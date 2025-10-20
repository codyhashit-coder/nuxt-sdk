export type LoginType =
  | "username"
  | "email"
  | "phone"
  | "wechat"
  | "github"
  | "facebook"
  | "google"
  | "instagram"
  | "coldWallet"
  | "web3"

export interface LoginFormType {
  type?: LoginType
  username?: string
  email?: string
  phone?: string
  password?: string
  code?: string
  [key: string]: any // 支持未来扩展字段
}
