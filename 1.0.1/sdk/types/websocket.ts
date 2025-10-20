/**
 * WebSocket 相关类型定义
 */

// WebSocket 连接状态
export type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error'

// WebSocket 事件类型
export type WebSocketEventType = 'open' | 'close' | 'error' | 'message'

// 消息类型
export interface WebSocketMessage<T = any> {
  type: string
  data: T
  timestamp?: number
  id?: string
}

// WebSocket 配置选项
export interface WebSocketOptions {
  // 基础配置
  url: string
  protocols?: string | string[],
  
  // 重连配置
  reconnect?: boolean
  reconnectAttempts?: number
  reconnectInterval?: number
  maxReconnectInterval?: number
  reconnectDecay?: number
  
  // 心跳配置
  heartbeat?: boolean
  heartbeatInterval?: number
  heartbeatMessage?: string | WebSocketMessage
  
  // 消息队列配置
  messageQueue?: boolean
  maxQueueSize?: number
  
  // 错误处理
  onError?: (error: Event) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onReconnect?: (attempt: number) => void
  onMessage?: (message: WebSocketMessage) => void
  
  // 调试
  debug?: boolean
}

// WebSocket 连接状态信息
export interface WebSocketState {
  status: WebSocketStatus
  isConnected: boolean
  reconnectAttempts: number
  lastError: Error | null
  connectionTime: number | null
  messagesReceived: number
  messagesSent: number
}

// 消息处理器类型
export type MessageHandler<T = any> = (message: WebSocketMessage<T>) => void | Promise<void>

// 消息订阅器
export interface MessageSubscription {
  id: string
  type: string
  handler: MessageHandler
  once?: boolean
}

// WebSocket 实例接口
export interface WebSocketInstance {
  // 连接管理
  connect(): Promise<void>
  disconnect(): void
  reconnect(): void
  
  // 消息发送
  send<T = any>(message: WebSocketMessage<T>): boolean
  sendRaw(data: string | ArrayBuffer | Blob): boolean
  
  // 消息订阅
  subscribe<T = any>(type: string, handler: MessageHandler<T>): string
  unsubscribe(id: string): boolean
  once<T = any>(type: string, handler: MessageHandler<T>): string
  
  // 状态管理
  getState(): WebSocketState
  
  // 工具方法
  isConnected(): boolean
  ping(): void
}
