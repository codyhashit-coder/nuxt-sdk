// composables/pages/useAppKitAuth.vite.ts
import { useAppKit, useAppKitAccount } from "@reown/appkit/vue"
import { useAppKitAuth as useAppKitAuthCore } from "~/sdk/composables/modules/useAppKitAuth"

export function useAppKitAuthVite() {
  const account = useAppKitAccount()
  const { open } = useAppKit()
//   const connectWallet = () => { open({ view: "Connect" }) }
  // 适配 Vite，自己实现 fetcher
  const fetcher = async (url: string, opts?: any) => {
    console.log("fetcher", url, opts)
    // const res = await fetch(url, {
    //   method: opts?.method || "GET",
    //   headers: { "Content-Type": "application/json" },
    //   body: opts?.body ? JSON.stringify(opts.body) : undefined,
    // })
    // return res.json()
  }

  return {
    account,
    ...useAppKitAuthCore({
      account,
      open,
      fetcher,
    }),
  }
}
