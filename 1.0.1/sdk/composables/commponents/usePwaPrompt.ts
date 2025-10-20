import { ref, onMounted } from 'vue'

export function usePwaInstallGuide() {
  // console.log("vapidKeys===",vapidKeys);
  // 'BMcCdiWcmxgnoiWff_H2q2Gz0NjkBey3ietOvbV1MXBsVM6anEFSV1-hPocqaEPiqUWNnQRpAXasTy92T4ONi3U',
  // privateKey: '-ULVO2TyWvuB3zfqn6PTfQgBcoJRmxVsCxX4Be28-IA'
  const showInstallGuide = ref(false)
  const deferredPrompt = ref<Event | null>(null)

  onMounted(() => {
    // Android / 支持 beforeinstallprompt 的情况
    window.addEventListener('beforeinstallprompt', (e: any) => {
      e.preventDefault()
      deferredPrompt.value = e
      showInstallGuide.value = true
    })

    // iOS 或不支持 beforeinstallprompt 的情况
    if (/iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase()) || 
        (navigator.userAgent.toLowerCase().includes('android') && !('onbeforeinstallprompt' in window))) {
      showInstallGuide.value = true
    }
  })

  const installPwa = async () => {
    if (deferredPrompt.value) {
      (deferredPrompt.value as any).prompt()
      const choiceResult = await (deferredPrompt.value as any).userChoice
      if (choiceResult.outcome === 'accepted') {
        deferredPrompt.value = null
        showInstallGuide.value = false
      }
    }
  }

  return {
    showInstallGuide,
    installPwa
  }
}
