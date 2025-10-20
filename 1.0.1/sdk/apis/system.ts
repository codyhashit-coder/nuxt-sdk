import { get } from "~/request/index"
import { systemApi } from "~/sdk/networkUrl/index"
export const pageList = async () => {
  return await get(systemApi.pageList)
}
