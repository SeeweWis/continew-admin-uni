import type {
  ProfileBasicInfoReq,
  ProfileEmailReq,
  ProfilePasswordReq,
  ProfilePhoneReq,
} from './types/profile'
import { http } from '@/http/http'
import { encryptPassword } from '@/http/crypto'

const getPublicKey = () => import.meta.env.VITE_API_ENCRYPT_PUBLIC_KEY

/** 修改昵称和性别 */
export function fetchUpdateProfileBasic(data: ProfileBasicInfoReq) {
  return http<void>({
    url: '/user/profile/basic/info',
    method: 'PATCH',
    data,
  })
}

/** 修改密码（当前密码和新密码均由 RSA 公钥加密） */
export function fetchUpdateProfilePassword(data: ProfilePasswordReq) {
  const publicKey = getPublicKey()
  return http<void>({
    url: '/user/profile/password',
    method: 'PATCH',
    data: {
      oldPassword: encryptPassword(data.oldPassword, publicKey),
      newPassword: encryptPassword(data.newPassword, publicKey),
    },
  })
}

/** 修改手机号（当前密码 RSA 加密） */
export function fetchUpdateProfilePhone(data: ProfilePhoneReq) {
  return http<void>({
    url: '/user/profile/phone',
    method: 'PATCH',
    data: {
      phone: data.phone,
      captcha: data.captcha,
      oldPassword: encryptPassword(data.oldPassword, getPublicKey()),
    },
  })
}

/** 修改邮箱（当前密码 RSA 加密） */
export function fetchUpdateProfileEmail(data: ProfileEmailReq) {
  return http<void>({
    url: '/user/profile/email',
    method: 'PATCH',
    data: {
      email: data.email,
      captcha: data.captcha,
      oldPassword: encryptPassword(data.oldPassword, getPublicKey()),
    },
  })
}
