import type { ICommonFileUploadRes } from './types/oss'
import { getEnvBaseUrl } from '@/utils'

/** ContiNew Admin POST /system/common/file endpoint. */
export const COMMON_FILE_UPLOAD_URL = `${getEnvBaseUrl()}/system/common/file`

export type { ICommonFileUploadRes }
