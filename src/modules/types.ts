export type ModuleTone = 'blue' | 'teal' | 'red' | 'amber'

/** 工作台入口：按角色/权限决定是否展示 */
export interface ModuleMenuItem {
  key: string
  label: string
  hint: string
  icon: string
  tone: ModuleTone
  route: string
  roles?: string[]
  permissions?: string[]
}

/** 扫码前缀与目标页面的映射 */
export interface ModuleScanTarget {
  prefixes: string[]
  label: string
  route: string
}

/** 业务模块清单：菜单与扫码规则都由这里统一声明 */
export interface ModuleManifest {
  key: string
  name: string
  enabled?: boolean
  menus: ModuleMenuItem[]
  scanPrefixes?: ModuleScanTarget[]
}
