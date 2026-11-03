import { getAllPages } from '@/utils'

export const LOGIN_STRATEGY_MAP = {
  DEFAULT_NO_NEED_LOGIN: 0, // 黑名单策略，默认可以进入APP
  DEFAULT_NEED_LOGIN: 1, // 白名单策略，默认不可以进入APP，需要强制登录
}
// TODO: 1/3 登录策略，默认使用`无需登录策略`，即默认不需要登录就可以访问
export const LOGIN_STRATEGY = LOGIN_STRATEGY_MAP.DEFAULT_NO_NEED_LOGIN
export const isNeedLoginMode = LOGIN_STRATEGY === LOGIN_STRATEGY_MAP.DEFAULT_NEED_LOGIN

// 在 definePage 里面配置了 excludeLoginPath 的页面，功能与 EXCLUDE_LOGIN_PATH_LIST 相同
export const excludeLoginPathList = getAllPages('excludeLoginPath').map(page => page.path)

// 排除在外的列表，白名单策略指白名单列表，黑名单策略指黑名单列表
// TODO: 2/3 在 definePage 配置 excludeLoginPath，或者在下面配置 EXCLUDE_LOGIN_PATH_LIST
export const EXCLUDE_LOGIN_PATH_LIST = [
  '/pages/xxx/index', // 示例值
  '/pages-sub/xxx/index', // 示例值
  ...excludeLoginPathList, // 都是以 / 开头的 path
]

/**
 * 需要有效登录态的路由前缀：业务分包页面
 * 工作台、审批中心和消息页需要登录；扫码和个人中心保持公共页。
 * 未登录或 token 过期时唤起登录弹窗并阻止跳转。
 */
export const NEED_LOGIN_PATH_PREFIXES = [
  '/pages/message',
  '/pages-workbench',
  '/pages-approval',
  '/pages-material',
  '/pages-emergency',
  '/pages-training',
  '/pages-profile',
]

/** 判断路由是否需要登录（业务分包前缀命中即需要） */
export function isNeedLoginPath(path: string) {
  return NEED_LOGIN_PATH_PREFIXES.some(prefix => path.startsWith(prefix))
}
