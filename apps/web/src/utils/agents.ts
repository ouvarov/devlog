import type { AgentName, AgentsInfo } from '@devlog/shared'

const getMaxSteps = (info: AgentsInfo | undefined, name: AgentName): number | null =>
  info?.agents.find((agent) => agent.name === name)?.maxSteps ?? null

export { getMaxSteps }
