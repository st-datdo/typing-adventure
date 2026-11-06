import { expect, test } from '@playwright/test'
import { seedSettings, typeText } from './helpers/kr'
import { repeatText, startCustomText } from './helpers/hf'

test('HF-09 fireworks under 4x CPU keep every key, focus and node cap', async ({ page }) => {
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
  await seedSettings(page, { ageGroup: 'big', lang: 'vi', soundEnabled: false })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await page.waitForTimeout(900)
  const text = repeatText(60)
  await startCustomText(page, text)
  await page.waitForLoadState('networkidle')

  const assets: string[] = []
  page.on('request', (r) => {
    if (['image', 'font', 'media', 'script'].includes(r.resourceType())) assets.push(r.url())
  })

  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  const issues: string[] = []
  let maxNodes = 0
  let saw50 = false
  let polling = true
  const poll = (async () => {
    while (polling) {
      const s = await page
        .evaluate(() => ({
          nodes: document.querySelectorAll('.fw-spark, .fw-rocket').length,
          focus:
            !!document.activeElement?.classList.contains('hidden-input') ||
            !!document.querySelector('.celebration-content'),
          x50: (document.querySelector('.combo-burst')?.textContent ?? '').includes('x50'),
        }))
        .catch(() => null)
      if (s) {
        maxNodes = Math.max(maxNodes, s.nodes)
        if (!s.focus) issues.push('lost focus')
        if (s.x50) saw50 = true
      }
      await page.waitForTimeout(100)
    }
  })()

  await page.evaluate(() => {
    ;(window as unknown as { __longTasks: number[] }).__longTasks = []
  })
  await typeText(page, text.slice(0, 52), 30)
  await expect(page.locator('.combo-burst')).toContainText('x50')
  expect(await page.locator('.char--correct').count()).toBe(52)
  await typeText(page, text.slice(52), 30)
  polling = false
  await poll

  await expect(page.locator('.celebration-content')).toBeVisible()
  await expect(page.locator('.celebration-content')).toContainText('100%')
  expect(issues).toEqual([])
  expect(maxNodes).toBeLessThanOrEqual(60)
  expect(saw50).toBe(true)
  expect(assets).toEqual([])

  if (process.env.KR_PERF === '1') {
    const max = await page.evaluate(() =>
      Math.max(0, ...(window as unknown as { __longTasks: number[] }).__longTasks),
    )
    expect(max).toBeLessThanOrEqual(100)
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
})
