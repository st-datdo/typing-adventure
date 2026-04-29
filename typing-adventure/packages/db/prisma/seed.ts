import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const WORDS_EASY = [
  'cat', 'dog', 'sun', 'hat', 'big', 'run', 'fun', 'red', 'top', 'box',
  'cup', 'map', 'pen', 'bed', 'hot', 'sit', 'let', 'cut', 'hop', 'win',
  'bat', 'fog', 'jam', 'kit', 'log', 'mud', 'net', 'pig', 'rug', 'van',
  'ant', 'bus', 'dig', 'egg', 'fix', 'gum', 'hug', 'ice', 'jet', 'kid',
]

const WORDS_MEDIUM = [
  'apple', 'happy', 'tiger', 'robot', 'music', 'dance', 'cloud', 'dream',
  'light', 'beach', 'green', 'smile', 'stone', 'world', 'train', 'space',
  'plant', 'water', 'bread', 'house', 'mouse', 'heart', 'river', 'storm',
  'flame', 'piano', 'grape', 'candy', 'brave', 'quest', 'magic', 'knight',
]

const WORDS_HARD = [
  'butterfly', 'adventure', 'elephant', 'dinosaur', 'chocolate', 'beautiful',
  'wonderful', 'astronaut', 'celebrate', 'fantastic', 'pineapple', 'strawberry',
  'education', 'discovery', 'ecosystem', 'hamburger', 'invisible', 'knowledge',
  'landscape', 'nightmare', 'operation', 'passenger', 'questions', 'rectangle',
  'sunflower', 'telephone', 'umbrella', 'vegetable', 'xylophone', 'dangerous',
]

async function main() {
  console.log('Seeding database...')

  // Seed admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@typingadventure.com' },
    update: {},
    create: {
      email: 'admin@typingadventure.com',
      name: 'Admin',
      avatar: '👑',
      role: 'ADMIN',
      records: {
        create: {},
      },
    },
  })
  console.log(`Admin user: ${admin.id}`)

  // Seed default word packs
  const packs = [
    { name: 'Easy Words', level: 'easy', words: WORDS_EASY, isDefault: true },
    { name: 'Medium Words', level: 'medium', words: WORDS_MEDIUM, isDefault: true },
    { name: 'Hard Words', level: 'hard', words: WORDS_HARD, isDefault: true },
    {
      name: 'Animals',
      level: 'easy',
      words: ['cat', 'dog', 'fish', 'bird', 'frog', 'duck', 'bear', 'deer', 'fox', 'owl',
              'bat', 'ant', 'bee', 'cow', 'pig', 'hen', 'ram', 'eel', 'yak', 'emu'],
      category: 'animals',
    },
    {
      name: 'Food',
      level: 'easy',
      words: ['cake', 'rice', 'soup', 'milk', 'egg', 'pie', 'jam', 'nut', 'fig', 'ham',
              'corn', 'pear', 'plum', 'bean', 'lime', 'mint', 'tofu', 'taco', 'wrap', 'roll'],
      category: 'food',
    },
    {
      name: 'School',
      level: 'medium',
      words: ['pencil', 'eraser', 'school', 'lesson', 'teach', 'learn', 'study', 'class',
              'paper', 'ruler', 'chalk', 'grade', 'smart', 'board', 'chair', 'table',
              'write', 'count', 'spell', 'think'],
      category: 'school',
    },
  ]

  for (const pack of packs) {
    await prisma.wordPack.upsert({
      where: { id: `default-${pack.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: { words: pack.words },
      create: {
        id: `default-${pack.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: pack.name,
        language: 'en',
        level: pack.level,
        words: pack.words,
        category: pack.category ?? null,
        isDefault: pack.isDefault ?? false,
        createdBy: admin.id,
      },
    })
    console.log(`Word pack: ${pack.name}`)
  }

  console.log('Seed complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
