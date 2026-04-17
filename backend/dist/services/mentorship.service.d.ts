import { MentorshipStatus } from '@prisma/client';
export declare function createRequest(studentId: string, body: {
    topic: string;
    context?: string | null;
    availability?: string | null;
    specialtyId?: string | null;
}): Promise<{
    data: {
        id: string;
        topic: string;
        context: string | null;
        availability: string | null;
        status: import("@prisma/client").$Enums.MentorshipStatus;
        statusNote: string | null;
        externalMeetingUrl: string | null;
        scheduledAt: string | null;
        createdAt: string;
        updatedAt: string;
        student: {
            id: string;
            name: string;
        };
        mentor: {
            id: string;
            name: string;
        } | null;
        specialty: {
            id: string;
            name: string;
        } | null;
    };
}>;
export declare function listMine(studentId: string): Promise<{
    data: {
        id: string;
        topic: string;
        context: string | null;
        availability: string | null;
        status: import("@prisma/client").$Enums.MentorshipStatus;
        statusNote: string | null;
        externalMeetingUrl: string | null;
        scheduledAt: string | null;
        createdAt: string;
        updatedAt: string;
        student: {
            id: string;
            name: string;
        };
        mentor: {
            id: string;
            name: string;
        } | null;
        specialty: {
            id: string;
            name: string;
        } | null;
    }[];
}>;
export declare function listForStaff(params: {
    status?: MentorshipStatus;
    page: number;
    limit: number;
}): Promise<{
    data: {
        id: string;
        topic: string;
        context: string | null;
        availability: string | null;
        status: import("@prisma/client").$Enums.MentorshipStatus;
        statusNote: string | null;
        externalMeetingUrl: string | null;
        scheduledAt: string | null;
        createdAt: string;
        updatedAt: string;
        student: {
            id: string;
            name: string;
        };
        mentor: {
            id: string;
            name: string;
        } | null;
        specialty: {
            id: string;
            name: string;
        } | null;
    }[];
    page: number;
    limit: number;
    total: number;
}>;
export declare function updateStatus(requestId: string, actorId: string, body: {
    status: MentorshipStatus;
    mentorId?: string | null;
    statusNote?: string | null;
    scheduledAt?: string | null;
    externalMeetingUrl?: string | null;
}): Promise<{
    data: {
        id: string;
        topic: string;
        context: string | null;
        availability: string | null;
        status: import("@prisma/client").$Enums.MentorshipStatus;
        statusNote: string | null;
        externalMeetingUrl: string | null;
        scheduledAt: string | null;
        createdAt: string;
        updatedAt: string;
        student: {
            id: string;
            name: string;
        };
        mentor: {
            id: string;
            name: string;
        } | null;
        specialty: {
            id: string;
            name: string;
        } | null;
    };
}>;
export declare function listMentors(): Promise<{
    data: {
        id: string;
        name: string;
        email: string;
        roles: import("@prisma/client").$Enums.AppRole[];
    }[];
}>;
//# sourceMappingURL=mentorship.service.d.ts.map