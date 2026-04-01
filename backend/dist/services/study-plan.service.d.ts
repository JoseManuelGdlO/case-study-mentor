export declare function getTodayStudyPlan(userId: string): Promise<{
    data: Record<string, unknown>;
} | {
    data: null;
} | {
    data: {
        id: string;
        date: string;
        status: string;
        isFreeLimited: boolean;
        premium: boolean;
        targetMinutes: number;
        completionPercent: number;
        estimatedImpact14Days: {
            scoreDelta: number;
            percentileDelta: number;
        };
        tasks: {
            id: string;
            type: string;
            title: string;
            description: string | null;
            targetCount: number;
            completedCount: number;
            payload: unknown;
            completed: boolean;
        }[];
    };
}>;
export declare function regenerateTodayStudyPlan(userId: string): Promise<{
    data: {
        id: string;
        date: string;
        status: string;
        isFreeLimited: boolean;
        premium: boolean;
        targetMinutes: number;
        completionPercent: number;
        estimatedImpact14Days: {
            scoreDelta: number;
            percentileDelta: number;
        };
        tasks: {
            id: string;
            type: string;
            title: string;
            description: string | null;
            targetCount: number;
            completedCount: number;
            payload: unknown;
            completed: boolean;
        }[];
    };
}>;
export declare function completeStudyPlanTask(userId: string, planId: string, taskId: string, body: {
    completedCount?: number;
    score?: number;
    timeSpentSeconds: number;
}): Promise<{
    data: Record<string, unknown>;
} | {
    data: null;
} | {
    data: {
        id: string;
        date: string;
        status: string;
        isFreeLimited: boolean;
        premium: boolean;
        targetMinutes: number;
        completionPercent: number;
        estimatedImpact14Days: {
            scoreDelta: number;
            percentileDelta: number;
        };
        tasks: {
            id: string;
            type: string;
            title: string;
            description: string | null;
            targetCount: number;
            completedCount: number;
            payload: unknown;
            completed: boolean;
        }[];
    };
}>;
export declare function getStudyPlanImpact(userId: string): Promise<{
    data: Record<string, unknown>;
} | {
    data: {
        last14Days: {
            totalPlans: number;
            completedPlans: number;
            completionRate: number;
            scoreDelta: number;
            percentileDelta: number;
        };
        estimate: {
            scoreDelta: number;
            percentileDelta: number;
        };
    };
}>;
export declare function invalidateStudyPlanCaches(userId: string): Promise<void>;
//# sourceMappingURL=study-plan.service.d.ts.map