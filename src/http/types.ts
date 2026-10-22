/**
 * 在 uniapp 的 RequestOptions 和 IUniUploadFileOptions 基础上，添加自定义参数
 */
export type CustomRequestOptions = Omit<UniApp.RequestOptions, 'method'> & {
  /** 部分端支持 PATCH（个人资料、消息已读等接口使用） */
  method?: UniApp.RequestOptions['method'] | 'PATCH'
  query?: Record<string, unknown>
  /** 出错时是否隐藏错误提示 */
  hideErrorToast?: boolean
  /** 认证会话端点不触发自动刷新 */
  skipAuthRefresh?: boolean
  /** 内部标记：该请求已在刷新后重放 */
  authRefreshRetried?: boolean
} & IUniUploadFileOptions // 添加uni.uploadFile参数类型

/** 主要提供给 openapi-ts-request 生成的代码使用 */
export type CustomRequestOptions_ = Omit<CustomRequestOptions, 'url'>

export interface HttpRequestResult<T> {
  promise: Promise<T>
  requestTask: UniApp.RequestTask
}

export interface HttpError<T = unknown> {
  type: 'business' | 'auth' | 'http' | 'network'
  code?: number
  statusCode?: number
  message: string
  data?: T
  raw?: unknown
}

// 通用响应格式（兼容 msg + message 字段）
export type IResponse<T = unknown> = {
  code: number
  data: T
  message: string
  [key: string]: unknown // 允许额外属性
} | {
  code: number
  data: T
  msg: string
  [key: string]: unknown // 允许额外属性
}
