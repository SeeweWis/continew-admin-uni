import type { IAuthLoginRes, IUserInfoRes } from '@/api/types/login'
import { getUserInfo, login as loginApi, logout as logoutApi } from '@/api/login'
import { encryptPassword } from '@/http/crypto'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'

/** 客户端 ID：需在后端客户端配置中启用对应认证类型。 */
const CLIENT_ID = import.meta.env.VITE_APP_CLIENT_ID

async function postLogin(res: IAuthLoginRes) {
  if (!res.accessToken || !res.expiresIn || !res.refreshToken || !res.refreshExpiresIn) {
    throw new Error('后端未返回完整登录令牌，请检查小程序客户端的 Refresh Token 配置')
  }
  useTokenStore().setTokenInfo({
    token: res.accessToken,
    tokenType: res.tokenType,
    expiresIn: res.expiresIn,
    refreshToken: res.refreshToken,
    refreshExpiresIn: res.refreshExpiresIn,
  })
  try {
    await fetchUserInfo()
  }
  catch (error) {
    useTokenStore().clear()
    useUserStore().clearUserInfo()
    throw error
  }
}

/**
 * 微信小程序一键登录：wx.getPhoneNumber 授权码由后端兑换手机号。
 */
export async function loginByWechat(phoneCode: string) {
  const res = await loginApi({
    clientId: CLIENT_ID,
    authType: 'MINI_PROGRAM',
    code: phoneCode,
  })
  await postLogin(res)
  return res
}

export async function loginByPassword(form: { username: string, password: string, captcha?: string, uuid?: string }) {
  const res = await loginApi({ clientId: CLIENT_ID, authType: 'ACCOUNT', ...form, password: encryptPassword(form.password, import.meta.env.VITE_API_ENCRYPT_PUBLIC_KEY) })
  await postLogin(res)
  return res
}

export async function fetchUserInfo(): Promise<IUserInfoRes> {
  const res = await getUserInfo()
  const userInfo: IUserInfoRes = {
    userId: res.id,
    username: res.username,
    nickname: res.nickname,
    avatar: res.avatar,
    roles: res.roles,
    permissions: res.permissions,
  }
  useUserStore().setUserInfo(userInfo)
  return userInfo
}

export async function logout() {
  const tokenStore = useTokenStore()
  const refreshToken = tokenStore.tokenInfo.refreshToken
  try {
    if (refreshToken)
      await logoutApi(refreshToken)
  }
  catch (error) {
    console.error('退出登录失败:', error)
  }
  finally {
    tokenStore.clear()
    useUserStore().clearUserInfo()
  }
}
