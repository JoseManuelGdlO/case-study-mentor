import { prisma } from '../config/database.js';
import { shuffleInPlace } from '../utils/helpers.js';
import type { z } from 'zod';
import type { generateExamSchema } from '../schemas/exam.schema.js';

type GenerateInput = z.infer<typeof generateExamSchema>;

export async function generateExam(userId: string, input: GenerateInput) {
  const { language, mode, specialtyIds, areaIds, questionCount, questionFilter } = input;

  const caseWhere = {
    status: 'published',
    language,
    specialtyId: { in: specialtyIds },
    ...(areaIds.length > 0 ? { areaId: { in: areaIds } } : {}),
  };

  const cases = await prisma.clinicalCase.findMany({
    where: caseWhere,
    include: {
      questions: { select: { id: true } },
    },
  });

  let pairs: { caseId: string; questionId: string }[] = [];
  for (const c of cases) {
    for (const q of c.questions) {
      pairs.push({ caseId: c.id, questionId: q.id });
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

  shuffleInPlace(pairs);
  const selected = pairs.slice(0, questionCount);
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
  body: { questionId: string; selectedOptionId: string | null }
) {
  const exam = await prisma.exam.findFirst({
    where: { id: examId, userId },
    include: {
      examQuestions: { orderBy: { orderIndex: 'asc' } },
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
      },
      update: {
        selectedOptionId: body.selectedOptionId,
        isCorrect,
        answeredAt: now,
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
  const exam = await prisma.exam.findFirst({
    where: { id: examId, userId },
    include: {
      answers: true,
    },
  });
  if (!exam) {
    const err = new Error('Examen no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  }

  const answered = exam.answers.filter((a) => a.selectedOptionId != null);
  const correct = answered.filter((a) => a.isCorrect === true).length;
  const total = answered.length;
  const score = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;

  await prisma.exam.update({
    where: { id: examId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      score,
      ...(timeSpentSeconds != null ? { timeSpentSeconds } : {}),
    },
  });

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
