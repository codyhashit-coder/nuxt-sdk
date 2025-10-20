// stores/user.ts
import { defineStore } from "pinia"

export const useSystemStore = defineStore("system", {
  state: () => ({
    info: null,
    token: "",
  }),
  actions: {
    setUser(info: any, token: string) {
      this.info = info
      this.token = token
    },
    logout() {
      this.info = null
      this.token = ""
    },
  },
})
