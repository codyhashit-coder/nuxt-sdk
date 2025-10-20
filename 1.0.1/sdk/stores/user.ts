// stores/user.ts
import { defineStore } from "pinia"
import type { UserState } from "~/sdk/types/user"
export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    token: "",
    username: "",
  }),
  actions: {
    setUser(token: string, username: string) {
      this.token = token
      this.username = username
    },
    logout() {
      this.token = ""
      this.username = ""
    },
  },
  // 多个存储
  persist:[
    {
      pick: ['token', 'username'],
      storage:  typeof window !== 'undefined' ? localStorage : undefined
    }
  ]
  // 全部存储
  // persist: true
})
