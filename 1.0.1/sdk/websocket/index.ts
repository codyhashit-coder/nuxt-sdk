/**
 * 高性能 WebSocket 封装
 * 支持自动重连、心跳检测、消息队列、错误处理等功能
 */

import type {
  MessageHandler,
  MessageSubscription,
  WebSocketInstance,
  WebSocketMessage,
  WebSocketOptions,
  WebSocketState,
  WebSocketStatus
} from '~/sdk/types/websocket'

export class WebSocketManager implements WebSocketInstance {
  private ws: WebSocket | null = null
  private options: Required<WebSocketOptions>
  private state: WebSocketState
  private subscriptions: Map<string, MessageSubscription> = new Map()
  private messageQueue: WebSocketMessage[] = []
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private isDestroyed = false

  constructor(options: WebSocketOptions) {
    // 合并默认配置
    this.options = {
      protocols: [],
      reconnect: true,
      reconnectAttempts: 5,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      heartbeat: true,
      heartbeatInterval: 30000,
      heartbeatMessage: JSON.stringify({ type: 'ping', data: {} }),
      messageQueue: true,
      maxQueueSize: 100,
      onError: () => {},
      onConnect: () => {},
      onDisconnect: () => {},
      onReconnect: () => {},
      onMessage: () => {},
      debug: false,
      ...options
    }

    // 初始化状态
    this.state = {
      status: 'disconnected',
      isConnected: false,
      reconnectAttempts: 0,
      lastError: null,
      connectionTime: null,
      messagesReceived: 0,
      messagesSent: 0
    }

    this.log('WebSocketManager initialized', this.options)
  }

  /**
   * 连接到 WebSocket 服务器
   */
  async connect(): Promise<void> {
    if (this.isDestroyed) {
      throw new Error('WebSocketManager has been destroyed')
    }

    if (this.state.isConnected) {
      this.log('Already connected')
      return
    }

    return new Promise((resolve, reject) => {
      try {
        this.setState('connecting')
        this.log('Connecting to:', this.options.url)

        this.ws = new WebSocket(this.options.url, this.options.protocols)
        
        // 连接成功
        this.ws.onopen = (event) => {
          this.log('Connected successfully',event)
          this.setState('connected')
          this.state.connectionTime = Date.now()
          this.state.reconnectAttempts = 0
          this.startHeartbeat()
          this.processMessageQueue()
          this.options.onConnect()
          resolve()
        }

        // 接收消息
        this.ws.onmessage = (event) => {
          this.handleMessage(event)
        }

        // 连接关闭
        this.ws.onclose = (event) => {
          this.log('Connection closed:', event.code, event.reason)
          this.setState('disconnected')
          this.stopHeartbeat()
          this.options.onDisconnect()

          // 自动重连
          if (this.options.reconnect && !this.isDestroyed) {
            this.scheduleReconnect()
          }
        }

        // 连接错误
        this.ws.onerror = (event) => {
          this.log('Connection error:', event)
          this.state.lastError = new Error('WebSocket connection error')
          this.setState('error')
          this.options.onError(event)
          reject(new Error('WebSocket connection failed'))
        }

      } catch (error) {
        this.log('Connection failed:', error)
        this.state.lastError = error as Error
        this.setState('error')
        reject(error)
      }
    })
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.log('Disconnecting...')
    this.isDestroyed = true
    this.options.reconnect = false
    this.stopHeartbeat()
    this.clearReconnectTimer()

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect')
      this.ws = null
    }

