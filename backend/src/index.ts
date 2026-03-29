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

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const generalLimiter = rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false });
const authLimiter = rateLimit({ windowMs: 60_000, max: 5, standardHeaders: true, legacyHeaders: false });

app.use(generalLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ data: { ok: true, env: env.NODE_ENV } });
});

app.use('/api/auth', authLimiter, authRouter);
app.use('/api/cases', casesRouter);
app.use('/api/exams', examsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/stats', statsRouter);
app.use('/api/specialties', specialtiesRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/backoffice', backofficeRouter);

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
