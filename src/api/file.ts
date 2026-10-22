import type {
  FileInfo,
  MultipartInitReq,
  MultipartInitResult,
  MultipartPartResult,
  UploadConfig,
  UploadProgress,
} from './types/file'
import { http } from '@/http/http'

/** 普通上传地址（multipart，字段名 file） */
export const FILE_UPLOAD_URL = '/system/file/upload'
/** 分片上传地址（multipart，字段名 file） */
export const MULTIPART_PART_URL = '/system/multipart-upload/part'

/** 默认存储上传配置（需要 system:file:upload 权限） */
export function fetchGetUploadConfig() {
  return http.get<UploadConfig>('/system/file/upload/config/default')
}

/** 普通上传进度（需要 system:file:upload 权限） */
export function fetchGetUploadProgress(uploadTaskId: string) {
  return http.get<UploadProgress>(`/system/file/upload/progress/${uploadTaskId}`)
}

/** 初始化分片上传（需要 system:file:upload 权限） */
export function fetchInitMultipartUpload(data: MultipartInitReq) {
  return http.post<MultipartInitResult>('/system/multipart-upload/init', data)
}

/** 完成分片上传（需要 system:file:upload 权限） */
export function fetchCompleteMultipartUpload(uploadId: string) {
  return http.get<FileInfo>(`/system/multipart-upload/complete/${uploadId}`)
}

/** 取消分片上传（需要 system:file:upload 权限） */
export function fetchCancelMultipartUpload(uploadId: string) {
  return http.get<void>(`/system/multipart-upload/cancel/${uploadId}`)
}

/** 分片上传结果类型（供 service 使用） */
export type { MultipartPartResult }
