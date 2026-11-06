import { expect, test } from '@playwright/test'
import { seedSettings, textToType, typeText } from './helpers/kr'

test.describe('KR game screen', () => {
  test.beforeEach(async ({ page }) => {
    await seedSettings(page, { ageGroup: 'kid', lang: 'vi', soundEnabled: true })
    await page.goto('/')
    await page.locator('.word-display .char').first().waitFor()
  })

  test('KR-05 TopBar buttons keep labels and the sound toggle swaps icons', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Chơi lại từ đầu' })).toBeVisible()
    const sound = page.getByRole('button', { name: 'Bật/tắt âm thanh' })
    await expect(sound).toHaveAttribute('aria-pressed', 'true')
    await expect(sound.locator('svg')).toHaveAttribute('data-icon', 'soundOn')
    await sound.click()
    await expect(sound).toHaveAttribute('aria-pressed', 'false')
    await expect(sound.locator('svg')).toHaveAttribute('data-icon', 'soundOff')
    await expect(page.locator('h1')).not.toContainText('🦉')
    await expect(page).toHaveTitle(/Typing Adventure/)
  })

  test('KR-06 clicking the scene focuses the hidden input', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.locator('body').click({ position: { x: 1430, y: 880 } })
    expect(
      await page.evaluate(() => document.activeElement?.classList.contains('hidden-input')),
    ).toBe(true)
  })

  test('KR-16 data-playing toggles and pauses loops while typing', async ({ page }) => {
    const screen = page.locator('.ta-screen')
    await expect(screen).toHaveAttribute('data-playing', 'false')
    const text = await textToType(page)
    await typeText(page, text.slice(0, 1))
    await expect(screen).toHaveAttribute('data-playing', 'true')
    const states = await page.$$eval('.kr-loop', (els) =>
      els.map((el) => getComputedStyle(el).animationPlayState),
    )
    for (const s of states) expect(s).toBe('paused')
    await typeText(page, text.slice(1))
    await expect(screen).toHaveAttribute('data-playing', 'false')
  })

  test('KR-09 a 5-combo shows a burst without stealing focus', async ({ page }) => {
    const text = await textToType(page)
    await typeText(page, text.slice(0, 5))
    const burst = page.locator('.combo-burst')
    await expect(burst).toBeVisible()
    await expect(burst).toContainText('x5')
    await expect(page.locator('[aria-live="polite"].sr-only')).toContainText('Giỏi lắm!')
    expect(await burst.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe('none')
    expect(
      await page.evaluate(() => document.activeElement?.classList.contains('hidden-input')),
    ).toBe(true)
    await expect(page.locator('.game-owl')).toHaveAttribute('data-mood', 'happy')
    await page.waitForTimeout(1500)
    await expect(page.locator('.combo-burst')).toHaveCount(0)
  })
})
