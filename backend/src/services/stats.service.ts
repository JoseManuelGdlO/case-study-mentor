import { prisma } from '../config/database.js';
import { cacheService, CACHE_KEYS } from './cache.service.js';

const STATS_TTL = 5 * 60;

export async function getUserStats(userId: string) {
  const key = CACHE_KEYS.stats(userId);
  const cached = await cacheService.get<Record<string, unknown>>(key);
  if (cached) return { data: cached };

  const exams = await prisma.exam.findMany({
    where: { userId, status: 'completed' },
    select: { id: true, score: true, completedAt: true, createdAt: true },
  });

  const answers = await prisma.userAnswer.findMany({
    where: { userId },
    select: { isCorrect: true, questionId: true, selectedOptionId: true },
  });

  const totalExams = exams.length;
  const withResult = answers.filter((a) => a.selectedOptionId != null);
  const totalQuestions = withResult.length;
  const correctAnswers = withResult.filter((a) => a.isCorrect === true).length;
  const accuracyPercent =
    totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 10000) / 100 : 0;

  const completedDays = [
    ...new Set(
      exams
        .map((e) => (e.completedAt ?? e.createdAt).toISOString().slice(0, 10))
        .filter(Boolean)
    ),
  ].sort((a, b) => b.localeCompare(a));

  let studyStreak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let cursor = today;
  const daySet = new Set(completedDays);
  while (daySet.has(cursor)) {
    studyStreak++;
    const d = new Date(cursor + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() - 1);
    cursor = d.toISOString().slice(0, 10);
  }

  const qIds = [...new Set(withResult.map((a) => a.questionId))];
  const questions =
    qIds.length > 0
      ? await prisma.question.findMany({
          where: { id: { in: qIds } },
          select: {
            id: true,
            clinicalCase: { select: { specialty: { select: { name: true } } } },
          },
        })
      : [];
  const qToSpec = new Map(questions.map((q) => [q.id, q.clinicalCase.specialty.name]));

  const catMap = new Map<string, { total: number; correct: number }>();
  for (const a of withResult) {
    const cat = qToSpec.get(a.questionId) ?? 'Otro';
    const cur = catMap.get(cat) ?? { total: 0, correct: 0 };
    cur.total++;
    if (a.isCorrect === true) cur.correct++;
    catMap.set(cat, cur);
  }
  const byCategory = [...catMap.entries()].map(([category, v]) => ({
    category,
    total: v.total,
    correct: v.correct,
    percent: v.total > 0 ? Math.round((v.correct / v.total) * 10000) / 100 : 0,
  }));

  const weeklyProgress = buildWeeklyProgress(exams);
  const weeklyWellbeing = await buildWeeklyWellbeing(userId);
  const preExamRiskSignal = buildPreExamRiskSignal(weeklyWellbeing);

  const payload = {
    totalExams,
    totalQuestions,
    correctAnswers,
    accuracyPercent,
    studyStreak,
    byCategory,
    weeklyProgress,
    weeklyWellbeing: weeklyWellbeing.days,
    preExamRiskSignal,
    prediction: await getLatestPredictionSnapshot(userId),
  };

  await cacheService.set(key, payload, STATS_TTL);
  return { data: payload };
}

function buildWeeklyProgress(
  exams: { completedAt: Date | null; createdAt: Date; score: number | null }[]
): { week: string; score: number }[] {
  const now = new Date();
  const weeks: { week: string; score: number }[] = [];
  for (let w = 7; w >= 0; w--) {
    const end = new Date(now);
    end.setUTCDate(end.getUTCDate() - w * 7);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 7);
    const label = `Sem ${8 - w}`;
    const inRange = exams.filter((e) => {
      const d = e.completedAt ?? e.createdAt;
      return d >= start && d < end;
    });
    const avg =
      inRange.length && inRange.some((e) => e.score != null)
        ? Math.round(
            (inRange.reduce((s, e) => s + (e.score ?? 0), 0) /
              inRange.filter((e) => e.score != null).length) *
              100
          ) / 100
        : 0;
    weeks.push({ week: label, score: avg });
  }
  return weeks;
}

export async function invalidateUserStats(userId: string): Promise<void> {
  await cacheService.invalidate(`cache:stats:${userId}`);
}

async function getLatestPredictionSnapshot(userId: string) {
  const latest = await prisma.exam.findFirst({
    where: { userId, status: 'completed', predictedPercentile: { not: null } },
    orderBy: { completedAt: 'desc' },
    select: {
      id: true,
      completedAt: true,
      predictedPercentile: true,
      predictedPlacementProbability: true,
      predictionSpecialty: true,
      predictionVersion: true,
    },
  });

  if (
    !latest ||
    latest.predictedPercentile == null ||
    latest.predictedPlacementProbability == null ||
    !latest.predictionSpecialty
  ) {
    return null;
  }

  return {
    examId: latest.id,
    completedAt: latest.completedAt?.toISOString() ?? null,
    specialty: latest.predictionSpecialty,
    estimatedPercentile: latest.predictedPercentile,
    placementProbability: latest.predictedPlacementProbability,
    version: latest.predictionVersion ?? 'heuristic-v1',
  };
}

async function buildWeeklyWellbeing(userId: string) {
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  since.setUTCDate(since.getUTCDate() - 6);
  const rows = await prisma.dailyWellbeingLog.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      anxietyLevel: true,
      focusLevel: true,
      plannedStudyMinutes: true,
      completedStudyMinutes: true,
      mood: true,
    },
  });
  const map = new Map(rows.map((r) => [r.date.toISOString().slice(0, 10), r]));
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(since);
    d.setUTCDate(since.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const row = map.get(key);
    const adherence =
      row && row.plannedStudyMinutes > 0
        ? Math.min(100, Math.round((row.completedStudyMinutes / row.plannedStudyMinutes) * 100))
        : 0;
    return {
      date: key,
      anxietyLevel: row?.anxietyLevel ?? 0,
      focusLevel: row?.focusLevel ?? 0,
      adherencePercent: adherence,
      mood: row?.mood ?? null,
    };
  });
  return { days };
}

function buildPreExamRiskSignal(weeklyWellbeing: {
  days: { anxietyLevel: number; focusLevel: number; adherencePercent: number }[];
}) {
  const nonZero = weeklyWellbeing.days.filter((d) => d.anxietyLevel > 0 || d.focusLevel > 0);
  if (nonZero.length === 0) {
    return {
      level: 'low' as const,
      score: 0,
      message: 'Aún no hay suficientes registros de bienestar para calcular riesgo.',
    };
  }
  const avgAnxiety = nonZero.reduce((s, d) => s + d.anxietyLevel, 0) / nonZero.length;
  const avgFocus = nonZero.reduce((s, d) => s + d.focusLevel, 0) / nonZero.length;
  const avgAdherence = nonZero.reduce((s, d) => s + d.adherencePercent, 0) / nonZero.length;
  const raw = avgAnxiety * 22 + (5 - avgFocus) * 18 + (100 - avgAdherence) * 0.4;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const level = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
  const message =
    level === 'high'
      ? 'Señal alta: prioriza descanso activo y una técnica breve de regulación antes de estudiar.'
      : level === 'medium'
        ? 'Señal media: mantén pausas estructuradas y refuerza tu rutina de concentración.'
        : 'Señal baja: buen equilibrio reciente, mantén constancia y descansos.';
  return { level, score, message };
}
