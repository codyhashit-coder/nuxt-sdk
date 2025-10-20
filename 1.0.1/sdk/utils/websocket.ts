/**
 * WebSocket 工具函数
 * 提供消息处理、错误处理、性能优化等工具方法
 */

import type { WebSocketMessage, WebSocketOptions } from '../types/websocket'

/**
 * 消息工具类
 */
export class MessageUtils {
  /**
   * 创建标准消息格式
   */
  static createMessage<T = any>(type: string, data: T, id?: string): WebSocketMessage<T> {
    return {
      type,
      data,
      timestamp: Date.now(),
      id: id || this.generateMessageId()
    }
  }

  /**
   * 生成消息ID
   */
  static generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 验证消息格式
   */
  static validateMessage(message: any): message is WebSocketMessage {
    return (
      message &&
      typeof message === 'object' &&
      typeof message.type === 'string' &&
      message.hasOwnProperty('data')
    )
  }

  /**
   * 序列化消息
   */
  static serialize(message: WebSocketMessage): string {
    try {
      return JSON.stringify(message)
    } catch (error) {
      throw new Error(`Failed to serialize message: ${error}`)
    }
  }

  /**
   * 反序列化消息
   */
  static deserialize(data: string): WebSocketMessage {
    try {
      const message = JSON.parse(data)
      if (!this.validateMessage(message)) {
        throw new Error('Invalid message format')
      }
      return message
    } catch (error) {
      throw new Error(`Failed to deserialize message: ${error}`)
    }
  }

  /**
   * 克隆消息
   */
  static clone<T = any>(message: WebSocketMessage<T>): WebSocketMessage<T> {
    return JSON.parse(JSON.stringify(message))
  }

  /**
   * 提取消息类型
   */
  static getMessageType(data: string): string | null {
    try {
      const parsed = JSON.parse(data)
      return parsed?.type || null
    } catch {
      return null
    }
  }
}

/**
 * 错误处理工具类
 */
export class ErrorUtils {
  /**
   * 创建错误对象
   */
  static createError(message: string, code?: string, details?: any): Error {
    const error = new Error(message)
    ;(error as any).code = code
    ;(error as any).details = details
    return error
  }

  /**
   * 处理 WebSocket 错误
   */
  static handleWebSocketError(error: Event | Error): Error {
    if (error instanceof Event) {
      return this.createError('WebSocket connection error', 'WEBSOCKET_ERROR', {
        type: error.type,
        target: error.target
      })
    }
    return error
  }

  /**
   * 处理消息错误
   */
  static handleMessageError(error: any, message?: WebSocketMessage): Error {
    return this.createError(
      `Message processing error: ${error.message}`,
      'MESSAGE_ERROR',
      { originalMessage: message, originalError: error }
    )
  }

  /**
   * 处理连接错误
   */
  static handleConnectionError(error: any, url: string): Error {
    return this.createError(
      `Connection failed to ${url}: ${error.message}`,
      'CONNECTION_ERROR',
      { url, originalError: error }
    )
  }

  /**
   * 错误重试策略
   */
  static shouldRetry(error: Error, attempt: number, maxAttempts: number): boolean {
    if (attempt >= maxAttempts) return false
    
    const retryableErrors = [
      'CONNECTION_ERROR',
      'NETWORK_ERROR',
      'TIMEOUT_ERROR'
    ]
    
    return retryableErrors.includes((error as any).code)
  }

  /**
   * 计算重试延迟
   */
  static calculateRetryDelay(attempt: number, baseDelay: number = 1000, maxDelay: number = 30000): number {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay)
    // 添加随机抖动，避免雷群效应
    return delay + Math.random() * 1000
  }
}

/**
 * 性能优化工具类
 */
export class PerformanceUtils {
  private static messageQueue = new Map<string, WebSocketMessage[]>()
  private static rateLimiters = new Map<string, { count: number; resetTime: number }>()

  /**
   * 消息队列管理
   */
  static addToQueue(connectionId: string, message: WebSocketMessage, maxSize: number = 100): void {
    if (!this.messageQueue.has(connectionId)) {
      this.messageQueue.set(connectionId, [])
    }
    
    const queue = this.messageQueue.get(connectionId)!
    
    // 限制队列大小
    if (queue.length >= maxSize) {
      queue.shift()
    }
    
    queue.push(message)
  }

  static getQueue(connectionId: string): WebSocketMessage[] {
    return this.messageQueue.get(connectionId) || []
  }

  static clearQueue(connectionId: string): void {
    this.messageQueue.delete(connectionId)
  }

  static clearAllQueues(): void {
    this.messageQueue.clear()
  }

