import { http } from '@/http/http'

export interface ApprovalListItem {
  id: string | number
  title: string
  status: string
  currentNodeName?: string
  nodeName?: string
  startTime?: string
  createTime?: string
}

interface ApprovalPage {
  list: ApprovalListItem[]
  total: number
}

/** 我的申请和我的待办均由后端按当前登录用户限定数据范围。 */
export function fetchMyApprovalPage(kind: 'application' | 'task', page: number, size: number) {
  const url = kind === 'application' ? '/approval/instance' : '/approval/task'
  return http.get<ApprovalPage>(url, { page, size })
}
