import { prisma } from '../config/database.js';
import { paginationMeta, paginationParams } from '../utils/helpers.js';
import type { z } from 'zod';
import type { createCaseSchema, updateCaseSchema } from '../schemas/case.schema.js';
import { cacheService } from './cache.service.js';
import { sanitizeCreateCasePayload, sanitizeUpdateCasePayload } from '../utils/case-payload-sanitize.js';

type CreateCase = z.infer<typeof createCaseSchema>;
type UpdateCase = z.infer<typeof updateCaseSchema>;

function serializeCase(row: {
  id: string;
  specialtyId: string;
  areaId: string;
  topic: string;
  language: string;
  text: string;
  textFormat: 'plain' | 'html';
  imageUrl: string | null;
  generatedByIa: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
  updatedById: string | null;
  createdBy: { id: string; firstName: string; lastName: string; email: string } | null;
  updatedBy: { id: string; firstName: string; lastName: string; email: string } | null;
  specialty: { name: string };
  area: { name: string };
  labResults: { id: string; name: string; value: string; unit: string; normalRange: string }[];
  questions: {
    id: string;
    text: string;
    imageUrl: string | null;
    feedbackImageUrl: string | null;
    summary: string;
    bibliography: string;
    difficultyLevel: number;
    cognitiveCompetence: boolean;
    previousEnarmPresence: boolean;
    hint: string;
    orderIndex: number;
    options: { id: string; label: string; text: string; imageUrl: string | null; isCorrect: boolean; explanation: string }[];
  }[];
}) {
  return {
    id: row.id,
    specialtyId: row.specialtyId,
    areaId: row.areaId,
    specialty: row.specialty.name,
    area: row.area.name,
    topic: row.topic,
    language: row.language,
    text: row.text,
    textFormat: row.textFormat,
    imageUrl: row.imageUrl ?? undefined,
    generatedByIa: row.generatedByIa,
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
        feedbackImageUrl: q.feedbackImageUrl ?? undefined,
        summary: q.summary,
        bibliography: q.bibliography,
        difficultyLevel: q.difficultyLevel,
        cognitiveCompetence: q.cognitiveCompetence,
        previousEnarmPresence: q.previousEnarmPresence,
        hint: q.hint,
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
    createdBy: row.createdBy
      ? {
          id: row.createdBy.id,
          name: `${row.createdBy.firstName} ${row.createdBy.lastName}`.trim(),
          email: row.createdBy.email,
        }
      : undefined,
    updatedBy: row.updatedBy
      ? {
          id: row.updatedBy.id,
          name: `${row.updatedBy.firstName} ${row.updatedBy.lastName}`.trim(),
          email: row.updatedBy.email,
        }
      : undefined,
  };
}

export async function listCases(query: {
  specialty?: string;
  area?: string;
  status?: string;
  page?: string | number;
  limit?: string | number;
}) {
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
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        labResults: true,
        questions: { include: { options: true }, orderBy: { orderIndex: 'asc' } },
      },
    }),
  ]);
  const meta = paginationMeta(total, page, limit);
  return {
    data: rows.map(serializeCase),
    total,
    page,
    totalPages: meta.totalPages,
    meta,
  };
}

