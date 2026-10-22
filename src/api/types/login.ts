/**
 * /auth/login 请求体（后端 LoginReq 及认证策略扩展字段）
 */
export interface ILoginBody {
  clientId: string
  authType: 'ACCOUNT' | 'MINI_PROGRAM'
  username?: string
  password?: string
  captcha?: string
  uuid?: string
  /** wx.getPhoneNumber 返回的一次性授权码 */
  code?: string
}

/** /captcha/image 响应 */
export interface ICaptcha {
  uuid?: string
  /** 后端直接返回带 data:image 前缀的 Base64 图片 */
  img?: string
  expireTime?: number
  isEnabled?: boolean
}
export interface IAuthLoginRes {
  accessToken: string
  tokenType: 'Bearer'
  expiresIn: number
  refreshToken?: string
  refreshExpiresIn?: number
}

export type UserRole = string

/** 后端 /auth/user/info 的 UserInfoResp */
export interface IGetUserInfoRes {
  id: number
  username: string
  nickname: string
  avatar?: string
  roles: string[]
  permissions: string[]
  [key: string]: unknown
}

/** 本地用户状态映射 */
export interface IUserInfoRes {
  userId: number
  username: string
  nickname: string
  avatar?: string
  roles?: UserRole[]
  permissions?: string[]
  [key: string]: unknown
}
