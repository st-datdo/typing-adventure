import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { seedSettings } from './helpers/kr'

const THEMES = ['light', 'colorful', 'dark'] as const

const bodyMatchesToken = (page: Page) =>
  page.evaluate(() => {
    const probe = document.createElement('div')
    probe.style.backgroundColor = 'var(--kr-bg)'
    document.body.appendChild(probe)
    const want = getComputedStyle(probe).backgroundColor
    probe.remove()
    return { want, got: getComputedStyle(document.body).backgroundColor }
  })

const contrastViolations = async (page: Page) => {
  const res = await new AxeBuilder({ page }).withRules(['color-contrast']).analyze()
  return res.violations.flatMap((v) =>
    v.nodes.map((n) => `${n.target.join(' ')}: ${n.failureSummary ?? ''}`),
  )
}

test.describe('KR theme-only screens', () => {
  for (const theme of THEMES) {
    for (const path of ['/login', '/register', '/games']) {
      test(`KR-13 KR-02 ${path} uses kr tokens in ${theme}`, async ({ page }) => {
        await seedSettings(page, { ageGroup: 'kid', lang: 'vi', theme })
        await page.goto(path)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await page.waitForLoadState('networkidle')
        const { want, got } = await bodyMatchesToken(page)
        expect(got).toBe(want)
      })
    }

    test(`KR-13 KR-04 Little home uses the SVG owl in ${theme}`, async ({ page }) => {
      await seedSettings(page, { ageGroup: 'little', lang: 'vi', theme })
      await page.goto('/')
      const mascot = page.locator('.little-mascot').first()
      await expect(mascot).toBeVisible()
      await expect(mascot).not.toContainText('🦉')
      await expect(mascot.locator('svg')).toHaveCount(1)
    })

    test(`KR-17 login has no contrast violations in ${theme}`, async ({ page }) => {
      await seedSettings(page, { ageGroup: 'kid', lang: 'vi', theme })
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(800)
      expect(await contrastViolations(page)).toEqual([])
    })

    test(`KR-17 Little home has no contrast violations in ${theme}`, async ({ page }) => {
      await seedSettings(page, { ageGroup: 'little', lang: 'vi', theme })
      await page.goto('/')
      await page.locator('.little-mascot').first().waitFor()
      await page.waitForTimeout(1200)
      expect(await contrastViolations(page)).toEqual([])
    })
  }
})
