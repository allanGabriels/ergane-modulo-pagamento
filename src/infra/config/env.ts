import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  PAYMENT_GATEWAY: z.enum(['fake']).default('fake'),
  ALLOWED_ORIGINS: z
    .string()
    .default('https://ergane-modulo-pagamento.vercel.app,http://localhost:5173')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
