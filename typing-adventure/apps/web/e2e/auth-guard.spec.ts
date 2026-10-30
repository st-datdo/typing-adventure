import { expect, test } from '@playwright/test'

for (const path of ['/friends', '/lobby', '/admin/dashboard', '/race/ABC123']) {
  test(`AG-03: guest GET ${path} is redirected to /login with callbackUrl`, async ({
    request,
    baseURL,
  }) => {
    const res = await request.get(path, { maxRedirects: 0 })
    expect([302, 307]).toContain(res.status())
    const location = new URL(res.headers()['location'], baseURL)
    expect(location.pathname).toBe('/login')
    const callbackUrl = location.searchParams.get('callbackUrl')
    expect(callbackUrl).not.toBeNull()
    expect(new URL(callbackUrl as string, baseURL).pathname).toBe(path)
  })
}
