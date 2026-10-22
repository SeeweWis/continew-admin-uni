import type { ICommonFileUploadRes } from './types/oss'

/** ContiNew Admin POST /system/common/file endpoint（相对路径，由 http 拦截器统一拼接 base/代理） */
export const COMMON_FILE_UPLOAD_URL = '/system/common/file'

export type { ICommonFileUploadRes }
