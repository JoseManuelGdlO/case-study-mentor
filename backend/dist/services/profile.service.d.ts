import type { SubscriptionTier } from '@prisma/client';
export type ApiUserPlan = 'free' | 'monthly' | 'semester' | 'annual';
export declare function effectivePlanFromProfile(row: {
    subscriptionTier: SubscriptionTier;
    subscriptionExpiresAt: Date | null;
}): {
    plan: ApiUserPlan;
    subscriptionExpiresAt: string | null;
};
export declare function getProfile(userId: string): Promise<{
    data: {
        id: string;
        email: string;
        authProvider: import("@prisma/client").$Enums.AuthProvider;
        firstName: string;
        lastName: string;
        university: string | null;
        graduationYear: number | null;
        examDate: string | null;
        avatarUrl: string | null;
        onboardingDone: boolean;
        roles: import("@prisma/client").$Enums.AppRole[];
        plan: ApiUserPlan;
        subscriptionExpiresAt: string | null;
    };
}>;
export declare function updateProfile(userId: string, body: {
    firstName?: string;
    lastName?: string;
    university?: string | null;
    graduationYear?: number | null;
    examDate?: string | null;
    avatarUrl?: string | null;
}): Promise<{
    data: {
        id: string;
        email: string;
        authProvider: import("@prisma/client").$Enums.AuthProvider;
        firstName: string;
        lastName: string;
        university: string | null;
        graduationYear: number | null;
        examDate: string | null;
        avatarUrl: string | null;
        onboardingDone: boolean;
        roles: import("@prisma/client").$Enums.AppRole[];
        plan: ApiUserPlan;
        subscriptionExpiresAt: string | null;
    };
}>;
export declare function completeOnboarding(userId: string): Promise<{
    data: {
        id: string;
        email: string;
        authProvider: import("@prisma/client").$Enums.AuthProvider;
        firstName: string;
        lastName: string;
        university: string | null;
        graduationYear: number | null;
        examDate: string | null;
        avatarUrl: string | null;
        onboardingDone: boolean;
        roles: import("@prisma/client").$Enums.AppRole[];
        plan: ApiUserPlan;
        subscriptionExpiresAt: string | null;
    };
}>;
export declare function changePassword(userId: string, body: {
    currentPassword: string;
    newPassword: string;
}): Promise<{
    data: {
        ok: boolean;
    };
}>;
//# sourceMappingURL=profile.service.d.ts.map