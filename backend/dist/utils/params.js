/** Express route/query params can be string | string[] */
export function paramString(v) {
    if (v == null)
        return '';
    return Array.isArray(v) ? v[0] ?? '' : v;
}
//# sourceMappingURL=params.js.map