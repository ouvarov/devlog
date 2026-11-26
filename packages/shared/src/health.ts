import { z } from 'zod'

const HealthResponseSchema = z.object({ status: z.literal('ok') }).strict()

type HealthResponse = z.infer<typeof HealthResponseSchema>

export { HealthResponseSchema }
export type { HealthResponse }
