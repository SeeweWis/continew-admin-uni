import type { DictItem } from './types/dict'
import { http } from '@/http/http'

/** 查询公共字典 */
export function fetchGetDict(code: string) {
  return http.get<DictItem[]>(`/system/common/dict/${encodeURIComponent(code)}`)
}
