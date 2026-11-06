export interface IconDef {
  d: readonly string[]
  fill?: boolean
}

const CIRCLE9 = 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0'
const HEART = 'M12 20.5s-8-4.9-8-10.9A4.5 4.5 0 0 1 12 6.8a4.5 4.5 0 0 1 8 2.8c0 6-8 10.9-8 10.9z'
const SPEAKER = 'M11 5 6 9H3v6h3l5 4z'

export const ICONS = {
  menu: { d: ['M4 6h16', 'M4 12h16', 'M4 18h16'] },
  close: { d: ['M6 6l12 12', 'M18 6 6 18'] },
  logout: { d: ['M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3', 'M16 17l5-5-5-5', 'M21 12H9'] },
  restart: { d: ['M3 12a9 9 0 1 0 3-6.7', 'M3 4v5h5'] },
  soundOn: { d: [SPEAKER, 'M15.5 8.5a5 5 0 0 1 0 7', 'M18.5 5.5a9 9 0 0 1 0 13'] },
  soundOff: { d: [SPEAKER, 'M16 9l6 6', 'M22 9l-6 6'] },
  home: { d: ['M3 11l9-8 9 8', 'M5 10v10h5v-6h4v6h5V10'] },
  arrowLeft: { d: ['M19 12H5', 'M12 19l-7-7 7-7'] },
  globe: { d: [CIRCLE9, 'M3 12h18', 'M12 3a14 14 0 0 1 0 18', 'M12 3a14 14 0 0 0 0 18'] },
  clock: { d: [CIRCLE9, 'M12 7v5l3 2'] },
  bolt: { d: ['M13 2 4 14h7l-1 8 9-12h-7z'] },
  rocket: {
    d: [
      'M12 2c4 3 5 8 3 13H9C7 10 8 5 12 2z',
      'M9 15l-3 3 1 3 3-2',
      'M15 15l3 3-1 3-3-2',
      'M12 8.5h.01',
    ],
  },
  target: {
    d: [CIRCLE9, 'M7 12a5 5 0 1 0 10 0a5 5 0 1 0-10 0', 'M11 12a1 1 0 1 0 2 0a1 1 0 1 0-2 0'],
  },
  coin: {
    d: [
      CIRCLE9,
      'M12 6.5v11',
      'M15 9.5c-.5-1-1.6-1.5-3-1.5-1.7 0-3 .9-3 2s1.3 1.7 3 2 3 .9 3 2-1.3 2-3 2c-1.4 0-2.5-.5-3-1.5',
    ],
  },
  crown: { d: ['M3 8l4 4 5-7 5 7 4-4-2 11H5z'] },
  flame: {
    d: ['M12 22a6 6 0 0 0 6-6c0-5-4-7-5-12-2 3-3 5-3 7-1-1-2-2-2-3-1 2-2 4-2 8a6 6 0 0 0 6 6z'],
  },
  heart: { d: [HEART], fill: true },
  heartOutline: { d: [HEART] },
  pencil: { d: ['M4 20l4-1 11-11-3-3L5 16z', 'M14 6l3 3'] },
  keyCap: {
    d: [
      'M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z',
      'M8 15h8',
      'M8 9h.01',
      'M12 9h.01',
      'M16 9h.01',
    ],
  },
  book: { d: ['M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z', 'M4 21a2 2 0 0 1 2-2h13v2', 'M9 7h6'] },
  stopwatch: {
    d: ['M5 13a7 7 0 1 0 14 0a7 7 0 1 0-14 0', 'M12 13V9', 'M10 2h4', 'M12 2v4', 'M18 6l1.5-1.5'],
  },
  shield: { d: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'] },
  arrowUp: { d: ['M12 19V5', 'M5 12l7-7 7 7'] },
  arrowDown: { d: ['M12 5v14', 'M19 12l-7 7-7-7'] },
  arrowsUpDown: { d: ['M8 20V4', 'M4 8l4-4 4 4', 'M16 4v16', 'M12 16l4 4 4-4'] },
  rainbow: { d: ['M2 18a10 10 0 0 1 20 0', 'M6 18a6 6 0 0 1 12 0', 'M10 18a2 2 0 0 1 4 0'] },
  hillSmall: { d: ['M2 19c3-6 6-8 10-8s7 2 10 8z'] },
  hillDouble: { d: ['M1 19l7-9 4 5 4-7 7 11z'] },
  mountainFlag: { d: ['M2 20l8-12 4 6 2-3 6 9z', 'M10 8V3l4 1.5L10 6'] },
  check: { d: ['M5 12l5 5 9-10'] },
  gamepad: {
    d: [
      'M6 8h12a4 4 0 0 1 4 4v1a4 4 0 0 1-7 2.6L14 15h-4l-1 .6A4 4 0 0 1 2 13v-1a4 4 0 0 1 4-4z',
      'M7 10.5v3',
      'M5.5 12h3',
      'M16 11h.01',
      'M18 13h.01',
    ],
  },
  sparkle: { d: ['M12 2l2 6.5 6.5 2.5-6.5 2.5L12 20l-2-6.5L3.5 11 10 8.5z'], fill: true },
  star: {
    d: ['M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z'],
    fill: true,
  },
} satisfies Record<string, IconDef>

export type IconName = keyof typeof ICONS
