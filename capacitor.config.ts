import type { CapacitorConfig } from '@capacitor/cli'
import { readFileSync } from 'node:fs'

const config: CapacitorConfig = {
  appId: 'app.vercel.realtimemap',
  appName: JSON.parse(readFileSync('./package.json', 'utf8')).productName,
  webDir: 'dist',
}

export default config
