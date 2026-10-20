<script setup lang="ts">
import { TELEGRAM_CHANNEL_URL } from '@/components/00.shared/lib/links'
import { openBugReport } from '@/components/02.features/app/BugReport'
import { openCommunityRules } from '@/components/02.features/info/CommunityRules'
import { openPrivacyPolicy } from '@/components/02.features/info/LegalPolicy'
import { openRoadmap } from '@/components/02.features/info/Roadmap'
import SettingsRow from '../kit/SettingsRow.vue'
import SettingsSection from '../kit/SettingsSection.vue'

function openTelegram() {
  window.open(TELEGRAM_CHANNEL_URL, '_blank')
}
</script>

<template>
  <settings-section title="О приложении">
    <settings-row
      link
      label="Наш Telegram-канал"
      hint="Новости, обновления и обсуждение"
      @click="openTelegram()"
    />

    <settings-row
      link
      label="Дорожная карта"
      hint="Что уже в работе и что в планах"
      @click="openRoadmap()"
    />

    <settings-row
      link
      label="Сообщить о баге"
      hint="Опишите проблему — приложим логи и данные устройства"
      @click="openBugReport()"
    />

    <settings-row
      link
      label="Правила сообщества"
      hint="Как пользоваться метками, чатами и картой"
      @click="openCommunityRules()"
    />

    <settings-row
      link
      label="Политика конфиденциальности"
      hint="Обработка персональных данных (152-ФЗ)"
      @click="openPrivacyPolicy()"
    />
  </settings-section>
</template>
