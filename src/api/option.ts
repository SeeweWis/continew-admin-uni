import type { SiteOption } from './types/option'
import { http } from '@/http/http'

/** 查询站点公共配置（后端 @SaIgnore，无需登录） */
export function fetchGetSiteOptions() {
  return http.get<SiteOption[]>('/system/common/dict/option/site', undefined, undefined, {
    skipAuthRefresh: true,
  })
}
