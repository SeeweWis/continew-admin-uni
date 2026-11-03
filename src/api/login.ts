import type { IAuthLoginRes, ICaptcha, IGetUserInfoRes, ILoginBody, IUserRoute } from './types/login'
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

/** 获取当前用户已授权的目录、菜单树 */
export function getUserRoutes() {
  return http.get<IUserRoute[]>('/auth/user/route')
}

/** 刷新 token */
export function refreshToken(refreshToken: string) {
  return http.post<IAuthLoginRes>('/auth/refresh', { refreshToken }, undefined, undefined, { skipAuthRefresh: true })
}

/** 退出登录 */
export function logout(refreshToken: string | undefined, authorization: string) {
  return http.post<void>('/auth/logout', refreshToken ? { refreshToken } : undefined, undefined, { Authorization: authorization }, { skipAuthRefresh: true })
}
