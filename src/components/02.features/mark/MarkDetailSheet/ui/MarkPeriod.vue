<script setup lang="ts">
import { pluralize } from '@/components/00.shared/lib/date/FormatDate'

const props = defineProps<{
  date: {
    startAt: string
    endAt: string
    progressPercent: number
    daysPassed: number
    daysLeft: number
  }
  meta: {
    status: string
  }
}>()

const DAY_TITLES: [string, string, string] = ['день', 'дня', 'дней']
const isMultiDayPeriod = computed(() => (props.date.daysPassed + props.date.daysLeft) > 0)

const ENDED_STATUSES = new Set(['ended', 'expired', 'finished', 'inactive'])
const isEnded = computed(() => {
  const endAt = Date.parse(props.date.endAt)
  return ENDED_STATUSES.has(props.meta.status.toLowerCase()) || (Number.isFinite(endAt) && endAt <= Date.now())
})

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).replace(' г.', '')
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="period-block">
    <div class="period-block__header">
      <u-icon
        icon="app:calendar"
        class="header-icon"
      />
      <span class="label-text">ПЕРИОД АКТИВНОСТИ</span>
      <transition
        name="status-swap"
        mode="out-in"
      >
        <span
          :key="isEnded ? 'ended' : 'active'"
          class="status-pill"
          :class="isEnded ? 'status-pill--ended' : 'status-pill--active'"
        >
          <u-icon
            v-if="isEnded"
            icon="app:check"
            class="status-pill__check"
          />
          <span
            v-else
            class="status-pill__dot"
          />
          {{ isEnded ? 'Завершилась' : 'Активна' }}
        </span>
      </transition>
    </div>

    <div class="period-block__content">
      <div class="activity-row">
        <div class="time-info">
          <span class="time-info__label">НАЧАЛО</span>
          <span class="time-info__date">{{ formatDate(date.startAt) }}</span>
          <span class="time-info__time">{{ formatTime(date.startAt) }}</span>
        </div>

        <div class="custom-progress">
          <div class="glow-dot" />
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${date.progressPercent}%` }"
            />
          </div>
          <div class="end-ring" />
        </div>

        <div class="time-info end">
          <span class="time-info__label">КОНЕЦ</span>
          <span class="time-info__date">{{ formatDate(date.endAt) }}</span>
          <span class="time-info__time">{{ formatTime(date.endAt) }}</span>
        </div>
      </div>
    </div>

    <template v-if="isMultiDayPeriod">
      <u-drawer />
      <div class="period-block__footer">
        <div class="footer-stats">
          <span class="footer-stats__text">Прошло: </span>
          <span class="footer-stats__value">{{ pluralize(date.daysPassed, DAY_TITLES) }}</span>
        </div>
        <div class="footer-stats">
          <span class="footer-stats__text">Осталось: </span>
          <span class="footer-stats__value primary">{{ pluralize(date.daysLeft, DAY_TITLES) }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.period-block {
  @include glass-panel(16px, 14px, true, false);
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__header {
    display: flex;
    align-items: center;
    gap: 10px;

    .header-icon {
      color: var(--primary-color);
      width: 18px;
      height: 18px;
    }

    .label-text {
      @include label-text();
    }
  }
}

.status-pill {
  --tone: var(--access-color);

  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--tone);
  background: color-mix(in srgb, var(--tone) 14%, transparent);
  border: 0.5px solid color-mix(in srgb, var(--tone) 35%, transparent);

  &--ended {
    --tone: var(--text-color-muted);
  }

  &__dot {
    position: relative;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--tone);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: inherit;
      background: var(--tone);
      animation: status-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;
    }
  }

  &__check {
    width: 12px;
    height: 12px;
    animation: status-check 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }
}

.status-swap-enter-active,
.status-swap-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.status-swap-enter-from,
.status-swap-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

@keyframes status-ping {
  75%,
  100% {
    transform: scale(2.6);
    opacity: 0;
  }
}

@keyframes status-check {
  from {
    transform: scale(0) rotate(-45deg);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .status-pill__dot::after,
  .status-pill__check {
    animation: none;
  }
}

.activity-row {
  display: flex;
  justify-content: space-between;
  gap: 14px;
}

.time-info {
  display: flex;
  flex-direction: column;
  min-width: max-content;

  &.end {
    align-items: flex-end;
    text-align: right;
  }

  &__label {
    @include label-text(8px);
    margin-bottom: 6px;
    letter-spacing: 1px;
  }

  &__date {
    @include value-text(14px);
  }

  &__time {
    font-size: 13px;
    color: var(--text-color-muted);
    margin-top: 2px;
    font-weight: 500;
  }
}

.custom-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;

  .glow-dot {
    width: 7px;
    height: 7px;
    background: var(--primary-color);
    border-radius: 50%;
    box-shadow: 0 0 15px 2px color-mix(in srgb, var(--primary-color) 50%, transparent);
  }

  .progress-track {
    flex-grow: 1;
    height: 4px;
    background: var(--surface-subtle);
    border-radius: 10px;
    position: relative;
  }

  .progress-fill {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    background: var(--primary-color);
    border-radius: 10px;
  }

  .end-ring {
    width: 8px;
    height: 8px;
    border: 2px solid var(--border-subtle);
    background: transparent;
    border-radius: 50%;
  }
}

.period-block__footer {
  display: flex;
  justify-content: space-between;
  padding-top: 4px;
}

.footer-stats {
  font-size: 13px;
  &__text {
    color: var(--text-color-muted);
  }
  &__value {
    color: var(--text-color);
    font-weight: 700;
    &.primary {
      color: var(--primary-color);
    }
  }
}
</style>
