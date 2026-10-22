/** 公告分页查询参数 */
export interface NoticeQuery {
  page: number
  size: number
  title?: string
  /** 分类（字典 notice_type） */
  type?: string
  [key: string]: unknown
}

/** 公告列表/详情（后端 NoticeResp / NoticeDetailResp） */
export interface NoticeItem {
  id: string | number
  title: string
  type?: string | null
  /** 通知范围：1 所有人，2 指定用户 */
  noticeScope?: 1 | 2
  noticeUsers?: string[]
  /** 通知方式：1 系统消息，2 登录弹窗 */
  noticeMethods?: (1 | 2)[]
  isTiming?: boolean
  publishTime?: string
  isTop?: boolean
  /** 状态：1 待发布，2 已发布，3 已撤回 */
  status?: 1 | 2 | 3
  isRead?: boolean
  /** 详情内容 */
  content?: string
  createUserString?: string
  createTime?: string
}

export interface NoticePage {
  list: NoticeItem[]
  total: number
}
