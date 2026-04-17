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
export declare function getTodayWellbeing(userId: string): Promise<{
    data: {
        date: string;
        log: {
            id: string;
            mood: import("@prisma/client").$Enums.WellbeingMood;
            anxietyLevel: number;
            focusLevel: number;
            sleepHours: number | null;
            plannedStudyMinutes: number;
            completedStudyMinutes: number;
            notes: string | null;
            createdAt: string;
            updatedAt: string;
        } | null;
        interventions: {
            id: string;
            kind: import("@prisma/client").$Enums.WellbeingInterventionKind;
            durationMinutes: number;
            completed: boolean;
            date: string;
            createdAt: string;
        }[];
    };
}>;
export declare function upsertTodayWellbeing(userId: string, payload: {
    mood: 'very_low' | 'low' | 'neutral' | 'good' | 'great';
    anxietyLevel: number;
    focusLevel: number;
    sleepHours?: number | null;
    plannedStudyMinutes: number;
    completedStudyMinutes: number;
    notes?: string | null;
}): Promise<{
    data: {
        id: string;
        mood: import("@prisma/client").$Enums.WellbeingMood;
        anxietyLevel: number;
        focusLevel: number;
        sleepHours: number | null;
        plannedStudyMinutes: number;
        completedStudyMinutes: number;
        notes: string | null;
        date: string;
        updatedAt: string;
    };
}>;
export declare function logWellbeingIntervention(userId: string, payload: {
    kind: 'breathing' | 'pomodoro' | 'break_reset' | 'grounding' | 'stretch';
    durationMinutes: number;
    completed: boolean;
}): Promise<{
    data: {
        id: string;
        kind: import("@prisma/client").$Enums.WellbeingInterventionKind;
        durationMinutes: number;
        completed: boolean;
        date: string;
        createdAt: string;
    };
}>;
export declare function getWeeklyWellbeing(userId: string): Promise<{
    data: {
        days: {
            date: string;
            mood: import("@prisma/client").$Enums.WellbeingMood | null;
            anxietyLevel: number | null;
            focusLevel: number | null;
            plannedStudyMinutes: number;
            completedStudyMinutes: number;
            adherencePercent: number;
            interventionsCount: number;
        }[];
        summary: {
            avgAnxiety: number;
            avgFocus: number;
            avgAdherence: number;
            completedLogs: number;
            interventionsUsed: number;
        };
    };
}>;
//# sourceMappingURL=study-plan.service.d.ts.map