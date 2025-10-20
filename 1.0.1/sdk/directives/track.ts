import type { Directive } from 'vue'
import { useAnalytics } from '~/sdk/anaytics/useAnalytics'

export interface TrackBinding {
  event: string
  data?: Record<string, any>
  on?: string | string[] // 支持的事件类型
}

export const vTrack: Directive<HTMLElement, TrackBinding | string> = {
  mounted(el, binding) {
    const { track } = useAnalytics()
    
    // 解析配置
    let eventName: string
    let eventData: Record<string, any> = {}
    let eventTypes: string[] = ['click'] // 默认监听 click
    
    if (typeof binding.value === 'string') {
      eventName = binding.value
    } else {
      eventName = binding.value.event
      eventData = binding.value.data || {}
      
      // 支持自定义事件类型
      if (binding.value.on) {
        eventTypes = Array.isArray(binding.value.on) 
          ? binding.value.on 
          : [binding.value.on]
      }
    }
    
    // 创建事件处理器
    const handleEvent = (e: Event) => {
      // 合并事件信息到 data
      const combinedData = {
        ...eventData,
        eventType: e.type,
        targetTag: (e.target as HTMLElement)?.tagName,
        targetText: (e.target as HTMLElement)?.textContent?.substring(0, 50)
      }
      
      track(eventName, combinedData)
    }
    
    // 绑定所有指定的事件
    eventTypes.forEach(eventType => {
      el.addEventListener(eventType, handleEvent)
    })
    
    // 保存引用以便卸载
    ;(el as any)._trackHandlers = {
      handler: handleEvent,
      eventTypes
    }
  },
  
  unmounted(el) {
    const handlers = (el as any)._trackHandlers
    if (handlers) {
      handlers.eventTypes.forEach((eventType: string) => {
        el.removeEventListener(eventType, handlers.handler)
      })
      delete (el as any)._trackHandlers
    }
  }
}
