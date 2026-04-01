import { prisma } from '../config/database.js';

export type ExamPrediction = {
  specialtyId: string;
  specialtyName: string;
  estimatedPercentile: number;
  placementProbability: number;
  version: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export async function predictPlacement(input: {
  userId: string;
  examId: string;
  score: number;
  selectedSpecialtyIds: string[];
  requestedSpecialtyId?: string | null;
}): Promise<ExamPrediction | null> {
  const specialtyId =
    input.requestedSpecialtyId && input.selectedSpecialtyIds.includes(input.requestedSpecialtyId)
      ? input.requestedSpecialtyId
      : input.selectedSpecialtyIds[0];
  if (!specialtyId) return null;

  const specialty = await prisma.specialty.findUnique({
    where: { id: specialtyId },
    select: { id: true, name: true },
  });
  if (!specialty) return null;

  const calibration = await prisma.predictionCalibration.findFirst({
    where: {
      specialtyId,
      minScore: { lte: input.score },
      maxScore: { gte: input.score },
    },
    orderBy: [{ version: 'desc' }, { minScore: 'desc' }],
  });

  let estimatedPercentile: number;
  let placementProbability: number;
  let version = 'heuristic-v1';

  if (calibration) {
    estimatedPercentile = round2(clamp(calibration.percentileEstimate, 1, 99));
    placementProbability = round2(clamp(calibration.probabilityEstimate, 0, 100));
    version = calibration.version;
  } else {
    // Fallback heuristic while calibration table gets populated.
    estimatedPercentile = round2(clamp(input.score * 0.95 + 5, 1, 99));
    placementProbability = round2(clamp(input.score * 0.8 + 5, 1, 99));
  }

  return {
    specialtyId: specialty.id,
    specialtyName: specialty.name,
    estimatedPercentile,
    placementProbability,
    version,
  };
}

export async function getLatestPrediction(userId: string) {
  const exam = await prisma.exam.findFirst({
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

  if (!exam || exam.predictedPercentile == null || exam.predictedPlacementProbability == null || !exam.predictionSpecialty) {
    return { data: null };
  }

  return {
    data: {
      examId: exam.id,
      completedAt: exam.completedAt?.toISOString() ?? null,
      specialty: exam.predictionSpecialty,
      estimatedPercentile: exam.predictedPercentile,
      placementProbability: exam.predictedPlacementProbability,
      version: exam.predictionVersion ?? 'heuristic-v1',
    },
  };
}
