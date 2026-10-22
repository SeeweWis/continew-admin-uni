export interface MessageQuery {
  page: number
  size: number
  title?: string
  /** 1 系统消息，2 安全消息 */
  type?: 1 | 2
  isRead?: boolean
  [key: string]: unknown
}

export interface MessageItem {
  id: string | number
  title: string
  /** 1 系统消息，2 安全消息 */
  type?: 1 | 2
  path?: string | null
  isRead?: boolean
  readTime?: string | null
  createTime?: string | null
  /** 详情接口返回 */
  content?: string
  /** 详情接口返回：1 所有人，2 指定用户 */
  scope?: 1 | 2
  users?: string[]
}

export interface MessagePage {
  list: MessageItem[]
  total: number
}

export interface MessageUnread {
  total: number
  details?: { type: 1 | 2, count: number }[]
}
