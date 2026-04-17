import { prisma } from '../config/database.js';
import { sanitizeHtmlFragment } from '../utils/html-sanitize.js';
function notFound(message) {
    const err = new Error(message);
    err.status = 404;
    return err;
}
export async function listThreads(params) {
    const skip = (params.page - 1) * params.limit;
    const staff = params.roles.includes('admin') || params.roles.includes('editor');
    const where = {
        ...(params.specialtyId ? { specialtyId: params.specialtyId } : {}),
        ...(params.search
            ? {
                OR: [
                    { title: { contains: params.search } },
                    { body: { contains: params.search } },
                ],
            }
            : {}),
        ...(staff ? {} : { isHidden: false }),
    };
    const orderBy = params.sort === 'pinned'
        ? [{ isPinned: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];
    const [total, threads] = await Promise.all([
        prisma.communityThread.count({ where }),
        prisma.communityThread.findMany({
            where,
            orderBy,
            skip,
            take: params.limit,
            include: {
                author: { select: { id: true, firstName: true, lastName: true } },
                specialty: { select: { id: true, name: true } },
                _count: { select: { posts: true } },
            },
        }),
    ]);
    return {
        data: threads.map((thread) => ({
            id: thread.id,
            title: thread.title,
            body: thread.body,
            isPinned: thread.isPinned,
            isLocked: thread.isLocked,
            isHidden: thread.isHidden,
            createdAt: thread.createdAt.toISOString(),
            updatedAt: thread.updatedAt.toISOString(),
            postCount: thread._count.posts,
            author: {
                id: thread.author.id,
                name: `${thread.author.firstName} ${thread.author.lastName}`.trim(),
            },
            specialty: thread.specialty,
        })),
        page: params.page,
        limit: params.limit,
        total,
    };
}
export async function createThread(userId, body) {
    const safeBody = sanitizeHtmlFragment(body.body);
    const thread = await prisma.communityThread.create({
        data: {
            authorId: userId,
            title: body.title,
            body: safeBody,
            specialtyId: body.specialtyId ?? null,
        },
        include: {
            author: { select: { id: true, firstName: true, lastName: true } },
            specialty: { select: { id: true, name: true } },
        },
    });
    return {
        data: {
            id: thread.id,
            title: thread.title,
            body: thread.body,
            isPinned: thread.isPinned,
            isLocked: thread.isLocked,
            isHidden: thread.isHidden,
            createdAt: thread.createdAt.toISOString(),
            updatedAt: thread.updatedAt.toISOString(),
            author: {
                id: thread.author.id,
                name: `${thread.author.firstName} ${thread.author.lastName}`.trim(),
            },
            specialty: thread.specialty,
        },
    };
}
export async function getThreadById(id, roles) {
    const staff = roles.includes('admin') || roles.includes('editor');
    const thread = await prisma.communityThread.findFirst({
        where: {
            id,
            ...(staff ? {} : { isHidden: false }),
        },
        include: {
            author: { select: { id: true, firstName: true, lastName: true } },
            specialty: { select: { id: true, name: true } },
            posts: {
                where: staff ? {} : { isHidden: false },
                orderBy: { createdAt: 'asc' },
                include: { author: { select: { id: true, firstName: true, lastName: true } } },
            },
        },
    });
    if (!thread)
        throw notFound('Hilo no encontrado');
    return {
        data: {
            id: thread.id,
            title: thread.title,
            body: thread.body,
            isPinned: thread.isPinned,
            isLocked: thread.isLocked,
            isHidden: thread.isHidden,
            createdAt: thread.createdAt.toISOString(),
            updatedAt: thread.updatedAt.toISOString(),
            author: {
                id: thread.author.id,
                name: `${thread.author.firstName} ${thread.author.lastName}`.trim(),
            },
            specialty: thread.specialty,
            posts: thread.posts.map((post) => ({
                id: post.id,
                body: post.body,
                parentPostId: post.parentPostId,
                isHidden: post.isHidden,
                createdAt: post.createdAt.toISOString(),
                updatedAt: post.updatedAt.toISOString(),
                author: {
                    id: post.author.id,
                    name: `${post.author.firstName} ${post.author.lastName}`.trim(),
                },
            })),
        },
    };
}
export async function createPost(userId, threadId, body) {
    const thread = await prisma.communityThread.findUnique({ where: { id: threadId } });
    if (!thread || thread.isHidden)
        throw notFound('Hilo no encontrado');
    if (thread.isLocked) {
        const err = new Error('Este hilo está bloqueado');
        err.status = 400;
        throw err;
    }
    if (body.parentPostId) {
        const parentPost = await prisma.communityPost.findFirst({
            where: { id: body.parentPostId, threadId },
            select: { id: true },
        });
        if (!parentPost)
            throw notFound('Respuesta padre no encontrada');
    }
    const safeBody = sanitizeHtmlFragment(body.body);
    const post = await prisma.communityPost.create({
        data: {
            authorId: userId,
            threadId,
            body: safeBody,
            parentPostId: body.parentPostId ?? null,
        },
        include: { author: { select: { id: true, firstName: true, lastName: true } } },
    });
    return {
        data: {
            id: post.id,
            body: post.body,
            parentPostId: post.parentPostId,
            isHidden: post.isHidden,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString(),
            author: {
                id: post.author.id,
                name: `${post.author.firstName} ${post.author.lastName}`.trim(),
            },
        },
    };
}
export async function moderatePost(postId, isHidden) {
    const existing = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true } });
    if (!existing)
        throw notFound('Respuesta no encontrada');
    const post = await prisma.communityPost.update({
        where: { id: postId },
        data: { isHidden },
        select: { id: true, isHidden: true, updatedAt: true },
    });
    return {
        data: {
            id: post.id,
            isHidden: post.isHidden,
            updatedAt: post.updatedAt.toISOString(),
        },
    };
}
//# sourceMappingURL=community.service.js.map