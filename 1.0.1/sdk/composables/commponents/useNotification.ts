export async function useNotification() {
  // 请求用户授权
  const requestPermission = async () => {
    if (!('Notification' in window)) {
      alert('当前浏览器不支持系统通知')
      return false
    }
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  // 发送通知
  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: options?.body || '',
        icon: options?.icon || '/192.png',
        ...options,
      })
    }
  }

  return { requestPermission, sendNotification }
}
