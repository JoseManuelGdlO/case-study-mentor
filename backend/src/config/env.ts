import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** override: true para que `.env` gane sobre NODE_ENV/SMTP vacíos heredados del shell o Docker. */
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });
/** Si el proceso se lanza con cwd distinto, intentar `.env` en cwd (sin pisar claves ya cargadas). */
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: false });

const emptyToUndefined = (v: unknown) => (v === '' || v === undefined ? undefined : v);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  UPLOAD_DIR: z.string().default('uploads'),
  /** URL pública del frontend (success/cancel de pagos). Si falta, se usa el primer origen de CORS_ORIGIN. */
  FRONTEND_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  STRIPE_SECRET_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  STRIPE_WEBHOOK_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  PAYPAL_CLIENT_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  PAYPAL_CLIENT_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  PAYPAL_WEBHOOK_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  /**
   * API de PayPal: sandbox o live. Si no se define, se usa live solo con NODE_ENV=production y sandbox en el resto.
   * Así puedes alinear credenciales (sandbox/live) sin depender solo de NODE_ENV.
   */
  PAYPAL_ENV: z.preprocess(emptyToUndefined, z.enum(['sandbox', 'live']).optional()),
  /** SMTP opcional: sin esto, en desarrollo el reset se registra en consola; en producción olvidé contraseña responde 503. */
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SMTP_PORT: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  SMTP_USER: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_PASS: z.preprocess(emptyToUndefined, z.string().optional()),
  SMTP_FROM: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  /** true si usas puerto 465 con SSL */
  SMTP_SECURE: z.preprocess(
    (v) => (v === '' || v === undefined ? undefined : v === true || v === 'true' || v === '1'),
    z.boolean().optional()
  ),
  /**
   * false = sin express-rate-limit (solo para pruebas de carga locales/staging).
   * En producción debe ser true; de lo contrario el servidor queda sin protección frente a abuso.
   */
  RATE_LIMIT_ENABLED: z.preprocess(
    (v) => {
      if (v === '' || v === undefined) return true;
      const s = String(v).toLowerCase();
      if (s === 'false' || s === '0' || s === 'no') return false;
      return true;
    },
    z.boolean()
  ),
  /** Rollout gradual para simulador adaptativo/prediccion premium (0-100). */
  ADAPTIVE_ROLLOUT_PERCENT: z.coerce.number().min(0).max(100).default(100),
  /** Rollout gradual para planificador diario (0-100). */
  STUDY_PLAN_ROLLOUT_PERCENT: z.coerce.number().min(0).max(100).default(100),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();

function isLocalOrLoopbackOrigin(origin: string): boolean {
  try {
    const u = new URL(origin);
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1' || u.hostname === '[::1]';
  } catch {
    return false;
  }
}

/**
 * URL pública del frontend (sin barra final): enlaces en correos, redirects de pago, etc.
 * - Si existe FRONTEND_URL, se usa siempre.
 * - Si no, entre varios orígenes en CORS_ORIGIN (separados por coma) se prefiere el primero
 *   que no sea localhost, para que Stripe/PayPal no redirijan al dev local en producción.
 */
export function getFrontendBaseUrl(): string {
  const explicit = env.FRONTEND_URL?.replace(/\/$/, '');
  if (explicit) return explicit;

  const origins = env.CORS_ORIGIN.split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const publicOrigin = origins.find((o) => !isLocalOrLoopbackOrigin(o));
  if (publicOrigin) return publicOrigin;

  const first = origins[0];
  if (first) return first;
  throw new Error('FRONTEND_URL o CORS_ORIGIN debe definir el origen del frontend');
}

/**
 * Stripe/PayPal: en producción no permitir redirects solo a localhost (config típica rota).
 */
export function requirePublicFrontendBaseUrlForPayments(): string {
  const base = getFrontendBaseUrl();
  if (env.NODE_ENV === 'production' && isLocalOrLoopbackOrigin(base)) {
    const err = new Error(
      'Define FRONTEND_URL=https://enarm.com.mx (tu dominio público) en el servidor del API. ' +
        'Si CORS_ORIGIN solo incluye localhost, los pagos redirigen mal tras Stripe.'
    ) as Error & { status: number };
    err.status = 503;
    throw err;
  }
  return base;
}
