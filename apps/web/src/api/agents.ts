import {
  type AgentsInfo,
  AgentsInfoSchema,
  type PrioritizeResponse,
  PrioritizeResponseSchema,
} from '@devlog/shared'

import { jsonBody, requestJson } from './client'

const getAgentsInfo = (signal?: AbortSignal): Promise<AgentsInfo> =>
  requestJson('/agents', AgentsInfoSchema, { signal })

const runPrioritize = (): Promise<PrioritizeResponse> =>
  requestJson('/agents/prioritize', PrioritizeResponseSchema, { method: 'POST', ...jsonBody({}) })

export { getAgentsInfo, runPrioritize }
