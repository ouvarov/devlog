import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { AgentMeta } from '@devlog/shared'

import { LLM_META } from '@/fixtures/prioritizeResponse'
import type { PlanTask } from '@/types/prioritizePlan'
import { getPlanBanner } from '@/utils/prioritizePlan'

import { PrioritizePlanView } from './PrioritizePlanView'

const CI_TASK: PlanTask = { id: 1, title: 'Set up CI', status: 'in-progress', priority: 'high' }

const renderWithMeta = (changes: Partial<AgentMeta>): string =>
  renderToStaticMarkup(
    <PrioritizePlanView
      banner={getPlanBanner({ ...LLM_META, ...changes })}
      focus={[]}
      later={[]}
      summary="Plan summary."
    />,
  )

describe('PrioritizePlanView', () => {
  it('shows "nothing to prioritize" and no fallback banner for a skipped run', () => {
    const markup = renderWithMeta({ source: 'fallback', stoppedBy: 'skipped', steps: 0 })

    expect(markup).toContain('Nothing to prioritize')
    expect(markup).not.toContain('Computed without AI')
  })

  it('shows the fallback banner with the reason in words', () => {
    const markup = renderWithMeta({
      source: 'fallback',
      stoppedBy: 'error',
      fallbackReason: 'llm-error',
    })

    expect(markup).toContain('Computed without AI')
    expect(markup).toContain('The model provider returned an error.')
  })

  it('links known tasks and shows a deleted task as #id without a link', () => {
    const markup = renderToStaticMarkup(
      <PrioritizePlanView
        banner={null}
        focus={[
          { taskId: 1, reason: 'In progress', taskRef: { kind: 'found', task: CI_TASK } },
          { taskId: 9, reason: 'Was deleted', taskRef: { kind: 'missing' } },
        ]}
        later={[{ taskId: 8, taskRef: { kind: 'missing' } }]}
        summary="CI first."
      />,
    )

    expect(markup).toContain('href="/tasks/1"')
    expect(markup).toContain('#9')
    expect(markup).not.toContain('href="/tasks/9"')
    expect(markup).toContain('#8')
    expect(markup).not.toContain('href="/tasks/8"')
  })

  it('shows a placeholder, not #id, while a task is loading', () => {
    const markup = renderToStaticMarkup(
      <PrioritizePlanView
        banner={null}
        focus={[{ taskId: 14, reason: 'Subtask', taskRef: { kind: 'loading' } }]}
        later={[{ taskId: 15, taskRef: { kind: 'failed' } }]}
        summary="CI first."
      />,
    )

    expect(markup).toContain('Loading task…')
    expect(markup).not.toContain('#14')
    expect(markup).toContain('#15 (could not load)')
  })

  it('renders reasons and the summary with HTML as plain text', () => {
    const markup = renderToStaticMarkup(
      <PrioritizePlanView
        banner={null}
        focus={[{ taskId: 1, reason: '<b>x</b>', taskRef: { kind: 'found', task: CI_TASK } }]}
        later={[]}
        summary="<img src=x onerror=alert(1)>"
      />,
    )

    expect(markup).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(markup).not.toContain('<b>')
    expect(markup).not.toContain('<img')
  })
})
