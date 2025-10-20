// 登录hook
// import { useUserStore } from "~/sdk/stores/user"
import type { LoginFormType } from "~/sdk/types/index"
export const useloginHook = () => {
  const form = reactive<LoginFormType>({
    type: "username",
    username: "",
    email: "",
    phone: "",
    code: "",
    password: "",
    facebook: "",
    coldWallet: "",
    google: "",
    github: "",
    instagram: "",
    wechat: "",
    web3: "",
  })
  // const userStore = useUserStore()
  // 账号登录
  const handleUsernameLogin = async () => {
    const params: LoginFormType = {
      type: "username",
      username: form.username,
      password: form.password,
      code: form.code,
    }
    handleLogin(params)
  }
  // 邮箱登录
  const handleEmailLogin = async () => {
    const params: any = {
      type: "email",
      email: form.email,
      password: form.password,
      code: form.code,
    }
     handleLogin(params)
  }
  // 手机登录
  const handlePhoneLogin = async () => {
    const params: any = {
      type: "phone",
      phone: form.phone,
      password: form.password,
      code: form.code,
    }
     handleLogin(params)
  }
  // 微信登录
  const handleWechatLogin = async () => {
    const params: any = {
      type: "wechat",
      wechat: form.wechat,
      password: form.password,
      code: form.code,
    }
     handleLogin(params)
  }
  // github登录
  const handleGithubLogin = async () => {
    const params: any = {
      type: "github",
      github: form.github,
      password: form.password,
      code: form.code,
    }
    handleLogin(params)
  }
  // facebook 登录
  const handleFacebookLogin = async () => {
    const params: any = {
      type: "facebook",
      facebook: form.facebook,
      password: form.password,
      code: form.code,
    }
     handleLogin(params)
  }
  // google登录
  const handleGoogleLogin = async () => {
    const params: any = {
      type: "google",
      google: form.google,
      password: form.password,
      code: form.code,
    }
     handleLogin(params)
  }
  // instagram登录
  const handleInstagramLogin = async () => {
    const params: any = {
      type: "instagram",
      instagram: form.instagram,
      password: form.password,
      code: form.code,
    }
     handleLogin(params)
  }
  // 冷钱包登录
  const handleColdWalletLogin = async () => {
    const params: any = {
      type: "coldWallet",
      coldWallet: form.coldWallet,
      password: form.password,
      code: form.code,
    }
     handleLogin(params)
  }
  // web3
  const handleWeb3Login = async () => {
    const params: any = {
      type: "web3",
      web3: form.web3,
      password: form.password,
      code: form.code,
    }
     handleLogin(params)
  }

  const handleLogin = async (params: LoginFormType) => {
    // 为了以后的台子，扩展性
    console.log("login params===", params)
    // await userStore.submitLogin(params)
  }

  return {
    form,
    handleUsernameLogin,
    handleEmailLogin,
    handlePhoneLogin,
    handleWechatLogin,
    handleGithubLogin,
    handleFacebookLogin,
    handleGoogleLogin,
    handleInstagramLogin,
    handleColdWalletLogin,
    handleWeb3Login,
  }
}
