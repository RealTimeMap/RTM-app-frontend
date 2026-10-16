import type { BrowserContext, Page } from '@playwright/test'
import type { MapMark, MockApi } from '../e2e/support/mockApi'
import { Buffer } from 'node:buffer'
import sharp from 'sharp'
import { API_BASE } from '../e2e/support/env'
import { expect, openApp, test } from '../e2e/support/fixtures'
import { markFull, ME } from '../e2e/support/mockApi'

const OUT = 'store/screenshots'
const MEDIA = 'https://media.store.test'

// ---------- Медиа: аватары и фото генерируются, без внешних картинок ----------

const AVATARS: Record<string, [string, string]> = {
  anna: ['#f472b6', '#7c3aed'],
  max: ['#38bdf8', '#2563eb'],
  olga: ['#fbbf24', '#ea580c'],
  ilya: ['#34d399', '#0d9488'],
  kate: ['#a78bfa', '#db2777'],
  me: ['#818cf8', '#7c3aed'],
}

const PHOTOS: Record<string, [string, string, string]> = {
  concert: ['#1e1b4b', '#7c3aed', '#f472b6'],
  fair: ['#7c2d12', '#ea580c', '#fde68a'],
  river: ['#0c4a6e', '#0ea5e9', '#bae6fd'],
}

