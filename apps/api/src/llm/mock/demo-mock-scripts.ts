import {
  DECOMPOSE_CLARIFY_MOCK_SCRIPT,
  DECOMPOSE_PROPOSAL_MOCK_SCRIPT,
} from './decompose-mock-script.js'
import { PRIORITIZE_MOCK_SCRIPT } from './prioritize-mock-script.js'
import { type MockCallOptions, type MockScript, offeredToolNamesOf } from './scripted-model.js'

// One mock model serves every agent, so the script is picked by the tools the agent offers.
const pickDemoMockScript = (options: MockCallOptions): MockScript => {
  const toolNames = offeredToolNamesOf(options)
  if (toolNames.has('ask_clarification')) return DECOMPOSE_CLARIFY_MOCK_SCRIPT
  if (toolNames.has('submit_subtasks')) return DECOMPOSE_PROPOSAL_MOCK_SCRIPT
  return PRIORITIZE_MOCK_SCRIPT
}

export { pickDemoMockScript }
