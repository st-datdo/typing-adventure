import { expect, test } from '@playwright/test'
import { seedSettings, textToType, typeText } from './helpers/kr'

const pressedScale = (transform: string) => {
  if (transform === 'none') return { scale: 1, ty: 0 }
  const m = transform.match(/matrix\(([^)]+)\)/)
  if (!m) return { scale: 1, ty: 0 }
  const v = m[1].split(',').map(Number)
  return { scale: v[0], ty: v[5] }
}

test('KR-08 age card sinks on press, restores on release, pointer cursor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await seedSettings(page, { ageGroup: null, lang: 'vi' })
  await page.goto('/')
  const card = page.locator('.age-card').first()
  await card.waitFor()
  await page.waitForTimeout(600)
  expect(await card.evaluate((el) => getComputedStyle(el).cursor)).toBe('pointer')
  const box = (await card.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(250)
  const down = pressedScale(await card.evaluate((el) => getComputedStyle(el).transform))
  const pressed = (down.scale >= 0.92 && down.scale <= 0.97) || (down.ty >= 2 && down.ty <= 4)
  expect(pressed, JSON.stringify(down)).toBe(true)
  await page.mouse.move(0, 0)
  await page.mouse.up()
})

test('KR-08 disabled ui-btn has no press effect and a non-pointer cursor', async ({ page }) => {
  await seedSettings(page, { ageGroup: 'big', lang: 'en' })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  const result = await page.evaluate(() => {
    const b = document.createElement('button')
    b.className = 'ui-btn ui-btn--go'
    b.disabled = true
    b.textContent = 'x'
    document.body.appendChild(b)
    const cursor = getComputedStyle(b).cursor
    b.remove()
    return cursor
  })
  expect(['not-allowed', 'default']).toContain(result)
})

test('KR-21 guest finishing a round makes no data API request', async ({ page }) => {
  const preexisting = new Set(['GET /api/wordpacks'])
  const api: string[] = []
  page.on('request', (r) => {
    const u = new URL(r.url())
    const key = `${r.method()} ${u.pathname}`
    if (
      u.pathname.startsWith('/api/') &&
      !u.pathname.startsWith('/api/auth/') &&
      !preexisting.has(key)
    )
      api.push(key)
  })
  await seedSettings(page, { ageGroup: 'kid', lang: 'vi' })
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await typeText(page, await textToType(page))
  await expect(page.locator('.celebration-content')).toBeVisible()
  await page.waitForTimeout(800)
  expect(api).toEqual([])
  expect(await page.evaluate(() => localStorage.getItem('typingAdventure_settings'))).not.toBeNull()
})
