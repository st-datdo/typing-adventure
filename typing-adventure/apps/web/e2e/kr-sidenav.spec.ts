import { expect, test } from '@playwright/test'
import { readSettings, seedSettings, tapTargetsUnder44 } from './helpers/kr'

const openNav = async (page: import('@playwright/test').Page) => {
  await page.locator('.word-display .char').first().waitFor()
  await page.getByRole('button', { name: 'Menu' }).click()
  await expect(page.locator('.side-nav--open')).toBeVisible()
}

test.describe('KR SideNav', () => {
  test('KR-11 KR-18 choose mode and lesson with the keyboard', async ({ page }) => {
    await seedSettings(page, { ageGroup: 'big', lang: 'vi' })
    await page.goto('/')
    await openNav(page)
    await expect(page.locator('.side-nav-head button')).toBeFocused()
    const modes = page.getByRole('radiogroup').first()
    await modes.getByRole('radio', { checked: true }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(modes.getByRole('radio', { name: /Bài học/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    const lessons = page.getByRole('radiogroup').nth(1)
    await expect(lessons).toBeVisible()
    await lessons.getByRole('radio', { name: /Tất cả/ }).focus()
    await page.keyboard.press('Space')
    await expect(lessons.getByRole('radio', { name: /Tất cả/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    await page.keyboard.press('Escape')
    await expect(page.locator('.char--correct')).toHaveCount(0)
    expect(
      await page.evaluate(() => document.activeElement?.classList.contains('hidden-input')),
    ).toBe(true)
  })

  test('KR-11 choosing Hard persists the level', async ({ page }) => {
    await seedSettings(page, { ageGroup: 'big', lang: 'vi' })
    await page.goto('/')
    await openNav(page)
    await page.getByRole('radio', { name: /Khó/ }).click()
    await expect.poll(async () => (await readSettings(page)).level).toBe('hard')
  })

  test('KR-11 kid sees only two mode cards', async ({ page }) => {
    await seedSettings(page, { ageGroup: 'kid', lang: 'vi' })
    await page.goto('/')
    await openNav(page)
    await expect(page.getByRole('radiogroup').first().getByRole('radio')).toHaveCount(2)
  })

  test('KR-19 cards are at least 44x44 at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await seedSettings(page, { ageGroup: 'big', lang: 'vi' })
    await page.goto('/')
    await openNav(page)
    expect(await tapTargetsUnder44(page, '.side-nav [role=radio]')).toEqual([])
  })
})
