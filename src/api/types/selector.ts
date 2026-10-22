/** 后端 LabelValueResp */
export interface LabelValue {
  label: string
  value: string | number
  disabled?: boolean
  /** 后端 LabelValueResp.extra，类型为 Object */
  extra?: unknown
}

/** 部门树节点（后端 DeptResp + 树形 children） */
export interface DeptTreeNode {
  id: string | number
  parentId?: string | number
  name: string
  /** 状态：1 启用，2 禁用 */
  status?: 1 | 2
  sort?: number
  isSystem?: boolean
  description?: string
  children?: DeptTreeNode[]
  [key: string]: unknown
}

/** 部门树查询参数 */
export interface DeptTreeQuery {
  description?: string
  status?: 1 | 2
  [key: string]: unknown
}
