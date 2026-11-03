/** 后端菜单 name 与小程序页面的唯一映射表。未配置的菜单仍展示，但不跳转 Web 路由。 */
export interface MiniMenuPage {
  route: string
  icon?: string
  hint?: string
}

export const miniMenuPages: Record<string, MiniMenuPage> = {
  // 当前 /auth/user/route 示例中的 System、Monitor、Approval 子菜单尚无对应小程序页面。
  // 后续接入页面时，在这里以后台 name 为键配置小程序 route。
}

/** 后台图标使用 mdi，当前小程序仅内置 Carbon 图标，因此在这里映射一级菜单图标。 */
const firstLevelIcons: Record<string, string> = {
  System: 'i-carbon-settings',
  Monitor: 'i-carbon-dashboard',
  Approval: 'i-carbon-task-approved',
}

export function getMiniMenuIcon(name: string) {
  return miniMenuPages[name]?.icon ?? firstLevelIcons[name] ?? 'i-carbon-folder'
}
