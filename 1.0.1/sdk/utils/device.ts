/**
 * 设备检测工具
 */

// 检测是否为移动设备
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  const mobileKeywords = [
    'android', 'iphone', 'ipad', 'ipod', 'blackberry', 
    'windows phone', 'mobile', 'webos', 'opera mini'
  ]
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword))
}

// 检测是否为平板设备
export const isTablet = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent.toLowerCase()
  return /ipad|android(?!.*mobile)|tablet/i.test(userAgent)
}

// 检测屏幕宽度
export const getScreenWidth = (): number => {
  if (typeof window === 'undefined') return 1024
  return window.innerWidth || document.documentElement.clientWidth
}

// 检测是否为 H5 环境
export const isH5 = (): boolean => {
  // 移动设备或者屏幕宽度小于 768px 认为是 H5
  return isMobile() || isTablet() || getScreenWidth() < 768
}

// 检测是否为 PC 环境
export const isPC = (): boolean => {
  return !isH5()
}

// 获取设备类型
export const getDeviceType = (): 'pc' | 'h5' => {
  return isH5() ? 'h5' : 'pc'
}

// 响应式检测
export const useDeviceDetection = () => {
  const deviceType = ref<'pc' | 'h5'>(getDeviceType())
  
  const updateDeviceType = () => {
    deviceType.value = getDeviceType()
  }
  
  onMounted(() => {
    window.addEventListener('resize', updateDeviceType)
  })
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateDeviceType)
  })
  
  return {
    deviceType: readonly(deviceType),
    isPC: computed(() => deviceType.value === 'pc'),
    isH5: computed(() => deviceType.value === 'h5'),
    updateDeviceType
  }
}
