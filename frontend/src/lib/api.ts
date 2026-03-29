const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? '';

function url(path: string): string {
  if (path.startsWith('http')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export type ApiErrorBody = { error: string; details?: unknown };

async function tryRefresh(): Promise<boolean> {
  const res = await fetch(url('/api/auth/refresh'), {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.ok;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.body != null && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  let res = await fetch(url(path), {
    ...init,
    credentials: 'include',
    headers,
  });
  if (res.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/register') && !path.includes('/auth/refresh')) {
    const ok = await tryRefresh();
    if (ok) {
      res = await fetch(url(path), {
        ...init,
        credentials: 'include',
        headers,
      });
    }
  }
  return res;
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  const json = (await res.json().catch(() => ({}))) as T & ApiErrorBody;
  if (!res.ok) {
    const msg = typeof json.error === 'string' ? json.error : res.statusText;
    throw new Error(msg || 'Error de red');
  }
  return json as T;
}

export function getUploadUrl(relative: string): string {
  if (relative.startsWith('http')) return relative;
  return url(relative);
}
