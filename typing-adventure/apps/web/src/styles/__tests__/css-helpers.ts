import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const stylesDir = join(__dirname, '..')

export function readStyle(file: string): string {
  const p = join(stylesDir, file)
  return existsSync(p) ? readFileSync(p, 'utf8') : ''
}

export interface CssBlock {
  selectors: string[]
  body: string
}

export function cssBlocks(css: string): CssBlock[] {
  const out: CssBlock[] = []
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const re = /([^{}]+)\{([^{}]*)\}/g
  let m: RegExpExecArray | null
  while ((m = re.exec(clean))) {
    out.push({
      selectors: m[1]
        .split(',')
        .map((s) => s.trim().replace(/'/g, '"').replace(/\s+/g, ' '))
        .filter(Boolean),
      body: m[2],
    })
  }
  return out
}

export function cssDecls(body: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const part of body.split(';')) {
    const i = part.indexOf(':')
    if (i < 0) continue
    out[part.slice(0, i).trim()] = part
      .slice(i + 1)
      .trim()
      .replace(/\s+/g, ' ')
  }
  return out
}

export function ruleFor(css: string, selector: string): Record<string, string> {
  const merged: Record<string, string> = {}
  for (const b of cssBlocks(css)) {
    if (b.selectors.includes(selector)) Object.assign(merged, cssDecls(b.body))
  }
  return merged
}

export function rulesMatching(css: string, test: (selector: string) => boolean): CssBlock[] {
  return cssBlocks(css).filter((b) => b.selectors.some(test))
}

export function keyframes(css: string, name: string): string | null {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  const start = clean.search(new RegExp(`@keyframes\\s+${name}\\s*\\{`))
  if (start < 0) return null
  let depth = 0
  for (let i = clean.indexOf('{', start); i < clean.length; i++) {
    if (clean[i] === '{') depth++
    else if (clean[i] === '}') {
      depth--
      if (depth === 0) return clean.slice(clean.indexOf('{', start) + 1, i)
    }
  }
  return null
}

export function allKeyframeNames(css: string): string[] {
  return [...css.matchAll(/@keyframes\s+([\w-]+)/g)].map((m) => m[1])
}

export function mediaBlock(css: string, query: RegExp): string {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
  let out = ''
  const re = /@media[^{]*\{/g
  let m: RegExpExecArray | null
  while ((m = re.exec(clean))) {
    if (!query.test(m[0])) continue
    let depth = 0
    for (let i = m.index + m[0].length - 1; i < clean.length; i++) {
      if (clean[i] === '{') depth++
      else if (clean[i] === '}') {
        depth--
        if (depth === 0) {
          out += clean.slice(m.index + m[0].length, i) + '\n'
          break
        }
      }
    }
  }
  return out
}

export function tokenValue(name: string): string | undefined {
  const tokens = readStyle('tokens.css')
  const root = ruleFor(tokens, ':root')
  return root[name]
}

export function resolveVar(value: string): string {
  return value.replace(/var\((--[\w-]+)\)/g, (all, name: string) => tokenValue(name) ?? all)
}

export function toPx(value: string): number {
  const v = resolveVar(value).trim()
  const m = v.match(/^(-?[\d.]+)(px|rem)?$/)
  if (!m) return NaN
  return m[2] === 'rem' ? parseFloat(m[1]) * 16 : parseFloat(m[1])
}

export function toMs(value: string): number {
  const v = resolveVar(value).trim()
  const m = v.match(/^([\d.]+)(ms|s)$/)
  if (!m) return NaN
  return m[2] === 's' ? parseFloat(m[1]) * 1000 : parseFloat(m[1])
}
