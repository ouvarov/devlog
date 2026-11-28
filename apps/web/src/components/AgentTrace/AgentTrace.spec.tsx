import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AgentTraceSteps } from '@/components/AgentTraceSteps/AgentTraceSteps'
import { PRIORITIZE_RESPONSE } from '@/fixtures/prioritizeResponse'

import { AgentTrace } from './AgentTrace'

const { trace } = PRIORITIZE_RESPONSE

describe('AgentTrace', () => {
  it('starts collapsed with aria-expanded false', () => {
    const markup = renderToStaticMarkup(<AgentTrace steps={trace} />)

    expect(markup).toContain('aria-expanded="false"')
    expect(markup).not.toContain('aria-controls')
    expect(markup).toContain('Show trace (3 steps)')
    expect(markup).not.toContain('submit_plan')
  })

  it('renders nothing without steps', () => {
    expect(renderToStaticMarkup(<AgentTrace steps={[]} />)).toBe('')
  })
})

describe('AgentTraceSteps', () => {
  const markup = renderToStaticMarkup(<AgentTraceSteps steps={trace} />)

  it('renders one entry per step with its tool calls', () => {
    expect(markup.match(/<li[^>]*>\s*<p[^>]*><span[^>]*>Step/g)).toHaveLength(3)
    expect(markup).toContain('list_tasks')
    expect(markup).toContain('get_task')
    expect(markup).toContain('Submitting a plan with a done task.')
  })

  it('marks a rejected submit and a tool error', () => {
    expect(markup).toContain('Rejected submit')
    expect(markup).toContain('Tool error')
  })

  it('renders model text and tool output with HTML as plain text', () => {
    const htmlMarkup = renderToStaticMarkup(
      <AgentTraceSteps
        steps={[
          {
            index: 0,
            text: '<b>x</b>',
            toolCalls: [
              {
                toolName: 'get_task',
                input: { note: '<img src=x onerror=alert(1)>' },
                output: '<img src=x onerror=alert(1)>',
                isError: false,
                isRejectedSubmit: false,
              },
            ],
            finishReason: 'stop',
          },
        ]}
      />,
    )

    expect(htmlMarkup).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(htmlMarkup).not.toContain('<b>')
    expect(htmlMarkup).not.toContain('<img')
  })
})
