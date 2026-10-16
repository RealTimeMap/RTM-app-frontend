import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

/** Скриншоты для витрины RuStore: 1080×1920 (9:16), без системных элементов Android. */
export default defineConfig({
  ...base,
  testDir: './store',
  outputDir: './test-results/store',
  timeout: 90_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    ...base.use,
    ...devices['Pixel 7'],
    viewport: { width: 432, height: 768 },
    deviceScaleFactor: 2.5,
    trace: 'off',
  },
})
