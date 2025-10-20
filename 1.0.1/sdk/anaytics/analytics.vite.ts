import type { App } from 'vue'
import { vTrack } from '~/sdk/directives/track'
import { useAnalytics } from '~/sdk/anaytics/useAnalytics'

export interface AnalyticsOptions {
  uploadUrl: string
  uploadInterval?: number
  maxBatchSize?: number
  enabled?: boolean
}

/**
 * 初始化埋点服务（传入 app 实例）
 */
export function setupAnalytics(app: App, options: AnalyticsOptions) {
  // 防止重复注册
  if ((window as any).__analytics_inited__) return
  (window as any).__analytics_inited__ = true

  // 初始化埋点服务
  const { track } = useAnalytics({
    uploadUrl: options.uploadUrl,
    uploadInterval: options.uploadInterval ?? 60000,
    maxBatchSize: options.maxBatchSize ?? 100,
    enabled: options.enabled ?? true
  })

  // 全局挂载方法
  app.config.globalProperties.$track = track
  app.provide('track', track)

  // 注册全局指令
  app.directive('track', vTrack)
}
