import { expect, test } from '@playwright/test'
import { readSettings, seedSettings } from './helpers/kr'

test.describe('KR AgePicker', () => {
  test('KR-12 picking 6–8 stores kid and opens the game', async ({ page }) => {
    await seedSettings(page, { ageGroup: null, lang: 'vi' })
    await page.goto('/')
    await page.getByRole('button', { name: /6–8/ }).click()
    await expect(page.locator('.ta-screen')).toBeVisible()
    expect((await readSettings(page)).ageGroup).toBe('kid')
  })

  test('KR-12 picking 3–5 opens Little mode', async ({ page }) => {
    await seedSettings(page, { ageGroup: null, lang: 'vi' })
    await page.goto('/')
    await page.getByRole('button', { name: /3–5/ }).click()
    await expect(page.locator('.little-root').first()).toBeVisible()
    expect((await readSettings(page)).ageGroup).toBe('little')
  })

  test('KR-12 language button switches text', async ({ page }) => {
    await seedSettings(page, { ageGroup: null, lang: 'vi' })
    await page.goto('/')
    await expect(page.getByText('Con mấy tuổi rồi nhỉ?')).toBeVisible()
    await page.locator('.age-lang').click()
    await expect(page.getByText('Con mấy tuổi rồi nhỉ?')).toHaveCount(0)
  })

  test('KR-07 entrance animations settle within 1000ms', async ({ page }) => {
    await seedSettings(page, { ageGroup: null })
    await page.goto('/')
    await page.locator('.age-card').first().waitFor()
    await page.waitForTimeout(1000)
    const states = await page.$$eval('.kr-enter', (els) =>
      els.map((el) => {
        const s = getComputedStyle(el)
        return { opacity: s.opacity, transform: s.transform }
      }),
    )
    expect(states.length).toBeGreaterThan(0)
    for (const s of states) expect(s).toEqual({ opacity: '1', transform: 'none' })
  })

  test('KR-06 scene is decorative at >=768px', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await seedSettings(page, { ageGroup: null })
    await page.goto('/')
    const scene = page.locator('.kr-scene').first()
    await expect(scene).toBeAttached()
    expect(await scene.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none')
  })
})
