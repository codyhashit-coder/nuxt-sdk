/**
 * Vue 3 WebSocket Composable
 * 提供响应式的 WebSocket 接口
 */

import { computed, onUnmounted, ref } from 'vue'
import type {
  MessageHandler,
  WebSocketMessage,
  WebSocketOptions,
  WebSocketState
} from '~/sdk/types/websocket'
import { createWebSocket } from '~/sdk/websocket'

export interface UseWebSocketReturn {
  // 响应式状态
  status: Readonly<Ref<string>>
  isConnected: Readonly<Ref<boolean>>
  state: Readonly<Ref<WebSocketState>>
  
  // 连接管理
  connect: () => Promise<void>
  disconnect: () => void
  reconnect: () => void
  
  // 消息处理
  send: <T = any>(message: WebSocketMessage<T>) => boolean
  sendRaw: (data: string | ArrayBuffer | Blob) => boolean
  subscribe: <T = any>(type: string, handler: MessageHandler<T>) => string
  unsubscribe: (id: string) => boolean
  once: <T = any>(type: string, handler: MessageHandler<T>) => string
  
  // 工具方法
  ping: () => void
  checkConnection: () => boolean
}

/**
 * WebSocket Composable
 * @param options WebSocket 配置选项
 * @returns WebSocket 响应式接口
 */
export function useWebSocket(options: WebSocketOptions): UseWebSocketReturn {
  // 创建 WebSocket 实例
  const ws = createWebSocket(options)
  
  // 响应式状态
  const status = ref<string>(ws.getState().status)
  const isConnectedRef = ref<boolean>(ws.getState().isConnected)
  const state = ref<WebSocketState>(ws.getState())
  
  // 订阅列表，用于清理
  const subscriptions = ref<Set<string>>(new Set())

  // 更新状态的函数
  const updateState = () => {
    const currentState = ws.getState()
    status.value = currentState.status
    isConnectedRef.value = currentState.isConnected
    state.value = currentState
  }

  // 监听状态变化
  const stateWatcher = setInterval(updateState, 100)

  // 连接管理方法
  const connect = async () => {
    try {
      await ws.connect()
      updateState()
    } catch (error) {
      console.error('WebSocket connection failed:', error)
      throw error
    }
  }

  const disconnect = () => {
    ws.disconnect()
    updateState()
  }

  const reconnect = () => {
    ws.reconnect()
    updateState()
  }

  // 消息处理方法
  const send = <T = any>(message: WebSocketMessage<T>) => {
    const result = ws.send(message)
    updateState()
    return result
  }

  const sendRaw = (data: string | ArrayBuffer | Blob) => {
    const result = ws.sendRaw(data)
    updateState()
    return result
  }

  const subscribe = <T = any>(type: string, handler: MessageHandler<T>) => {
    const id = ws.subscribe(type, handler)
    subscriptions.value.add(id)
    return id
  }

  const unsubscribe = (id: string) => {
    const result = ws.unsubscribe(id)
    subscriptions.value.delete(id)
    return result
  }

  const once = <T = any>(type: string, handler: MessageHandler<T>) => {
    const id = ws.once(type, handler)
    subscriptions.value.add(id)
    return id
  }

  // 工具方法
  const ping = () => {
    ws.ping()
  }

  const checkConnection = () => {
    return ws.isConnected()
  }

  // 计算属性
  const computedStatus = computed(() => status.value)
  const computedIsConnected = computed(() => isConnectedRef.value)
  const computedState = computed(() => state.value)

  // 组件卸载时清理
  onUnmounted(() => {
    // 清除状态监听
    if (stateWatcher) {
      clearInterval(stateWatcher)
    }
    
    // 取消所有订阅
    subscriptions.value.forEach(id => {
      ws.unsubscribe(id)
    })
    
    // 断开连接
    ws.disconnect()
  })

  return {
    // 响应式状态
    status: computedStatus,
    isConnected: computedIsConnected,
    state: computedState,
    
    // 连接管理
    connect,
    disconnect,
    reconnect,
    
    // 消息处理
    send,
    sendRaw,
    subscribe,
    unsubscribe,
    once,
    
    // 工具方法
    ping,
    checkConnection
  }
}

/**
 * 全局 WebSocket 实例管理
 */
class WebSocketInstanceManager {
  private instances = new Map<string, UseWebSocketReturn>()

  /**
   * 获取或创建 WebSocket 实例
   */
  getInstance(key: string, options: WebSocketOptions): UseWebSocketReturn {
    if (!this.instances.has(key)) {
      const instance = useWebSocket(options)
      this.instances.set(key, instance)
    }
    return this.instances.get(key)!
  }

  /**
   * 销毁 WebSocket 实例
   */
  destroyInstance(key: string): void {
    const instance = this.instances.get(key)
    if (instance) {
      instance.disconnect()
      this.instances.delete(key)
    }
  }

  /**
   * 销毁所有实例
   */
  destroyAll(): void {
    this.instances.forEach(instance => {
      instance.disconnect()
    })
    this.instances.clear()
  }
}

// 全局管理器实例
const globalManager = new WebSocketInstanceManager()

/**
 * 获取全局 WebSocket 实例
 * @param key 实例标识符
 * @param options WebSocket 配置
 * @returns WebSocket 响应式接口
 */
export function useGlobalWebSocket(key: string, options: WebSocketOptions): UseWebSocketReturn {
  return globalManager.getInstance(key, options)
}

/**
 * 销毁全局 WebSocket 实例
 * @param key 实例标识符
 */
export function destroyWebSocket(key: string): void {
  globalManager.destroyInstance(key)
}

/**
 * 销毁所有 WebSocket 实例
 */
export function destroyAllWebSockets(): void {
  globalManager.destroyAll()
}

export default useWebSocket
