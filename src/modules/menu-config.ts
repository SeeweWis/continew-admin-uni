/** 后端菜单 name 与小程序页面的唯一映射表。未配置的菜单仍展示，但不跳转 Web 路由。 */
export interface MiniMenuPage {
  route: string
  hint?: string
}

export const miniMenuPages: Record<string, MiniMenuPage> = {
  // 当前 /auth/user/route 示例中的 System、Monitor、Approval 子菜单尚无对应小程序页面。
  // 后续接入页面时，在这里以后台 name 为键配置小程序 route。
}

/** 图标由后台统一配置，缺失、非法或字体中不存在的名称显示文件夹。 */
export function getMiniMenuIcon(icon?: string) {
  return typeof icon === 'string' && /^mdi:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon)
    ? `mdi mdi-${icon.slice(4)}`
    : 'mdi mdi-folder-outline'
}
