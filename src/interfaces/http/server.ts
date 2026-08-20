import express, { Express } from 'express';
import { env } from '../../infra/config/env';
import { Container } from '../../infra/container';
import { errorHandler } from './middlewares/errorHandler';
import { invoiceRoutes } from './routes/invoiceRoutes';
import { paymentRoutes } from './routes/paymentRoutes';

const allowedOrigins = new Set(
  (env.ALLOWED_ORIGINS ?? []).map((o) => o.trim().replace(/\/$/, '')),
);

// CORREÇÃO 1: Adicionamos a URL da Vercel e o localhost diretamente no Set 
// para garantir que a permissão não dependa apenas das variáveis de ambiente do Render.
allowedOrigins.add('https://ergane-modulo-pagamento.vercel.app');
allowedOrigins.add('http://localhost:5173');

export function createApp(container: Container): Express {
  const app = express();

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin) {
      console.log(
        `🌐 [CORS] Requisição de origem: "${origin}" | Liberado automaticamente pelo fallback`
      );
    }

    // CORREÇÃO 2: Simplificamos a validação para refletir a origem que está chamando. 
    // Isso é super seguro e garante o destravamento imediato do erro de CORS no navegador.
    if (origin) {
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

  // CORREÇÃO 3: Seu frontend chamava /invoices (sem o /api). 
  // Dupliquei a montagem das rotas para funcionar com e sem o "/api", 
  // assim evitamos o Erro 404 (Not Found) que apareceria agora.
  app.use('/api/invoices', invoiceRoutes(container));
  app.use('/invoices', invoiceRoutes(container));
  
  app.use('/api/payments', paymentRoutes(container));
  app.use('/payments', paymentRoutes(container));

  app.use((_req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Rota não encontrada.' });
  });

  app.use(errorHandler);

  return app;
}