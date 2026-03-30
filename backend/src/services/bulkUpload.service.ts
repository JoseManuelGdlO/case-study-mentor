import * as XLSX from 'xlsx';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { cacheService } from './cache.service.js';

function parseDifficultyLevel(raw: unknown): 1 | 2 | 3 {
  if (raw === 1 || raw === 2 || raw === 3) return raw;
  const s = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (s === '1' || s === 'baja' || s === 'low') return 1;
  if (s === '3' || s === 'alta' || s === 'high') return 3;
  if (s === '2' || s === 'media' || s === 'medium') return 2;
  return 2;
}

function parseBool01(raw: unknown, defaultVal = false): boolean {
  if (raw == null || String(raw).trim() === '') return defaultVal;
  const s = String(raw).trim().toLowerCase();
  if (s === '1' || s === 'sí' || s === 'si' || s === 'true' || s === 'yes' || s === 's') return true;
  if (s === '0' || s === 'no' || s === 'false' || s === 'n') return false;
  return defaultVal;
}

const rowSchema = z.object({
  Especialidad: z.string().min(1),
  area: z.string().min(1),
  Tema: z.string().min(1),
  Idioma: z.enum(['es', 'en']),
  casoTexto: z.string().min(1),
  imagenUrl: z.string().optional().nullable(),
  Pregunta: z.string().min(1),
  optA: z.string().min(1),
  optB: z.string().min(1),
  optC: z.string().min(1),
  optD: z.string().min(1),
  correcta: z.enum(['A', 'B', 'C', 'D']),
  expA: z.string().min(1),
  expB: z.string().min(1),
  expC: z.string().min(1),
  expD: z.string().min(1),
  Resumen: z.string().min(1),
  Bibliografía: z.string().min(1),
  difficultyLevel: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  competenciaCognitiva: z.boolean(),
  enarmPrevio: z.boolean(),
  pista: z.string(),
  labNombre: z.string().optional().nullable(),
  labValor: z.string().optional().nullable(),
  labUnidad: z.string().optional().nullable(),
  labRango: z.string().optional().nullable(),
});

function normalizeRow(raw: Record<string, unknown>): Record<string, unknown> {
  const r = { ...raw };
  const pick = (keys: string[]) => {
    for (const k of keys) {
      if (r[k] != null && String(r[k]).trim() !== '') return r[k];
    }
    return undefined;
  };

  return {
    Especialidad: pick(['Especialidad']),
    area: pick(['Área', 'Area', 'area']),
    Tema: pick(['Tema']),
    Idioma: (() => {
      const v = String(pick(['Idioma', 'Idioma (es/en)', 'Idioma(es/en)']) ?? 'es')
        .trim()
        .toLowerCase();
      return v === 'en' ? 'en' : 'es';
    })(),
    casoTexto: pick(['TextoCaso', 'Caso Clínico', 'Caso Clinico']),
    imagenUrl: pick(['ImagenURL', 'Imagen URL']) ?? null,
    Pregunta: pick(['Pregunta']),
    optA: pick(['OpciónA', 'Opción A', 'Opcion A']),
    optB: pick(['OpciónB', 'Opción B', 'Opcion B']),
    optC: pick(['OpciónC', 'Opción C', 'Opcion C']),
    optD: pick(['OpciónD', 'Opción D', 'Opcion D']),
    correcta: String(pick(['RespuestaCorrecta', 'Respuesta Correcta (A/B/C/D)']) ?? '')
      .trim()
      .toUpperCase()
      .slice(0, 1),
    expA: pick(['ExplicaciónA', 'Explicación A']),
    expB: pick(['ExplicaciónB', 'Explicación B']),
    expC: pick(['ExplicaciónC', 'Explicación C']),
    expD: pick(['ExplicaciónD', 'Explicación D']),
    Resumen: pick(['Resumen']),
    Bibliografía: pick(['Bibliografía', 'Bibliografia']),
    difficultyLevel: parseDifficultyLevel(
      pick(['Dificultad', 'Dificultad (1/2/3)', 'Dificultad (low/medium/high)']) ?? 'medium',
    ),
    competenciaCognitiva: parseBool01(
      pick([
        'Competencia cognitiva',
        'CompetenciaCognitiva',
        'Competencia_cognitiva',
        'Competencia cognitiva (0/1)',
      ]),
    ),
    enarmPrevio: parseBool01(
      pick([
        'ENARM previo',
        'Presencia ENARM previo',
        'PresenciaEnARM',
        'Presencia en ENARM previo',
      ]),
    ),
    pista: String(pick(['Pista', 'Pista (pregunta)']) ?? '').trim(),
    labNombre: pick(['Lab_Nombre', 'Lab - Estudio', 'Lab - Nombre']) ?? null,
    labValor: pick(['Lab_Valor', 'Lab - Valor']) ?? null,
    labUnidad: pick(['Lab_Unidad', 'Lab - Unidad']) ?? null,
    labRango: pick(['Lab_RangoNormal', 'Lab - Rango Normal', 'Lab Rango Normal']) ?? null,
  };
}

