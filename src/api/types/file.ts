/** 默认存储上传配置（后端 FileUploadConfigResp） */
export interface UploadConfig {
  storageId: string | number
  storageName: string
  storageCode: string
  /** 1 本地存储，2 对象存储 */
  storageType: 1 | 2
  /** 分片上传阈值（字节） */
  multipartUploadThreshold: number
  /** 分片大小（字节） */
  multipartUploadPartSize: number
  multipartTempDir?: string
}

/** 普通上传结果（后端 FileUploadResp） */
export interface FileUploadResult {
  id: string
  url: string
  thUrl?: string
  metadata?: Record<string, string>
}

/** 单文件上传进度状态 */
export type UploadProgressStatus = 'INIT' | 'UPLOADING' | 'FINALIZING' | 'COMPLETED' | 'FAILED' | 'NOT_FOUND'

export interface UploadProgress {
  uploadTaskId: string
  status: UploadProgressStatus
  percentage: number
  bytesRead: number
  totalBytes: number
  fileId?: string
  url?: string
  message?: string
}

/** 分片上传初始化请求（后端 MultipartUploadCreateReq） */
export interface MultipartInitReq {
  fileName: string
  fileSize: number
  fileMd5: string
  contentType?: string
  parentPath?: string
  metaData?: Record<string, string>
}

/** 分片上传初始化结果（后端 MultipartUploadCreateResp） */
export interface MultipartInitResult {
  fileId: string
  uploadId: string
  bucket?: string
  platform?: string
  fileName: string
  fileMd5: string
  fileSize: number
  extension?: string
  contentType?: string
  type?: string
  parentPath?: string
  path: string
  partSize: number
  uploadedPartNumbers?: number[]
}

/** 分片上传结果（后端 MultipartUploadPartResp） */
export interface MultipartPartResult {
  partNumber: number
  partETag?: string
  partSize?: number
  success: boolean
  errorMessage?: string
}

/** 分片完成后返回的文件信息（后端 FileDO） */
export interface FileInfo {
  id: string | number
  name: string
  originalName?: string
  size?: number
  parentPath?: string
  path: string
  extension?: string
  contentType?: string
  /** 文件类型（后端 FileTypeEnum） */
  type?: number
  sha256?: string
  metadata?: string
  thumbnailName?: string
  thumbnailSize?: number
  thumbnailMetadata?: string
  storageId?: string | number
  createUser?: string | number
  createTime?: string
  updateUser?: string | number
  updateTime?: string
  deleted?: string | number
}