async function avatarPng(name: string) {
  const [a, b] = AVATARS[name] ?? AVATARS.me!
  const letter = name === 'me' ? 'Д' : ({ anna: 'А', max: 'М', olga: 'О', ilya: 'И', kate: 'К' } as Record<string, string>)[name]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>
    <rect width="256" height="256" fill="url(#g)"/>
    <text x="128" y="160" font-family="Helvetica, Arial" font-size="110" font-weight="700" fill="#fff" text-anchor="middle">${letter}</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function photoJpg(name: string) {
  const [a, b, c] = PHOTOS[name] ?? PHOTOS.concert!
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="0.7" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>
      <radialGradient id="sun" cx="0.7" cy="0.35" r="0.35"><stop offset="0" stop-color="#fff" stop-opacity="0.85"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#sky)"/>
    <rect width="1200" height="800" fill="url(#sun)"/>
    <path d="M0 620 L80 560 L140 600 L220 480 L300 590 L380 520 L460 600 L560 430 L640 580 L720 500 L820 600 L900 470 L980 580 L1080 520 L1200 590 L1200 800 L0 800Z" fill="#0f172a" opacity="0.85"/>
  </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer()
}

async function installMedia(context: BrowserContext) {
  await context.route(`${MEDIA}/**`, async (route) => {
    const [, kind, file] = new URL(route.request().url()).pathname.split('/')
    const name = file!.replace(/\.\w+$/, '')
    const body = kind === 'avatar' ? await avatarPng(name) : await photoJpg(name)
    await route.fulfill({
      body,
      contentType: kind === 'avatar' ? 'image/png' : 'image/jpeg',
      headers: { 'access-control-allow-origin': '*', 'cache-control': 'max-age=3600' },
    })
  })
}

const avatar = (name: string) => `${MEDIA}/avatar/${name}.png`
const photo = (name: string) => `${MEDIA}/photo/${name}.jpg`

// ---------- Данные ----------

const PEOPLE = {
  anna: { id: 11, username: 'Анна', tag: 'anna_walks', avatar: avatar('anna') },
  max: { id: 12, username: 'Максим', tag: 'max_bike', avatar: avatar('max') },
  olga: { id: 13, username: 'Ольга', tag: 'olga.art', avatar: avatar('olga') },
  ilya: { id: 14, username: 'Илья', tag: 'ilya_run', avatar: avatar('ilya') },
  kate: { id: 15, username: 'Катя', tag: 'kate', avatar: avatar('kate') },
}

const ME_STORE = {
  ...ME,
  username: 'Дмитрий',
  tag: 'dima',
  avatar: avatar('me'),
  gamification: {
    currentLevel: 7,
    currentLevelName: 'Исследователь',
    currentXp: 340,
    progressPercent: 68,
    xpForNextLevel: 500,
    nextLevel: { level: 8, levelName: 'Следопыт' },
  },
}

const CATEGORIES = {
  event: { id: 1, categoryName: 'Событие', color: '#7c3aed', icon: 'app:concert-loop' },
  sport: { id: 2, categoryName: 'Спорт', color: '#16a34a', icon: 'app:sport-loop' },
  exhibition: { id: 3, categoryName: 'Выставка', color: '#ea580c', icon: 'app:exhibition' },
  festival: { id: 4, categoryName: 'Фестиваль', color: '#db2777', icon: 'app:festival-loop' },
}

interface StoreMark {
  mark: MapMark
  info: string
  category: (typeof CATEGORIES)[keyof typeof CATEGORIES]
  owner: (typeof PEOPLE)[keyof typeof PEOPLE]
  likes: number
}

function storeMark(id: number, markName: string, lng: number, lat: number, extra: Omit<StoreMark, 'mark'>, photos: string[] = []): StoreMark {
  return { mark: { id, markName, geom: { type: 'Point', coordinates: [lng, lat] }, photos }, ...extra }
}

const MARKS: StoreMark[] = [
  storeMark(1, 'Уличный концерт у ГУМа', 37.6205, 55.7552, { info: 'Живая музыка до 21:00, играют джаз и каверы. Приходите с друзьями!', category: CATEGORIES.event, owner: PEOPLE.anna, likes: 48 }, [photo('concert'), photo('river')]),
  storeMark(2, 'Ярмарка на Манежной', 37.6148, 55.7562, { info: 'Горячий сбитень, пряники и мастер-классы для детей.', category: CATEGORIES.festival, owner: PEOPLE.olga, likes: 31 }, [photo('fair')]),
  storeMark(3, 'Пробежка по набережной', 37.6222, 55.7493, { info: 'Собираемся у моста в 19:30, темп спокойный, 5 км.', category: CATEGORIES.sport, owner: PEOPLE.ilya, likes: 17 }, [photo('river')]),
  storeMark(4, 'Бесплатная выставка графики', 37.6082, 55.7528, { info: 'Молодые художники, вход свободный.', category: CATEGORIES.exhibition, owner: PEOPLE.olga, likes: 22 }),
  storeMark(5, 'Велопрогулка по центру', 37.6112, 55.7598, { info: 'Стартуем от Театральной, маршрут 12 км.', category: CATEGORIES.sport, owner: PEOPLE.max, likes: 12 }),
  storeMark(6, 'Фестиваль уличной еды', 37.6265, 55.7578, { info: 'Больше 30 фудтраков и живая музыка.', category: CATEGORIES.festival, owner: PEOPLE.kate, likes: 64 }),
  storeMark(7, 'Лекция об архитектуре', 37.6045, 55.7572, { info: 'Рассказываем о зданиях вокруг Красной площади.', category: CATEGORIES.event, owner: PEOPLE.anna, likes: 9 }),
]

function fullMark(m: StoreMark) {
  const base = markFull(m.mark)
  return {
    ...base,
    additionalInfo: m.info,
    category: m.category,
    owner: m.owner,
    like: { count: m.likes, isLiked: m.mark.id === 1, canLike: true },
    share: { count: Math.round(m.likes / 4) },
  }
}

const ACHIEVEMENTS: Array<[string, string, string]> = [
  ['Первая метка', 'Поставьте свою первую метку', 'app:map-pin-star-loop'],
  ['Душа компании', 'Соберите 10 подписчиков', 'app:people-loop'],
  ['Ранняя пташка', 'Метка до 7 утра', 'app:early-bird-loop'],
  ['Неделя подряд', '7 дней активности', 'app:streak-loop'],
  ['Путешественник', 'Метки в 5 городах', 'app:globe-loop'],
  ['Фотограф', '20 меток с фото', 'app:camera-loop'],
  ['Ночной дозор', 'Метка после полуночи', 'app:night-loop'],
  ['Вершина', 'Достигните 10 уровня', 'app:summit-loop'],
]

function achievement(i: number) {
  const [title, desc, icon] = ACHIEVEMENTS[i % ACHIEVEMENTS.length]!
  return { id: i + 1, code: `a${i + 1}`, title, desc, triggerEventType: 'mark_created', threshold: 10, icon }
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()

const CHATS = [
  { chatId: 1, peer: PEOPLE.anna, unread: 2, at: 3, last: [PEOPLE.anna.username, 'Встречаемся у сцены, я в жёлтой куртке 🙂'] },
  { chatId: 2, peer: PEOPLE.max, unread: 0, at: 25, last: [ME_STORE.username, 'Отличный маршрут, завтра повторим!'] },
  { chatId: 3, peer: PEOPLE.olga, unread: 1, at: 70, last: [PEOPLE.olga.username, 'Добавила фото с выставки в метку'] },
  { chatId: 4, peer: PEOPLE.ilya, unread: 0, at: 180, last: [PEOPLE.ilya.username, 'Пробежка в 19:30, не опаздывай'] },
  { chatId: 5, peer: PEOPLE.kate, unread: 0, at: 60 * 26, last: [ME_STORE.username, 'Спасибо за подсказку с фудтраками!'] },
].map(c => ({
  chatId: c.chatId,
  type: 'direct',
  title: c.peer.username,
  avatar: c.peer.avatar,
  unreadCount: c.unread,
  updatedAt: minutesAgo(c.at),
  peerId: c.peer.id,
  isAdmin: false,
  lastMessage: { messageId: c.chatId * 100, username: c.last[0], content: c.last[1] },
  readCursors: [{ userId: ME_STORE.userId, lastReadMessageId: c.chatId * 100 - c.unread }, { userId: c.peer.id, lastReadMessageId: c.chatId * 100 }],
}))

const DIALOG: Array<[boolean, string, number]> = [
  [false, 'Привет! Видел метку про концерт у ГУМа?', 42],
  [true, 'Да, уже смотрю на карте — совсем рядом со мной', 40],
  [false, 'Там сейчас играют джаз, народу много', 38],
  [true, 'Отлично, буду минут через 15 🚶', 35],
  [false, 'Я поставила метку прямо у сцены, ориентируйся по ней', 20],
  [true, 'Вижу, иду по маршруту', 12],
  [false, 'Встречаемся у сцены, я в жёлтой куртке 🙂', 3],
]

function chatHistory() {
  const messages = DIALOG.map(([mine, content, ago], i) => ({
    id: 90 + i,
    type: 'text',
    content,
    createdAt: minutesAgo(ago),
    chatId: 1,
    sender: mine ? { id: ME_STORE.userId, username: ME_STORE.username, avatar: ME_STORE.avatar } : PEOPLE.anna,
  }))
  return { messages, lastMessageId: 96, readCursors: [{ userId: ME_STORE.userId, lastReadMessageId: 96 }, { userId: PEOPLE.anna.id, lastReadMessageId: 95 }] }
}

const GROUPS = [
  { id: 'g-coffee', name: 'Любимые кофейни', description: 'Где вкусно и уютно', color: '#b45309', icon: 'app:cup' },
  { id: 'g-run', name: 'Маршруты для бега', description: 'Набережные и парки', color: '#16a34a', icon: 'app:walk' },
  { id: 'g-trip', name: 'Поездка в Питер', description: 'Что посмотреть', color: '#2563eb', icon: 'app:suitcase' },
]

const PERSONAL: Array<[number, string, string, string, string, number, number, string[]]> = [
  [201, 'Кофейня «Зерно»', 'Лучший раф в центре', '#b45309', 'app:cup', 37.6129, 55.7609, ['g-coffee']],
  [202, 'Старт пробежки', 'Парк Зарядье, вход со стороны набережной', '#16a34a', 'app:walk', 37.6286, 55.7512, ['g-run']],
  [203, 'Эрмитаж', 'Взять билеты заранее', '#2563eb', 'app:city', 30.3146, 59.9398, ['g-trip']],
  [204, 'Книжный на Покровке', '', '#7c3aed', 'app:star', 37.6455, 55.7593, []],
]

function personalSync() {
  const marks = PERSONAL.map(([id, title, description, color, icon, lng, lat, groupsIds], i) => ({
    id,
    revision: i + 1,
    title,
    description,
    category: 'place',
    color,
    icon,
    isShare: false,
    isVisible: true,
    groupsIds,
    photos: [],
    geom: { Point: [lng, lat] },
  }))
  const groups = GROUPS.map((g, i) => ({ id: g.id, revision: i + 1, name: g.name, description: g.description }))
  const section = <T>(upserted: T[]) => ({ upserted, removed: [], cursor: 10, hasMore: false })
  return { sections: { personalMarks: section(marks), groups: section(groups) }, cursor: 10, hasMore: false, updateTo: 10 }
}

function comment(id: number, author: (typeof PEOPLE)[keyof typeof PEOPLE], content: string, likes: number) {
  return {
    id,
    content,
    author,
    likes,
    createdAt: minutesAgo(id * 7),
    meta: { canReply: true, haveReplies: false, repliesCount: 0, status: 'active', isLiked: false, canLike: true },
  }
}

async function setupApi(api: MockApi, context: BrowserContext) {
  api.mapMarks = MARKS.map(m => m.mark)
  const byId = new Map(MARKS.map(m => [m.mark.id, m]))
  // Мок отдаёт полную метку раньше переопределений, поэтому перехватываем выше по приоритету
  await context.route(new RegExp(`${API_BASE.replace(/\./g, '\\.')}/marks/\\d+$`), (route) => {
    const id = Number(new URL(route.request().url()).pathname.split('/').pop())
    const found = byId.get(id)
    return found ? route.fulfill({ json: fullMark(found), headers: { 'access-control-allow-origin': '*' } }) : route.fallback()
  })
  const page = <T>(items: T[], total = items.length) => ({ items, page: 1, pageSize: items.length || 1, totalPages: 1, total, hasNext: false })

  api.respond(/^\/profile\/me$/, ME_STORE)
  api.respond(/^\/profile\/\d+\/statistics\/summary$/, { markCount: 34, friendsCount: '12', subscribersCount: '87', subscriptionsCount: '41' })
  api.respond(/^\/achievement\/user\/\d+\/nearest\/?$/, { items: [4, 5, 6, 7].map(i => ({ achievement: achievement(i), current: 6, threshold: 10, progress: 60 })) })
  api.respond(/^\/achievement\/all$/, ACHIEVEMENTS.map((_, i) => achievement(i)))
  api.respond(/^\/achievement\/user\/\d+$/, page([0, 1, 2, 3].map(i => ({ ...achievement(i), achievement: achievement(i), receivedAt: minutesAgo(i * 3000) })), 4))
  api.respond(/^\/marks\/\d+\/list$/, page(MARKS.slice(0, 4).map(m => m.mark), 34))
  api.respond(/^\/1\/comments\/?$/, {
    items: [
      comment(1, PEOPLE.max, 'Классно играют, советую подойти!', 12),
      comment(2, PEOPLE.olga, 'Были вчера, атмосфера супер 🎷', 8),
      comment(3, PEOPLE.kate, 'Во сколько заканчивают?', 3),
    ],
    hasMore: false,
  })
  api.respond(/accrual\/1\/stat$/, { likes: '48', shares: '12', isLiked: true, canLike: true })
  api.respond(/^\/chats\/?$/, CHATS)
  api.respond(/^\/chats\/1\/history$/, chatHistory())
  api.respond(/^\/personal\/sync$/, personalSync())
  api.respond(/^\/group\/list$/, page(GROUPS.map(g => ({ ...g, userId: ME_STORE.userId, createdAt: minutesAgo(10000) }))))
}

// ---------- Съёмка ----------

test.beforeEach(async ({ context, api }) => {
  await installMedia(context)
  await setupApi(api, context)
})

async function ready(page: Page) {
  await expect(page.locator('.app-splash')).toHaveCount(0, { timeout: 20_000 })
}

async function shot(page: Page, name: string, settle = 1500) {
  await page.waitForTimeout(settle)
  await page.screenshot({ path: `${OUT}/${name}.png` })
}

async function openMap(page: Page) {
  await openApp(page)
  await ready(page)
  await expect(page.locator('.nearby-card').first()).toBeVisible()
  await page.waitForTimeout(3000)
}

test('01 карта с метками', async ({ page }) => {
  await openMap(page)
  await page.getByRole('button', { name: 'Отдалить' }).click()
  await shot(page, '01-map', 3000)
})

test('02 карточка метки', async ({ page }) => {
  await openMap(page)
  await page.locator('.nearby-card', { hasText: 'Уличный концерт' }).click()
  await expect(page.locator('.mark-preview__card')).toBeVisible()
  await shot(page, '02-mark-preview')
  await page.locator('.mark-preview__card').click()
  await shot(page, '02b-mark-detail', 2500)
})

test('03 3D-режим', async ({ page, context, baseURL }) => {
  // 3D-здания и деревья — опциональные слои, по умолчанию выключены
  await context.addCookies(['map_layer_buildings3d', 'map_layer_trees'].map(name => ({ name, value: 'true', url: baseURL! })))
  await openMap(page)
  await page.getByRole('button', { name: 'Приблизить' }).click()
  await page.getByRole('button', { name: 'Вид со стороны' }).first().click()
  // 3D-здания и модели достопримечательностей догружаются после анимации наклона
  await page.waitForLoadState('networkidle')
  await shot(page, '03-3d', 12_000)
})

test('04 профиль', async ({ page }) => {
  await openApp(page, '/profile/me')
  await ready(page)
  await expect(page.locator('.level-card')).toBeVisible()
  await shot(page, '04-profile')
})

test('05 чаты', async ({ page }) => {
  await openApp(page, '/chats')
  await ready(page)
  await expect(page.getByText(PEOPLE.anna.username).first()).toBeVisible()
  await shot(page, '05-chats')
  await page.getByText(PEOPLE.anna.username).first().click()
  await expect(page.locator('.bubble-row--own').first()).toBeVisible()
  await shot(page, '06-dialog')
})

test('07 места', async ({ page }) => {
  await openApp(page, '/places')
  await ready(page)
  await shot(page, '07-places', 2500)
})
