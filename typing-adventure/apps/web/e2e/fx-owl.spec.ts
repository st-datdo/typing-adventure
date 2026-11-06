import { expect, test, type Page } from '@playwright/test'
import { vi as viDict } from '@typing-adventure/i18n'
import { seedSettings, typeText } from './helpers/kr'
import { overlapReport, repeatText, startCustomText } from './helpers/hf'

const TEXT = repeatText(200)
const owl = (page: Page) => page.locator('.game-owl')

const pool = (prefix: string) =>
  Object.entries(viDict as Record<string, string>)
    .filter(([k]) => k.startsWith(prefix))
    .map(([, v]) => v)

async function setup(page: Page, settings: Record<string, unknown> = {}) {
  await page.clock.install()
  await page.setViewportSize({ width: 1280, height: 720 })
  await seedSettings(page, { ageGroup: 'big', lang: 'vi', soundEnabled: false, ...settings })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await page.waitForTimeout(900)
  await startCustomText(page, TEXT)
}

test.describe('FX owl', () => {
  test('FX-12 cheer at tier 5 then idle', async ({ page }) => {
    await setup(page)
    await typeText(page, TEXT.slice(0, 5))
    await expect(owl(page)).toHaveAttribute('data-mood', 'cheer')
    await expect(owl(page)).toHaveAttribute('data-mood', 'idle', { timeout: 1300 })
  })

  test('FX-12 a miss makes the owl think, never sad', async ({ page }) => {
    await setup(page)
    await typeText(page, TEXT.slice(0, 2))
    await page.keyboard.type('z')
    await expect(owl(page)).toHaveAttribute('data-mood', 'thinking')
    const moods = new Set<string>()
    for (let i = 0; i < 10; i++) {
      moods.add((await owl(page).getAttribute('data-mood')) ?? '')
      await page.waitForTimeout(100)
    }
    expect(moods.has('sad')).toBe(false)
  })

  test('FX-12 three misses in a row encourage with a bubble', async ({ page }) => {
    await setup(page)
    await typeText(page, TEXT.slice(0, 2))
    await page.keyboard.type('z')
    await page.keyboard.type('z')
    await page.keyboard.type('z')
    await expect(owl(page)).toHaveAttribute('data-mood', 'encourage')
    const bubble = page.locator('.fx-owl-bubble[data-kind="encourage"]')
    await expect(bubble).toHaveCount(1)
    expect(pool('fxOwlEncourage')).toContain(((await bubble.textContent()) ?? '').trim())
  })

  test('FX-12 idle wave, sleep and wake up', async ({ page }) => {
    await setup(page)
    await typeText(page, TEXT.slice(0, 1))
    await page.clock.fastForward(5000)
    await expect(owl(page)).toHaveAttribute('data-mood', 'wave')
    await page.clock.fastForward(10000)
    await expect(owl(page)).toHaveAttribute('data-mood', 'sleep')
    await typeText(page, TEXT.slice(1, 2))
    await expect(owl(page)).toHaveAttribute('data-mood', 'happy')
    await expect(owl(page)).toHaveAttribute('data-mood', 'idle', { timeout: 900 })
  })

  test('FX-12 no idle timers before the first key, with settings open or after the game', async ({
    page,
  }) => {
    await setup(page)
    await page.clock.fastForward(16000)
    await expect(owl(page)).not.toHaveAttribute('data-mood', 'sleep')

    await typeText(page, TEXT.slice(0, 1))
    await page.getByRole('button', { name: 'Menu' }).click()
    await page
      .locator('.side-nav-actions')
      .getByRole('button', { name: /Cài đặt/ })
      .click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.clock.fastForward(16000)
    await expect(owl(page)).not.toHaveAttribute('data-mood', 'sleep')
    await expect(owl(page)).not.toHaveAttribute('data-mood', 'wave')
    await page.getByRole('dialog').getByRole('button', { name: 'Đóng' }).click()

    await page.locator('.btn-custom-text').click()
    await page.locator('.ta-textarea').fill('asd')
    await page.locator('.ta-modal-actions .ui-btn--go').click()
    await page.locator('.ta-textarea').waitFor({ state: 'detached' })
    await page.locator('.hidden-input').focus()
    await typeText(page, 'asd')
    await expect(page.locator('.celebration-content')).toBeVisible()
    await page.clock.fastForward(16000)
    await expect(owl(page)).not.toHaveAttribute('data-mood', 'sleep')
  })

  test('FX-11 owl praise bubble appears, stays short and covers nothing', async ({ page }) => {
    await setup(page)
    let seen = 0
    const overlaps: string[] = []
    let i = 0
    for (let w = 0; w < 30; w++) {
      const end = TEXT.indexOf(' ', i)
      if (end < 0) break
      await typeText(page, TEXT.slice(i, end))
      const bubble = page.locator('.fx-owl-bubble[data-kind="praise"]')
      if ((await bubble.count()) > 0) {
        seen++
        expect(pool('fxOwlPraise')).toContain(((await bubble.textContent()) ?? '').trim())
        overlaps.push(
          ...(await overlapReport(page, '.fx-owl-bubble', [
            '.word-display .char',
            '.key',
            '.hand-left',
            '.hand-right',
          ])),
        )
        await expect(bubble).toHaveCount(0, { timeout: 1500 })
      }
      await page.keyboard.type('z')
      await typeText(page, ' ')
      i = end + 1
    }
    expect(seen).toBeGreaterThanOrEqual(1)
    expect(overlaps).toEqual([])
  })

  test('FX-11 level few never shows praise bubbles', async ({ page }) => {
    await setup(page, { effectsLevel: 'few' })
    let i = 0
    for (let w = 0; w < 20; w++) {
      const end = TEXT.indexOf(' ', i)
      await typeText(page, TEXT.slice(i, end))
      expect(await page.locator('.fx-owl-bubble[data-kind="praise"]').count()).toBe(0)
      await page.keyboard.type('z')
      await typeText(page, ' ')
      i = end + 1
    }
  })

  test('FX-04 accessory at tier 20 drops on a miss; evolve at tier 50 keeps it', async ({
    page,
  }) => {
    await setup(page)
    await typeText(page, TEXT.slice(0, 20))
    await expect(owl(page)).toHaveAttribute('data-accessory', /.+/)
    await page.keyboard.type('z')
    await expect(owl(page)).not.toHaveAttribute('data-accessory', /.+/, { timeout: 600 })

    await typeText(page, TEXT.slice(20, 70))
    await expect(owl(page)).toHaveAttribute('data-evolve', /.+/)
    await expect(owl(page)).not.toHaveAttribute('data-evolve', /.+/, { timeout: 2000 })
    await expect(owl(page)).toHaveAttribute('data-accessory', /.+/)
  })
})
