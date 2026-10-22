import type { ICommonFileUploadRes } from '@/api/types/oss'
import { COMMON_FILE_UPLOAD_URL } from '@/api/oss'
import { useFileUpload } from '@/utils/uploadFile'

/**
 * 上传文件到 ContiNew Admin 通用文件接口：POST /system/common/file，multipart 字段名 file
 * Authorization 由全局 uploadFile 拦截器自动注入；登录态失效 / 业务失败的提示与兜底由钩子内部处理
 *
 * @param filePath 本地临时文件路径（uni.chooseMedia/chooseImage 或拍照所得）
 * @param options.onProgress 上传进度回调（0-100）
 * @returns 后端文件信息：{ id, url, thUrl, metadata }
 */
export function uploadCommonFile(filePath: string, options: { onProgress?: (progress: number) => void } = {}): Promise<ICommonFileUploadRes> {
  return new Promise<ICommonFileUploadRes>((resolve, reject) => {
    const { run } = useFileUpload<ICommonFileUploadRes>(COMMON_FILE_UPLOAD_URL, filePath, {}, {
      onProgress: options.onProgress,
      onSuccess: res => resolve(res as ICommonFileUploadRes),
      onError: err => reject(err instanceof Error ? err : new Error('上传失败')),
    })
    run()
  })
}
