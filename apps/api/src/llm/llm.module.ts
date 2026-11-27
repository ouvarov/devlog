import { Logger, Module, type Provider } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import type { Env } from '../config/env.schema.js'
import { type LlmConnection, createLlmConnection } from './llm-connection.js'
import { LLM } from './llm.tokens.js'

const logger = new Logger('LlmModule')

const logConnection = (connection: LlmConnection): void => {
  if (connection.isConfigured) {
    logger.log(`LLM provider ${connection.provider}, model ${connection.modelId}`)
    return
  }
  logger.warn(
    `LLM provider ${connection.provider} has no API key; agent endpoints answer 503 LLM_NOT_CONFIGURED`,
  )
}

const connectLlm = (config: ConfigService<Env, true>): LlmConnection => {
  const connection = createLlmConnection({
    LLM_PROVIDER: config.get('LLM_PROVIDER', { infer: true }),
    GOOGLE_GENERATIVE_AI_API_KEY: config.get('GOOGLE_GENERATIVE_AI_API_KEY', { infer: true }),
    GEMINI_MODEL: config.get('GEMINI_MODEL', { infer: true }),
  })
  logConnection(connection)
  return connection
}

const llmProvider: Provider = {
  provide: LLM,
  inject: [ConfigService],
  useFactory: connectLlm,
}

@Module({
  providers: [llmProvider],
  exports: [LLM],
})
export class LlmModule {}
