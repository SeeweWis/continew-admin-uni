import { reactive } from 'vue'

/**
 * 页面级导航栏注册表：
 * 页面模板中自行渲染 <fg-navbar>（需要使用左右插槽时）会注册其路由，
 * 布局中挂载的全局导航栏（global 实例）对同路由自动隐藏，避免出现双导航栏。
 * 以路由为键，页面栈中多页面并存时互不影响。
 */
export const navbarState = reactive({
  customRoutes: new Set<string>(),
})

/** 扫码页：满屏摄像头，滚动区关闭滚动 */
export const SCAN_PAGE = '/pages-scan/index'

export function useNavbarRegistry() {
  function register(path: string) {
    navbarState.customRoutes.add(path)
  }
  function unregister(path: string) {
    navbarState.customRoutes.delete(path)
  }
  return { register, unregister }
}
