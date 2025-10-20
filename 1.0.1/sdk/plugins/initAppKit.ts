// sdk/core/initAppKit.ts
import { createAppKit } from "@reown/appkit/vue"
import { networks, projectId, wagmiAdapter } from "~/sdk/config/appkit"

export function initAppKit() {
  createAppKit({
    adapters: [wagmiAdapter],
    networks,
    projectId,
    metadata: {
      name: "项目名",
      description: "描述",
      url: "https://你的域名.com",
      icons: ["https://你的图标地址.png"],
    },
    features: {
      email: true,
      socials: ["google", "github", "discord"],
    },
    // themeMode: "system",
    themeVariables: {
      "--w3m-accent": "#00BB7F",
    },
  })
}
