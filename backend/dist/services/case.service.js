import { prisma } from '../config/database.js';
import { paginationParams, totalPages } from '../utils/helpers.js';
import { cacheService } from './cache.service.js';
function serializeCase(row) {
    return {
        id: row.id,
        specialtyId: row.specialtyId,
        areaId: row.areaId,
        specialty: row.specialty.name,
        area: row.area.name,
        topic: row.topic,
        language: row.language,
        text: row.text,
        imageUrl: row.imageUrl ?? undefined,
        labResults: row.labResults.map((l) => ({
            id: l.id,
            name: l.name,
            value: l.value,
            unit: l.unit,
            normalRange: l.normalRange,
        })),
        questions: row.questions
            .slice()
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .map((q) => ({
            id: q.id,
            text: q.text,
            imageUrl: q.imageUrl ?? undefined,
            summary: q.summary,
            bibliography: q.bibliography,
            difficulty: q.difficulty,
            orderIndex: q.orderIndex,
            options: q.options.map((o) => ({
                id: o.id,
                label: o.label,
                text: o.text,
                imageUrl: o.imageUrl ?? undefined,
                isCorrect: o.isCorrect,
                explanation: o.explanation,
            })),
        })),
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}
export async function listCases(query) {
    const { skip, take, page, limit } = paginationParams(query.page, query.limit);
    const where = {
        ...(query.specialty ? { specialtyId: query.specialty } : {}),
        ...(query.area ? { areaId: query.area } : {}),
        ...(query.status ? { status: query.status } : {}),
    };
    const [total, rows] = await Promise.all([
        prisma.clinicalCase.count({ where }),
        prisma.clinicalCase.findMany({
            where,
            skip,
            take,
            orderBy: { updatedAt: 'desc' },
            include: {
                specialty: true,
                area: true,
                labResults: true,
                questions: { include: { options: true }, orderBy: { orderIndex: 'asc' } },
            },
        }),
    ]);
    return {
        data: rows.map(serializeCase),
        total,
        page,
        totalPages: totalPages(total, limit),
    };
}
export async function getCaseById(id) {
    const row = await prisma.clinicalCase.findUnique({
        where: { id },
        include: {
            specialty: true,
            area: true,
            labResults: true,
            questions: { include: { options: true }, orderBy: { orderIndex: 'asc' } },
        },
    });
    if (!row) {
        const err = new Error('Caso no encontrado');
        err.status = 404;
        throw err;
    }
    return { data: serializeCase(row) };
}
export async function createCase(input) {
    const created = await prisma.$transaction(async (tx) => {
        const c = await tx.clinicalCase.create({
            data: {
                specialtyId: input.specialtyId,
                areaId: input.areaId,
                topic: input.topic,
                language: input.language,
                text: input.text,
                imageUrl: input.imageUrl ?? null,
                status: input.status,
                labResults: {
                    create: (input.labResults ?? []).map((l) => ({
                        name: l.name,
                        value: l.value,
                        unit: l.unit,
                        normalRange: l.normalRange,
                    })),
                },
                questions: {
                    create: input.questions.map((q, qi) => ({
                        text: q.text,
                        imageUrl: q.imageUrl ?? null,
                        summary: q.summary,
                        bibliography: q.bibliography,
                        difficulty: q.difficulty,
                        orderIndex: q.orderIndex ?? qi,
                        options: {
                            create: q.options.map((o) => ({
                                label: o.label,
                                text: o.text,
                                imageUrl: o.imageUrl ?? null,
                                isCorrect: o.isCorrect,
                                explanation: o.explanation,
                            })),
                        },
                    })),
                },
            },
            include: {
                specialty: true,
                area: true,
                labResults: true,
                questions: { include: { options: true }, orderBy: { orderIndex: 'asc' } },
            },
        });
        return c;
    });
    await cacheService.invalidate('cache:specialties*');
    return getCaseById(created.id);
}
export async function updateCase(id, input) {
    const existing = await prisma.clinicalCase.findUnique({ where: { id } });
    if (!existing) {
        const err = new Error('Caso no encontrado');
        err.status = 404;
        throw err;
    }
    await prisma.$transaction(async (tx) => {
        await tx.clinicalCase.update({
            where: { id },
            data: {
                ...(input.specialtyId != null ? { specialtyId: input.specialtyId } : {}),
                ...(input.areaId != null ? { areaId: input.areaId } : {}),
                ...(input.topic != null ? { topic: input.topic } : {}),
                ...(input.language != null ? { language: input.language } : {}),
                ...(input.text != null ? { text: input.text } : {}),
                ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
                ...(input.status != null ? { status: input.status } : {}),
            },
        });
        if (input.labResults) {
            await tx.labResult.deleteMany({ where: { caseId: id } });
            await tx.labResult.createMany({
                data: input.labResults.map((l) => ({
                    caseId: id,
                    name: l.name,
                    value: l.value,
                    unit: l.unit,
                    normalRange: l.normalRange,
                })),
            });
        }
        if (input.questions) {
            await tx.answerOption.deleteMany({
                where: { question: { caseId: id } },
            });
            await tx.question.deleteMany({ where: { caseId: id } });
            for (let qi = 0; qi < input.questions.length; qi++) {
                const q = input.questions[qi];
                await tx.question.create({
                    data: {
                        caseId: id,
                        text: q.text,
                        imageUrl: q.imageUrl ?? null,
                        summary: q.summary,
                        bibliography: q.bibliography,
                        difficulty: q.difficulty,
                        orderIndex: q.orderIndex ?? qi,
                        options: {
                            create: q.options.map((o) => ({
                                label: o.label,
                                text: o.text,
                                imageUrl: o.imageUrl ?? null,
                                isCorrect: o.isCorrect,
                                explanation: o.explanation,
                            })),
                        },
                    },
                });
            }
        }
    });
    await cacheService.invalidate('cache:specialties*');
    return getCaseById(id);
}
export async function deleteCase(id) {
    await prisma.clinicalCase.delete({ where: { id } }).catch(() => {
        const err = new Error('Caso no encontrado');
        err.status = 404;
        throw err;
    });
    await cacheService.invalidate('cache:specialties*');
    return { data: { ok: true } };
}
//# sourceMappingURL=case.service.js.map