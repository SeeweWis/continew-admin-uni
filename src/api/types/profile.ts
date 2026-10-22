/** 性别：0 未知，1 男，2 女 */
export type Gender = 0 | 1 | 2

export interface ProfileBasicInfoReq {
  nickname: string
  gender: Gender
}

export interface ProfilePasswordReq {
  oldPassword: string
  newPassword: string
}

export interface ProfilePhoneReq {
  phone: string
  captcha: string
  oldPassword: string
}

export interface ProfileEmailReq {
  email: string
  captcha: string
  oldPassword: string
}
