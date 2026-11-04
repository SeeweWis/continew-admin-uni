import type { IUserInfoRes } from '@/api/types/login'
import type { ModuleManifest, ModuleMenuItem, ModuleScanTarget } from './types'

const ALL_ROLE = '*'
const ALL_PERMISSION = '*:*:*'
const SUPER_ADMIN_ROLE = 'superadmin'

/** 未匹配到扫码前缀时的兜底页面 */
export const DEFAULT_SCAN_ROUTE = '/pages-material/material/detail/index'

/** 业务模块注册表：工作台入口与扫码分发共用这一份清单 */
export const modules: ModuleManifest[] = [
  {
    key: 'material',
    name: '物资管理',
    scanPrefixes: [
      { prefixes: ['MAT', 'WL'], label: '物资码', route: '/pages-material/material/detail/index' },
      { prefixes: ['STK', 'PD'], label: '盘点码', route: '/pages-material/stock/stocktake/index' },
      { prefixes: ['CAB', 'YJG'], label: '应急柜码', route: '/pages-material/cabinet/check/index' },
    ],
    menus: [
      {
        key: 'requisition-apply',
        label: '领用申请',
        hint: '提交物资领用',
        icon: 'mdi mdi-package-variant-closed',
        tone: 'blue',
        route: '/pages-material/requisition/apply/index',
        roles: ['*'],
      },
      {
        key: 'requisition-approval',
        label: '领用审批',
        hint: '处理待审批申请',
        icon: 'mdi mdi-clipboard-check-outline',
        tone: 'amber',
        route: '/pages-workbench/approval/detail/index',
        roles: ['leader'],
        permissions: ['material:requisition:audit'],
      },
      {
        key: 'stocktake',
        label: '库存盘点',
        hint: '核对账实差异',
        icon: 'mdi mdi-clipboard-list-outline',
        tone: 'teal',
        route: '/pages-material/stock/stocktake/index',
        roles: ['warehouse'],
        permissions: ['material:stocktake:check'],
      },
      {
        key: 'cabinet-check',
        label: '应急柜点检',
        hint: '确认柜内物资状态',
        icon: 'mdi mdi-shield-check-outline',
        tone: 'red',
        route: '/pages-material/cabinet/check/index',
        roles: ['emergency', 'warehouse'],
        permissions: ['material:cabinet:query'],
      },
      {
        key: 'inbound',
        label: '入库登记',
        hint: '登记物资入库',
        icon: 'mdi mdi-download',
        tone: 'blue',
        route: '/pages-material/stock/inbound/index',
        roles: ['warehouse'],
        permissions: ['material:inbound:add'],
      },
      {
        key: 'outbound',
        label: '出库登记',
        hint: '登记物资出库',
        icon: 'mdi mdi-upload',
        tone: 'amber',
        route: '/pages-material/requisition/outbound/index',
        roles: ['warehouse'],
        permissions: ['material:outbound:add'],
      },
    ],
  },
  {
    key: 'emergency',
    name: '应急管理',
    menus: [
      {
        key: 'emergency-points',
        label: '应急点位',
        hint: '查看应急物资点位',
        icon: 'mdi mdi-alert-outline',
        tone: 'red',
        route: '/pages-emergency/points/index/index',
        roles: ['*'],
      },
      {
        key: 'event-register',
        label: '事件登记',
        hint: '记录应急事件',
        icon: 'mdi mdi-file-chart-outline',
        tone: 'red',
        route: '/pages-emergency/event/register/index',
        roles: ['emergency'],
      },
    ],
  },
  {
    key: 'training',
    name: '培训学习',
    scanPrefixes: [
      { prefixes: ['ACT', 'QD'], label: '签到码', route: '/pages-training/activity/sign/index' },
    ],
    menus: [
      {
        key: 'safety-learning',
        label: '安全学习',
        hint: '培训学习入口',
        icon: 'mdi mdi-school-outline',
        tone: 'teal',
        route: '/pages-workbench/training/index',
        roles: ['*'],
      },
      {
        key: 'training-activity',
        label: '活动管理',
        hint: '组织线下活动',
        icon: 'mdi mdi-school-outline',
        tone: 'teal',
        route: '/pages-training/activity/list/index',
        roles: ['trainer'],
      },
    ],
  },
]

export function getEnabledModules() {
  return modules.filter(module => module.enabled !== false)
}

function matches(required: string[] | undefined, actual: string[], wildcard: string) {
  return !required?.length
    || required.includes(wildcard)
    || actual.includes(wildcard)
    || required.some(value => actual.includes(value))
}

/** 按角色与权限过滤工作台入口 */
export function getVisibleWorkbenchMenus(
  userInfo: Pick<IUserInfoRes, 'roles' | 'permissions'>,
): ModuleMenuItem[] {
  const menus = getEnabledModules().flatMap(module => module.menus)
  const roles = userInfo.roles ?? []
  const permissions = userInfo.permissions ?? []

  if (roles.includes(SUPER_ADMIN_ROLE) || permissions.includes(ALL_PERMISSION)) {
    return menus
  }

  return menus.filter(item =>
    matches(item.roles, roles, ALL_ROLE)
    && matches(item.permissions, permissions, ALL_PERMISSION),
  )
}

/** 按编码前缀匹配扫码目标，未匹配时返回 undefined */
export function resolveScanTarget(code: string): ModuleScanTarget | undefined {
  const upperCode = code.toUpperCase()
  for (const module of getEnabledModules()) {
    for (const target of module.scanPrefixes ?? []) {
      if (target.prefixes.some(prefix => upperCode.startsWith(prefix.toUpperCase()))) {
        return target
      }
    }
  }
  return undefined
}
