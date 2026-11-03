import type { CustomRequestOptions, HttpError, IResponse } from '@/http/types'
import { useUserStore } from '@/store/user'
import { getRefreshTokenExpireTime, useTokenStore } from '@/store/token'
import { openLoginPopup } from '@/utils/loginPopup'
import { createHttpError, getResponseMessage, HttpErrorType, isSuccessResultCode, ResultEnum, ShowMessage } from './tools/enum'
import { refreshToken as refreshTokenApi } from '@/api/login'

let refreshPromise: Promise<void> | undefined
let refreshSessionVersion: number | undefined

export async function refreshAccessToken() {
  const tokenStore = useTokenStore()
  const sessionVersion = tokenStore.sessionVersion
  if (!refreshPromise || refreshSessionVersion !== sessionVersion) {
    refreshSessionVersion = sessionVersion
    const pending = (async () => {
      const refreshToken = tokenStore.tokenInfo.refreshToken
      const refreshExpiry = getRefreshTokenExpireTime()
      if (!refreshToken || !refreshExpiry || Date.now() >= refreshExpiry)
        throw new Error('刷新令牌已过期')

      const result = await refreshTokenApi(refreshToken)
      if (tokenStore.sessionVersion !== sessionVersion)
        throw new Error('登录状态已变更')
      if (!result.accessToken || !result.expiresIn)
        throw new Error('刷新响应缺少访问令牌')
      tokenStore.setTokenInfo({
        token: result.accessToken,
        tokenType: result.tokenType,
        expiresIn: result.expiresIn,
        refreshToken: result.refreshToken || refreshToken,
        refreshExpiresIn: result.refreshExpiresIn ?? Math.max(0, Math.floor((refreshExpiry - Date.now()) / 1000)),
      }, true)
    })().finally(() => {
      if (refreshPromise === pending) {
        refreshPromise = undefined
        refreshSessionVersion = undefined
      }
    })
    refreshPromise = pending
  }
  return refreshPromise
}

export async function waitForTokenRefresh() {
  if (!refreshPromise)
    return true
  try {
    await refreshPromise
    return true
  }
  catch {
    return false
  }
}

export async function ensureAccessToken() {
  const tokenStore = useTokenStore().updateNowTime()
  const sessionVersion = tokenStore.sessionVersion
  if (!tokenStore.validToken && tokenStore.tokenInfo.token && tokenStore.tokenInfo.refreshToken) {
    try {
      await refreshAccessToken()
    }
    catch (error) {
      if (tokenStore.sessionVersion === sessionVersion)
        clearExpiredSession()
      throw createHttpError({
        type: HttpErrorType.Auth,
        message: error instanceof Error ? error.message : '登录已过期，请重新登录',
        raw: error,
      })
    }
  }
}

function clearExpiredSession() {
  useTokenStore().clear()
  useUserStore().clearUserInfo()
  openLoginPopup()
}

export function http<T>(options: CustomRequestOptions) {
  if (!options.skipAuthRefresh) {
    const sessionVersion = useTokenStore().sessionVersion
    return ensureAccessToken().then(() => {
      if (useTokenStore().sessionVersion !== sessionVersion)
        throw createHttpError({ type: HttpErrorType.Auth, message: '登录状态已变更' })
      return sendRequest<T>(options)
    })
  }
  return sendRequest<T>(options)
}

