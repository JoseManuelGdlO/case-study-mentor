import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { shuffleInPlace } from '../utils/helpers.js';
import type { z } from 'zod';
import type { generateExamSchema } from '../schemas/exam.schema.js';
import { predictPlacement } from './prediction.service.js';
import { invalidateStudyPlanCaches } from './study-plan.service.js';

type GenerateInput = z.infer<typeof generateExamSchema>;

export async function generateExam(userId: string, input: GenerateInput) {
  const {
    language,
    mode,
    specialtyIds,
    areaIds,
    questionCount,
    questionFilter,
    adaptiveMode,
    predictionSpecialtyId,
  } = input;

  const caseWhere = {
    status: 'published',
    language,
    specialtyId: { in: specialtyIds },
    ...(areaIds.length > 0 ? { areaId: { in: areaIds } } : {}),
  };

  const [profile, cases] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscriptionExpiresAt: true },
    }),
    prisma.clinicalCase.findMany({
      where: caseWhere,
      include: {
        questions: { select: { id: true, difficultyLevel: true } },
      },
    }),
  ]);

  const hasPaidPlan =
    profile &&
    profile.subscriptionTier !== 'free' &&
    !!profile.subscriptionExpiresAt &&
    profile.subscriptionExpiresAt > new Date();
  if (adaptiveMode && !hasPaidPlan) {
    const err = new Error('El modo adaptativo está disponible solo para usuarios con suscripción activa') as Error & {
      status: number;
    };
    err.status = 403;
    throw err;
  }
  if (adaptiveMode && !isUserInAdaptiveRollout(userId)) {
    const err = new Error('El simulador adaptativo se esta habilitando gradualmente') as Error & {
      status: number;
    };
    err.status = 403;
    throw err;
  }

  let pairs: { caseId: string; questionId: string; difficultyLevel: number; areaId: string }[] = [];
  for (const c of cases) {
    for (const q of c.questions) {
      pairs.push({ caseId: c.id, questionId: q.id, difficultyLevel: q.difficultyLevel, areaId: c.areaId });
    }
  }

  if (questionFilter !== 'all') {
    const answeredRows = await prisma.userAnswer.findMany({
      where: { userId },
      select: { questionId: true },
      distinct: ['questionId'],
    });
    const answeredSet = new Set(answeredRows.map((a) => a.questionId));
    if (questionFilter === 'unanswered') {
      pairs = pairs.filter((p) => !answeredSet.has(p.questionId));
    } else {
      pairs = pairs.filter((p) => answeredSet.has(p.questionId));
    }
  }

  const selected = adaptiveMode
    ? await selectAdaptiveQuestions(userId, pairs, questionCount)
    : selectStandardQuestions(pairs, questionCount);
  if (selected.length < questionCount) {
    const err = new Error('No hay suficientes preguntas con los filtros seleccionados') as Error & { status: number };
    err.status = 400;
    throw err;
  }

  const seenCases = new Set<string>();
  const examCasesData: { caseId: string; orderIndex: number }[] = [];
  let caseOrd = 0;
  for (const p of selected) {
    if (!seenCases.has(p.caseId)) {
      seenCases.add(p.caseId);
      examCasesData.push({ caseId: p.caseId, orderIndex: caseOrd++ });
    }
  }

  const areaIdsForExam =
    areaIds.length > 0
      ? areaIds
      : (
          await prisma.clinicalCase.findMany({
            where: { id: { in: [...seenCases] } },
            select: { areaId: true },
            distinct: ['areaId'],
          })
        ).map((r) => r.areaId);

  const exam = await prisma.$transaction(async (tx) => {
    const e = await tx.exam.create({
      data: {
        userId,
        mode,
        language,
        questionCount: selected.length,
        questionFilter,
        adaptiveMode,
        ...(predictionSpecialtyId ? { predictionSpecialty: predictionSpecialtyId } : {}),
        status: 'not_started',
        currentIndex: 0,
        selectedSpecialties: {
          create: specialtyIds.map((specialtyId) => ({ specialtyId })),
        },
        selectedAreas: {
          create: [...new Set(areaIdsForExam)].map((areaId) => ({ areaId })),
        },
        examCases: {
          create: examCasesData,
        },
        examQuestions: {
          create: selected.map((p, i) => ({
            questionId: p.questionId,
            orderIndex: i,
          })),
        },
      },
    });
    return e;
  });

  return getExamById(userId, exam.id);
}

