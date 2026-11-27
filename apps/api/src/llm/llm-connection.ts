import { createGoogle } from '@ai-sdk/google'
import type { LanguageModel } from 'ai'

import type { LlmProvider } from '@devlog/shared'

import { LlmNotConfiguredException } from '../common/errors/llm-not-configured.exception.js'
import type { Env } from '../config/env.schema.js'
import { PRIORITIZE_MOCK_SCRIPT } from './mock/prioritize-mock-script.js'
import { createScriptedModel } from './mock/scripted-model.js'

const DEFAULT_LLM_PROVIDER: LlmProvider = 'google'

type ConfiguredLlm = {
  isConfigured: true
  provider: LlmProvider
  modelId: string
  model: LanguageModel
}

type UnconfiguredLlm = {
  isConfigured: false
  provider: LlmProvider
}

type LlmConnection = ConfiguredLlm | UnconfiguredLlm

type LlmEnv = Pick<Env, 'LLM_PROVIDER' | 'GOOGLE_GENERATIVE_AI_API_KEY' | 'GEMINI_MODEL'>

const createLlmConnection = (env: LlmEnv): LlmConnection => {
  const provider = env.LLM_PROVIDER ?? DEFAULT_LLM_PROVIDER
  if (provider === 'mock') {
    const mockModel = createScriptedModel(PRIORITIZE_MOCK_SCRIPT)
    return { isConfigured: true, provider, modelId: mockModel.modelId, model: mockModel }
  }

  const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) return { isConfigured: false, provider }

  const google = createGoogle({ apiKey })
  return {
    isConfigured: true,
    provider,
    modelId: env.GEMINI_MODEL,
    model: google(env.GEMINI_MODEL),
  }
}

const requireConfiguredLlm = (connection: LlmConnection): ConfiguredLlm => {
  if (!connection.isConfigured) throw new LlmNotConfiguredException()
  return connection
}

export { createLlmConnection, requireConfiguredLlm }
export type { ConfiguredLlm, LlmConnection, LlmEnv, UnconfiguredLlm }
