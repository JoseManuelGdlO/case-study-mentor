import path from 'path';
import fs from 'fs';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { connectRedis, redis } from './config/redis.js';
import { errorHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.routes.js';
import { casesRouter } from './routes/cases.routes.js';
import { examsRouter } from './routes/exams.routes.js';
import { profileRouter } from './routes/profile.routes.js';
import { statsRouter } from './routes/stats.routes.js';
import { specialtiesRouter } from './routes/specialties.routes.js';
import { uploadRouter } from './routes/upload.routes.js';
import { backofficeRouter } from './routes/backoffice.routes.js';
import { contentRouter } from './routes/content.routes.js';
import { studyPlanRouter } from './routes/study-plan.routes.js';
import {
  paymentsRouter,
  paypalWebhookHandler,
  stripeWebhookHandler,
} from './routes/payments.routes.js';

/** Orígenes permitidos: `CORS_ORIGIN` puede ser uno o varios separados por coma (sin repetir el header completo en la respuesta). */
function parseCorsOrigins(raw: string): string[] {
  return raw
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

const allowedCorsOrigins = parseCorsOrigins(env.CORS_ORIGIN);

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = origin.replace(/\/$/, '');
      if (allowedCorsOrigins.includes(normalized)) {
        callback(null, origin);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  })
);

app.post(
  '/api/payments/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.post('/api/payments/webhooks/paypal', paypalWebhookHandler);

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

app.get('/api/health', async (_req, res) => {
  const checks: Record<string, 'ok' | 'error'> = { api: 'ok' };
  try {
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'ok' : 'error';
  } catch {
    checks.redis = 'error';
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch {
    checks.database = 'error';
  }
  const allOk = checks.redis === 'ok' && checks.database === 'ok';
  res.status(allOk ? 200 : 503).json({
    data: {
      ok: allOk,
      env: env.NODE_ENV,
      checks,
      uptimeSec: Math.floor(process.uptime()),
    },
  });
});

const generalLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });

if (env.RATE_LIMIT_ENABLED) {
  app.use(generalLimiter);
}

if (env.RATE_LIMIT_ENABLED) {
  app.use('/api/auth', authLimiter, authRouter);
} else {
  app.use('/api/auth', authRouter);
}
app.use('/api/cases', casesRouter);
app.use('/api/exams', examsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/stats', statsRouter);
app.use('/api/specialties', specialtiesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/backoffice', backofficeRouter);
app.use('/api/content', contentRouter);
app.use('/api/study-plan', studyPlanRouter);
app.use('/api/payments', paymentsRouter);

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'ENARM API', version: '1.0.0' },
    servers: [{ url: 'http://localhost:3001/api' }],
    paths: {
      '/health': { get: { summary: 'Health', responses: { '200': { description: 'OK' } } } },
      '/auth/login': {
        post: {
          summary: 'Login',
          requestBody: {
            content: {
              'application/json': {
                schema: { type: 'object', properties: { email: { type: 'string' }, password: { type: 'string' } } },
              },
            },
          },
          responses: { '200': { description: 'Sets cookies' } },
        },
      },
      '/auth/register': { post: { summary: 'Register', responses: { '201': { description: 'Created' } } } },
      '/exams/generate': { post: { summary: 'Generate exam', responses: { '201': { description: 'Exam' } } } },
      '/profile': { get: { summary: 'Current profile' }, put: { summary: 'Update profile' } },
      '/specialties': { get: { summary: 'Specialty tree (auth)' } },
    },
  },
  apis: [],
});

if (env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.use(errorHandler);

async function main() {
  await connectRedis();
  await redis.ping();
  app.listen(env.PORT, () => {
    console.log(`API http://localhost:${env.PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
