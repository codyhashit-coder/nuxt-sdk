// sdk/stores/theme.ts
import { defineStore } from 'pinia'

type ThemeName = 'light' | 'dark' | 'blue' | 'green' | 'red'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    theme: 'light' as ThemeName,
  }),
  actions: {
    setTheme(newTheme: ThemeName) {
      this.theme = newTheme
      document.documentElement.setAttribute('data-theme', newTheme)
    },
    toggleTheme() {
      const allThemes: ThemeName[] = ['light', 'dark', 'blue', 'green', 'red']
      const currentIndex = allThemes.indexOf(this.theme)
      this.setTheme(allThemes[(currentIndex + 1) % allThemes.length] as ThemeName)
    },
    initTheme() {
      // initTheme 可选，pinia-persistedstate 会自动从 localStorage 恢复
      document.documentElement.setAttribute('data-theme', this.theme)
    },
  },
  persist: [
    {
      pick: ['theme'], // 指定要持久化的字段
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    },
  ],
})
