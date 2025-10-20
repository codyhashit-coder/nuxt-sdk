// sdk/composables/initWagmi.ts
import { WagmiPlugin } from '@wagmi/vue'
import type { App } from 'vue'
import { wagmiAdapter } from '~/sdk/config/appkit'

export function initWagmi(app: App) {
  app.use(WagmiPlugin, { config: wagmiAdapter.wagmiConfig })
}
