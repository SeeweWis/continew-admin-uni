import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

/** 本地缓存的访问令牌和刷新令牌 */
export interface ITokenInfo {
  token: string
  tokenType: string
  /** 有效期（秒） */
  expiresIn: number
  refreshToken: string
  refreshExpiresIn: number
}

// 初始化状态（单 token 模式）
const tokenInfoState: ITokenInfo = {
  token: '',
  tokenType: 'Bearer',
  expiresIn: 0,
  refreshToken: '',
  refreshExpiresIn: 0,
}

const ACCESS_TOKEN_EXPIRE_KEY = 'accessTokenExpireTime'
const REFRESH_TOKEN_EXPIRE_KEY = 'refreshTokenExpireTime'

/** 读取本地时间戳并校验类型，非法值按已过期（0）处理 */
function readStorageTimestamp(key: string): number {
  const value = uni.getStorageSync(key)
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }
  return 0
}

export function getAccessTokenExpireTime() {
  return readStorageTimestamp(ACCESS_TOKEN_EXPIRE_KEY)
}

export function getRefreshTokenExpireTime() {
  return readStorageTimestamp(REFRESH_TOKEN_EXPIRE_KEY)
}

/**
 * 登录态状态仓库：只负责 token 的缓存、过期判断与持久化
 * 登录/退出的整合流程见 @/services/auth
 */
export const useTokenStore = defineStore(
  'token',
  () => {
    const tokenInfo = ref<ITokenInfo>({ ...tokenInfoState })
    const sessionVersion = ref(0)

    // 添加一个时间戳 ref 作为响应式依赖
    const nowTime = ref(Date.now())
    /**
     * 更新响应式数据:now
     * 确保isTokenExpired重新计算,而不是用错误过期缓存值
     * 可useTokenStore内部适时调用;也可链式调用:tokenStore.updateNowTime().hasLogin
     * @returns 最新的tokenStore实例
     */
    const updateNowTime = () => {
      nowTime.value = Date.now()
      return useTokenStore()
    }

    /**
     * 写入 token 并记录过期时间
     */
    const setTokenInfo = (val: ITokenInfo, preserveSession = false) => {
      if (!preserveSession)
        sessionVersion.value++
      updateNowTime()
      tokenInfo.value = val
      uni.setStorageSync(ACCESS_TOKEN_EXPIRE_KEY, Date.now() + val.expiresIn * 1000)
      uni.setStorageSync(REFRESH_TOKEN_EXPIRE_KEY, Date.now() + val.refreshExpiresIn * 1000)
    }

    /**
     * 清除本地登录态
     */
    const clear = () => {
      sessionVersion.value++
      updateNowTime()
      // 清除存储的过期时间
      uni.removeStorageSync(ACCESS_TOKEN_EXPIRE_KEY)
      uni.removeStorageSync(REFRESH_TOKEN_EXPIRE_KEY)
      tokenInfo.value = { ...tokenInfoState }
      uni.removeStorageSync('token')
    }

    /**
     * 判断token是否过期
     */
    const isTokenExpired = computed(() => {
      // 必须先读取响应式 nowTime：storage 中的过期时间不是响应式的，
      // 若首次评估时直接 return（无过期时间），computed 会因没有依赖而永久缓存，
      // 导致登录写入 token 后 validToken 仍一直为空。
      const now = nowTime.value
      const expireTime = getAccessTokenExpireTime()
      if (!expireTime)
        return true
      return now >= expireTime
    })

    /**
     * 获取有效的token（已过期则返回空）
     * 建议这样使用 tokenStore.updateNowTime().validToken
     */
    const getValidToken = computed(() => {
      if (isTokenExpired.value) {
        return ''
      }
      return tokenInfo.value.token
    })

    /**
     * 检查是否有登录信息（不考虑token是否过期）
     */
    const hasLoginInfo = computed(() => {
      return !!tokenInfo.value?.token
    })

    const hasValidRefreshToken = computed(() => {
      const expireTime = getRefreshTokenExpireTime()
      return !!tokenInfo.value.refreshToken && !!expireTime && nowTime.value < expireTime
    })

    /**
     * 检查是否已登录且token有效
     * 建议这样使用tokenStore.updateNowTime().hasLogin
     */
    const hasValidLogin = computed(() => {
      return hasLoginInfo.value && (!isTokenExpired.value || hasValidRefreshToken.value)
    })

    return {
      // 认证状态判断（最常用的）
      hasLogin: hasValidLogin,

      // 内部系统使用的方法
      validToken: getValidToken,

      // 调试或特殊场景可能需要直接访问的信息
      tokenInfo,
      sessionVersion,
      setTokenInfo,
      clear,
      updateNowTime,
    }
  },
  {
    // 添加持久化配置，确保刷新页面后token信息不丢失
    persist: { paths: ['tokenInfo'] },
  },
)
