<script setup lang="ts">
import { Capacitor } from '@capacitor/core'
import { APP_NAME } from '@/components/00.shared/lib/appName'
import { downloadAndroidApp } from '@/components/02.features/app/AppUpdate'
import { useOnboarding } from '@/components/02.features/app/Onboarding/model/useOnboarding'
import { openCommunityRules } from '@/components/02.features/info/CommunityRules'
import { openPrivacyPolicy } from '@/components/02.features/info/LegalPolicy'
import { RoadmapTimeline } from '@/components/02.features/info/Roadmap'

declare const __APP_VERSION__: string

const { completeOnboarding } = useOnboarding()
const currentIndex = ref(0)

const appVersion = __APP_VERSION__
const isNative = Capacitor.isNativePlatform()

// ---------- Фон: улицы и огоньки-метки ----------

interface Street {
  id: number
  d: string
  width: number
}

interface Light {
  id: number
  x: number
  y: number
  size: number
  color: string
  duration: number
  delay: number
}

const LIGHT_COLORS = ['var(--primary-color)', '#f59e0b', '#ec4899', '#38bdf8', 'var(--primary-color)']

const streets = ref<Street[]>([])
const lights = ref<Light[]>([])

const random = (min: number, max: number) => Math.random() * (max - min) + min

onMounted(() => {
  const width = window.innerWidth
  const height = window.innerHeight

  streets.value = Array.from({ length: 14 }).map((_, i) => {
    const vertical = i % 2 === 0
    const base = vertical ? random(0, width) : random(0, height)
    const drift = random(-120, 120)
    const d = vertical
      ? `M ${base},-20 Q ${base + drift},${height / 2} ${base + drift / 2},${height + 20}`
      : `M -20,${base} Q ${width / 2},${base + drift} ${width + 20},${base + drift / 2}`
    return { id: i, d, width: random(1, i % 5 === 0 ? 6 : 3) }
  })

  lights.value = Array.from({ length: 16 }).map((_, i) => ({
    id: i,
    x: random(4, 96),
    y: random(4, 96),
    size: random(6, 12),
    color: LIGHT_COLORS[i % LIGHT_COLORS.length]!,
    duration: random(6, 11),
    delay: random(0, 10),
  }))
})

// ---------- Слайды ----------

interface Feature {
  icon: string
  title: string
  text: string
}

interface Slide {
  key: 'intro' | 'lifespan' | 'people' | 'app' | 'roadmap' | 'rules'
  accent: string
  icon: string
  title: string
  text: string
  features?: Feature[]
}

const slides: Slide[] = [
  {
    key: 'intro',
    accent: 'var(--primary-color)',
    icon: 'app:pin-wave',
    title: APP_NAME,
    text: 'Карта, на которой город светится живыми метками. Каждая метка — огонёк: событие, место или встреча прямо сейчас.',
    features: [
      { icon: 'app:pin-plus', title: 'Зажги метку', text: 'Отметь, что происходит вокруг тебя' },
      { icon: 'app:map-loop', title: 'Смотри, где светит', text: 'Метки людей рядом появляются в реальном времени' },
    ],
  },
  {
    key: 'lifespan',
    accent: '#f59e0b',
    icon: 'app:flame-loop',
    title: 'Метка светит, пока актуальна',
    text: 'Задай, сколько метке гореть. Когда событие закончится, огонёк погаснет сам — на карте только то, что происходит сейчас.',
    features: [
      { icon: 'app:gallery', title: 'Фото и описание', text: 'Покажи, что происходит, а не просто точку' },
      { icon: 'app:calendar', title: 'Время жизни', text: 'Выбери, когда метка погаснет' },
      { icon: 'app:route', title: 'Маршрут', text: 'Доберись до любой метки в пару нажатий' },
    ],
  },
  {
    key: 'people',
    accent: '#ec4899',
    icon: 'app:people-loop',
    title: 'Свет собирает людей',
    text: 'Вокруг каждой метки — люди, которым тоже интересно. Обсуждай, договаривайся о встрече, расти вместе с картой.',
    features: [
      { icon: 'app:heart', title: 'Лайки и комментарии', text: 'Поддержи метку и задай вопрос автору' },
      { icon: 'app:chat-loop', title: 'Чаты', text: 'Пиши напрямую тем, кто рядом' },
      { icon: 'app:trophy-loop', title: 'Уровни и достижения', text: 'Чем ярче ты светишь, тем выше уровень' },
    ],
  },
  {
    key: 'app',
    accent: '#38bdf8',
    icon: 'app:smartphone',
    title: 'Всегда под рукой',
    text: 'Пользуйся в браузере или установи приложение для Android — с уведомлениями и работой офлайн.',
    features: [
      { icon: 'app:bell', title: 'Android', text: 'Узнаешь о новых метках и сообщениях сразу' },
      { icon: 'app:globe-loop', title: 'Веб и PWA', text: 'Работает в любом браузере без установки' },
    ],
  },
  {
    key: 'roadmap',
    accent: '#22c55e',
    icon: 'app:rocket-loop',
    title: 'Что зажжём дальше',
    text: 'Мы активно развиваем приложение. Вот что уже в работе и что впереди.',
  },
  {
    key: 'rules',
    accent: '#ef4444',
    icon: 'app:alert-loop',
    title: 'Важная информация',
    text: 'Приложение находится в активной разработке, поэтому отдельные функции могут работать нестабильно. Мы постоянно его улучшаем и будем признательны за обратную связь.',
  },
]

