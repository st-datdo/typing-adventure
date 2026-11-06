import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import {
  noHorizontalScroll,
  seedSettings,
  tapTargetsUnder44,
  textToType,
  typeText,
} from './helpers/kr'

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

type Screen = { name: string; open: (page: Page) => Promise<void> }

const gameReady = async (page: Page) => {
  await page.goto('/')
  await page.locator('.word-display .char').first().waitFor()
  await page.waitForTimeout(900)
}

const SCREENS: Screen[] = [
  {
    name: 'agepicker',
    open: async (page) => {
      await seedSettings(page, { ageGroup: null, lang: 'vi' })
      await page.goto('/')
      await page.locator('.age-card').first().waitFor()
      await page.waitForTimeout(900)
    },
  },
  {
    name: 'game',
    open: async (page) => {
      await seedSettings(page, { ageGroup: 'big', lang: 'en' })
      await gameReady(page)
    },
  },
  {
    name: 'game+sidenav',
    open: async (page) => {
      await seedSettings(page, { ageGroup: 'big', lang: 'en' })
      await gameReady(page)
      await page.getByRole('button', { name: 'Menu' }).click()
      await page.waitForTimeout(500)
    },
  },
  {
    name: 'result',
    open: async (page) => {
      await seedSettings(page, { ageGroup: 'big', lang: 'vi' })
      await gameReady(page)
      const text = await textToType(page)
      await typeText(page, text)
      await page.locator('.celebration-content').waitFor()
      await page.waitForTimeout(1500)
    },
  },
  {
    name: 'games',
    open: async (page) => {
      await seedSettings(page, { ageGroup: 'kid', lang: 'vi' })
      await page.goto('/games')
      await page.locator('.games-card').first().waitFor()
      await page.waitForTimeout(900)
    },
  },
  {
    name: 'login',
    open: async (page) => {
      await seedSettings(page, { ageGroup: 'kid', lang: 'vi' })
      await page.goto('/login')
      await page.waitForLoadState('networkidle')
    },
  },
]

const notCoveredByScene = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const out: string[] = []
    document.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) return
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return
      const hit = document.elementFromPoint(x, y)
      if (hit?.closest('.kr-scene')) out.push(sel)
    })
    return out
  }, selector)

test.describe('KR layout sweep', () => {
  for (const width of [375, 768, 1024, 1440]) {
    for (const screen of SCREENS) {
      test(`KR-20 ${screen.name} at ${width}px has no horizontal scroll and no scene overlap`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: width === 375 ? 667 : 900 })
        await screen.open(page)
        expect(await noHorizontalScroll(page)).toBe(true)
        for (const sel of [
          '.word-display',
          '.keyboard',
          '.ui-btn--go',
          '.age-card',
          '.games-card',
        ]) {
          expect(await notCoveredByScene(page, sel)).toEqual([])
        }
      })
    }
  }

  for (const screen of SCREENS) {
    test(`KR-19 ${screen.name} tap targets are at least 44x44 at 375x667`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await screen.open(page)
      expect(await tapTargetsUnder44(page, 'button:not(.key), a, [role=radio], select')).toEqual([])
    })
  }

  test('KR-18 Tab through TopBar shows a visible focus ring', async ({ page }) => {
    await seedSettings(page, { ageGroup: 'big', lang: 'en' })
    await gameReady(page)
    const widths: number[] = []
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('Tab')
      const w = await page.evaluate(() => {
        const a = document.activeElement as HTMLElement | null
        if (!a || !a.closest('.ui-topbar')) return null
        return parseFloat(getComputedStyle(a).outlineWidth)
      })
      if (w !== null) widths.push(w)
    }
    expect(widths.length).toBeGreaterThan(0)
    for (const w of widths) expect(w).toBeGreaterThanOrEqual(2)
  })

  test('KR-02 dark theme is applied before hydration and switches immediately', async ({
    page,
  }) => {
    await seedSettings(page, { ageGroup: 'big', lang: 'en', theme: 'dark' })
    let early: string | null = null
    page.on('domcontentloaded', async () => {
      early = await page
        .evaluate(() => document.documentElement.getAttribute('data-theme'))
        .catch(() => null)
    })
    await gameReady(page)
    expect(early).toBe('dark')
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('typingAdventure_settings') ?? '{}')
      return raw
    })
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.locator('.side-nav-actions .ui-btn').first().click()
    const themeSelect = page
      .locator('.ui-overlay select')
      .filter({ has: page.locator('option[value="colorful"]') })
    await themeSelect.selectOption('colorful')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'colorful')
  })

  test('KR-03 KR-16 fonts and images are same-origin, no CSP errors, Baloo font', async ({
    page,
    baseURL,
  }) => {
    const foreign: string[] = []
    const csp: string[] = []
    page.on('request', (r) => {
      const type = r.resourceType()
      if (
        (type === 'font' || type === 'image') &&
        !r.url().startsWith(baseURL!) &&
        !r.url().startsWith('data:')
      ) {
        foreign.push(r.url())
      }
    })
    page.on('console', (m) => {
      if (m.text().includes('Content Security Policy')) csp.push(m.text())
    })
    await seedSettings(page, { ageGroup: null, lang: 'vi' })
    await page.goto('/')
    await page.locator('.age-card').first().waitFor()
    await page.waitForLoadState('networkidle')
    expect(foreign).toEqual([])
    expect(csp).toEqual([])
    expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/Baloo/i)
  })

  for (const theme of THEMES) {
    for (const screen of SCREENS.filter((s) => s.name !== 'login')) {
      test(`KR-17 ${screen.name} has no contrast violations in ${theme}`, async ({ page }) => {
        await page.addInitScript((t) => {
          const raw = JSON.parse(localStorage.getItem('typingAdventure_settings') ?? 'null')
          if (raw?.state) {
            raw.state.theme = t
            localStorage.setItem('typingAdventure_settings', JSON.stringify(raw))
          }
        }, theme)
        await screen.open(page)
        await page.waitForTimeout(600)
        expect(await contrastViolations(page)).toEqual([])
      })
    }
  }
})
