import { expect, test } from '@playwright/test'
import { seedSettings, textToType, typeText } from './helpers/kr'

test('KR-15 typing under 4x CPU throttle keeps every key and focus', async ({ page }) => {
  await page.addInitScript(() => {
    const w = window as unknown as { __longTasks: number[] }
    w.__longTasks = []
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) w.__longTasks.push(e.duration)
      }).observe({ type: 'longtask', buffered: true })
    } catch {}
  })
  await seedSettings(page, { ageGroup: 'big', lang: 'vi', soundEnabled: false })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await page.waitForTimeout(800)
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
  const text = await textToType(page)

  const lostFocus: string[] = []
  const poll = setInterval(async () => {
    const ok = await page
      .evaluate(() => {
        const a = document.activeElement
        return (
          !!a?.classList.contains('hidden-input') ||
          !!document.querySelector('.celebration-content')
        )
      })
      .catch(() => true)
    if (!ok) lostFocus.push('lost')
  }, 200)

  await page.evaluate(() => {
    const w = window as unknown as { __longTasks: number[] }
    w.__longTasks = []
  })
  await typeText(page, text.slice(0, -1), 30)
  expect(await page.locator('.char--correct').count()).toBe(text.length - 1)
  await typeText(page, text.slice(-1), 30)
  clearInterval(poll)

  await expect(page.locator('.celebration-content')).toBeVisible()
  await expect(page.locator('.celebration-content')).toContainText('100%')
  expect(lostFocus).toEqual([])

  if (process.env.KR_PERF === '1') {
    const max = await page.evaluate(() =>
      Math.max(0, ...(window as unknown as { __longTasks: number[] }).__longTasks),
    )
    expect(max).toBeLessThanOrEqual(100)
  }
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
})
