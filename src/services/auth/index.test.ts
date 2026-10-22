import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { fetchUserInfo, loginByPassword, loginByWechat, logout } from './index'

const { encryptPasswordMock, getUserInfoMock, loginMock, logoutMock } = vi.hoisted(() => ({
  encryptPasswordMock: vi.fn(),
  getUserInfoMock: vi.fn(),
  loginMock: vi.fn(),
  logoutMock: vi.fn(),
}))

vi.mock('@/http/crypto', () => ({ encryptPassword: encryptPasswordMock }))
vi.mock('@/api/login', () => ({
  getUserInfo: getUserInfoMock,
  login: loginMock,
  logout: logoutMock,
}))

beforeEach(() => {
  getUserInfoMock.mockResolvedValue({
    id: 42,
    username: 'mini-user',
    nickname: 'Mini User',
    avatar: 'https://example.com/avatar.png',
    roles: ['MINI_PROGRAM_USER'],
    permissions: [],
  })
  loginMock.mockResolvedValue({
    accessToken: 'access-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    refreshToken: 'refresh-token',
    refreshExpiresIn: 86400,
  })
  encryptPasswordMock.mockReturnValue('encrypted-password')
})

describe('auth API contract mapping', () => {
  it('sends the WeChat phone authorization code and stores backend token fields', async () => {
    await loginByWechat('phone-code')

    expect(loginMock).toHaveBeenCalledWith({
      clientId: import.meta.env.VITE_APP_CLIENT_ID,
      authType: 'MINI_PROGRAM',
      code: 'phone-code',
    })
    expect(useTokenStore().tokenInfo).toMatchObject({
      token: 'access-token',
      tokenType: 'Bearer',
      refreshToken: 'refresh-token',
    })
    expect(useUserStore().userInfo).toMatchObject({
      userId: 42,
      username: 'mini-user',
      nickname: 'Mini User',
      roles: ['MINI_PROGRAM_USER'],
    })
  })

  it('maps the flat backend user-info response', async () => {
    await expect(fetchUserInfo()).resolves.toMatchObject({ userId: 42, username: 'mini-user' })
  })

  it('sends ACCOUNT credentials using the RSA-encrypted password and captcha fields', async () => {
    await loginByPassword({ username: 'mini-user', password: 'secret', captcha: 'ABCD', uuid: 'captcha-id' })

    expect(encryptPasswordMock).toHaveBeenCalledWith('secret', import.meta.env.VITE_API_ENCRYPT_PUBLIC_KEY)
    expect(loginMock).toHaveBeenCalledWith({
      clientId: import.meta.env.VITE_APP_CLIENT_ID,
      authType: 'ACCOUNT',
      username: 'mini-user',
      password: 'encrypted-password',
      captcha: 'ABCD',
      uuid: 'captcha-id',
    })
  })

  it('sends the refresh token when revoking the login session', async () => {
    useTokenStore().setTokenInfo({
      token: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshToken: 'refresh-token',
      refreshExpiresIn: 86400,
    })

    await logout()

    expect(logoutMock).toHaveBeenCalledWith('refresh-token')
    expect(useTokenStore().tokenInfo.token).toBe('')
  })
})