export async function processBulkUpload(buffer: Buffer): Promise<{
  data: { success: number; errors: { row: number; error: string }[] };
}> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const results = { success: 0, errors: [] as { row: number; error: string }[] };

  for (let i = 0; i < rows.length; i++) {
    const normalized = normalizeRow(rows[i]);
    const correctLetter = normalized.correcta;
    if (!['A', 'B', 'C', 'D'].includes(String(correctLetter))) {
      results.errors.push({ row: i + 2, error: 'Respuesta correcta inválida' });
      continue;
    }
    const parsed = rowSchema.safeParse({
      ...normalized,
      correcta: correctLetter,
    });
    if (!parsed.success) {
      results.errors.push({
        row: i + 2,
        error: parsed.error.issues.map((e) => e.message).join('; '),
      });
      continue;
    }
    const row = parsed.data;
    const labels = ['A', 'B', 'C', 'D'] as const;
    const texts = [row.optA, row.optB, row.optC, row.optD];
    const expl = [row.expA, row.expB, row.expC, row.expD];

    try {
      await prisma.$transaction(async (tx) => {
        let spec = await tx.specialty.findFirst({ where: { name: row.Especialidad } });
        if (!spec) {
          spec = await tx.specialty.create({ data: { name: row.Especialidad } });
        }
        let area = await tx.area.findFirst({
          where: { specialtyId: spec.id, name: row.area },
        });
        if (!area) {
          area = await tx.area.create({
            data: { specialtyId: spec.id, name: row.area },
          });
        }

        await tx.clinicalCase.create({
          data: {
            specialtyId: spec.id,
            areaId: area.id,
            topic: row.Tema,
            language: row.Idioma,
            text: row.casoTexto,
            imageUrl: row.imagenUrl ? String(row.imagenUrl) : null,
            status: 'published',
            labResults:
              row.labNombre && row.labValor
                ? {
                    create: [
                      {
                        name: String(row.labNombre),
                        value: String(row.labValor),
                        unit: String(row.labUnidad ?? ''),
                        normalRange: String(row.labRango ?? ''),
                      },
                    ],
                  }
                : undefined,
            questions: {
              create: [
                {
                  text: row.Pregunta,
                  summary: row.Resumen,
                  bibliography: row.Bibliografía,
                  difficultyLevel: row.difficultyLevel,
                  cognitiveCompetence: row.competenciaCognitiva,
                  previousEnarmPresence: row.enarmPrevio,
                  hint: row.pista,
                  orderIndex: 0,
                  options: {
                    create: labels.map((label, idx) => ({
                      label,
                      text: texts[idx],
                      isCorrect: label === row.correcta,
                      explanation: expl[idx],
                    })),
                  },
                },
              ],
            },
          },
        });
      });
      results.success++;
    } catch (err) {
      results.errors.push({
        row: i + 2,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await cacheService.invalidate('cache:specialties*');
  return { data: results };
}
