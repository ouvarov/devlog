import { describe, expect, it } from 'vitest'

import { validateEnv } from './env.schema.js'

describe('validateEnv', () => {
  it('starts with defaults when nothing is set', () => {
    const env = validateEnv({})

    expect(env.PORT).toBe(4000)
    expect(env.WEB_ORIGIN).toBe('http://localhost:3000')
    expect(env.LLM_PROVIDER).toBeUndefined()
  })

  it('treats empty values copied from .env.example as unset', () => {
    const env = validateEnv({ PORT: '', WEB_ORIGIN: '', LLM_PROVIDER: '', GEMINI_MODEL: '' })

    expect(env.PORT).toBe(4000)
    expect(env.LLM_PROVIDER).toBeUndefined()
    expect(env.GEMINI_MODEL).toBe('gemini-3.5-flash-lite')
  })

  it('refuses LLM_PROVIDER=google without GOOGLE_GENERATIVE_AI_API_KEY', () => {
    expect(() => validateEnv({ LLM_PROVIDER: 'google' })).toThrow(/GOOGLE_GENERATIVE_AI_API_KEY/)
  })

  it('accepts LLM_PROVIDER=google with a key', () => {
    const env = validateEnv({ LLM_PROVIDER: 'google', GOOGLE_GENERATIVE_AI_API_KEY: 'test-key' })

    expect(env.LLM_PROVIDER).toBe('google')
  })

  it('refuses an unknown LLM_PROVIDER', () => {
    expect(() => validateEnv({ LLM_PROVIDER: 'openai' })).toThrow(/LLM_PROVIDER/)
  })
})
