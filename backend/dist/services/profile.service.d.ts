export declare function getProfile(userId: string): Promise<{
    data: {
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
        plan: "free";
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
        firstName: string;
        lastName: string;
        university: string | null;
        graduationYear: number | null;
        examDate: string | null;
        avatarUrl: string | null;
        onboardingDone: boolean;
        roles: import("@prisma/client").$Enums.AppRole[];
        plan: "free";
    };
}>;
export declare function completeOnboarding(userId: string): Promise<{
    data: {
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
        plan: "free";
    };
}>;
//# sourceMappingURL=profile.service.d.ts.map