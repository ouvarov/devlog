import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { LoadError } from './LoadError'

const ERROR = new Error('No LLM is configured')

describe('LoadError', () => {
  it('offers a retry when one is given', () => {
    expect(renderToStaticMarkup(<LoadError error={ERROR} onRetry={() => {}} />)).toContain('Retry')
  })

  it('shows only the message when retrying cannot help', () => {
    const markup = renderToStaticMarkup(<LoadError error={ERROR} />)

    expect(markup).toContain('No LLM is configured')
    expect(markup).not.toContain('Retry')
  })
})
