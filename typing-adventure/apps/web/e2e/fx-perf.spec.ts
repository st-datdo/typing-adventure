import { expect, test } from '@playwright/test'
import { seedSettings, typeText } from './helpers/kr'
import { repeatText, startCustomText } from './helpers/hf'

test('FX-17 a 110 key run under 4x CPU keeps every key, focus, caps and no network', async ({
  page,
}) => {
  test.setTimeout(180_000)
  await page.addInitScript(() => {
    const w = window as unknown as { __longTasks: number[] }
    w.__longTasks = []
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) w.__longTasks.push(e.duration)
      }).observe({ type: 'longtask', buffered: true })
    } catch {}
  })
  await page.setViewportSize({ width: 1280, height: 720 })
  await seedSettings(page, {
    ageGroup: 'big',
    lang: 'vi',
    soundEnabled: false,
    effectsLevel: 'lots',
  })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await page.waitForTimeout(900)
  const text = repeatText(110)
  await startCustomText(page, text)
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1600)

  const requests: string[] = []
  page.on('request', (r) => requests.push(`${r.resourceType()} ${r.url()}`))

  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  const issues: string[] = []
  let saw100 = false
  let polling = true
  const poll = (async () => {
    while (polling) {
      const s = await page
        .evaluate(() => ({
          particles: document.querySelectorAll('.fx-p').length,
          labels: document.querySelectorAll('.fx-combo-label').length,
          canvases: document.querySelectorAll('canvas.fx-canvas[data-active="true"]').length,
          focus:
            !!document.activeElement?.classList.contains('hidden-input') ||
            !!document.querySelector('.celebration-content'),
          x100: Array.from(document.querySelectorAll('.fx-combo-label')).some((l) =>
            (l.textContent ?? '').includes('x100'),
          ),
        }))
        .catch(() => null)
      if (s) {
        if (s.particles > 60) issues.push(`particles ${s.particles}`)
        if (s.labels > 1) issues.push(`labels ${s.labels}`)
        if (s.canvases > 1) issues.push(`canvases ${s.canvases}`)
        if (!s.focus) issues.push('lost focus')
        if (s.x100) saw100 = true
      }
      await page.waitForTimeout(100)
    }
  })()

  await page.evaluate(() => {
    ;(window as unknown as { __longTasks: number[] }).__longTasks = []
  })
  await typeText(page, text.slice(0, 101), 30)
  await expect(page.locator('.char--correct')).toHaveCount(101)
  await typeText(page, text.slice(101), 30)
  await expect(page.locator('.celebration-content')).toBeVisible()
  polling = false
  await poll

  await expect(page.locator('.celebration-content')).toContainText('100%')
  expect(await page.locator('.char--correct').count()).toBe(110)
  expect([...new Set(issues)]).toEqual([])
  expect(saw100).toBe(true)
  expect(requests).toEqual([])

  if (process.env.KR_PERF === '1') {
    const max = await page.evaluate(() =>
      Math.max(0, ...(window as unknown as { __longTasks: number[] }).__longTasks),
    )
    expect(max).toBeLessThanOrEqual(100)
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
})