function stripSimulationOptions<T extends { isCorrect: boolean; explanation: string }>(
  options: T[]
): Omit<T, 'isCorrect' | 'explanation'>[] {
  return options.map(({ isCorrect: _i, explanation: _e, ...rest }) => rest as Omit<T, 'isCorrect' | 'explanation'>);
}

export async function listExams(userId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;
  const [total, rows] = await Promise.all([
    prisma.exam.count({ where: { userId } }),
    prisma.exam.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        selectedSpecialties: { include: { specialty: true } },
        selectedAreas: { include: { area: true } },
      },
    }),
  ]);

  const data = rows.map((e) => ({
    id: e.id,
    config: {
      language: e.language as 'es' | 'en',
      mode: e.mode as 'simulation' | 'study',
      adaptiveMode: e.adaptiveMode,
      categories: e.selectedSpecialties.map((s) => s.specialty.name),
      subcategories: e.selectedAreas.map((a) => a.area.name),
      questionCount: e.questionCount,
      questionFilter: e.questionFilter,
    },
    status: e.status as 'not_started' | 'in_progress' | 'completed',
    score: e.score,
    startedAt: e.startedAt?.toISOString() ?? e.createdAt.toISOString(),
    completedAt: e.completedAt?.toISOString() ?? null,
    timeSpentSeconds: e.timeSpentSeconds,
    currentQuestionIndex: e.currentIndex,
    createdAt: e.createdAt.toISOString(),
  }));

  return { data, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getExamById(userId: string, examId: string) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, userId },
    include: {
      examCases: { orderBy: { orderIndex: 'asc' } },
      examQuestions: {
        orderBy: { orderIndex: 'asc' },
        include: {
          question: {
            include: {
              options: { orderBy: { label: 'asc' } },
              clinicalCase: {
                include: {
                  specialty: true,
                  area: true,
                  labResults: true,
                },
              },
            },
          },
        },
      },
      answers: true,
      selectedSpecialties: { include: { specialty: true } },
      selectedAreas: { include: { area: true } },
    },
  });

  if (!exam) {
    const err = new Error('Examen no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  }

  const hideAnswers = exam.mode === 'simulation' && exam.status !== 'completed';

  const caseMap = new Map<
    string,
    {
      id: string;
      specialty: string;
      area: string;
      topic: string;
      language: string;
      text: string;
      imageUrl?: string | null;
      generatedByIa: boolean;
      labResults: unknown[];
      questions: unknown[];
      status: string;
      createdAt: string;
      updatedAt: string;
    }
  >();

  for (const eq of exam.examQuestions) {
    const q = eq.question;
    const cc = q.clinicalCase;
    if (!caseMap.has(cc.id)) {
      caseMap.set(cc.id, {
        id: cc.id,
        specialty: cc.specialty.name,
        area: cc.area.name,
        topic: cc.topic,
        language: cc.language as 'es' | 'en',
        text: cc.text,
        imageUrl: cc.imageUrl,
        generatedByIa: cc.generatedByIa,
        labResults: cc.labResults.map((l) => ({
          id: l.id,
          name: l.name,
          value: l.value,
          unit: l.unit,
          normalRange: l.normalRange,
        })),
        questions: [],
        status: cc.status as 'draft' | 'published' | 'archived',
        createdAt: cc.createdAt.toISOString(),
        updatedAt: cc.updatedAt.toISOString(),
      });
    }
    const entry = caseMap.get(cc.id)!;
    const opts = q.options.map((o) => ({
      id: o.id,
      label: o.label,
      text: o.text,
      imageUrl: o.imageUrl ?? undefined,
      isCorrect: o.isCorrect,
      explanation: o.explanation,
    }));
    (entry.questions as object[]).push({
      id: q.id,
      text: q.text,
      imageUrl: q.imageUrl ?? undefined,
      feedbackImageUrl: hideAnswers ? undefined : (q.feedbackImageUrl ?? undefined),
      options: hideAnswers ? stripSimulationOptions(opts) : opts,
      summary: hideAnswers ? '' : q.summary,
      bibliography: hideAnswers ? '' : q.bibliography,
      difficultyLevel: q.difficultyLevel,
      cognitiveCompetence: q.cognitiveCompetence,
      previousEnarmPresence: q.previousEnarmPresence,
      hint: q.hint,
      orderIndex: q.orderIndex,
      globalOrder: eq.orderIndex,
    });
  }

  const cases = exam.examCases.map((ec) => caseMap.get(ec.caseId)).filter(Boolean);

  const flatQuestions = [...exam.examQuestions]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((eq) => {
      const q = eq.question;
      const cc = q.clinicalCase;
      const opts = q.options.map((o) => ({
        id: o.id,
        label: o.label,
        text: o.text,
        imageUrl: o.imageUrl ?? undefined,
        isCorrect: o.isCorrect,
        explanation: o.explanation,
      }));
      return {
        id: q.id,
        globalOrder: eq.orderIndex,
        text: q.text,
        imageUrl: q.imageUrl ?? undefined,
        feedbackImageUrl: hideAnswers ? undefined : (q.feedbackImageUrl ?? undefined),
        options: hideAnswers ? stripSimulationOptions(opts) : opts,
        summary: hideAnswers ? '' : q.summary,
        bibliography: hideAnswers ? '' : q.bibliography,
        difficultyLevel: q.difficultyLevel,
        cognitiveCompetence: q.cognitiveCompetence,
        previousEnarmPresence: q.previousEnarmPresence,
        hint: q.hint,
        caseText: cc.text,
        caseImageUrl: cc.imageUrl,
        specialty: cc.specialty.name,
        area: cc.area.name,
        topic: cc.topic,
        caseId: cc.id,
        labResults: cc.labResults.map((l) => ({
          id: l.id,
          name: l.name,
          value: l.value,
          unit: l.unit,
          normalRange: l.normalRange,
        })),
      };
    });

  const answers = exam.answers.map((a) => ({
    questionId: a.questionId,
    selectedOptionId: a.selectedOptionId,
    isCorrect: a.isCorrect,
  }));

  return {
    data: {
      id: exam.id,
      config: {
        language: exam.language as 'es' | 'en',
        mode: exam.mode as 'simulation' | 'study',
        adaptiveMode: exam.adaptiveMode,
        categories: exam.selectedSpecialties.map((s) => s.specialty.name),
        subcategories: exam.selectedAreas.map((a) => a.area.name),
        questionCount: exam.questionCount,
        questionFilter: exam.questionFilter,
      },
      cases,
      answers,
      currentQuestionIndex: exam.currentIndex,
      status: exam.status as 'not_started' | 'in_progress' | 'completed',
      score: exam.score,
      prediction:
        exam.predictedPercentile != null &&
        exam.predictedPlacementProbability != null &&
        exam.predictionSpecialty
          ? {
              specialty: exam.predictionSpecialty,
              estimatedPercentile: exam.predictedPercentile,
              placementProbability: exam.predictedPlacementProbability,
              version: exam.predictionVersion ?? 'heuristic-v1',
            }
          : null,
      startedAt: exam.startedAt?.toISOString() ?? '',
      completedAt: exam.completedAt?.toISOString() ?? null,
      timeSpentSeconds: exam.timeSpentSeconds,
      flatQuestions,
    },
  };
}

export async function submitAnswer(
  userId: string,
  examId: string,
  body: { questionId: string; selectedOptionId: string | null; responseTimeSeconds?: number }
) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, userId },
    include: {
      examQuestions: {
        orderBy: { orderIndex: 'asc' },
        include: { question: { select: { difficultyLevel: true } } },
      },
    },
  });
  const eqMatch = exam?.examQuestions.find((eq) => eq.questionId === body.questionId);
  if (!exam || !eqMatch) {
    const err = new Error('Pregunta no pertenece a este examen') as Error & { status: number };
    err.status = 400;
    throw err;
  }

  let isCorrect: boolean | null = null;
  let explanation: string | undefined;
  let selectedOption:
    | { isCorrect: boolean; explanation: string; id: string }
    | null = null;

  if (body.selectedOptionId) {
    const opt = await prisma.answerOption.findFirst({
      where: { id: body.selectedOptionId, questionId: body.questionId },
    });
    if (!opt) {
      const err = new Error('Opción inválida') as Error & { status: number };
      err.status = 400;
      throw err;
    }
    selectedOption = opt;
    isCorrect = opt.isCorrect;
  }

  await prisma.$transaction(async (tx) => {
    const now = new Date();
    await tx.userAnswer.upsert({
      where: {
        examId_questionId: { examId, questionId: body.questionId },
      },
      create: {
        userId,
        examId,
        questionId: body.questionId,
        selectedOptionId: body.selectedOptionId,
        isCorrect,
        responseTimeSeconds: body.responseTimeSeconds,
        questionDifficulty: eqMatch.question.difficultyLevel,
      },
      update: {
        selectedOptionId: body.selectedOptionId,
        isCorrect,
        answeredAt: now,
        responseTimeSeconds: body.responseTimeSeconds,
        questionDifficulty: eqMatch.question.difficultyLevel,
      },
    });

    const nextIndex = eqMatch.orderIndex + 1;
    await tx.exam.update({
      where: { id: examId },
      data: {
        status: 'in_progress',
        startedAt: exam.startedAt ?? now,
        currentIndex: Math.max(exam.currentIndex, nextIndex),
      },
    });
  });

  if (exam.mode === 'study' && body.selectedOptionId && selectedOption) {
    explanation = selectedOption.explanation;
    return {
      data: {
        saved: true,
        isCorrect: selectedOption.isCorrect,
        explanation,
      },
    };
  }

  return { data: { saved: true } };
}

