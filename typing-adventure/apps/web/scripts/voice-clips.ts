import { existsSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { listVoiceClips } from '../src/lib/audio/voice-clips'

const VOICE_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'voice')
const LANGS = ['vi', 'en'] as const

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

function list(): void {
  console.log('lang,file,text')
  for (const clip of listVoiceClips()) {
    console.log([clip.lang, `${clip.lang}/${clip.id}.mp3`, csvCell(clip.text)].join(','))
  }
}

function manifest(): void {
  const wanted = listVoiceClips()
  const out: Record<string, string[]> = {}
  for (const lang of LANGS) {
    const dir = join(VOICE_DIR, lang)
    const files = existsSync(dir) ? readdirSync(dir).filter(f => f.endsWith('.mp3')) : []
    const ids = new Set(files.map(f => f.slice(0, -'.mp3'.length)))
    out[lang] = wanted.filter(c => c.lang === lang && ids.has(c.id)).map(c => c.id)
    const unknown = [...ids].filter(id => !wanted.some(c => c.lang === lang && c.id === id))
    if (unknown.length > 0) console.warn(`[${lang}] unknown files ignored: ${unknown.join(', ')}`)
  }
  writeFileSync(join(VOICE_DIR, 'manifest.json'), `${JSON.stringify(out, null, 2)}\n`)
  const have = out.vi.length + out.en.length
  console.log(`manifest.json written: ${have}/${wanted.length} clips recorded`)
}

const command = process.argv[2]
if (command === 'list') list()
else if (command === 'manifest') manifest()
else {
  console.log('Usage: pnpm --filter @typing-adventure/web voice:clips <list|manifest>')
  process.exit(1)
}
