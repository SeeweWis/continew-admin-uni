import type { FileUploadResult, MultipartPartResult } from '@/api/types/file'
import { FILE_UPLOAD_URL, MULTIPART_PART_URL } from '@/api/file'
import { ensureAccessToken } from '@/http/http'
import { useTokenStore } from '@/store/token'
import { useUserStore } from '@/store/user'
import { openLoginPopup } from '@/utils/loginPopup'

interface UploadOptions {
  onProgress?: (progress: number) => void
  hideErrorToast?: boolean
}

interface UploadRequestOptions extends UploadOptions {
  query?: Record<string, string | number | undefined>
}

function withQuery(url: string, query?: Record<string, string | number | undefined>) {
  const entries = Object.entries(query ?? {}).filter(([, value]) => value !== undefined && value !== null)
  if (!entries.length)
    return url
  const queryString = entries
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    .join('&')
  return `${url}?${queryString}`
}

function clearExpiredSession() {
  useTokenStore().clear()
  useUserStore().clearUserInfo()
  openLoginPopup()
}

function uploadMultipart<T>(url: string, filePath: string, options: UploadRequestOptions = {}) {
  return new Promise<T>((resolve, reject) => {
    const task = uni.uploadFile({
      url: withQuery(url, options.query),
      filePath,
      name: 'file',
      success: (response) => {
        let result: { code?: number, msg?: string, data?: T }
        try {
          result = JSON.parse(response.data) as { code?: number, msg?: string, data?: T }
        }
        catch {
          reject(new Error('上传响应解析失败'))
          return
        }

        const code = Number(result.code)
        if (response.statusCode === 401 || code === 401) {
          clearExpiredSession()
          reject(new Error(result.msg || '登录已过期，请重新登录'))
          return
        }

        if (response.statusCode < 200 || response.statusCode >= 300 || code !== 0) {
          const message = result.msg || '上传失败'
          if (!options.hideErrorToast)
            uni.showToast({ icon: 'none', title: message })
          reject(new Error(message))
          return
        }

        resolve(result.data as T)
      },
      fail: (error) => {
        const message = '网络错误，上传失败'
        if (!options.hideErrorToast)
          uni.showToast({ icon: 'none', title: message })
        reject(error instanceof Error ? error : new Error(message))
      },
    })

    task.onProgressUpdate((progress) => {
      options.onProgress?.(progress.progress)
    })
  })
}

/**
 * 普通文件上传（POST /system/file/upload）
 * 分片上传请使用 uploadMultipartPart + init/complete 接口。
 */
export async function uploadFileByPath(filePath: string, options: UploadOptions & {
  parentPath?: string
  uploadTaskId?: string
} = {}) {
  await ensureAccessToken()
  return uploadMultipart<FileUploadResult>(FILE_UPLOAD_URL, filePath, {
    onProgress: options.onProgress,
    hideErrorToast: options.hideErrorToast,
    query: {
      parentPath: options.parentPath,
      uploadTaskId: options.uploadTaskId,
    },
  })
}

/** 上传单个分片（POST /system/multipart-upload/part） */
export async function uploadMultipartPart(
  filePath: string,
  params: { uploadId: string, partNumber: number, path: string },
  options: UploadOptions = {},
) {
  await ensureAccessToken()
  return uploadMultipart<MultipartPartResult>(MULTIPART_PART_URL, filePath, {
    onProgress: options.onProgress,
    hideErrorToast: options.hideErrorToast,
    query: {
      uploadId: params.uploadId,
      partNumber: params.partNumber,
      path: params.path,
    },
  })
}
