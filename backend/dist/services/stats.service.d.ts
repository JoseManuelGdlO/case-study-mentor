export declare function getUserStats(userId: string): Promise<{
    data: Record<string, unknown>;
} | {
    data: {
        totalExams: number;
        totalQuestions: number;
        correctAnswers: number;
        accuracyPercent: number;
        studyStreak: number;
        byCategory: {
            category: string;
            total: number;
            correct: number;
            percent: number;
        }[];
        weeklyProgress: {
            week: string;
            score: number;
        }[];
    };
}>;
export declare function invalidateUserStats(userId: string): Promise<void>;
//# sourceMappingURL=stats.service.d.ts.map