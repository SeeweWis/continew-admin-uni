import type { IAuthLoginRes, ICaptcha, IGetUserInfoRes, ILoginBody } from './types/login'
import { http } from '@/http/http'

/** 登录 */
export function login(data: ILoginBody) {
  return http.post<IAuthLoginRes>('/auth/login', data, undefined, undefined, { skipAuthRefresh: true })
}

/** 获取验证码 */
export function getCode() {
  return http.get<ICaptcha>('/captcha/image')
}

/** 获取用户信息 */
export function getUserInfo() {
  return http.get<IGetUserInfoRes>('/auth/user/info')
}

/** 刷新 token */
export function refreshToken(refreshToken: string) {
  return http.post<IAuthLoginRes>('/auth/refresh', { refreshToken }, undefined, undefined, { skipAuthRefresh: true })
}

/** 退出登录 */
export function logout(refreshToken: string) {
  return http.post<void>('/auth/logout', { refreshToken }, undefined, undefined, { skipAuthRefresh: true })
}
