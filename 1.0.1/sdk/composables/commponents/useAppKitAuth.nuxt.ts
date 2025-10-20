// composables/pages/useAppKitAuth.nuxt.ts
// @ts-ignore
import { useFetch } from "#app"
import { useAppKit, useAppKitAccount } from "@reown/appkit/vue"
import { useAppKitAuth as useAppKitAuthCore } from "~/sdk/composables/modules/useAppKitAuth"

export function useAppKitAuthNuxt() {
  const account = useAppKitAccount()
  const { open } = useAppKit()
  console.log("useAppKitAuthNuxt")
  return {
    account,
    ...useAppKitAuthCore({
      account,
      open,
      fetcher: useFetch,
    }),
  }
}
