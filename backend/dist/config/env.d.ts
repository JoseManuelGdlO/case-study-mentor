import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodNumber>;
    DATABASE_URL: z.ZodString;
    REDIS_URL: z.ZodString;
    JWT_ACCESS_SECRET: z.ZodString;
    JWT_REFRESH_SECRET: z.ZodString;
    GOOGLE_CLIENT_ID: z.ZodString;
    CORS_ORIGIN: z.ZodString;
    UPLOAD_DIR: z.ZodDefault<z.ZodString>;
    /** URL pública del frontend (success/cancel de pagos). Si falta, se usa el primer origen de CORS_ORIGIN. */
    FRONTEND_URL: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    STRIPE_SECRET_KEY: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    STRIPE_WEBHOOK_SECRET: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    PAYPAL_CLIENT_ID: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    PAYPAL_CLIENT_SECRET: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    PAYPAL_WEBHOOK_ID: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    /**
     * API de PayPal: sandbox o live. Si no se define, se usa live solo con NODE_ENV=production y sandbox en el resto.
     * Así puedes alinear credenciales (sandbox/live) sin depender solo de NODE_ENV.
     */
    PAYPAL_ENV: z.ZodEffects<z.ZodOptional<z.ZodEnum<["sandbox", "live"]>>, "sandbox" | "live" | undefined, unknown>;
    /** SMTP opcional: sin esto, en desarrollo el reset se registra en consola; en producción olvidé contraseña responde 503. */
    SMTP_HOST: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    SMTP_PORT: z.ZodEffects<z.ZodOptional<z.ZodNumber>, number | undefined, unknown>;
    SMTP_USER: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    SMTP_PASS: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    SMTP_FROM: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    /** true si usas puerto 465 con SSL */
    SMTP_SECURE: z.ZodEffects<z.ZodOptional<z.ZodBoolean>, boolean | undefined, unknown>;
    /**
     * false = sin express-rate-limit (solo para pruebas de carga locales/staging).
     * En producción debe ser true; de lo contrario el servidor queda sin protección frente a abuso.
     */
    RATE_LIMIT_ENABLED: z.ZodEffects<z.ZodBoolean, boolean, unknown>;
    /** Rollout gradual para simulador adaptativo/prediccion premium (0-100). */
    ADAPTIVE_ROLLOUT_PERCENT: z.ZodDefault<z.ZodNumber>;
    /** Rollout gradual para planificador diario (0-100). */
    STUDY_PLAN_ROLLOUT_PERCENT: z.ZodDefault<z.ZodNumber>;
    /** Web Push (VAPID) para notificaciones a administradores. Las tres deben definirse para activar el envío. */
    VAPID_PUBLIC_KEY: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    VAPID_PRIVATE_KEY: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    /** Ej.: mailto:soporte@tudominio.com */
    VAPID_SUBJECT: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, unknown>;
    /**
     * Confirmación al cambiar el plan de un usuario desde el backoffice.
     * Por defecto `admin123` para desarrollo; en producción define un valor fuerte en `.env`.
     */
    ADMIN_PLAN_CHANGE_PASSWORD: z.ZodEffects<z.ZodString, string, unknown>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    CORS_ORIGIN: string;
    UPLOAD_DIR: string;
    RATE_LIMIT_ENABLED: boolean;
    ADAPTIVE_ROLLOUT_PERCENT: number;
    STUDY_PLAN_ROLLOUT_PERCENT: number;
    ADMIN_PLAN_CHANGE_PASSWORD: string;
    FRONTEND_URL?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    PAYPAL_CLIENT_ID?: string | undefined;
    PAYPAL_CLIENT_SECRET?: string | undefined;
    PAYPAL_WEBHOOK_ID?: string | undefined;
    PAYPAL_ENV?: "sandbox" | "live" | undefined;
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: number | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    SMTP_FROM?: string | undefined;
    SMTP_SECURE?: boolean | undefined;
    VAPID_PUBLIC_KEY?: string | undefined;
    VAPID_PRIVATE_KEY?: string | undefined;
    VAPID_SUBJECT?: string | undefined;
}, {
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    CORS_ORIGIN: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: number | undefined;
    UPLOAD_DIR?: string | undefined;
    FRONTEND_URL?: unknown;
    STRIPE_SECRET_KEY?: unknown;
    STRIPE_WEBHOOK_SECRET?: unknown;
    PAYPAL_CLIENT_ID?: unknown;
    PAYPAL_CLIENT_SECRET?: unknown;
    PAYPAL_WEBHOOK_ID?: unknown;
    PAYPAL_ENV?: unknown;
    SMTP_HOST?: unknown;
    SMTP_PORT?: unknown;
    SMTP_USER?: unknown;
    SMTP_PASS?: unknown;
    SMTP_FROM?: unknown;
    SMTP_SECURE?: unknown;
    RATE_LIMIT_ENABLED?: unknown;
    ADAPTIVE_ROLLOUT_PERCENT?: number | undefined;
    STUDY_PLAN_ROLLOUT_PERCENT?: number | undefined;
    VAPID_PUBLIC_KEY?: unknown;
    VAPID_PRIVATE_KEY?: unknown;
    VAPID_SUBJECT?: unknown;
    ADMIN_PLAN_CHANGE_PASSWORD?: unknown;
}>;
export type Env = z.infer<typeof envSchema>;
export declare const env: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    DATABASE_URL: string;
    REDIS_URL: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    CORS_ORIGIN: string;
    UPLOAD_DIR: string;
    RATE_LIMIT_ENABLED: boolean;
    ADAPTIVE_ROLLOUT_PERCENT: number;
    STUDY_PLAN_ROLLOUT_PERCENT: number;
    ADMIN_PLAN_CHANGE_PASSWORD: string;
    FRONTEND_URL?: string | undefined;
    STRIPE_SECRET_KEY?: string | undefined;
    STRIPE_WEBHOOK_SECRET?: string | undefined;
    PAYPAL_CLIENT_ID?: string | undefined;
    PAYPAL_CLIENT_SECRET?: string | undefined;
    PAYPAL_WEBHOOK_ID?: string | undefined;
    PAYPAL_ENV?: "sandbox" | "live" | undefined;
    SMTP_HOST?: string | undefined;
    SMTP_PORT?: number | undefined;
    SMTP_USER?: string | undefined;
    SMTP_PASS?: string | undefined;
    SMTP_FROM?: string | undefined;
    SMTP_SECURE?: boolean | undefined;
    VAPID_PUBLIC_KEY?: string | undefined;
    VAPID_PRIVATE_KEY?: string | undefined;
    VAPID_SUBJECT?: string | undefined;
};
/**
 * URL pública del frontend (sin barra final): enlaces en correos, redirects de pago, etc.
 * - Si existe FRONTEND_URL, se usa siempre.
 * - Si no, entre varios orígenes en CORS_ORIGIN (separados por coma) se prefiere el primero
 *   que no sea localhost, para que Stripe/PayPal no redirijan al dev local en producción.
 */
export declare function getFrontendBaseUrl(): string;
/**
 * Stripe/PayPal: en producción no permitir redirects solo a localhost (config típica rota).
 */
export declare function requirePublicFrontendBaseUrlForPayments(): string;
export {};
//# sourceMappingURL=env.d.ts.map