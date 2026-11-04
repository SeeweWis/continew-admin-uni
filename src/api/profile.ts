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

/** 微信头像临时文件需按后端的 PATCH multipart/avatarFile 契约提交。 */
export async function fetchUpdateProfileAvatar(filePath: string): Promise<{ avatar: string }> {
  // #ifdef MP-WEIXIN
  const file = await new Promise<ArrayBuffer>((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath,
      success: ({ data }) => data instanceof ArrayBuffer ? resolve(data) : reject(new Error('头像文件读取失败')),
      fail: () => reject(new Error('头像文件读取失败')),
    })
  })
  const bytes = new Uint8Array(file)
  if (!bytes.length || bytes.length > 10 * 1024 * 1024)
    throw new Error('头像大小不能超过 10MB')

  const format = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47
    ? { extension: 'png', mime: 'image/png' }
    : bytes[0] === 0xFF && bytes[1] === 0xD8
      ? { extension: 'jpg', mime: 'image/jpeg' }
      : bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46
        ? { extension: 'gif', mime: 'image/gif' }
        : null
  if (!format)
    throw new Error('头像仅支持 JPG、PNG、GIF 格式')

  const boundary = `----uni-avatar-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const header = `--${boundary}\r\n`
    + `Content-Disposition: form-data; name="avatarFile"; filename="avatar.${format.extension}"\r\n`
    + `Content-Type: ${format.mime}\r\n\r\n`
  const footer = `\r\n--${boundary}--\r\n`
  const head = new Uint8Array(header.split('').map(char => char.charCodeAt(0)))
  const tail = new Uint8Array(footer.split('').map(char => char.charCodeAt(0)))
  const body = new Uint8Array(head.length + bytes.length + tail.length)
  body.set(head)
  body.set(bytes, head.length)
  body.set(tail, head.length + bytes.length)
  return http<{ avatar: string }>({
    url: '/user/profile/avatar',
    method: 'PATCH',
    header: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    data: body.buffer,
    hideErrorToast: true,
  })
  // #endif

  // #ifndef MP-WEIXIN
  throw new Error('当前平台不支持微信头像上传')
  // #endif
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
