import type { Response } from 'express';
import { type ImpersonationClaims } from '../utils/jwt.js';
export declare function sessionActiveKey(userId: string): string;
export declare function setAuthCookies(res: Response, userId: string, email: string, impersonation?: ImpersonationClaims): Promise<void>;
/** Target must exist and must not be admin/editor. */
export declare function assertImpersonableTargetUser(targetUserId: string): Promise<ImpersonationClaims>;
export declare function clearAuthCookies(res: Response): void;
export declare function publicUser(userId: string): Promise<{
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
    roles: string[];
    plan: import("./profile.service.js").ApiUserPlan;
    subscriptionExpiresAt: string | null;
    hasStripeSubscription: boolean;
    hasPayPalSubscription: boolean;
    subscriptionCancelAtPeriodEnd: boolean;
    freeTrialExamsUsed: number;
    freeTrialExamsRemaining: number | null;
} | null>;
export declare function register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}, res: Response): Promise<{
    data: {
        user: {
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
            roles: string[];
            plan: import("./profile.service.js").ApiUserPlan;
            subscriptionExpiresAt: string | null;
            hasStripeSubscription: boolean;
            hasPayPalSubscription: boolean;
            subscriptionCancelAtPeriodEnd: boolean;
            freeTrialExamsUsed: number;
            freeTrialExamsRemaining: number | null;
        } | null;
        isNewUser: boolean;
    };
}>;
/** Crea cuenta con email/contraseña y roles arbitrarios (solo invocado desde backoffice admin). */
export declare function createUserByAdmin(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roles: ('admin' | 'editor' | 'user')[];
}): Promise<{
    data: {
        user: {
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
            roles: string[];
            plan: import("./profile.service.js").ApiUserPlan;
            subscriptionExpiresAt: string | null;
            hasStripeSubscription: boolean;
            hasPayPalSubscription: boolean;
            subscriptionCancelAtPeriodEnd: boolean;
            freeTrialExamsUsed: number;
            freeTrialExamsRemaining: number | null;
        };
    };
}>;
export declare function login(data: {
    email: string;
    password: string;
}, res: Response): Promise<{
    data: {
        user: {
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
            roles: string[];
            plan: import("./profile.service.js").ApiUserPlan;
            subscriptionExpiresAt: string | null;
            hasStripeSubscription: boolean;
            hasPayPalSubscription: boolean;
            subscriptionCancelAtPeriodEnd: boolean;
            freeTrialExamsUsed: number;
            freeTrialExamsRemaining: number | null;
        } | null;
        isNewUser: boolean;
    };
}>;
export declare function refreshTokens(refreshCookie: string | undefined, res: Response): Promise<{
    data: {
        user: {
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
            roles: string[];
            plan: import("./profile.service.js").ApiUserPlan;
            subscriptionExpiresAt: string | null;
            hasStripeSubscription: boolean;
            hasPayPalSubscription: boolean;
            subscriptionCancelAtPeriodEnd: boolean;
            freeTrialExamsUsed: number;
            freeTrialExamsRemaining: number | null;
        };
    };
}>;
export declare function requestPasswordReset(email: string): Promise<{
    data: {
        message: string;
    };
}>;
export declare function logout(refreshCookie: string | undefined, res: Response): Promise<{
    data: {
        ok: boolean;
    };
}>;
export declare function googleAuth(idToken: string, res: Response): Promise<{
    data: {
        user: {
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
            roles: string[];
            plan: import("./profile.service.js").ApiUserPlan;
            subscriptionExpiresAt: string | null;
            hasStripeSubscription: boolean;
            hasPayPalSubscription: boolean;
            subscriptionCancelAtPeriodEnd: boolean;
            freeTrialExamsUsed: number;
            freeTrialExamsRemaining: number | null;
        } | null;
        isNewUser: boolean;
    };
}>;
//# sourceMappingURL=auth.service.d.ts.map