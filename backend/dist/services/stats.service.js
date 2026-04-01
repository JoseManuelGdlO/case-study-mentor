import { prisma } from '../config/database.js';
import { cacheService, CACHE_KEYS } from './cache.service.js';
const STATS_TTL = 5 * 60;
export async function getUserStats(userId) {
    const key = CACHE_KEYS.stats(userId);
    const cached = await cacheService.get(key);
    if (cached)
        return { data: cached };
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
    const accuracyPercent = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 10000) / 100 : 0;
    const completedDays = [
        ...new Set(exams
            .map((e) => (e.completedAt ?? e.createdAt).toISOString().slice(0, 10))
            .filter(Boolean)),
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
    const questions = qIds.length > 0
        ? await prisma.question.findMany({
            where: { id: { in: qIds } },
            select: {
                id: true,
                clinicalCase: { select: { specialty: { select: { name: true } } } },
            },
        })
        : [];
    const qToSpec = new Map(questions.map((q) => [q.id, q.clinicalCase.specialty.name]));
    const catMap = new Map();
    for (const a of withResult) {
        const cat = qToSpec.get(a.questionId) ?? 'Otro';
        const cur = catMap.get(cat) ?? { total: 0, correct: 0 };
        cur.total++;
        if (a.isCorrect === true)
            cur.correct++;
        catMap.set(cat, cur);
    }
    const byCategory = [...catMap.entries()].map(([category, v]) => ({
        category,
        total: v.total,
        correct: v.correct,
        percent: v.total > 0 ? Math.round((v.correct / v.total) * 10000) / 100 : 0,
    }));
    const weeklyProgress = buildWeeklyProgress(exams);
    const payload = {
        totalExams,
        totalQuestions,
        correctAnswers,
        accuracyPercent,
        studyStreak,
        byCategory,
        weeklyProgress,
        prediction: await getLatestPredictionSnapshot(userId),
    };
    await cacheService.set(key, payload, STATS_TTL);
    return { data: payload };
}
function buildWeeklyProgress(exams) {
    const now = new Date();
    const weeks = [];
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
        const avg = inRange.length && inRange.some((e) => e.score != null)
            ? Math.round((inRange.reduce((s, e) => s + (e.score ?? 0), 0) /
                inRange.filter((e) => e.score != null).length) *
                100) / 100
            : 0;
        weeks.push({ week: label, score: avg });
    }
    return weeks;
}
export async function invalidateUserStats(userId) {
    await cacheService.invalidate(`cache:stats:${userId}`);
}
async function getLatestPredictionSnapshot(userId) {
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
    if (!latest ||
        latest.predictedPercentile == null ||
        latest.predictedPlacementProbability == null ||
        !latest.predictionSpecialty) {
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
//# sourceMappingURL=stats.service.js.map