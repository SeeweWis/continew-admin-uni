import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CustomRequestOptions } from '@/http/types'
import { useTokenStore } from '@/store/token'
import { httpGet, refreshAccessToken } from './http'

const { refreshTokenMock } = vi.hoisted(() => ({ refreshTokenMock: vi.fn() }))

vi.mock('@/api/login', () => ({
  refreshToken: refreshTokenMock,
}))

beforeEach(() => {
  refreshTokenMock.mockResolvedValue({
    accessToken: 'rotated-access-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    refreshToken: 'rotated-refresh-token',
    refreshExpiresIn: 86400,
  })
  vi.mocked(uni.getStorageSync).mockReturnValue(Date.now() + 86400_000)
  useTokenStore().setTokenInfo({
    token: 'expired-access-token',
    tokenType: 'Bearer',
    expiresIn: 0,
    refreshToken: 'refresh-token',
    refreshExpiresIn: 86400,
  })
})

describe('refreshAccessToken', () => {
  it('rotates access and refresh tokens with one shared in-flight request', async () => {
    await Promise.all([refreshAccessToken(), refreshAccessToken()])

    expect(refreshTokenMock).toHaveBeenCalledTimes(1)
    expect(refreshTokenMock).toHaveBeenCalledWith('refresh-token')
    expect(useTokenStore().tokenInfo).toMatchObject({
      token: 'rotated-access-token',
      refreshToken: 'rotated-refresh-token',
    })
  })

  it('replays a 401 request once and preserves its query', async () => {
    useTokenStore().setTokenInfo({
      token: 'access-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      refreshToken: 'refresh-token',
      refreshExpiresIn: 86400,
    })
    vi.mocked(uni.request).mockImplementation((options) => {
      const response = vi.mocked(uni.request).mock.calls.length === 1
        ? { statusCode: 401, data: { code: 401, msg: 'expired' } }
        : { statusCode: 200, data: { code: 200, data: 'ok' } }
      options.success?.(response as never)
      return {} as UniApp.RequestTask
    })

    await expect(httpGet('/items', { page: 2 })).resolves.toBe('ok')

    expect(uni.request).toHaveBeenCalledTimes(2)
    expect(vi.mocked(uni.request).mock.calls.map(([options]) => (options as CustomRequestOptions).query)).toEqual([
      { page: 2 },
      { page: 2 },
    ])
  })
})
