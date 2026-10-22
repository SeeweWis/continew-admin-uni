import type { IAuthLoginRes, ICaptcha, IGetUserInfoRes, ILoginBody } from './types/login'
import { http } from '@/http/http'

export function login(data: ILoginBody) {
  return http.post<IAuthLoginRes>('/auth/login', data, undefined, undefined, { skipAuthRefresh: true })
}

export function getCode() {
  return http.get<ICaptcha>('/captcha/image')
}

export function getUserInfo() {
  return http.get<IGetUserInfoRes>('/auth/user/info')
}

export function refreshToken(refreshToken: string) {
  return http.post<IAuthLoginRes>('/auth/refresh', { refreshToken }, undefined, undefined, { skipAuthRefresh: true })
}

export function logout(refreshToken: string) {
  return http.post<void>('/auth/logout', { refreshToken }, undefined, undefined, { skipAuthRefresh: true })
}
