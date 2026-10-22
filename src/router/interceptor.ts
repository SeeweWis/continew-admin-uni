import { useTokenStore } from '@/store/token'
import { tabbarStore } from '@/tabbar/store'
import { getLastPage, parseUrlToObj } from '@/utils/index'
import { openLoginPopup } from '@/utils/loginPopup'
import { isNeedLoginPath } from './config'

export const FG_LOG_ENABLE = false

export const navigateToInterceptor = {
  // 注意，这里的url是 '/' 开头的，如 '/pages/work/index'，跟 'pages.json' 里面的 path 不同
  // 增加对相对路径的处理，BY 网友 @ideal
  invoke({ url, query }: { url: string, query?: Record<string, string> }) {
    if (url === undefined) {
      return
    }
    let { path, query: _query } = parseUrlToObj(url)

    FG_LOG_ENABLE && console.log('\n\n路由拦截器:-------------------------------------')
    FG_LOG_ENABLE && console.log('路由拦截器 1: url->', url, ', query ->', query)
    const myQuery = { ..._query, ...query }
    // /pages/route-interceptor/index?name=feige&age=30
    FG_LOG_ENABLE && console.log('路由拦截器 2: path->', path, ', _query ->', _query)
    FG_LOG_ENABLE && console.log('路由拦截器 3: myQuery ->', myQuery)

    // 处理相对路径
    if (!path.startsWith('/')) {
      const currentPath = getLastPage()?.route || ''
      const normalizedCurrentPath = currentPath.startsWith('/') ? currentPath : `/${currentPath}`
      const baseDir = normalizedCurrentPath.substring(0, normalizedCurrentPath.lastIndexOf('/'))
      path = `${baseDir}/${path}`
    }

    // // 处理路由不存在的情况
    // if (path !== '/' && !getAllPages().some(page => page.path === path)) {
    //   console.warn('路由不存在:', path)
    //   return false // 明确表示阻止原路由继续执行
    // }

    // // 插件页面
    // if (url.startsWith('plugin://')) {
    //   FG_LOG_ENABLE && console.log('路由拦截器 4: plugin:// 路径 ==>', url)
    //   path = url
    // }

    // 处理直接进入路由非首页时，tabbarIndex 不正确的问题
    tabbarStore.setAutoCurIdx(path)

    const tokenStore = useTokenStore()

    // 已登录（含本地 token 未过期）直接放行；小程序端登录为弹窗式（无登录页），
    // 业务分包页面需要有效登录态，未登录或 token 过期时唤起登录弹窗并阻止本次路由；
    // 运行中 token 被服务端判定失效的场景由 http 层 401 分支兜底（清登录态 + 唤起弹窗）
    if (tokenStore.updateNowTime().hasLogin) {
      return true
    }
    if (isNeedLoginPath(path)) {
      openLoginPopup()
      return false
    }
    return true
  },
}

// 针对 chooseLocation 的特殊处理
export const chooseLocationInterceptor = {
  invoke(options: any) {
    // 直接放行 chooseLocation 调用
    FG_LOG_ENABLE && console.log('chooseLocation 调用，直接放行:', options)
    return true
  },
}

export const routeInterceptor = {
  install() {
    uni.addInterceptor('navigateTo', navigateToInterceptor)
    uni.addInterceptor('reLaunch', navigateToInterceptor)
    uni.addInterceptor('redirectTo', navigateToInterceptor)
    uni.addInterceptor('switchTab', navigateToInterceptor)

    // 添加 chooseLocation 的拦截器，确保直接放行
    uni.addInterceptor('chooseLocation', chooseLocationInterceptor)
  },
}