  /**
   * 速率限制
   */
  static checkRateLimit(key: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
    const now = Date.now()
    const limiter = this.rateLimiters.get(key)
    
    if (!limiter || now > limiter.resetTime) {
      this.rateLimiters.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return true
    }
    
    if (limiter.count >= maxRequests) {
      return false
    }
    
    limiter.count++
    return true
  }

  /**
   * 批量消息处理
   */
  static batchMessages(messages: WebSocketMessage[], batchSize: number = 10): WebSocketMessage[][] {
    const batches: WebSocketMessage[][] = []
    
    for (let i = 0; i < messages.length; i += batchSize) {
      batches.push(messages.slice(i, i + batchSize))
    }
    
    return batches
  }

  /**
   * 消息压缩（简单的重复数据删除）
   */
  static compressMessages(messages: WebSocketMessage[]): WebSocketMessage[] {
    const seen = new Set<string>()
    return messages.filter(message => {
      const key = `${message.type}-${JSON.stringify(message.data)}`
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  /**
   * 内存使用监控
   */
  static getMemoryUsage(): { used: number; total: number; percentage: number } {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
      }
    }
    return { used: 0, total: 0, percentage: 0 }
  }
}

/**
 * 连接工具类
 */
export class ConnectionUtils {
  /**
   * 生成连接ID
   */
  static generateConnectionId(url: string): string {
    const hash = this.simpleHash(url)
    return `ws-${hash}-${Date.now()}`
  }

  /**
   * 简单哈希函数
   */
  private static simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 验证 WebSocket URL
   */
  static validateUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'ws:' || urlObj.protocol === 'wss:'
    } catch {
      return false
    }
  }

  /**
   * 获取连接质量指标
   */
  static getConnectionMetrics(state: any): {
    latency: number
    stability: number
    throughput: number
  } {
    const now = Date.now()
    const connectionTime = state.connectionTime || now
    const uptime = now - connectionTime
    
    return {
      latency: this.calculateLatency(state),
      stability: this.calculateStability(state, uptime),
      throughput: this.calculateThroughput(state, uptime)
    }
  }

  private static calculateLatency(state: any): number {
    // 简单的延迟计算，实际应用中可能需要更复杂的算法
    return state.messagesReceived > 0 ? 50 : 0 // 假设延迟为50ms
  }

  private static calculateStability(state: any, uptime: number): number {
    if (uptime === 0) return 0
    const errorRate = state.lastError ? 1 : 0
    return Math.max(0, 1 - errorRate)
  }

  private static calculateThroughput(state: any, uptime: number): number {
    if (uptime === 0) return 0
    return (state.messagesReceived + state.messagesSent) / (uptime / 1000) // 消息/秒
  }

  /**
   * 创建默认配置
   */
  static createDefaultOptions(url: string, customOptions?: Partial<WebSocketOptions>): WebSocketOptions {
    return {
      url,
      reconnect: true,
      reconnectAttempts: 5,
      reconnectInterval: 1000,
      maxReconnectInterval: 30000,
      reconnectDecay: 1.5,
      heartbeat: true,
      heartbeatInterval: 30000,
      heartbeatMessage: MessageUtils.createMessage('ping', {}),
      messageQueue: true,
      maxQueueSize: 100,
      debug: false,
      ...customOptions
    }
  }
}

/**
 * 调试工具类
 */
export class DebugUtils {
  private static logs: Array<{ timestamp: number; level: string; message: string; data?: any }> = []
  private static maxLogs = 1000

  /**
   * 记录日志
   */
  static log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const logEntry = {
      timestamp: Date.now(),
      level,
      message,
      data
    }
    
    this.logs.push(logEntry)
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }
    
    // 控制台输出
    console[level](`[WebSocket Debug] ${message}`, data)
  }

  /**
   * 获取日志
   */
  static getLogs(filter?: { level?: string; since?: number }): typeof this.logs {
    let filtered = this.logs
    
    if (filter?.level) {
      filtered = filtered.filter(log => log.level === filter.level)
    }
    
    if (filter?.since) {
      filtered = filtered.filter(log => log.timestamp >= filter.since!)
    }
    
    return filtered
  }

  /**
   * 清除日志
   */
  static clearLogs(): void {
    this.logs = []
  }

  /**
   * 导出日志
   */
  static exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  /**
   * 性能分析
   */
  static profile(name: string, fn: () => void): void {
    const start = performance.now()
    fn()
    const end = performance.now()
    this.log('info', `Profile ${name}: ${(end - start).toFixed(2)}ms`)
  }

  /**
   * 异步性能分析
   */
  static async profileAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    this.log('info', `Profile ${name}: ${(end - start).toFixed(2)}ms`)
    return result
  }
}

export default {
  MessageUtils,
  ErrorUtils,
  PerformanceUtils,
  ConnectionUtils,
  DebugUtils
}
