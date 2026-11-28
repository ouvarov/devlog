import {
  type AgentsInfo,
  AgentsInfoSchema,
  type DecomposeRequest,
  type DecomposeResponse,
  DecomposeResponseSchema,
  type PrioritizeResponse,
  PrioritizeResponseSchema,
} from '@devlog/shared'

import { jsonBody, requestJson } from './client'

const getAgentsInfo = (signal?: AbortSignal): Promise<AgentsInfo> =>
  requestJson('/agents', AgentsInfoSchema, { signal })

const runPrioritize = (): Promise<PrioritizeResponse> =>
  requestJson('/agents/prioritize', PrioritizeResponseSchema, { method: 'POST', ...jsonBody({}) })

const runDecompose = (request: DecomposeRequest, signal?: AbortSignal): Promise<DecomposeResponse> =>
  requestJson('/agents/decompose', DecomposeResponseSchema, {
    method: 'POST',
    signal,
    ...jsonBody(request),
  })

export { getAgentsInfo, runDecompose, runPrioritize }
