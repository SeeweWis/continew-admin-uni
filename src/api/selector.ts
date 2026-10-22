import type { DeptTreeNode, DeptTreeQuery, LabelValue } from './types/selector'
import { http } from '@/http/http'

/** 用户字典（需要 system:user:* 权限） */
export function fetchGetUserDict() {
  return http.get<LabelValue[]>('/system/user/dict')
}

/** 角色字典（需要 system:role:* 权限） */
export function fetchGetRoleDict() {
  return http.get<LabelValue[]>('/system/role/dict')
}

/** 部门树（需要 system:dept:* 权限） */
export function fetchGetDeptTree(params?: DeptTreeQuery) {
  return http.get<DeptTreeNode[]>('/system/dept/tree', params)
}
