export declare function listThreads(params: {
    userId: string;
    specialtyId?: string;
    sort: 'recent' | 'pinned';
    page: number;
    limit: number;
    roles: string[];
}): Promise<{
    data: {
        id: string;
        title: string;
        body: string;
        isPinned: boolean;
        isLocked: boolean;
        isHidden: boolean;
        createdAt: string;
        updatedAt: string;
        postCount: number;
        author: {
            id: string;
            name: string;
        };
        specialty: {
            name: string;
            id: string;
        } | null;
    }[];
    page: number;
    limit: number;
    total: number;
}>;
export declare function createThread(userId: string, body: {
    title: string;
    body: string;
    specialtyId?: string | null;
}): Promise<{
    data: {
        id: string;
        title: string;
        body: string;
        isPinned: boolean;
        isLocked: boolean;
        isHidden: boolean;
        createdAt: string;
        updatedAt: string;
        author: {
            id: string;
            name: string;
        };
        specialty: {
            name: string;
            id: string;
        } | null;
    };
}>;
export declare function getThreadById(id: string, roles: string[]): Promise<{
    data: {
        id: string;
        title: string;
        body: string;
        isPinned: boolean;
        isLocked: boolean;
        isHidden: boolean;
        createdAt: string;
        updatedAt: string;
        author: {
            id: string;
            name: string;
        };
        specialty: {
            name: string;
            id: string;
        } | null;
        posts: {
            id: string;
            body: string;
            parentPostId: string | null;
            isHidden: boolean;
            createdAt: string;
            updatedAt: string;
            author: {
                id: string;
                name: string;
            };
        }[];
    };
}>;
export declare function createPost(userId: string, threadId: string, body: {
    body: string;
    parentPostId?: string | null;
}): Promise<{
    data: {
        id: string;
        body: string;
        parentPostId: string | null;
        isHidden: boolean;
        createdAt: string;
        updatedAt: string;
        author: {
            id: string;
            name: string;
        };
    };
}>;
export declare function moderatePost(postId: string, isHidden: boolean): Promise<{
    data: {
        id: string;
        isHidden: boolean;
        updatedAt: string;
    };
}>;
//# sourceMappingURL=community.service.d.ts.map