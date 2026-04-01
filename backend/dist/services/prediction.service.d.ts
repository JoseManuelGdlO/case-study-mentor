export type ExamPrediction = {
    specialtyId: string;
    specialtyName: string;
    estimatedPercentile: number;
    placementProbability: number;
    version: string;
};
export declare function predictPlacement(input: {
    userId: string;
    examId: string;
    score: number;
    selectedSpecialtyIds: string[];
    requestedSpecialtyId?: string | null;
}): Promise<ExamPrediction | null>;
export declare function getLatestPrediction(userId: string): Promise<{
    data: null;
} | {
    data: {
        examId: string;
        completedAt: string | null;
        specialty: string;
        estimatedPercentile: number;
        placementProbability: number;
        version: string;
    };
}>;
//# sourceMappingURL=prediction.service.d.ts.map