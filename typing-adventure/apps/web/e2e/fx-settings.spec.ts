import { expect, test, type Page } from '@playwright/test'
import { readSettings, seedSettings, typeText } from './helpers/kr'
import { repeatText, startCustomText } from './helpers/hf'

const TEXT = repeatText(60)

async function openSettings(page: Page, menu: string, settings: RegExp) {
  await page.getByRole('button', { name: menu }).click()
  await page.locator('.side-nav-actions').getByRole('button', { name: settings }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
}

async function boot(page: Page, settings: Record<string, unknown> = {}) {
  await seedSettings(page, { ageGroup: 'big', lang: 'vi', soundEnabled: false, ...settings })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await page.waitForTimeout(900)
}

test.describe('FX effects level setting', () => {
  test('FX-14 the effects field follows the theme field and defaults to lots', async ({ page }) => {
    await boot(page)
    await openSettings(page, 'Menu', /Cài đặt/)
    const dialog = page.getByRole('dialog')
    const theme = dialog.locator('label[for="set-theme"]')
    const fx = dialog.locator('#set-fx-label')
    await expect(fx).toHaveText('Hiệu ứng')
    const order = await page.evaluate(() => {
      const a = document.querySelector('label[for="set-theme"]')!
      const b = document.querySelector('#set-fx-label')!
      return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
    })
    expect(order).toBeTruthy()
    await expect(theme).toBeVisible()
    const group = dialog.getByRole('radiogroup', { name: 'Hiệu ứng' })
    await expect(group.getByRole('radio', { name: /Nhiều/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )
  })

  test('FX-14 arrow keys switch to some, which stops key sparks and survives reload', async ({
    page,
  }) => {
    const settingsCalls: string[] = []
    page.on('request', (r) => {
      if (r.url().includes('/api/users/me/settings')) settingsCalls.push(r.method())
    })
    await boot(page)
    await openSettings(page, 'Menu', /Cài đặt/)
    const group = page.getByRole('dialog').getByRole('radiogroup', { name: 'Hiệu ứng' })
    await group.getByRole('radio', { name: /Nhiều/ }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(group.getByRole('radio', { name: /Vừa/ })).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('dialog').getByRole('button', { name: 'Đóng' }).click()
    await expect(page.getByRole('dialog')).toHaveCount(0)

    await startCustomText(page, TEXT)
    for (let i = 0; i < 10; i++) {
      await typeText(page, TEXT[i])
      await page.waitForTimeout(30)
      expect(await page.locator('.fx-p--spark').count()).toBe(0)
    }
    await expect.poll(async () => (await readSettings(page)).effectsLevel).toBe('some')

    await page.reload()
    await page.locator('.word-display .char').first().waitFor()
    expect((await readSettings(page)).effectsLevel).toBe('some')
    expect(settingsCalls).toEqual([])
  })

  test('FX-14 FX-20 english labels read Effects, Lots, Some, Few', async ({ page }) => {
    await boot(page, { lang: 'en' })
    await openSettings(page, 'Menu', /Settings/)
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('#set-fx-label')).toHaveText('Effects')
    const group = dialog.getByRole('radiogroup', { name: 'Effects' })
    await expect(group.getByRole('radio', { name: /Lots/ })).toBeVisible()
    await expect(group.getByRole('radio', { name: /Some/ })).toBeVisible()
    await expect(group.getByRole('radio', { name: /Few/ })).toBeVisible()
  })
})
