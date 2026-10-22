import type { NoticeItem, NoticePage, NoticeQuery } from './types/notice'
import { http } from '@/http/http'

/** 公告分页（需要 system:notice:list 权限） */
export function fetchGetNoticePage(params: NoticeQuery) {
  return http.get<NoticePage>('/system/notice', params)
}

/** 公告详情（需要 system:notice:get 权限） */
export function fetchGetNoticeDetail(id: string | number) {
  return http.get<NoticeItem>(`/system/notice/${id}`)
}
