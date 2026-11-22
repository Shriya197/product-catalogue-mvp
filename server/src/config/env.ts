import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { z } from 'zod';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

config({ path: path.resolve(moduleDir, '../../.env'), quiet: true });
config({ path: path.resolve(moduleDir, '../../../.env'), quiet: true });

const optionalString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().trim().min(1).optional(),
);

const optionalPort = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.coerce.number().int().positive().default(587),
);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  FAKESTORE_BASE_URL: z.string().url().default('https://fakestoreapi.com'),
  SALES_INBOX_EMAIL: z.string().email().default('sales@example.com'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  SMTP_HOST: optionalString,
  SMTP_PORT: optionalPort,
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  SMTP_FROM: optionalString,
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[config] Invalid environment variables', parsed.error.flatten());
  throw new Error('Invalid environment configuration');
}

export const env: Env = parsed.data;
