// composables/modules/useAppKitAuth.ts
import { ref, watch } from "vue"

export function useAppKitAuth({
  account,
  open,
  fetcher,
}: {
  account: any
  open: (opts: any) => void
  fetcher: (url: string, opts?: any) => Promise<any>
}) {
  const backendStatus = ref("")

  // 打开登录/连接钱包 Modal
  function connectWallet() {
    open({ view: "Connect" })
  }

  // 自动监听登录状态变化，提交到后端
  watch(
    account,
    async (newVal: any) => {
      if (newVal?.isConnected) {
        const userInfo = {
          address: newVal.address,
          email: newVal.profile?.email || null,
          socials: newVal.profile?.socials || [],
        }

        try {
          await fetcher("/api/auth/login", {
            method: "POST",
            body: userInfo,
          })
          backendStatus.value = "提交成功"
        } catch (err) {
          backendStatus.value = "提交失败"
        }
      }
    },
    { immediate: true }
  )

  return {
    backendStatus,
    connectWallet,
  }
}
