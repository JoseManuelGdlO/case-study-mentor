import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { cacheService, CACHE_KEYS } from './cache.service.js';
const STUDY_PLAN_TTL = 5 * 60;
function toDayStartUtc(date = new Date()) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}
function toDayEndUtc(date = new Date()) {
    const d = toDayStartUtc(date);
    d.setUTCDate(d.getUTCDate() + 1);
    return d;
}
function isPaidPlan(tier, exp) {
    return tier !== 'free' && !!exp && exp > new Date();
}
function inRollout(userId) {
    if (env.STUDY_PLAN_ROLLOUT_PERCENT >= 100)
        return true;
    if (env.STUDY_PLAN_ROLLOUT_PERCENT <= 0)
        return false;
    let hash = 0;
    for (let i = 0; i < userId.length; i++)
        hash = (hash * 31 + userId.charCodeAt(i)) % 1000;
    return hash % 100 < env.STUDY_PLAN_ROLLOUT_PERCENT;
}
export async function getTodayStudyPlan(userId) {
    const key = CACHE_KEYS.studyPlanToday(userId);
    const cached = await cacheService.get(key);
    if (cached)
        return { data: cached };
    const now = new Date();
    const dayStart = toDayStartUtc(now);
    const dayEnd = toDayEndUtc(now);
    const [profile, existing] = await Promise.all([
        prisma.profile.findUnique({
            where: { id: userId },
            select: { subscriptionTier: true, subscriptionExpiresAt: true },
        }),
        prisma.studyPlan.findFirst({
            where: { userId, date: { gte: dayStart, lt: dayEnd } },
            include: { tasks: { orderBy: { sortOrder: 'asc' } }, executions: true },
        }),
    ]);
    if (!profile) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
    }
    if (!inRollout(userId))
        return { data: null };
    const premium = isPaidPlan(profile.subscriptionTier, profile.subscriptionExpiresAt);
    const plan = existing ??
        (await createStudyPlanForToday(userId, premium, dayStart));
    const planWithTasks = existing
        ? existing
        : await prisma.studyPlan.findFirstOrThrow({
            where: { id: plan.id },
            include: { tasks: { orderBy: { sortOrder: 'asc' } } },
        });
    const payload = await serializePlan(planWithTasks, premium);
    await cacheService.set(key, payload, STUDY_PLAN_TTL);
    return { data: payload };
}
export async function regenerateTodayStudyPlan(userId) {
    const dayStart = toDayStartUtc();
    const dayEnd = toDayEndUtc();
    const profile = await prisma.profile.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true, subscriptionExpiresAt: true },
    });
    if (!profile) {
        const err = new Error('Usuario no encontrado');
        err.status = 404;
        throw err;
    }
    const premium = isPaidPlan(profile.subscriptionTier, profile.subscriptionExpiresAt);
    await prisma.studyPlan.deleteMany({
        where: { userId, date: { gte: dayStart, lt: dayEnd }, status: { in: ['pending', 'in_progress'] } },
    });
    const plan = await createStudyPlanForToday(userId, premium, dayStart);
    const planWithTasks = await prisma.studyPlan.findFirstOrThrow({
        where: { id: plan.id },
        include: { tasks: { orderBy: { sortOrder: 'asc' } } },
    });
    await invalidateStudyPlanCaches(userId);
    return { data: await serializePlan(planWithTasks, premium) };
}
export async function completeStudyPlanTask(userId, planId, taskId, body) {
    const plan = await prisma.studyPlan.findFirst({
        where: { id: planId, userId },
        include: { tasks: true, executions: true },
    });
    if (!plan) {
        const err = new Error('Plan diario no encontrado');
        err.status = 404;
        throw err;
    }
    const task = plan.tasks.find((t) => t.id === taskId);
    if (!task) {
        const err = new Error('Tarea no encontrada');
        err.status = 404;
        throw err;
    }
    const completedCount = Math.min(body.completedCount ?? task.targetCount, task.targetCount);
    await prisma.$transaction(async (tx) => {
        await tx.studyPlanTask.update({
            where: { id: taskId },
            data: { completedCount },
        });
        await tx.studyPlanExecution.upsert({
            where: {
                userId_studyPlanId_studyPlanTaskId: {
                    userId,
                    studyPlanId: planId,
                    studyPlanTaskId: taskId,
                },
            },
            create: {
                userId,
                studyPlanId: planId,
                studyPlanTaskId: taskId,
                completed: completedCount >= task.targetCount,
                score: body.score,
                timeSpentSeconds: body.timeSpentSeconds,
                completedAt: new Date(),
            },
            update: {
                completed: completedCount >= task.targetCount,
                score: body.score,
                timeSpentSeconds: body.timeSpentSeconds,
                completedAt: new Date(),
            },
        });
        const allTasks = await tx.studyPlanTask.findMany({ where: { studyPlanId: planId } });
        const done = allTasks.every((t) => t.completedCount >= t.targetCount);
        await tx.studyPlan.update({
            where: { id: planId },
            data: { status: done ? 'completed' : 'in_progress' },
        });
    });
    await invalidateStudyPlanCaches(userId);
    return getTodayStudyPlan(userId);
}
export async function getStudyPlanImpact(userId) {
    const key = CACHE_KEYS.studyPlanImpact(userId);
    const cached = await cacheService.get(key);
    if (cached)
        return { data: cached };
    const since14 = new Date();
    since14.setUTCDate(since14.getUTCDate() - 14);
    const [plans, exams] = await Promise.all([
        prisma.studyPlan.findMany({
            where: { userId, date: { gte: since14 } },
            include: { tasks: true },
            orderBy: { date: 'asc' },
        }),
        prisma.exam.findMany({
            where: { userId, status: 'completed', completedAt: { gte: since14 } },
            orderBy: { completedAt: 'asc' },
            select: { score: true, predictedPercentile: true },
        }),
    ]);
    const totalPlans = plans.length;
    const completedPlans = plans.filter((p) => p.status === 'completed').length;
    const completionRate = totalPlans > 0 ? Math.round((completedPlans / totalPlans) * 10000) / 100 : 0;
    const scores = exams.map((e) => e.score ?? 0);
    const scoreDelta = scores.length >= 2 ? Math.round((scores[scores.length - 1] - scores[0]) * 100) / 100 : 0;
    const percentiles = exams.map((e) => e.predictedPercentile ?? 0).filter((v) => v > 0);
    const percentileDelta = percentiles.length >= 2 ? Math.round((percentiles[percentiles.length - 1] - percentiles[0]) * 100) / 100 : 0;
    const payload = {
        last14Days: {
            totalPlans,
            completedPlans,
            completionRate,
            scoreDelta,
            percentileDelta,
        },
        estimate: {
            scoreDelta: Math.round((completionRate / 100) * 3 * 100) / 100,
            percentileDelta: Math.round((completionRate / 100) * 5 * 100) / 100,
        },
    };
    await cacheService.set(key, payload, STUDY_PLAN_TTL);
    return { data: payload };
}
export async function invalidateStudyPlanCaches(userId) {
    await Promise.all([
        cacheService.invalidate(CACHE_KEYS.studyPlanToday(userId)),
        cacheService.invalidate(CACHE_KEYS.studyPlanImpact(userId)),
    ]);
}
async function createStudyPlanForToday(userId, premium, date) {
    const stats = await prisma.userAnswer.findMany({
        where: { userId, selectedOptionId: { not: null } },
        orderBy: { answeredAt: 'desc' },
        take: 200,
        select: {
            isCorrect: true,
            question: {
                select: {
                    id: true,
                    clinicalCase: {
                        select: {
                            id: true,
                            area: { select: { id: true, name: true } },
                            specialty: { select: { id: true, name: true } },
                        },
                    },
                },
            },
        },
    });
    const weakAreas = computeWeakAreas(stats);
    const specialtyId = weakAreas[0]?.specialtyId;
    const areaId = weakAreas[0]?.areaId;
    const questionCount = premium ? 10 : 5;
    const flashcardCount = premium ? 5 : 2;
    const miniCaseCount = premium ? 1 : 0;
    const targetMinutes = premium ? 35 : 20;
    const questionIds = await selectQuestionIds(specialtyId, areaId, questionCount);
    const flashcardIds = await selectFlashcardIds(specialtyId, areaId, flashcardCount);
    const miniCaseIds = await selectMiniCaseIds(specialtyId, areaId, miniCaseCount);
    const taskCreates = [];
    const pushTask = (task) => {
        taskCreates.push({
            taskType: task.taskType,
            title: task.title,
            description: task.description,
            targetCount: task.targetCount,
            completedCount: task.completedCount,
            payload: task.payload,
            sortOrder: task.sortOrder,
        });
    };
    if (questionIds.length > 0) {
        pushTask({
            taskType: 'question_set',
            title: premium ? 'Bloque de 10 preguntas' : 'Bloque corto de preguntas',
            description: 'Responde preguntas enfocadas a tus areas de mejora.',
            targetCount: questionIds.length,
            completedCount: 0,
            payload: { questionIds },
            sortOrder: 1,
        });
    }
    if (flashcardIds.length > 0) {
        pushTask({
            taskType: 'flashcard_set',
            title: premium ? 'Repaso con 5 flashcards' : 'Repaso con flashcards',
            description: 'Consolida conceptos clave antes del siguiente simulador.',
            targetCount: flashcardIds.length,
            completedCount: 0,
            payload: { flashcardIds },
            sortOrder: 2,
        });
    }
    if (miniCaseIds.length > 0) {
        pushTask({
            taskType: 'mini_case',
            title: 'Mini-caso clinico',
            description: 'Aplica razonamiento clinico en un caso breve.',
            targetCount: 1,
            completedCount: 0,
            payload: { caseIds: miniCaseIds },
            sortOrder: 3,
        });
    }
    if (taskCreates.length === 0) {
        pushTask({
            taskType: 'question_set',
            title: 'Bloque recomendado pendiente',
            description: 'No hay contenido disponible para tu area actual. Regenera el plan o agrega contenido en backoffice.',
            targetCount: 0,
            completedCount: 0,
            payload: { questions: [] },
            sortOrder: 1,
        });
    }
    return prisma.studyPlan.create({
        data: {
            userId,
            date,
            status: 'pending',
            isFreeLimited: !premium,
            targetMinutes,
            estimatedScoreDelta: premium ? 2.5 : 1.2,
            estimatedPercentileDelta: premium ? 4.2 : 1.8,
            tasks: {
                create: taskCreates,
            },
            executions: { create: [] },
        },
        include: {
            tasks: { orderBy: { sortOrder: 'asc' } },
            executions: true,
        },
    });
}
function computeWeakAreas(stats) {
    const map = new Map();
    for (const row of stats) {
        const specialty = row.question.clinicalCase.specialty;
        const area = row.question.clinicalCase.area;
        const key = `${specialty.id}:${area.id}`;
        const cur = map.get(key) ?? {
            specialtyId: specialty.id,
            specialtyName: specialty.name,
            areaId: area.id,
            areaName: area.name,
            total: 0,
            correct: 0,
        };
        cur.total++;
        if (row.isCorrect)
            cur.correct++;
        map.set(key, cur);
    }
    return [...map.values()]
        .map((r) => ({ ...r, percent: r.total > 0 ? (r.correct / r.total) * 100 : 0 }))
        .sort((a, b) => a.percent - b.percent);
}
async function selectQuestionIds(specialtyId, areaId, count) {
    if (count <= 0)
        return [];
    const rows = await prisma.question.findMany({
        where: {
            clinicalCase: {
                status: 'published',
                ...(specialtyId ? { specialtyId } : {}),
                ...(areaId ? { areaId } : {}),
            },
        },
        select: { id: true },
        take: Math.max(20, count * 3),
        orderBy: { difficultyLevel: 'desc' },
    });
    return rows.slice(0, count).map((r) => r.id);
}
async function selectFlashcardIds(specialtyId, areaId, count) {
    if (count <= 0)
        return [];
    const rows = await prisma.flashcard.findMany({
        where: {
            isActive: true,
            ...(specialtyId ? { specialties: { some: { specialtyId } } } : {}),
            ...(areaId ? { areas: { some: { areaId } } } : {}),
        },
        select: { id: true },
        take: Math.max(20, count * 3),
        orderBy: { updatedAt: 'desc' },
    });
    return rows.slice(0, count).map((r) => r.id);
}
async function selectMiniCaseIds(specialtyId, areaId, count) {
    if (count <= 0)
        return [];
    const rows = await prisma.clinicalCase.findMany({
        where: {
            status: 'published',
            ...(specialtyId ? { specialtyId } : {}),
            ...(areaId ? { areaId } : {}),
        },
        select: { id: true },
        take: Math.max(5, count * 2),
        orderBy: { updatedAt: 'desc' },
    });
    return rows.slice(0, count).map((r) => r.id);
}
async function serializePlan(plan, premium) {
    const totalTarget = plan.tasks.reduce((s, t) => s + t.targetCount, 0);
    const totalDone = plan.tasks.reduce((s, t) => s + Math.min(t.completedCount, t.targetCount), 0);
    const completionPercent = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0;
    const tasks = await Promise.all(plan.tasks.map(async (t) => ({
        id: t.id,
        type: t.taskType,
        title: t.title,
        description: t.description,
        targetCount: t.targetCount,
        completedCount: t.completedCount,
        payload: await enrichTaskPayload(t.taskType, t.payload),
        completed: t.completedCount >= t.targetCount,
    })));
    return {
        id: plan.id,
        date: plan.date.toISOString(),
        status: plan.status,
        isFreeLimited: plan.isFreeLimited,
        premium,
        targetMinutes: plan.targetMinutes,
        completionPercent,
        estimatedImpact14Days: {
            scoreDelta: plan.estimatedScoreDelta,
            percentileDelta: plan.estimatedPercentileDelta,
        },
        tasks,
    };
}
async function enrichTaskPayload(taskType, payload) {
    if (!payload || typeof payload !== 'object')
        return payload;
    const data = payload;
    if (taskType === 'flashcard_set') {
        const ids = Array.isArray(data.flashcardIds) ? data.flashcardIds.filter((v) => typeof v === 'string') : [];
        if (ids.length === 0)
            return { flashcards: [] };
        const flashcards = await prisma.flashcard.findMany({
            where: { id: { in: ids }, isActive: true },
            select: { id: true, question: true, answer: true, hint: true },
        });
        return { flashcards };
    }
    if (taskType === 'mini_case') {
        const ids = Array.isArray(data.caseIds) ? data.caseIds.filter((v) => typeof v === 'string') : [];
        if (ids.length === 0)
            return { cases: [] };
        const cases = await prisma.clinicalCase.findMany({
            where: { id: { in: ids }, status: 'published' },
            select: {
                id: true,
                topic: true,
                text: true,
                textFormat: true,
                specialty: { select: { name: true } },
                area: { select: { name: true } },
                questions: {
                    take: 1,
                    orderBy: { orderIndex: 'asc' },
                    select: {
                        id: true,
                        text: true,
                        options: {
                            orderBy: { label: 'asc' },
                            select: {
                                id: true,
                                label: true,
                                text: true,
                                isCorrect: true,
                                explanation: true,
                                feedbackImageUrl: true,
                            },
                        },
                    },
                },
            },
        });
        return {
            cases: cases.map((c) => ({
                id: c.id,
                topic: c.topic,
                specialty: c.specialty.name,
                area: c.area.name,
                text: c.text,
                textFormat: c.textFormat,
                question: c.questions[0] ?? null,
            })),
        };
    }
    if (taskType === 'question_set') {
        const ids = Array.isArray(data.questionIds) ? data.questionIds.filter((v) => typeof v === 'string') : [];
        if (ids.length === 0)
            return { questions: [] };
        const questions = await prisma.question.findMany({
            where: { id: { in: ids } },
            select: {
                id: true,
                text: true,
                hint: true,
                options: {
                    orderBy: { label: 'asc' },
                    select: {
                        id: true,
                        label: true,
                        text: true,
                        isCorrect: true,
                        explanation: true,
                        feedbackImageUrl: true,
                    },
                },
                clinicalCase: {
                    select: {
                        topic: true,
                        textFormat: true,
                        specialty: { select: { name: true } },
                        area: { select: { name: true } },
                    },
                },
            },
        });
        return {
            questions: questions.map((q) => ({
                id: q.id,
                text: q.text,
                hint: q.hint,
                options: q.options,
                topic: q.clinicalCase.topic,
                specialty: q.clinicalCase.specialty.name,
                area: q.clinicalCase.area.name,
                textFormat: q.clinicalCase.textFormat,
            })),
        };
    }
    return payload;
}
//# sourceMappingURL=study-plan.service.js.map