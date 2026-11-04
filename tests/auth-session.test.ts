import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { http, refreshAccessToken } from '../src/http/http'
import { fetchUserInfo, logout } from '../src/services/auth'
import { useTokenStore } from '../src/store/token'
import { useUserStore } from '../src/store/user'

vi.mock('../src/utils/loginPopup', () => ({ openLoginPopup: vi.fn() }))

interface Request { url: string, data?: unknown, header?: Record<string, string>, success: (res: unknown) => void }
let requests: Request[]
let storage: Record<string, unknown>

function respond(request: Request, code: string, data: unknown = null) {
  request.success({ statusCode: 200, data: { code, data, msg: 'response' } })
}

async function flush() {
  for (let i = 0; i < 8; i++)
    await Promise.resolve()
}

function signIn(token = 'access-1', refreshToken = 'refresh-1') {
  useTokenStore().setTokenInfo({ token, tokenType: 'Bearer', expiresIn: 3600, refreshToken, refreshExpiresIn: 7200 })
  useUserStore().setUserInfo({ userId: 1, username: 'user', nickname: 'User', avatar: '' })
}

beforeEach(() => {
  requests = []
  storage = {}
  vi.stubGlobal('uni', {
    getStorageSync: (key: string) => storage[key],
    setStorageSync: (key: string, value: unknown) => { storage[key] = value },
    removeStorageSync: (key: string) => { delete storage[key] },
    showToast: vi.fn(),
    request: (options: Request) => { requests.push(options) },
  })
  setActivePinia(createPinia())
})

describe('authentication session', () => {
  it('refreshes once for concurrent string 401 responses and retries late responses with the new token', async () => {
    signIn()
    const first = http<string>({ url: '/first' })
    const second = http<string>({ url: '/second' })
    await flush()
    const [request1, request2] = requests
    respond(request1, '401')
    await flush()
    expect(requests.filter(item => item.url === '/auth/refresh')).toHaveLength(1)
    respond(requests[2], '0', { accessToken: 'access-2', tokenType: 'Bearer', expiresIn: 3600, refreshToken: 'refresh-2', refreshExpiresIn: 7200 })
    await flush()
    respond(request2, '401')
    await flush()
    expect(requests.filter(item => item.url === '/auth/refresh')).toHaveLength(1)
    expect(useTokenStore().tokenInfo.token).toBe('access-2')
    respond(requests.find((item, index) => index > 2 && item.url === '/first')!, '0', 'one')
    respond(requests.find((item, index) => index > 2 && item.url === '/second')!, '0', 'two')
    await expect(Promise.all([first, second])).resolves.toEqual(['one', 'two'])
  })

  it('uses the rotated refresh token for logout and clears local state before the response', async () => {
    signIn()
    const refreshing = refreshAccessToken()
    const exiting = logout()
    respond(requests[0], '0', { accessToken: 'access-2', tokenType: 'Bearer', expiresIn: 3600, refreshToken: 'refresh-2', refreshExpiresIn: 7200 })
    await refreshing
    await flush()
    const request = requests.find(item => item.url === '/auth/logout')!
    expect(request.data).toEqual({ refreshToken: 'refresh-2' })
    expect(request.header?.Authorization).toBe('Bearer access-2')
    expect(useTokenStore().tokenInfo.token).toBe('')
    expect(useUserStore().userInfo.userId).toBe(-1)
    respond(request, '0')
    await exiting
  })

  it('clears local state and skips logout when token refresh fails', async () => {
    signIn()
    const refreshing = refreshAccessToken().catch(() => {})
    const exiting = logout()
    await flush()
    respond(requests[0], '401')
    await refreshing

    expect(await exiting).toBe(false)
    expect(requests.filter(item => item.url === '/auth/logout')).toHaveLength(0)
    expect(useTokenStore().tokenInfo.token).toBe('')
    expect(useUserStore().userInfo.userId).toBe(-1)
  })

  it('does not restore user information or clear a new session when an old request completes', async () => {
    signIn()
    const userRequest = fetchUserInfo()
    const stale = http({ url: '/protected' })
    const userResult = userRequest.catch(error => error)
    const staleResult = stale.catch(error => error)
    await flush()
    const [oldUser, oldProtected] = requests
    useTokenStore().clear()
    useUserStore().clearUserInfo()
    signIn('new-access', 'new-refresh')
    respond(oldUser, '0', { id: 99, username: 'old' })
    respond(oldProtected, '401')
    await Promise.all([userResult, staleResult])
    expect(useUserStore().userInfo.username).toBe('user')
    expect(useTokenStore().tokenInfo.token).toBe('new-access')
    expect(requests.filter(item => item.url === '/auth/refresh')).toHaveLength(0)
  })

  it('clears the session when refresh is rejected', async () => {
    signIn()
    const result = http({ url: '/protected' }).catch(error => error)
    await flush()
    respond(requests[0], '401')
    await flush()
    respond(requests[1], '401')
    expect((await result).type).toBe('auth')
    expect(useTokenStore().tokenInfo.token).toBe('')
    expect(useUserStore().userInfo.userId).toBe(-1)
  })

  it('keeps local state cleared if the logout request fails', async () => {
    signIn()
    const exiting = logout()
    await flush()
    expect(requests[0].url).toBe('/auth/logout')
    expect(useTokenStore().tokenInfo.token).toBe('')
    respond(requests[0], '401')
    await exiting
    expect(useUserStore().userInfo.userId).toBe(-1)
  })

  it('leaves logout failure notification to the caller', async () => {
    signIn()
    const exiting = logout()
    await flush()
    respond(requests[0], '500')
    expect(await exiting).toBe(false)
    expect(uni.showToast).not.toHaveBeenCalled()
  })
})
