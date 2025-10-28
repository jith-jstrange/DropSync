import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import router from '@routes/index';
import syncRoutes from '@routes/sync';
import webhookRoutes from '@webhooks/index';
import { env } from '@config/env';
import { logger } from '@config/logger';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api', router);
app.use('/api/sync', syncRoutes);
app.use('/webhook', webhookRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error('Unhandled error', { error: err?.message });
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(env.port, () => {
  logger.info(`Server listening on :${env.port}`);
});
