import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AgentRunning } from './AgentRunning'

describe('AgentRunning', () => {
  it('keeps an empty live region in the page before a run starts', () => {
    const markup = renderToStaticMarkup(
      <AgentRunning isRunning={false} elapsedSeconds={0} maxSteps={6} />,
    )

    expect(markup).toMatch(/<p[^>]*role="status"[^>]*><\/p>/)
  })

  it('announces the step limit and keeps the ticking seconds out of the live region', () => {
    const markup = renderToStaticMarkup(
      <AgentRunning isRunning={true} elapsedSeconds={4} maxSteps={6} />,
    )

    expect(markup).toMatch(/role="status"[^>]*>Running the agent, up to 6 steps…<\/p>/)
    expect(markup).toContain('4 s')
  })
})
