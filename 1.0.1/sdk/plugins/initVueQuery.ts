// sdk/composables/initVueQuery.ts
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { App } from 'vue'

export function initVueQuery(app: App) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5000 },
    },
  })

  app.use(VueQueryPlugin, {
    queryClient,
    enableDevtoolsV6Plugin: true,
  })

  return queryClient
}
