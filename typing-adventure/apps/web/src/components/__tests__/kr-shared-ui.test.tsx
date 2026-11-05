import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { LoadingScreen } from '../ui/LoadingScreen'

describe('KR shared UI', () => {
  it('render harness: LoadingScreen renders a status region', () => {
    const html = renderToStaticMarkup(<LoadingScreen label="x" />)
    expect(html).toContain('role="status"')
  })
})
