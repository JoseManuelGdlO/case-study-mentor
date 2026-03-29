import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { z } from 'zod';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const emptyToUndefined = (v) => (v === '' || v === undefined ? undefined : v);
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
});
function loadEnv() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
        process.exit(1);
    }
    return parsed.data;
}
export const env = loadEnv();
/** Base URL del frontend para redirects de checkout (sin barra final). */
export function getFrontendBaseUrl() {
    const explicit = env.FRONTEND_URL?.replace(/\/$/, '');
    if (explicit)
        return explicit;
    const first = env.CORS_ORIGIN.split(',')[0]?.trim().replace(/\/$/, '');
    if (first)
        return first;
    throw new Error('FRONTEND_URL o CORS_ORIGIN debe definir el origen del frontend');
}
//# sourceMappingURL=env.js.map