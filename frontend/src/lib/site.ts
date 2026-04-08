/** Canonical public site URL (no trailing slash). Override with VITE_SITE_URL in build. */
export function getSiteUrl(): string {
  const raw = import.meta.env.VITE_SITE_URL ?? 'https://enarmx.com.mx';
  return raw.replace(/\/$/, '');
}

export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'ENARMX';

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function defaultOgImageUrl(): string {
  return `${getSiteUrl()}/og-default.png`;
}
