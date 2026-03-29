/** Express route/query params can be string | string[] */
export function paramString(v: string | string[] | undefined): string {
  if (v == null) return '';
  return Array.isArray(v) ? v[0] ?? '' : v;
}
