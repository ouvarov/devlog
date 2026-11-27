import { z } from 'zod'

import { LLM_PROVIDERS } from '@devlog/shared'

const DEFAULT_PORT = 4000
const DEFAULT_WEB_ORIGIN = 'http://localhost:3000'
const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash-lite'

const envSchema = z
  .object({
    PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
    WEB_ORIGIN: z
      .url()
      .transform((value) => new URL(value).origin)
      .default(DEFAULT_WEB_ORIGIN),
    LLM_PROVIDER: z.enum(LLM_PROVIDERS).optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default(DEFAULT_GEMINI_MODEL),
  })
  .superRefine((env, context) => {
    if (env.LLM_PROVIDER === 'google' && !env.GOOGLE_GENERATIVE_AI_API_KEY) {
      context.addIssue({
        code: 'custom',
        path: ['GOOGLE_GENERATIVE_AI_API_KEY'],
        message: 'GOOGLE_GENERATIVE_AI_API_KEY is required when LLM_PROVIDER=google',
      })
    }
  })

type Env = z.infer<typeof envSchema>

const dropEmptyValues = (rawEnv: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(rawEnv).filter(([, value]) => value !== ''))

const validateEnv = (rawEnv: Record<string, unknown>): Env => {
  const parsedEnv = envSchema.safeParse(dropEmptyValues(rawEnv))
  if (parsedEnv.success) return parsedEnv.data

  throw new Error(`Invalid environment:\n${z.prettifyError(parsedEnv.error)}`)
}

export { validateEnv }
export type { Env }
