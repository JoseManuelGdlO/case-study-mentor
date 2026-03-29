import type { Response } from 'express';
export declare function setAuthCookies(res: Response, userId: string, email: string): Promise<void>;
export declare function clearAuthCookies(res: Response): void;
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
            firstName: string;
            lastName: string;
            university: string | null;
            graduationYear: number | null;
            examDate: string | null;
            avatarUrl: string | null;
            onboardingDone: boolean;
            roles: import("@prisma/client").$Enums.AppRole[];
        } | null;
        isNewUser: boolean;
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
            firstName: string;
            lastName: string;
            university: string | null;
            graduationYear: number | null;
            examDate: string | null;
            avatarUrl: string | null;
            onboardingDone: boolean;
            roles: import("@prisma/client").$Enums.AppRole[];
        } | null;
        isNewUser: boolean;
    };
}>;
export declare function refreshTokens(refreshCookie: string | undefined, res: Response): Promise<{
    data: {
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            university: string | null;
            graduationYear: number | null;
            examDate: string | null;
            avatarUrl: string | null;
            onboardingDone: boolean;
            roles: import("@prisma/client").$Enums.AppRole[];
        } | null;
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
            firstName: string;
            lastName: string;
            university: string | null;
            graduationYear: number | null;
            examDate: string | null;
            avatarUrl: string | null;
            onboardingDone: boolean;
            roles: import("@prisma/client").$Enums.AppRole[];
        } | null;
        isNewUser: boolean;
    };
}>;
//# sourceMappingURL=auth.service.d.ts.map