function sendRequest<T>(options: CustomRequestOptions) {
  const tokenStore = useTokenStore()
  const sessionVersion = tokenStore.sessionVersion
  const requestToken = tokenStore.tokenInfo.token
  // 1. 返回 Promise 对象
  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...options,
      // UniApp 类型未声明 PATCH，但部分平台运行时支持；个人资料/消息接口依赖 PATCH
      method: options.method as UniApp.RequestOptions['method'],
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      // 响应成功
      success: async (res) => {
        const responseData = res.data as Partial<IResponse<T>>
        const code = responseData?.code

        // 检查是否是401错误（包括HTTP状态码401或业务码401）
        const isTokenExpired = res.statusCode === 401 || Number(code) === ResultEnum.Unauthorized

        if (isTokenExpired) {
          if (!options.skipAuthRefresh && tokenStore.sessionVersion !== sessionVersion) {
            return reject(createHttpError({ type: HttpErrorType.Auth, code, statusCode: res.statusCode, message: '登录状态已变更', raw: res }))
          }
          if (!options.skipAuthRefresh && !options.authRefreshRetried && tokenStore.tokenInfo.refreshToken) {
            try {
              if (requestToken === tokenStore.tokenInfo.token)
                await refreshAccessToken()
            }
            catch {
              if (tokenStore.sessionVersion === sessionVersion)
                clearExpiredSession()
              return reject(createHttpError({
                type: HttpErrorType.Auth,
                code,
                statusCode: res.statusCode,
                message: getResponseMessage(responseData, '登录已过期，请重新登录'),
                data: responseData?.data,
                raw: res,
              }))
            }
            if (tokenStore.sessionVersion !== sessionVersion)
              return reject(createHttpError({ type: HttpErrorType.Auth, code, statusCode: res.statusCode, message: '登录状态已变更', raw: res }))
            return http<T>({ ...options, authRefreshRetried: true }).then(resolve, reject)
          }

          if (options.skipAuthRefresh) {
            return reject(createHttpError({
              type: HttpErrorType.Auth,
              code,
              statusCode: res.statusCode,
              message: getResponseMessage(responseData, '登录已过期，请重新登录'),
              data: responseData?.data,
              raw: res,
            }))
          }

          const authMessage = getResponseMessage(responseData, '登录已过期，请重新登录')
          uni.showToast({ icon: 'none', title: authMessage })
          clearExpiredSession()
          return reject(createHttpError({
            type: HttpErrorType.Auth,
            code,
            statusCode: res.statusCode,
            message: authMessage,
            data: responseData?.data,
            raw: res,
          }))
        }

        // 处理其他成功状态（HTTP状态码200-299）
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 处理业务逻辑错误
          if (!isSuccessResultCode(code as number)) {
            const httpError = createHttpError({
              type: HttpErrorType.Business,
              code,
              statusCode: res.statusCode,
              message: getResponseMessage(responseData),
              data: responseData?.data,
              raw: responseData,
            })

            if (!options.hideErrorToast) {
              uni.showToast({
                icon: 'none',
                title: httpError.message,
              })
            }
            return reject(httpError)
          }
          return resolve(responseData.data as T)
        }

        // 处理其他错误
        const httpError = createHttpError({
          type: HttpErrorType.Http,
          code,
          statusCode: res.statusCode,
          message: getResponseMessage(responseData, ShowMessage(res.statusCode)),
          data: responseData?.data,
          raw: res,
        })

        if (!options.hideErrorToast) {
          uni.showToast({
            icon: 'none',
            title: httpError.message,
          })
        }
        reject(httpError)
      },
      // 响应失败
      fail(err) {
        const httpError = createHttpError({
          type: HttpErrorType.Network,
          message: '网络错误，换个网络试试',
          raw: err,
        } satisfies HttpError)

        if (!options.hideErrorToast) {
          uni.showToast({
            icon: 'none',
            title: httpError.message,
          })
        }
        reject(httpError)
      },
    })
  })
}

/**
 * GET 请求
 * @param url 后台地址
 * @param query 请求query参数
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpGet<T>(url: string, query?: Record<string, unknown>, header?: Record<string, unknown>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'GET',
    header,
    ...options,
  })
}

/**
 * POST 请求
 * @param url 后台地址
 * @param data 请求body参数
 * @param query 请求query参数，post请求也支持query，很多微信接口都需要
 * @param header 请求头，默认为json格式
 * @returns
 */
export function httpPost<T>(url: string, data?: unknown, query?: Record<string, unknown>, header?: Record<string, unknown>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    data,
    method: 'POST',
    header,
    ...options,
  })
}
/**
 * PUT 请求
 */
export function httpPut<T>(url: string, data?: unknown, query?: Record<string, unknown>, header?: Record<string, unknown>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    data,
    query,
    method: 'PUT',
    header,
    ...options,
  })
}

/**
 * DELETE 请求（无请求体，仅 query）
 */
export function httpDelete<T>(url: string, query?: Record<string, unknown>, header?: Record<string, unknown>, options?: Partial<CustomRequestOptions>) {
  return http<T>({
    url,
    query,
    method: 'DELETE',
    header,
    ...options,
  })
}

// 支持与 axios 类似的API调用
http.get = httpGet
http.post = httpPost
http.put = httpPut
http.delete = httpDelete

// 支持与 alovaJS 类似的API调用
http.Get = httpGet
http.Post = httpPost
http.Put = httpPut
http.Delete = httpDelete
