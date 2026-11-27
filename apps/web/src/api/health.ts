import { type HealthResponse, HealthResponseSchema } from '@devlog/shared'

import { requestJson } from './client'

const getHealth = (signal?: AbortSignal): Promise<HealthResponse> =>
  requestJson('/health', HealthResponseSchema, { signal })

export { getHealth }