const current = computed(() => slides[currentIndex.value]!)
const isLastSlide = computed(() => currentIndex.value === slides.length - 1)

async function handleNext() {
  if (isLastSlide.value)
    await completeOnboarding()
  else
    currentIndex.value++
}

function openGithub() {
  window.open('https://github.com/RealTimeMap', '_blank')
}
</script>

<template>
  <div
    class="welcome"
    :style="{ '--accent': current.accent }"
  >
    <div
      class="city"
      aria-hidden="true"
    >
      <svg class="city__streets">
        <path
          v-for="street in streets"
          :key="street.id"
          :d="street.d"
          :stroke-width="street.width"
        />
      </svg>

      <span
        v-for="light in lights"
        :key="light.id"
        class="city__light"
        :style="{
          'left': `${light.x}%`,
          'top': `${light.y}%`,
          'width': `${light.size}px`,
          'height': `${light.size}px`,
          '--light': light.color,
          'animationDuration': `${light.duration}s`,
          'animationDelay': `-${light.delay}s`,
        }"
      />
    </div>

    <div class="welcome-card">
      <div class="welcome-card__viewport">
        <transition
          name="slide-fade"
          mode="out-in"
        >
          <div
            :key="current.key"
            class="slide"
          >
            <div class="beacon">
              <span class="beacon__ring" />
              <span class="beacon__ring beacon__ring--late" />
              <div class="beacon__core">
                <u-icon
                  :icon="current.icon"
                  height="44"
                  width="44"
                />
              </div>
            </div>

            <component
              :is="current.key === 'intro' ? 'h1' : 'h2'"
              class="slide__title"
              :class="{ 'slide__title--brand': current.key === 'intro' }"
            >
              {{ current.title }}
            </component>
            <p class="slide__text">
              {{ current.text }}
            </p>

            <div
              v-if="current.features"
              class="features"
            >
              <div
                v-for="(feature, i) in current.features"
                :key="feature.title"
                class="feature"
                :style="{ animationDelay: `${0.12 + i * 0.08}s` }"
              >
                <div class="feature__icon">
                  <u-icon
                    :icon="feature.icon"
                    height="20"
                    width="20"
                  />
                </div>
                <div class="feature__text">
                  <strong>{{ feature.title }}</strong>
                  <span>{{ feature.text }}</span>
                </div>
              </div>
            </div>

            <template v-if="current.key === 'app'">
              <div class="version-badge">
                Текущая версия · v{{ appVersion }}
              </div>

              <button
                v-if="!isNative"
                type="button"
                class="download-btn"
                @click="downloadAndroidApp"
              >
                <u-icon
                  icon="app:download"
                  height="18"
                  width="18"
                />
                Скачать для Android
              </button>
            </template>

            <roadmap-timeline
              v-if="current.key === 'roadmap'"
              compact
            />

            <template v-if="current.key === 'rules'">
              <ul class="rules">
                <li>
                  Нажимая «Открыть карту», вы подтверждаете, что ознакомлены и согласны с
                  <button
                    type="button"
                    class="rules__link"
                    @click="openCommunityRules()"
                  >
                    Правилами сообщества
                  </button>
                  и
                  <button
                    type="button"
                    class="rules__link"
                    @click="openPrivacyPolicy()"
                  >
                    Политикой конфиденциальности
                  </button>.
                </li>
                <li>Не передавайте доступ к аккаунту третьим лицам.</li>
              </ul>

              <button
                type="button"
                class="github-btn"
                @click="openGithub"
              >
                <u-icon
                  icon="app:github"
                  height="16"
                  width="16"
                />
                Исходный код на GitHub
              </button>
            </template>
          </div>
        </transition>
      </div>

      <div class="welcome-card__footer">
        <div
          class="dots"
          role="tablist"
        >
          <button
            v-for="(slide, i) in slides"
            :key="slide.key"
            type="button"
            role="tab"
            class="dots__item"
            :class="{ 'dots__item--active': i === currentIndex, 'dots__item--passed': i < currentIndex }"
            :aria-selected="i === currentIndex"
            :aria-label="`Слайд ${i + 1}`"
            @click="currentIndex = i"
          />
        </div>

        <button
          type="button"
          class="button primary action-btn"
          @click="handleNext"
        >
          {{ isLastSlide ? 'Открыть карту' : 'Далее' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.welcome {
  --accent: var(--primary-color);

  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  padding: calc(16px + var(--safe-top)) calc(16px + var(--safe-right)) calc(16px + var(--safe-bottom))
    calc(16px + var(--safe-left));
  overflow: hidden;
  background:
    radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 60%),
    var(--bg-body);
  transition: background 0.6s ease;
}

/* --- Фон: город с огоньками --- */
.city {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;

  &__streets {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;

    path {
      fill: none;
      stroke: var(--text-color);
      stroke-linecap: round;
      opacity: 0.06;
    }
  }

  &__light {
    position: absolute;
    border-radius: 50%;
    background: var(--light);
    box-shadow:
      0 0 12px 3px color-mix(in srgb, var(--light) 60%, transparent),
      0 0 32px 8px color-mix(in srgb, var(--light) 25%, transparent);
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
    animation: light-life ease-in-out infinite;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      border: 1.5px solid var(--light);
      animation: light-ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
  }
}

@keyframes light-life {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
  }
  12% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.15);
  }
  20%,
  70% {
    opacity: 0.9;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.4);
  }
}

