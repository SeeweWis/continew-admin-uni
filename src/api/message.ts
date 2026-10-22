import type { MessageItem, MessagePage, MessageQuery, MessageUnread } from './types/message'
import type { NoticeItem, NoticePage, NoticeQuery } from './types/notice'
import { http } from '@/http/http'

/** 当前用户未读消息数量 */
export function fetchGetMessageUnread(detail = false) {
  return http.get<MessageUnread>('/user/message/unread', { detail })
}

/** 当前用户消息分页 */
export function fetchGetMessagePage(params: MessageQuery) {
  return http.get<MessagePage>('/user/message', params)
}

/** 消息详情（读取后后端会自动标记已读） */
export function fetchGetMessageDetail(id: string | number) {
  return http.get<MessageItem>(`/user/message/${id}`)
}

/** 标记指定消息已读 */
export function fetchReadMessages(ids: (string | number)[]) {
  return http<void>({
    url: '/user/message/read',
    method: 'PATCH',
    data: { ids },
  })
}

/** 全部消息标记已读 */
export function fetchReadAllMessages() {
  return http<void>({
    url: '/user/message/readAll',
    method: 'PATCH',
  })
}

/** 删除指定消息 */
export function fetchDeleteMessages(ids: (string | number)[]) {
  return http<void>({
    url: '/user/message',
    method: 'DELETE',
    data: { ids },
  })
}

/** 当前用户未读公告数量 */
export function fetchGetNoticeUnread() {
  return http.get<{ total: number }>('/user/message/notice/unread')
}

/** 当前用户未读公告 ID 列表 */
export function fetchGetUnreadNoticeIds(method: string) {
  return http.get<(string | number)[]>(`/user/message/notice/unread/${method}`)
}

/** 当前用户公告分页 */
export function fetchGetNoticeMessagePage(params: NoticeQuery) {
  return http.get<NoticePage>('/user/message/notice', params)
}

/** 当前用户公告详情（读取后后端会自动标记已读） */
export function fetchGetNoticeMessageDetail(id: string | number) {
  return http.get<NoticeItem>(`/user/message/notice/${id}`)
}
