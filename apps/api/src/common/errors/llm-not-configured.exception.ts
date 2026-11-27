import { ServiceUnavailableException } from '@nestjs/common'

export class LlmNotConfiguredException extends ServiceUnavailableException {
  constructor() {
    super('No LLM is configured: set GOOGLE_GENERATIVE_AI_API_KEY or LLM_PROVIDER=mock')
  }
}