@keyframes light-ping {
  from {
    transform: scale(1);
    opacity: 0.7;
  }
  to {
    transform: scale(3.4);
    opacity: 0;
  }
}

/* --- Карточка --- */
.welcome-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 440px;
  height: 660px;
  max-height: 90vh;
  border-radius: 32px;
  background: var(--glass-background);
  border: 1px solid var(--border-subtle);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow:
    0 24px 48px rgba(0, 0, 0, 0.2),
    0 0 0 1px color-mix(in srgb, var(--accent) 10%, transparent);
  transition: box-shadow 0.6s ease;

  &__viewport {
    position: relative;
    flex: 1;
    overflow: hidden;
  }

  &__footer {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 12px 24px 24px;
  }
}

/* --- Слайд --- */
.slide {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 44px 24px 8px;
  text-align: center;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &__title {
    margin: 0 0 10px;
    font-size: 24px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--text-color);

    &--brand {
      font-size: 34px;
      letter-spacing: -1px;
      background: linear-gradient(120deg, var(--text-color) 30%, var(--accent));
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  }

  &__text {
    margin: 0 0 24px;
    font-size: 15px;
    line-height: 1.55;
    color: var(--text-color);
    opacity: 0.72;
  }
}

/* --- Маяк-метка --- */
.beacon {
  position: relative;
  flex-shrink: 0;
  width: 96px;
  height: 96px;
  margin-bottom: 22px;

  &__core {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, var(--bg-block-solid));
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--accent) 30%, transparent),
      0 0 36px 4px color-mix(in srgb, var(--accent) 35%, transparent);
    animation: beacon-glow 2.6s ease-in-out infinite;
  }

  &__ring {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid var(--accent);
    opacity: 0;
    animation: beacon-ring 2.6s cubic-bezier(0, 0, 0.2, 1) infinite;

    &--late {
      animation-delay: 1.3s;
    }
  }
}

@keyframes beacon-glow {
  50% {
    box-shadow:
      0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent),
      0 0 52px 10px color-mix(in srgb, var(--accent) 45%, transparent);
  }
}

@keyframes beacon-ring {
  from {
    transform: scale(1);
    opacity: 0.6;
  }
  to {
    transform: scale(1.6);
    opacity: 0;
  }
}

/* --- Возможности --- */
.features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  text-align: left;
}

.feature {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 16px;
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
  animation: feature-in 0.4s ease both;

  &__icon {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border-radius: 12px;
    color: var(--accent);
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    font-size: 13px;

    strong {
      color: var(--text-color);
    }

    span {
      color: var(--text-color);
      opacity: 0.7;
    }
  }
}

@keyframes feature-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

/* --- Слайд приложения --- */
.version-badge {
  margin-top: 18px;
  padding: 8px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  background: var(--surface-subtle);
  border: 1px solid var(--border-subtle);
}

.download-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 12px 20px;
  border: none;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  box-shadow: 0 8px 20px color-mix(in srgb, var(--accent) 40%, transparent);
  cursor: pointer;
}

/* --- Правила --- */
.rules {
  width: 100%;
  margin: 0 0 20px;
  padding-left: 20px;
  text-align: left;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color);

  li {
    margin-bottom: 8px;
    opacity: 0.8;
  }

  &__link {
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    font-weight: 600;
    color: var(--primary-color);
    text-decoration: underline;
    cursor: pointer;
  }
}

.github-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  opacity: 0.6;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

/* --- Футер --- */
.dots {
  display: flex;
  justify-content: center;
  gap: 8px;

  &__item {
    width: 8px;
    height: 8px;
    padding: 0;
    border: none;
    border-radius: 999px;
    background: var(--border-subtle);
    cursor: pointer;
    transition:
      width 0.3s ease,
      background 0.3s ease;

    &--passed {
      background: color-mix(in srgb, var(--accent) 45%, transparent);
    }

    &--active {
      width: 24px;
      background: var(--accent);
      box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 60%, transparent);
    }
  }
}

.action-btn {
  width: 100%;
  height: 52px;
  font-size: 16px;
  font-weight: 600;
}

/* --- Переходы --- */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}

.slide-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-fade-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

@media (prefers-reduced-motion: reduce) {
  .city__light,
  .city__light::after,
  .beacon__core,
  .beacon__ring,
  .feature {
    animation: none;
  }

  .city__light {
    opacity: 0.8;
    transform: translate(-50%, -50%);
  }
}
</style>