    this.setState('disconnected')
  }

  /**
   * 重新连接
   */
  reconnect(): void {
    if (this.state.isConnected) {
      this.disconnect()
    }
    
    this.isDestroyed = false
    this.options.reconnect = true
    this.connect()
  }

  /**
   * 发送消息
   */
  send<T = any>(message: WebSocketMessage<T>): boolean {
    if (!this.state.isConnected || !this.ws) {
      if (this.options.messageQueue && this.messageQueue.length < this.options.maxQueueSize) {
        this.messageQueue.push({
          ...message,
          timestamp: Date.now()
        })
        this.log('Message queued:', message)
        return true
      }
      this.log('Cannot send message - not connected and queue full')
      return false
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message)
      this.ws.send(messageStr)
      this.state.messagesSent++
      this.log('Message sent:', message)
      return true
    } catch (error) {
      this.log('Failed to send message:', error)
      return false
    }
  }

  /**
   * 发送原始数据
   */
  sendRaw(data: string | ArrayBuffer | Blob): boolean {
    if (!this.state.isConnected || !this.ws) {
      this.log('Cannot send raw data - not connected')
      return false
    }

    try {
      this.ws.send(data)
      this.log('Raw data sent')
      return true
    } catch (error) {
      this.log('Failed to send raw data:', error)
      return false
    }
  }

  /**
   * 订阅消息
   */
  subscribe<T = any>(type: string, handler: MessageHandler<T>): string {
    const id = this.generateId()
    this.subscriptions.set(id, {
      id,
      type,
      handler,
      once: false
    })
    this.log('Subscribed to message type:', type, 'with id:', id)
    return id
  }

  /**
   * 取消订阅
   */
  unsubscribe(id: string): boolean {
    const removed = this.subscriptions.delete(id)
    this.log('Unsubscribed:', id, 'success:', removed)
    return removed
  }

  /**
   * 一次性订阅
   */
  once<T = any>(type: string, handler: MessageHandler<T>): string {
    const id = this.generateId()
    this.subscriptions.set(id, {
      id,
      type,
      handler,
      once: true
    })
    this.log('One-time subscription to message type:', type, 'with id:', id)
    return id
  }

  /**
   * 获取连接状态
   */
  getState(): WebSocketState {
    return { ...this.state }
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.state.isConnected && this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * 发送心跳
   */
  ping(): void {
    if (this.isConnected()) {
      const heartbeatMsg = typeof this.options.heartbeatMessage === 'string' 
        ? this.options.heartbeatMessage 
        : JSON.stringify(this.options.heartbeatMessage)
      this.sendRaw(heartbeatMsg)
      this.log('Ping sent')
    }
  }

  // 私有方法

  /**
   * 设置状态
   */
  private setState(status: WebSocketStatus): void {
    this.state.status = status
    this.state.isConnected = status === 'connected'
    this.log('State changed to:', status)
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(event: MessageEvent): void {
    try {
      let message: WebSocketMessage
      
      try {
        message = JSON.parse(event.data)
      } catch {
        // 如果不是 JSON，创建简单的消息对象
        message = {
          type: 'raw',
          data: event.data,
          timestamp: Date.now()
        }
      }

      this.state.messagesReceived++
      this.log('Message received:', message)

      // 调用全局消息处理器
      this.options.onMessage(message)

      // 调用订阅的处理器
      this.processSubscriptions(message)

    } catch (error) {
      this.log('Error handling message:', error)
    }
  }

  /**
   * 处理消息订阅
   */
  private processSubscriptions(message: WebSocketMessage): void {
    const toRemove: string[] = []

    this.subscriptions.forEach((subscription) => {
      if (subscription.type === message.type || subscription.type === '*') {
        try {
          subscription.handler(message)
          if (subscription.once) {
            toRemove.push(subscription.id)
          }
        } catch (error) {
          this.log('Error in message handler:', error)
        }
      }
    })

    // 移除一次性订阅
    toRemove.forEach(id => this.subscriptions.delete(id))
  }

  /**
   * 处理消息队列
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()
      if (message) {
        this.send(message)
      }
    }
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    if (!this.options.heartbeat) return

    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      this.ping()
    }, this.options.heartbeatInterval)

    this.log('Heartbeat started, interval:', this.options.heartbeatInterval)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
      this.log('Heartbeat stopped')
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.state.reconnectAttempts >= this.options.reconnectAttempts) {
      this.log('Max reconnect attempts reached')
      return
    }

    this.clearReconnectTimer()
    this.state.reconnectAttempts++
    
    const delay = Math.min(
      this.options.reconnectInterval * Math.pow(this.options.reconnectDecay, this.state.reconnectAttempts - 1),
      this.options.maxReconnectInterval
    )

    this.log(`Scheduling reconnect attempt ${this.state.reconnectAttempts} in ${delay}ms`)
    
    this.setState('reconnecting')
    this.options.onReconnect(this.state.reconnectAttempts)

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        this.log('Reconnect failed:', error)
        this.scheduleReconnect()
      })
    }, delay)
  }

  /**
   * 清除重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 日志输出
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[WebSocketManager]', ...args)
    }
  }
}

/**
 * 创建 WebSocket 实例的工厂函数
 */
export function createWebSocket(options: WebSocketOptions): WebSocketManager {
  return new WebSocketManager(options)
}

export default WebSocketManager
