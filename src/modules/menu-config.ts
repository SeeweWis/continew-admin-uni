/** 后端菜单 name 与小程序页面的唯一映射表。未配置的菜单仍展示，但不跳转 Web 路由。 */
export interface MiniMenuPage {
  route: string
  hint?: string
}

export const miniMenuPages: Record<string, MiniMenuPage> = {
  // 键 = sys_menu.name（client_type='XCX'），route = pages.config.ts 注册的页面路径
  MiniProfile: { route: '/pages/profile/index' },
  MiniMessage: { route: '/pages/message/index' },
  MiniApproval: { route: '/pages-approval/index' },
  MiniApprovalApplication: { route: '/pages-approval/list/index?kind=application' },
  MiniApprovalTask: { route: '/pages-approval/list/index?kind=task' },
  MiniCabinetCheck: { route: '/pages-material/cabinet/check/index' },
  MiniEmergencyEvent: { route: '/pages-emergency/event/register/index' },
  MiniEmergencyPoints: { route: '/pages-emergency/points/index/index' },
  MiniMaterialInbound: { route: '/pages-material/stock/inbound/index' },
  MiniMaterialRequisition: { route: '/pages-material/requisition/list/index' },
  MiniMaterialStocktake: { route: '/pages-material/stock/stocktake/index' },
  MiniTraining: { route: '/pages-training/activity/list/index' },
}

/** 图标由后台统一配置，缺失、非法或字体中不存在的名称显示文件夹。 */
export function getMiniMenuIcon(icon?: string) {
  return typeof icon === 'string' && /^mdi:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(icon)
    ? `mdi mdi-${icon.slice(4)}`
    : 'mdi mdi-folder-outline'
}