export async function getCaseById(id: string) {
  const row = await prisma.clinicalCase.findUnique({
    where: { id },
    include: {
      specialty: true,
      area: true,
      createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      labResults: true,
      questions: { include: { options: true }, orderBy: { orderIndex: 'asc' } },
    },
  });
  if (!row) {
    const err = new Error('Caso no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  }
  return { data: serializeCase(row) };
}

export async function createCase(input: CreateCase, userId: string) {
  const sanitized = sanitizeCreateCasePayload(input);
  const created = await prisma.$transaction(async (tx) => {
    const c = await tx.clinicalCase.create({
      data: {
        specialtyId: sanitized.specialtyId,
        areaId: sanitized.areaId,
        topic: sanitized.topic,
        language: sanitized.language,
        text: sanitized.text,
        textFormat: sanitized.textFormat,
        imageUrl: sanitized.imageUrl ?? null,
        generatedByIa: sanitized.generatedByIa ?? false,
        status: sanitized.status,
        createdById: userId,
        updatedById: userId,
        labResults: {
          create: (sanitized.labResults ?? []).map((l) => ({
            name: l.name,
            value: l.value,
            unit: l.unit,
            normalRange: l.normalRange,
          })),
        },
        questions: {
          create: sanitized.questions.map((q, qi) => ({
            text: q.text,
            imageUrl: q.imageUrl ?? null,
            feedbackImageUrl: q.feedbackImageUrl ?? null,
            summary: q.summary,
            bibliography: q.bibliography,
            difficultyLevel: q.difficultyLevel,
            cognitiveCompetence: q.cognitiveCompetence,
            previousEnarmPresence: q.previousEnarmPresence,
            hint: q.hint,
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
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        labResults: true,
        questions: { include: { options: true }, orderBy: { orderIndex: 'asc' } },
      },
    });
    return c;
  });
  await cacheService.invalidate('cache:specialties*');
  return getCaseById(created.id);
}

export async function updateCase(id: string, input: UpdateCase, userId: string) {
  const existing = await prisma.clinicalCase.findUnique({ where: { id } });
  if (!existing) {
    const err = new Error('Caso no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  }

  const sanitized = sanitizeUpdateCasePayload(input, existing.textFormat);

  await prisma.$transaction(async (tx) => {
    await tx.clinicalCase.update({
      where: { id },
      data: {
        ...(sanitized.specialtyId != null ? { specialtyId: sanitized.specialtyId } : {}),
        ...(sanitized.areaId != null ? { areaId: sanitized.areaId } : {}),
        ...(sanitized.topic != null ? { topic: sanitized.topic } : {}),
        ...(sanitized.language != null ? { language: sanitized.language } : {}),
        ...(sanitized.text != null ? { text: sanitized.text } : {}),
        ...(sanitized.textFormat != null ? { textFormat: sanitized.textFormat } : {}),
        ...(sanitized.imageUrl !== undefined ? { imageUrl: sanitized.imageUrl } : {}),
        ...(sanitized.generatedByIa !== undefined ? { generatedByIa: sanitized.generatedByIa } : {}),
        ...(sanitized.status != null ? { status: sanitized.status } : {}),
        updatedById: userId,
      },
    });

    if (sanitized.labResults) {
      await tx.labResult.deleteMany({ where: { caseId: id } });
      await tx.labResult.createMany({
        data: sanitized.labResults.map((l) => ({
          caseId: id,
          name: l.name,
          value: l.value,
          unit: l.unit,
          normalRange: l.normalRange,
        })),
      });
    }

    if (sanitized.questions) {
      await tx.answerOption.deleteMany({
        where: { question: { caseId: id } },
      });
      await tx.question.deleteMany({ where: { caseId: id } });
      for (let qi = 0; qi < sanitized.questions.length; qi++) {
        const q = sanitized.questions[qi];
        await tx.question.create({
          data: {
            caseId: id,
            text: q.text,
            imageUrl: q.imageUrl ?? null,
            feedbackImageUrl: q.feedbackImageUrl ?? null,
            summary: q.summary,
            bibliography: q.bibliography,
            difficultyLevel: q.difficultyLevel,
            cognitiveCompetence: q.cognitiveCompetence,
            previousEnarmPresence: q.previousEnarmPresence,
            hint: q.hint,
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

export async function deleteCase(id: string) {
  await prisma.clinicalCase.delete({ where: { id } }).catch(() => {
    const err = new Error('Caso no encontrado') as Error & { status: number };
    err.status = 404;
    throw err;
  });
  await cacheService.invalidate('cache:specialties*');
  return { data: { ok: true } };
}

export async function deleteCasesBulk(ids: string[]) {
  const uniqueIds = [...new Set(ids)];
  const result = await prisma.clinicalCase.deleteMany({
    where: { id: { in: uniqueIds } },
  });
  await cacheService.invalidate('cache:specialties*');
  return { data: { deleted: result.count } };
}
