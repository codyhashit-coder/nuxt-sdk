export interface AnalyticsEvent {
  eventName: string
  data: Record<string, any>
  timestamp: number
  url: string
  userAgent: string
  sessionId: string
}

export interface AnalyticsOptions {
  uploadUrl?: string
  uploadInterval?: number
  maxBatchSize?: number
  enabled?: boolean
}

class AnalyticsService {
  private uploadUrl: string
  private uploadInterval: number
  private maxBatchSize: number
  private queue: AnalyticsEvent[] = []
  private timer: NodeJS.Timeout | null = null
  private isUploading = false
  private sessionId: string = ''
  private enabled: boolean

  constructor(options: AnalyticsOptions = {}) {
    this.uploadUrl = options.uploadUrl || '/api/analytics'
    this.uploadInterval = options.uploadInterval || 60000
    this.maxBatchSize = options.maxBatchSize || 100
    this.enabled = options.enabled !== false
    
    if (this.enabled) {
      this.init()
    }
  }

  private init() {
    this.sessionId = this.getSessionId()
    this.startAutoUpload()

    // 页面卸载前上传
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload)
      document.addEventListener('visibilitychange', this.handleVisibilityChange)
    }
  }

  private handleBeforeUnload = () => {
    this.uploadImmediately()
  }

  private handleVisibilityChange = () => {
    if (document.hidden && this.queue.length > 0) {
      this.uploadImmediately()
    }
  }

  track(eventName: string, data: Record<string, any> = {}) {
    if (!this.enabled) return

    const event: AnalyticsEvent = {
      eventName,
      data,
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      sessionId: this.sessionId
    }
    this.queue.push(event)

    // 队列满时立即上传
    if (this.queue.length >= this.maxBatchSize) {
      this.upload()
    }
  }

  private startAutoUpload() {
    if (this.timer) {
      clearInterval(this.timer)
    }

    this.timer = setInterval(() => {
      if (this.queue.length > 0) {
        this.upload()
      }
    }, this.uploadInterval)
  }

  private async upload() {
    if (this.isUploading || this.queue.length === 0) return

    this.isUploading = true
    const dataToUpload = this.queue.splice(0, this.maxBatchSize)

    try {
      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: dataToUpload,
          uploadTime: Date.now()
        }),
        keepalive: true
      })

      if (!response.ok) {
        this.queue.unshift(...dataToUpload)
        console.error('Analytics upload failed:', response.status)
      } else {
        console.log(`✅ Uploaded ${dataToUpload.length} analytics events`)
      }
    } catch (error) {
      this.queue.unshift(...dataToUpload)
      console.error('Analytics upload error:', error)
    } finally {
      this.isUploading = false
    }
  }

  private uploadImmediately() {
    if (this.queue.length === 0) return

    const data = JSON.stringify({
      events: this.queue,
      uploadTime: Date.now()
    })

    const blob = new Blob([data], { type: 'application/json' })
    
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon(this.uploadUrl, blob)
    }

    this.queue = []
  }

  private getSessionId(): string {
    if (typeof sessionStorage === 'undefined') return 'ssr-session'
    
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }

  destroy() {
    if (this.timer) {
      clearInterval(this.timer)
    }
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload)
      document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    }
    
    this.uploadImmediately()
  }
}

// 单例实例
let analyticsInstance: AnalyticsService | null = null
export function useAnalytics(options?: AnalyticsOptions) {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService(options)
  }

  // 组件卸载时不销毁全局实例
  // 只在应用卸载时调用 destroy

  const track = (eventName: string, data?: Record<string, any>) => {
    analyticsInstance?.track(eventName, data)
  }

  return {
    track
  }
}

// 导出实例以便手动销毁
export function destroyAnalytics() {
  analyticsInstance?.destroy()
  analyticsInstance = null
}