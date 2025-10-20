/**
 * WebSocket Pinia Store
 * 管理 WebSocket 连接状态和消息
 */

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type {
  MessageHandler,
  WebSocketInstance,
  WebSocketMessage,
  WebSocketOptions,
  WebSocketState
} from '../types/websocket'
import { createWebSocket } from '../websocket'

export interface WebSocketConnection {
  id: string
  url: string
  status: string
  isConnected: boolean
  state: WebSocketState
  subscriptions: Map<string, string>
  lastMessage: WebSocketMessage | null
  messageHistory: WebSocketMessage[]
  error: Error | null
  options: WebSocketOptions  // 添加 options 属性
  instance: WebSocketInstance | null  // 添加 WebSocket 实例引用
}

export const useWebSocketStore = defineStore('websocket', () => {
  // 状态
  const connections = ref<Map<string, WebSocketConnection>>(new Map())
  const globalMessageHistory = ref<WebSocketMessage[]>([])
  const maxHistorySize = ref(100)

  // 计算属性
  const connectedCount = computed(() => {
    return Array.from(connections.value.values()).filter(conn => conn.isConnected).length
  })

  const totalConnections = computed(() => connections.value.size)

  const allConnections = computed(() => {
    // 修复：移除重复的 id，直接返回 conn 即可（conn 已包含 id）
    return Array.from(connections.value.values())
  })

  // 连接管理方法
  const createConnection = (id: string, options: WebSocketOptions) => {
    if (connections.value.has(id)) {
      console.warn(`WebSocket connection ${id} already exists`)
      return connections.value.get(id)!
    }

    const ws = createWebSocket(options)
    
    const connection: WebSocketConnection = {
      id,
      url: options.url,
      status: 'disconnected',
      isConnected: false,
      state: ws.getState(),
      subscriptions: new Map(),
      lastMessage: null,
      messageHistory: [],
      error: null,
      options,  // 保存 options
      instance: ws  // 保存 WebSocket 实例
    }

    // 设置连接事件处理器
    const enhancedOptions: WebSocketOptions = {
      ...options,
      onConnect: () => {
        connection.status = 'connected'
        connection.isConnected = true
        connection.state = ws.getState()
        connection.error = null
        options.onConnect?.()
      },
      onDisconnect: () => {
        connection.status = 'disconnected'
        connection.isConnected = false
        connection.state = ws.getState()
        options.onDisconnect?.()
      },
      onError: (error: Event) => {
        connection.status = 'error'
        connection.isConnected = false
        connection.error = new Error('WebSocket error')
        connection.state = ws.getState()
        options.onError?.(error)
      },
      onMessage: (message: WebSocketMessage) => {
        connection.lastMessage = message
        connection.messageHistory.push(message)
        
        // 限制历史消息数量
        if (connection.messageHistory.length > maxHistorySize.value) {
          connection.messageHistory.shift()
        }

        // 添加到全局历史
        globalMessageHistory.value.push(message)
        if (globalMessageHistory.value.length > maxHistorySize.value) {
          globalMessageHistory.value.shift()
        }

        connection.state = ws.getState()
        options.onMessage?.(message)
      }
    }

    // 更新连接的 options
    connection.options = enhancedOptions

    connections.value.set(id, connection)
    return connection
  }

  const connect = async (id: string, options: WebSocketOptions) => {
    let connection = connections.value.get(id)
    
    // 如果连接不存在，先创建
    if (!connection) {
      connection = createConnection(id, options)
    }
    
    // 使用保存的实例
    const ws = connection.instance || createWebSocket(connection.options)
    connection.instance = ws
    
    try {
      await ws.connect()
      connection.status = 'connected'
      connection.isConnected = true
      connection.state = ws.getState()
      connection.error = null
    } catch (error) {
      connection.status = 'error'
      connection.isConnected = false
      connection.error = error as Error
      connection.state = ws.getState()
      throw error
    }
  }

  const disconnect = (id: string) => {
    const connection = connections.value.get(id)
    if (connection && connection.instance) {
      connection.instance.disconnect()
      connection.status = 'disconnected'
      connection.isConnected = false
      connection.state = connection.instance.getState()
    }
  }

  const reconnect = (id: string) => {
    const connection = connections.value.get(id)
    if (connection && connection.instance) {
      connection.instance.reconnect()
      connection.status = 'reconnecting'
      connection.isConnected = false
      connection.state = connection.instance.getState()
    }
  }

  const removeConnection = (id: string) => {
    const connection = connections.value.get(id)
    if (connection) {
      // 断开连接
      if (connection.instance) {
        connection.instance.disconnect()
      }
      
      // 移除订阅
      connection.subscriptions.clear()
      
      // 从状态中移除
      connections.value.delete(id)
    }
  }

  // 消息管理方法
  const sendMessage = <T = any>(id: string, message: WebSocketMessage<T>) => {
    const connection = connections.value.get(id)
    if (!connection) {
      console.error(`WebSocket connection ${id} not found`)
      return false
    }

    if (!connection.isConnected) {
      console.error(`WebSocket connection ${id} is not connected`)
      return false
    }

    if (!connection.instance) {
      console.error(`WebSocket instance for connection ${id} not found`)
      return false
    }

    const result = connection.instance.send(message)
    
    if (result) {
      connection.state = connection.instance.getState()
    }
    
    return result
  }

  const sendRawMessage = (id: string, data: string | ArrayBuffer | Blob) => {
    const connection = connections.value.get(id)
    if (!connection || !connection.instance) {
      console.error(`WebSocket connection ${id} not found`)
      return false
    }

    const result = connection.instance.sendRaw(data)
    
    if (result) {
      connection.state = connection.instance.getState()
    }
    
    return result
  }

  const subscribe = <T = any>(id: string, type: string, handler: MessageHandler<T>) => {
    const connection = connections.value.get(id)
    if (!connection || !connection.instance) {
      console.error(`WebSocket connection ${id} not found`)
      return ''
    }

    const subscriptionId = connection.instance.subscribe(type, handler)
    connection.subscriptions.set(subscriptionId, type)
    
    return subscriptionId
  }

  const unsubscribe = (id: string, subscriptionId: string) => {
    const connection = connections.value.get(id)
    if (!connection || !connection.instance) {
      console.error(`WebSocket connection ${id} not found`)
      return false
    }

    const result = connection.instance.unsubscribe(subscriptionId)
    
    if (result) {
      connection.subscriptions.delete(subscriptionId)
    }
    
    return result
  }

  // 工具方法
  const getConnection = (id: string) => {
    return connections.value.get(id)
  }

  const getConnectionState = (id: string) => {
    const connection = connections.value.get(id)
    return connection?.state
  }

  const isConnected = (id: string) => {
    const connection = connections.value.get(id)
    return connection?.isConnected ?? false
  }

  const getMessageHistory = (id?: string) => {
    if (id) {
      const connection = connections.value.get(id)
      return connection?.messageHistory ?? []
    }
    return globalMessageHistory.value
  }

  const clearMessageHistory = (id?: string) => {
    if (id) {
      const connection = connections.value.get(id)
      if (connection) {
        connection.messageHistory = []
      }
    } else {
      globalMessageHistory.value = []
    }
  }

  const setMaxHistorySize = (size: number) => {
    maxHistorySize.value = size
  }

  // 批量操作
  const connectAll = async () => {
    const promises = Array.from(connections.value.entries()).map(([id, connection]) => {
      return connect(id, connection.options)
    })
    return Promise.allSettled(promises)
  }

  const disconnectAll = () => {
    connections.value.forEach((_, id) => {
      disconnect(id)
    })
  }

  const removeAllConnections = () => {
    connections.value.forEach((_, id) => {
      removeConnection(id)
    })
  }

  return {
    // 状态
    connections,
    globalMessageHistory,
    maxHistorySize,
    
    // 计算属性
    connectedCount,
    totalConnections,
    allConnections,
    
    // 连接管理
    createConnection,
    connect,
    disconnect,
    reconnect,
    removeConnection,
    
    // 消息管理
    sendMessage,
    sendRawMessage,
    subscribe,
    unsubscribe,
    
    // 工具方法
    getConnection,
    getConnectionState,
    isConnected,
    getMessageHistory,
    clearMessageHistory,
    setMaxHistorySize,
    
    // 批量操作
    connectAll,
    disconnectAll,
    removeAllConnections
  }
})

export default useWebSocketStore