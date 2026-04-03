import { prisma } from '../config/database.js';
import { getExamById } from './exam.service.js';
import { paginationParams, totalPages } from '../utils/helpers.js';
export async function listPendingMentorReviews(pageInput, limitInput) {
    const { skip, take, page, limit } = paginationParams(pageInput, limitInput);
    const where = {
        mentorReviewEligible: true,
        mentorReviewedAt: null,
        status: 'completed',
    };
    const [rows, total] = await Promise.all([
        prisma.exam.findMany({
            where,
            orderBy: { completedAt: 'desc' },
            skip,
            take,
            include: {
                user: { select: { email: true, firstName: true, lastName: true } },
            },
        }),
        prisma.exam.count({ where }),
    ]);
    const data = rows.map((e) => ({
        id: e.id,
        mode: e.mode,
        score: e.score,
        questionCount: e.questionCount,
        completedAt: e.completedAt?.toISOString() ?? null,
        user: {
            email: e.user.email,
            firstName: e.user.firstName,
            lastName: e.user.lastName,
        },
    }));
    return {
        data,
        total,
        page,
        totalPages: totalPages(total, limit),
    };
}
export async function getMentorReviewExamDetail(examId) {
    const exam = await prisma.exam.findFirst({
        where: { id: examId, mentorReviewEligible: true, status: 'completed' },
        include: { user: { select: { email: true, firstName: true, lastName: true } } },
    });
    if (!exam) {
        const err = new Error('Examen no encontrado o no elegible para revisión');
        err.status = 404;
        throw err;
    }
    const { data } = await getExamById(exam.userId, examId);
    return {
        data: {
            exam: data,
            student: {
                email: exam.user.email,
                firstName: exam.user.firstName,
                lastName: exam.user.lastName,
            },
        },
    };
}
export async function submitMentorReview(examId, reviewerId, body) {
    const exam = await prisma.exam.findFirst({
        where: {
            id: examId,
            mentorReviewEligible: true,
            mentorReviewedAt: null,
            status: 'completed',
        },
        select: { id: true, userId: true },
    });
    if (!exam) {
        const err = new Error('Examen no pendiente de revisión');
        err.status = 404;
        throw err;
    }
    await prisma.exam.update({
        where: { id: examId },
        data: {
            mentorReviewRating: body.rating,
            mentorReviewComment: body.comment?.trim() ? body.comment.trim() : null,
            mentorReviewedAt: new Date(),
            mentorReviewedById: reviewerId,
        },
    });
    return getMentorReviewExamDetail(examId);
}
//# sourceMappingURL=exam-review.service.js.map