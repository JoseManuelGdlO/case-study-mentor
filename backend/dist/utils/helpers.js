export function paginationParams(page, limit) {
    const p = Math.max(1, parseInt(String(page ?? '1'), 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(String(limit ?? '20'), 10) || 20));
    return { skip: (p - 1) * l, take: l, page: p, limit: l };
}
export function totalPages(total, limit) {
    return Math.max(1, Math.ceil(total / limit));
}
export function paginationMeta(total, page, limit) {
    const pages = totalPages(total, limit);
    return {
        page,
        limit,
        total,
        totalPages: pages,
        hasNext: page < pages,
        hasPrev: page > 1,
    };
}
export function shuffleInPlace(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
//# sourceMappingURL=helpers.js.map