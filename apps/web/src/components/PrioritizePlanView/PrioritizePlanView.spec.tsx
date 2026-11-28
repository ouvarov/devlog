import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import type { PlanTask } from '@/types/prioritizePlan'

import { PrioritizePlanView } from './PrioritizePlanView'

const CI_TASK: PlanTask = { id: 1, title: 'Set up CI', status: 'in-progress', priority: 'high' }

describe('PrioritizePlanView', () => {
  it('links known tasks and shows a deleted task as #id without a link', () => {
    const markup = renderToStaticMarkup(
      <PrioritizePlanView
        banner={null}
        focus={[
          { taskId: 1, reason: 'In progress', task: CI_TASK },
          { taskId: 9, reason: 'Was deleted', task: null },
        ]}
        later={[{ taskId: 8, task: null }]}
        summary="CI first."
      />,
    )

    expect(markup).toContain('href="/tasks/1"')
    expect(markup).toContain('#9')
    expect(markup).not.toContain('href="/tasks/9"')
    expect(markup).toContain('#8')
    expect(markup).not.toContain('href="/tasks/8"')
  })

  it('renders reasons and the summary with HTML as plain text', () => {
    const markup = renderToStaticMarkup(
      <PrioritizePlanView
        banner={null}
        focus={[{ taskId: 1, reason: '<b>x</b>', task: CI_TASK }]}
        later={[]}
        summary="<img src=x onerror=alert(1)>"
      />,
    )

    expect(markup).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(markup).not.toContain('<b>')
    expect(markup).not.toContain('<img')
  })
})
