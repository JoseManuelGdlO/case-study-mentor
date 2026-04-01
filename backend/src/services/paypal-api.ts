import { env } from '../config/env.js';

function serviceError(message: string, status: number): Error & { status: number } {
  const e = new Error(message) as Error & { status: number };
  e.status = status;
  return e;
}

export function paypalApiBase(): string {
  if (env.PAYPAL_ENV === 'sandbox') return 'https://api-m.sandbox.paypal.com';
  if (env.PAYPAL_ENV === 'live') return 'https://api-m.paypal.com';
  return env.NODE_ENV === 'production' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

let paypalToken: { token: string; expiresAt: number } | null = null;

export async function paypalAccessToken(): Promise<string> {
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_CLIENT_SECRET) {
    throw serviceError('PayPal no está configurado', 503);
  }
  const now = Date.now();
  if (paypalToken && paypalToken.expiresAt > now + 60_000) return paypalToken.token;

  const auth = Buffer.from(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    const t = await res.text();
    throw serviceError(`PayPal OAuth falló: ${t}`, 502);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  paypalToken = {
    token: json.access_token,
    expiresAt: now + (json.expires_in ?? 300) * 1000,
  };
  return json.access_token;
}

export async function paypalFetch(path: string, init: RequestInit): Promise<Response> {
  const token = await paypalAccessToken();
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  return fetch(`${paypalApiBase()}${path}`, { ...init, headers });
}
