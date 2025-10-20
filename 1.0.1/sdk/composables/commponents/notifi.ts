import { ref } from 'vue'
import { post } from "~/request/index"

export const usePushNotification = () => {
  const swRegistration = ref<ServiceWorkerRegistration | null>(null)
  const subscription = ref<PushSubscription | null>(null)
  const isSupported = ref(false)
  const permission = ref<NotificationPermission>('default')

  const checkSupport = () => {
    isSupported.value =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    if (isSupported.value) permission.value = Notification.permission
    return isSupported.value
  }

  const init = async () => {
    if (!checkSupport()) return false
    try {
      swRegistration.value = await navigator.serviceWorker.register('/sw.js')
      swRegistration.value = await navigator.serviceWorker.ready
      return true
    } catch (err) {
      console.error('初始化失败:', err)
      return false
    }
  }

  const requestPermission = async () => {
    if (!isSupported.value) return false
    permission.value = await Notification.requestPermission()
    return permission.value === 'granted'
  }

  const subscribe = async () => {
    if (!swRegistration.value) return null
    if (permission.value !== 'granted') {
      const granted = await requestPermission()
      if (!granted) return null
    }

    // 模拟生成订阅对象
    subscription.value = {
      endpoint: 'https://fake.push.service/' + Date.now(),
      keys: { p256dh: 'fakeKey', auth: 'fakeAuth' }
    } as any

    // 调用假接口
    await post('/api/push/subscribe', {
      method: 'POST',
      body: subscription.value
    })

    return subscription.value
  }

  const unsubscribe = async () => {
    if (!subscription.value) return false

    // 调用假接口
    await post('/api/push/unsubscribe', {
      method: 'POST',
      body: subscription.value
    })

    subscription.value = null
    return true
  }

  // 模拟本地推送
  const simulatePush = async () => {
    if (!swRegistration.value) return
    swRegistration.value.showNotification('📢 假推送通知', {
      body: '这是模拟的推送消息',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png'
    })
  }

  return {
    isSupported,
    permission,
    subscription,
    init,
    requestPermission,
    subscribe,
    unsubscribe,
    simulatePush
  }
}
