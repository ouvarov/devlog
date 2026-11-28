import { Inject, Injectable } from '@nestjs/common'

import type { AgentsInfo } from '@devlog/shared'

import type { LlmConnection } from '../llm/llm-connection.js'
import { LLM } from '../llm/llm.tokens.js'
import { PRIORITIZE_AGENT_INFO } from './prioritize/prioritize.agent.js'

@Injectable()
export class AgentsService {
  constructor(@Inject(LLM) private readonly llm: LlmConnection) {}

  describe(): AgentsInfo {
    return {
      isConfigured: this.llm.isConfigured,
      provider: this.llm.provider,
      modelId: this.llm.isConfigured ? this.llm.modelId : null,
      agents: [PRIORITIZE_AGENT_INFO],
    }
  }
}
