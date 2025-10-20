<template>
  <div class="websocket-example">
    <h2>WebSocket 示例</h2>
    
    <!-- 连接状态 -->
    <div class="status-section">
      <h3>连接状态</h3>
      <div class="status-info">
        <span class="status" :class="status">{{ status }}</span>
        <span class="connection-count">连接数: {{ connectedCount }}</span>
      </div>
      <div class="connection-controls">
        <button @click="connect" :disabled="isConnected">连接</button>
        <button @click="disconnect" :disabled="!isConnected">断开</button>
        <button @click="reconnect" :disabled="!isConnected">重连</button>
      </div>
    </div>

    <!-- 消息发送 -->
    <div class="message-section">
      <h3>发送消息</h3>
      <div class="message-form">
        <input 
          v-model="messageType" 
          placeholder="消息类型" 
          class="message-type"
        />
        <textarea 
          v-model="messageData" 
          placeholder="消息内容 (JSON格式)" 
          class="message-data"
        ></textarea>
        <button @click="sendMessage" :disabled="!isConnected">发送</button>
      </div>
    </div>

    <!-- 消息历史 -->
    <div class="history-section">
      <h3>消息历史</h3>
      <div class="history-controls">
        <button @click="clearHistory">清除历史</button>
        <button @click="exportHistory">导出历史</button>
      </div>
      <div class="message-history">
        <div 
          v-for="(message, index) in messageHistory" 
          :key="index"
          class="message-item"
          :class="{ 'sent': message.sent, 'received': !message.sent }"
        >
          <div class="message-header">
            <span class="message-type">{{ message.type }}</span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-content">{{ JSON.stringify(message.data, null, 2) }}</div>
        </div>
      </div>
    </div>

    <!-- 连接信息 -->
    <div class="connection-info">
      <h3>连接信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <label>连接时间:</label>
          <span>{{ formatTime(Number(state.connectionTime)) }}</span>
        </div>
        <div class="info-item">
          <label>发送消息数:</label>
          <span>{{ state.messagesSent }}</span>
        </div>
        <div class="info-item">
          <label>接收消息数:</label>
          <span>{{ state.messagesReceived }}</span>
        </div>
        <div class="info-item">
          <label>重连次数:</label>
          <span>{{ state.reconnectAttempts }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useWebSocket } from '../composables/commponents/useWebSocket'
import { useWebSocketStore } from '../stores/websocket'
import type { WebSocketMessage } from '../types/websocket'

// 响应式数据
const messageType = ref('test')
const messageData = ref('{"content": "Hello WebSocket!"}')
const messageHistory = ref<Array<WebSocketMessage & { sent: boolean }>>([])

// 使用 WebSocket composable
const {
  status,
  isConnected,
  state,
  connect: connectWS,
  disconnect: disconnectWS,
  reconnect: reconnectWS,
  send: sendWS,
  subscribe,
  unsubscribe
} = useWebSocket({
  url: 'wss://echo.websocket.org',
  debug: true,
  reconnect: true,
  heartbeat: true,
  messageQueue: true
})

// 使用 WebSocket store
const wsStore = useWebSocketStore()

// 计算属性
const connectedCount = computed(() => wsStore.connectedCount)

// 订阅消息
let messageSubscriptionId = ''

onMounted(() => {
  // 订阅所有消息
  messageSubscriptionId = subscribe('*', (message) => {
    messageHistory.value.push({
      ...message,
      sent: false
    })
  })

  // 自动连接
  connect()
})

onUnmounted(() => {
  // 取消订阅
  if (messageSubscriptionId) {
    unsubscribe(messageSubscriptionId)
  }
  
  // 断开连接
  disconnectWS()
})

// 方法
const connect = async () => {
  try {
    await connectWS()
    console.log('WebSocket 连接成功')
  } catch (error) {
    console.error('WebSocket 连接失败:', error)
  }
}

const disconnect = () => {
  disconnectWS()
  console.log('WebSocket 已断开')
}

const reconnect = () => {
  reconnectWS()
  console.log('WebSocket 重连中...')
}

const sendMessage = () => {
  if (!isConnected.value) {
    console.warn('WebSocket 未连接')
    return
  }

  try {
    const data = JSON.parse(messageData.value)
    const message: WebSocketMessage = {
      type: messageType.value,
      data,
      timestamp: Date.now()
    }

    const success = sendWS(message)
    if (success) {
      messageHistory.value.push({
        ...message,
        sent: true
      })
      console.log('消息发送成功:', message)
    } else {
      console.error('消息发送失败')
    }
  } catch (error) {
    console.error('消息格式错误:', error)
  }
}

const clearHistory = () => {
  messageHistory.value = []
  wsStore.clearMessageHistory()
}

const exportHistory = () => {
  const data = JSON.stringify(messageHistory.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'websocket-history.json'
  a.click()
  URL.revokeObjectURL(url)
}

const formatTime = (timestamp?: number) => {
  if (!timestamp) return '未知'
  return new Date(timestamp).toLocaleTimeString()
}
</script>

<style scoped>
.websocket-example {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

.status-section,
.message-section,
.history-section,
.connection-info {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.status-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.status {
  padding: 5px 10px;
  border-radius: 4px;
  font-weight: bold;
  text-transform: uppercase;
}

.status.connected {
  background: #4CAF50;
  color: white;
}

.status.connecting {
  background: #FF9800;
  color: white;
}

.status.disconnected {
  background: #f44336;
  color: white;
}

.status.error {
  background: #9C27B0;
  color: white;
}

.connection-controls {
  display: flex;
  gap: 10px;
}

.connection-controls button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #2196F3;
  color: white;
}

.connection-controls button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.message-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message-type {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.message-data {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 100px;
  resize: vertical;
}

.message-form button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #4CAF50;
  color: white;
}

.message-form button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.history-controls {
  margin-bottom: 15px;
  display: flex;
  gap: 10px;
}

.history-controls button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #FF9800;
  color: white;
}

.message-history {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
  background: white;
}

.message-item {
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 4px;
  border-left: 4px solid #ddd;
}

.message-item.sent {
  background: #E3F2FD;
  border-left-color: #2196F3;
}

.message-item.received {
  background: #F3E5F5;
  border-left-color: #9C27B0;
}

.message-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 12px;
  color: #666;
}

.message-type {
  font-weight: bold;
}

.message-content {
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.info-item label {
  font-weight: bold;
  color: #555;
}
</style>
