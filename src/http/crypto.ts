import { JSEncrypt } from 'jsencrypt'

export function encryptPassword(password: string, publicKey: string) {
  if (!publicKey) {
    throw new Error('未配置 VITE_API_ENCRYPT_PUBLIC_KEY')
  }

  const rsa = new JSEncrypt()
  rsa.setPublicKey(publicKey)
  const encryptedPassword = rsa.encrypt(password)
  if (!encryptedPassword) {
    throw new Error('RSA 公钥加密密码失败')
  }
  return encryptedPassword
}
