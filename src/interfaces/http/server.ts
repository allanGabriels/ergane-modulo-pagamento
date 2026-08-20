import express, { Express } from 'express';
import { env } from '../../infra/config/env';
import { Container } from '../../infra/container';
import { errorHandler } from './middlewares/errorHandler';
import { invoiceRoutes } from './routes/invoiceRoutes';
import { paymentRoutes } from './routes/paymentRoutes';

const allowedOrigins = new Set(env.ALLOWED_ORIGINS);

export function createApp(container: Container): Express {
  const app = express();

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type, Authorization, X-Idempotency-Key',
      );
    }

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  });

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', module: 'ergane-modulo-pagamento' });
  });

  app.use('/api/invoices', invoiceRoutes(container));
  app.use('/api/payments', paymentRoutes(container));

  app.use((_req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Rota não encontrada.' });
  });

  app.use(errorHandler);

  return app;
}
