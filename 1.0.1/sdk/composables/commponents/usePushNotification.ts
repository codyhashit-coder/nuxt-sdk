// composables/usePushNotification.ts
import { post } from "~/request/index"
export const usePushNotification = () => {
    const config = useRuntimeConfig()
    const swRegistration = ref<ServiceWorkerRegistration | null>(null)
    const subscription = ref<PushSubscription | null>(null)
    const isSupported = ref(false)
    const permission = ref<NotificationPermission>('default')
    const pushProvider = ref<'jpush' | 'webpush'>('webpush')
    const jpushRegistrationId = ref<string | null>(null)
      
    // 显示通知（统一接口）
    const showNotification = (title: string, options?: NotificationOptions) => {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, options)
      }
    }
  
    // 检查浏览器支持
    const checkSupport = () => {
      isSupported.value = 
        'serviceWorker' in navigator && 
        'PushManager' in window && 
        'Notification' in window
      
      if (isSupported.value) {
        permission.value = Notification.permission
      }
      
      return isSupported.value
    }
  
    // 统一初始化
    const init = async () => {
      if (!checkSupport()) {
        console.warn('浏览器不支持推送通知')
        return false
      }
  
      try {     
        console.log('使用 Web Push（海外地区）')
        // 等待 Service Worker 注册
        swRegistration.value = await navigator.serviceWorker.ready
        console.log('swRegistration.value===', swRegistration.value)
        
        // 检查现有订阅
        subscription.value = await swRegistration.value.pushManager.getSubscription()
        console.log('subscription.value===', subscription.value)
        return true

      } catch (error) {
        console.error('初始化推送通知失败:', error)
        return false
      }
    }
  
    // 请求权限
    const requestPermission = async () => {
      if (!isSupported.value) return false
      
      try {
        permission.value = await Notification.requestPermission()
        return permission.value === 'granted'
      } catch (error) {
        console.error('请求通知权限失败:', error)
        return false
      }
    }
  
    // Base64 转 Uint8Array
    const urlBase64ToUint8Array = (base64String: string) => {
      const padding = '='.repeat((4 - base64String.length % 4) % 4)
      const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/')
  
      const rawData = window.atob(base64)
      const outputArray = new Uint8Array(rawData.length)
  
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }
      return outputArray
    }
  
    // 订阅推送（根据地区选择不同方案）
    const subscribe = async () => {
        if (permission.value !== 'granted') {
            const granted = await requestPermission()
            if (!granted) return null
        }
        // Web Push 订阅
        if (!swRegistration.value) {
            console.error('Service Worker 未注册')
            return null
        }

        try {
            const vapidPublicKey = config.public.vapidPublicKey as string
            const convertedKey = urlBase64ToUint8Array(vapidPublicKey)

            subscription.value = await swRegistration.value.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedKey
            })

            // 发送订阅信息到服务器
            await post('/api/push/subscribe', {
            method: 'POST',
            body: subscription.value
            })

            return subscription.value
        } catch (error) {
            console.error('订阅推送失败:', error)
            return null
        }
    }
  
    // 取消订阅
    const unsubscribe = async () => {
      try {
        // Web Push 取消订阅
        if (!subscription.value) return false
        
        await subscription.value.unsubscribe()
        
        await post('/api/push/unsubscribe', {
        method: 'POST',
        body: subscription.value
        })
        subscription.value = null
        
        return true
      } catch (error) {
        console.error('取消订阅失败:', error)
        return false
      }
    }
  
    // 获取订阅状态
    const getSubscriptionStatus = async () => {
   
        if (!swRegistration.value) return null
        
        subscription.value = await swRegistration.value.pushManager.getSubscription()
        return {
          subscribed: !!subscription.value,
          permission: permission.value,
          provider: 'webpush',
          subscription: subscription.value
        }
    }
  
    // 发送测试通知
    const sendTestNotification = () => {
      if (permission.value === 'granted') {
        showNotification('测试通知', {
          body: `这是一条测试通知消息（${pushProvider.value === 'jpush' ? '极光推送' : 'Web Push'}）`,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'test-notification'
        })
      }
    }
  
    // 模拟服务器推送
    const simulatePush = async () => {

        // Web Push 模拟
        if (!swRegistration.value) {
          console.warn('Service Worker 未就绪')
          return
        }
        
        await swRegistration.value.showNotification('假推送消息（Web Push）', {
          body: '这是一条模拟的推送内容',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'mock-push'
        })
    }
  
    return {
      isSupported,
      permission,
      subscription,
      pushProvider,
      jpushRegistrationId,
      init,
      requestPermission,
      subscribe,
      unsubscribe,
      getSubscriptionStatus,
      sendTestNotification,
      simulatePush
    }
  }
  