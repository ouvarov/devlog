import { describe, expect, it } from 'vitest'

import { LlmNotConfiguredException } from '../common/errors/llm-not-configured.exception.js'
import { validateEnv } from '../config/env.schema.js'
import { createLlmConnection, requireConfiguredLlm } from './llm-connection.js'

describe('createLlmConnection', () => {
  it('is not configured when neither LLM_PROVIDER nor a key is set', () => {
    const connection = createLlmConnection(validateEnv({}))

    expect(connection).toEqual({ isConfigured: false, provider: 'google' })
  })

  it('builds a Google model instance, not a gateway string id, when a key is set', () => {
    const connection = createLlmConnection(
      validateEnv({ GOOGLE_GENERATIVE_AI_API_KEY: 'test-key', GEMINI_MODEL: 'gemini-test' }),
    )

    expect(connection).toMatchObject({ isConfigured: true, provider: 'google', modelId: 'gemini-test' })
    const model = connection.isConfigured ? connection.model : undefined
    expect(typeof model).toBe('object')
    expect(typeof model === 'object' ? model.provider : undefined).toMatch(/^google/)
  })

  it('builds the scripted mock for LLM_PROVIDER=mock without a key', () => {
    const connection = createLlmConnection(validateEnv({ LLM_PROVIDER: 'mock' }))

    expect(connection).toMatchObject({ isConfigured: true, provider: 'mock', modelId: 'scripted-mock' })
  })
})

describe('requireConfiguredLlm', () => {
  it('throws LLM_NOT_CONFIGURED for a connection without a model', () => {
    expect(() => requireConfiguredLlm({ isConfigured: false, provider: 'google' })).toThrow(
      LlmNotConfiguredException,
    )
  })
})
