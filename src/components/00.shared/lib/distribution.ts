import { Capacitor, registerPlugin } from '@capacitor/core'

/** Канал, через который установлено приложение: от него зависит, можем ли мы обновляться сами */
export type Distribution = 'web' | 'ios' | 'github' | 'rustore'

interface DistributionPlugin {
  get: () => Promise<{ store: Distribution }>
}

const DistributionNative = registerPlugin<DistributionPlugin>('Distribution')

let cached: Promise<Distribution> | null = null

export function getDistribution(): Promise<Distribution> {
  cached ??= resolveDistribution()
  return cached
}

async function resolveDistribution(): Promise<Distribution> {
  const platform = Capacitor.getPlatform()
  if (platform !== 'android')
    return platform === 'ios' ? 'ios' : 'web'

  try {
    return (await DistributionNative.get()).store
  }
  catch {
    return 'github'
  }
}
