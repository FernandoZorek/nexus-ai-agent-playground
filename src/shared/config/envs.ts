import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  LLM_PROVIDER: z.enum(['gemini', 'openai']).default('gemini'),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash-lite'),
  OPENAI_MODEL: z.string().default('gpt-4o'),
  GEMINI_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  AI_COST_PER_1K_TOKENS: z.string().default("0.002").transform(Number),
  ENABLE_COST_LOGS: z.string().default("true").transform((v) => v === "true"),
  ENABLE_IDEMPOTENCY_CHECK: z.string().default("true").transform((v) => v === "true"),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const _envs = envSchema.safeParse(process.env);

if (!_envs.success) {
  console.error("❌ Invalid environment variables:", _envs.error.format());
  process.exit(1);
}

export const envs = _envs.data;