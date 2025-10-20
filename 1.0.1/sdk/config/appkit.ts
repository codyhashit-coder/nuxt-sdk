import { WagmiAdapter } from "@reown/appkit-adapter-wagmi"
import { arbitrum, mainnet, solana, type AppKitNetwork } from "@reown/appkit/networks"
export const projectId = process.env.NUXT_PROJECT_ID! || "76925d7912c507848fd3a749aa29b08a"
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet, arbitrum, solana]

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true, // 或 true，根据需求
})
