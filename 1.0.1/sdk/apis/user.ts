// 登录接口
import { get } from "~/request/index"
import { userApi } from "~/sdk/networkUrl/index"
import type { LoginFormType } from "~/sdk/types/index"
export const getLogin = async (params: LoginFormType) => {
  console.log("登录成功了")
  // return params
  return await get(userApi.login, params)
}