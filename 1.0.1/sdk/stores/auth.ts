// stores/auth.ts
import { defineStore } from "pinia"

interface UserInfo {
  id: string
  username: string
  email?: string
  avatar?: string
  // 添加其他用户信息字段...
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    // 登录状态
    isLoggedIn: false,
    // 认证 token
    token: '',
    // 用户信息
    userInfo: null as UserInfo | null,
    // 登录时间戳
    loginTime: 0
  }),
  
  getters: {
    /**
     * 是否已认证（已登录且有有效 token）
     */
    isAuthenticated: (state) => {
      return state.isLoggedIn && !!state.token
    },
    
    /**
     * 获取用户 ID
     */
    userId: (state) => state.userInfo?.id || '',
    
    /**
     * 获取用户名
     */
    username: (state) => state.userInfo?.username || '游客'
  },
  
  actions: {
    /**
     * 登录
     * @param token - 认证 token
     * @param userInfo - 用户信息
     */
    login(token: string, userInfo: UserInfo) {
      this.token = token
      this.userInfo = userInfo
      this.isLoggedIn = true
      this.loginTime = Date.now()
      
      // 保存 token 到 localStorage（也可以用 cookie）
      localStorage.setItem('auth_token', token)
      
      console.log('用户登录成功:', userInfo.username)
    },
    
    /**
     * 登出
     */
    logout() {
      this.token = ''
      this.userInfo = null
      this.isLoggedIn = false
      this.loginTime = 0
      
      // 清除 localStorage
      localStorage.removeItem('auth_token')
      
      console.log('用户已登出')
    },
    
    /**
     * 检查认证状态
     * @returns 是否已认证
     */
    checkAuth(): boolean {
      // 方式 1: 从 localStorage 检查
      const token = localStorage.getItem('auth_token')
      if (token) {
        this.token = token
        this.isLoggedIn = true
        return true
      }
      
      // 方式 2: 可以调用后端接口验证 token 是否有效
      // const isValid = await this.verifyToken(token)
      
      return false
    },
    
    /**
     * 验证 token 是否有效（可选）
     * @param token - 要验证的 token
     */
    async verifyToken(token: string): Promise<boolean> {
      try {
        // 调用后端接口验证 token
        // const response = await fetch('/api/auth/verify', {
        //   headers: { 'Authorization': `Bearer ${token}` }
        // })
        // return response.ok
        
        return !!token // 示例：简单判断 token 是否存在
      } catch (error) {
        console.error('Token 验证失败:', error)
        return false
      }
    },
    
    /**
     * 更新用户信息
     * @param userInfo - 新的用户信息
     */
    updateUserInfo(userInfo: Partial<UserInfo>) {
      if (this.userInfo) {
        this.userInfo = { ...this.userInfo, ...userInfo }
      }
    },
    
    /**
     * 刷新 token
     * @param newToken - 新的 token
     */
    refreshToken(newToken: string) {
      this.token = newToken
      localStorage.setItem('auth_token', newToken)
      console.log('Token 已刷新')
    }
  },
  
  // 持久化配置（使用 pinia-plugin-persistedstate）
  persist: [
    {
      pick: ['isLoggedIn', 'token', 'userInfo', 'loginTime'],
      storage:  typeof window !== 'undefined' ? localStorage : undefined
    }
  ]
})