import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Language } from "~/sdk/types/language"
export const useLocaleStore = defineStore('language', () => {
  // 注意：不要在 store 初始化时调用 useI18n()
  // 因为 i18n 可能还没有初始化完成
  
  // 使用 ref 存储当前语言（这个会被持久化）
  const savedLocale = ref<string>('en')

  // 可用语言列表
  const availableLocales = computed(() => [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
    { code: 'ar', name: 'العربية', flag: '🇦🇪' }
  ])

  // 当前语言（从 savedLocale 读取）
  const currentLocale = computed(() => savedLocale.value)

  // 切换语言
  const changeLocale = async (newLocale: Language) => { 
    if (newLocale === savedLocale.value) {
      console.log('Same locale, skipping')
      return
    }

    if (!availableLocales.value.some(l => l.code === newLocale)) {
      console.warn(`Locale ${newLocale} is not available`)
      return
    }

    // 在组件中调用时才能使用 useI18n
    // const { setLocale } = useI18n()
    
    try {
      // 使用 setLocale 方法切换语言
      // await setLocale(newLocale as Locale)
      
      // 更新 store 中的值（会自动持久化）
      savedLocale.value = newLocale
      
      // 更新 HTML 属性
      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale
        document.documentElement.dir = newLocale === 'ar' ? 'rtl' : 'ltr'
      }
      
      console.log('Locale changed successfully to', newLocale)
    } catch (error) {
      console.error('Failed to change locale:', error)
    }
  }

  // 初始化语言
  const initLocale = () => {
    console.log('Initializing locale, saved:', savedLocale.value)
    
    // 如果有保存的语言，使用它
    if (savedLocale.value && availableLocales.value.some(l => l.code === savedLocale.value)) {
      changeLocale(savedLocale.value as Language)
      return
    }

    // 否则尝试浏览器语言
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language // 'zh-CN' or 'en-US'
      
      // 先尝试完全匹配
      let matchedLocale = availableLocales.value.find(l => l.code === browserLang)
      
      // 如果没有完全匹配，尝试语言代码匹配（如 'zh' 匹配 'zh-CN'）
      if (!matchedLocale) {
        const langCode = browserLang.split('-')[0]
        matchedLocale = availableLocales.value.find(l => l.code.startsWith(langCode as Language))
      }
      
      if (matchedLocale) {
        changeLocale(matchedLocale.code as Language)
      }
    }
  }

  // 清除语言设置（重置为默认）
  const clearLocale = () => {
    changeLocale('en')
  }

  return {
    savedLocale, // 这个会被持久化
    currentLocale,
    availableLocales,
    changeLocale,
    initLocale,
    clearLocale
  }
}, {
  persist: {
    pick: ['savedLocale'], // 指定要持久化的字段
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    // key: 'user-locale',
    // storage: persistedState.localStorage,
    // paths: ['savedLocale'] // 只持久化 savedLocale
  }
})