export async function completeExam(userId: string, examId: string, timeSpentSeconds?: number) {
  const [profile, exam] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true, subscriptionExpiresAt: true },
    }),
    prisma.exam.findFirst({
      where: { id: examId, userId },
      include: {
        answers: true,
        selectedSpecialties: true,
      },
    }),
  ]);
  if (!exam) {
    const err = new Error('Examen no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  }

  const answered = exam.answers.filter((a) => a.selectedOptionId != null);
  const correct = answered.filter((a) => a.isCorrect === true).length;
  const total = answered.length;
  const score = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;

  const hasPaidPlan =
    profile &&
    profile.subscriptionTier !== 'free' &&
    !!profile.subscriptionExpiresAt &&
    profile.subscriptionExpiresAt > new Date();
  const prediction = hasPaidPlan
    ? await predictPlacement({
        userId,
        examId,
        score,
        selectedSpecialtyIds: exam.selectedSpecialties.map((s) => s.specialtyId),
        requestedSpecialtyId: exam.predictionSpecialty ?? undefined,
      })
    : null;

  await prisma.exam.update({
    where: { id: examId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      score,
      ...(prediction
        ? {
            predictionSpecialty: prediction.specialtyName,
            predictionVersion: prediction.version,
            predictedPercentile: prediction.estimatedPercentile,
            predictedPlacementProbability: prediction.placementProbability,
          }
        : {}),
      ...(timeSpentSeconds != null ? { timeSpentSeconds } : {}),
    },
  });

  await invalidateStudyPlanCaches(userId);

  return getExamById(userId, examId);
}

export async function getExamResults(userId: string, examId: string) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, userId },
  });
  if (!exam) {
    const err = new Error('Examen no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  }
  if (exam.mode === 'simulation' && exam.status !== 'completed') {
    const err = new Error('El examen aún no está completado') as Error & { status: number };
    err.status = 400;
    throw err;
  }
  return getExamById(userId, examId);
}

export async function getNextQuestion(userId: string, examId: string) {
  const exam = await getExamById(userId, examId);
  const flatQuestions = exam.data.flatQuestions ?? [];
  const index = Math.min(exam.data.currentQuestionIndex, Math.max(0, flatQuestions.length - 1));
  return {
    data: {
      examId,
      currentQuestionIndex: index,
      question: flatQuestions[index] ?? null,
      totalQuestions: flatQuestions.length,
    },
  };
}

function selectStandardQuestions(
  pairs: { caseId: string; questionId: string; difficultyLevel: number; areaId: string }[],
  questionCount: number
) {
  shuffleInPlace(pairs);
  return pairs.slice(0, questionCount);
}

async function selectAdaptiveQuestions(
  userId: string,
  pairs: { caseId: string; questionId: string; difficultyLevel: number; areaId: string }[],
  questionCount: number
) {
  if (pairs.length <= questionCount) return pairs.slice(0, questionCount);

  const recent = await prisma.userAnswer.findMany({
    where: { userId, selectedOptionId: { not: null } },
    select: { questionId: true, isCorrect: true, question: { select: { difficultyLevel: true } } },
    orderBy: { answeredAt: 'desc' },
    take: 80,
  });

  const correct = recent.filter((r) => r.isCorrect === true).length;
  const accuracy = recent.length > 0 ? correct / recent.length : 0.6;

  let targetDifficulty = 2;
  if (accuracy >= 0.75) targetDifficulty = 3;
  else if (accuracy <= 0.45) targetDifficulty = 1;

  const recentQuestionSet = new Set(recent.slice(0, 40).map((r) => r.questionId));
  const eligible = pairs.filter((p) => !recentQuestionSet.has(p.questionId));
  const source = eligible.length >= questionCount ? eligible : pairs;

  const byDiff = {
    1: source.filter((p) => p.difficultyLevel <= 1),
    2: source.filter((p) => p.difficultyLevel === 2),
    3: source.filter((p) => p.difficultyLevel >= 3),
  };
  shuffleInPlace(byDiff[1]);
  shuffleInPlace(byDiff[2]);
  shuffleInPlace(byDiff[3]);

  const distribution =
    targetDifficulty === 3 ? [0.2, 0.4, 0.4] : targetDifficulty === 1 ? [0.4, 0.4, 0.2] : [0.25, 0.5, 0.25];
  const quotas = [
    Math.round(questionCount * distribution[0]),
    Math.round(questionCount * distribution[1]),
    Math.round(questionCount * distribution[2]),
  ];

  const selected: { caseId: string; questionId: string; difficultyLevel: number; areaId: string }[] = [];
  selected.push(...byDiff[1].slice(0, quotas[0]));
  selected.push(...byDiff[2].slice(0, quotas[1]));
  selected.push(...byDiff[3].slice(0, quotas[2]));

  const selectedSet = new Set(selected.map((s) => s.questionId));
  const remaining = source.filter((p) => !selectedSet.has(p.questionId));
  shuffleInPlace(remaining);

  // Guardrail: keep a minimal area coverage to reduce topic bias.
  const seenAreas = new Set(selected.map((s) => s.areaId));
  const uncoveredByArea = new Map<string, typeof remaining>();
  for (const p of remaining) {
    const arr = uncoveredByArea.get(p.areaId) ?? [];
    arr.push(p);
    uncoveredByArea.set(p.areaId, arr);
  }
  for (const [areaId, candidates] of uncoveredByArea.entries()) {
    if (selected.length >= questionCount) break;
    if (seenAreas.has(areaId)) continue;
    const pick = candidates[0];
    if (!pick) continue;
    selected.push(pick);
    selectedSet.add(pick.questionId);
    seenAreas.add(areaId);
  }

  const remainingAfterCoverage = remaining.filter((p) => !selectedSet.has(p.questionId));
  for (const p of remainingAfterCoverage) {
    if (selected.length >= questionCount) break;
    selected.push(p);
  }
  shuffleInPlace(selected);
  return selected.slice(0, questionCount);
}

function isUserInAdaptiveRollout(userId: string): boolean {
  if (env.ADAPTIVE_ROLLOUT_PERCENT >= 100) return true;
  if (env.ADAPTIVE_ROLLOUT_PERCENT <= 0) return false;
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) % 1000;
  }
  const bucket = hash % 100;
  return bucket < env.ADAPTIVE_ROLLOUT_PERCENT;
}
