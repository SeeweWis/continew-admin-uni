/** 站点配置项（label 为配置编码，如 SITE_TITLE） */
export interface SiteOption {
  label: string
  value: string
  disabled?: boolean
  /** 后端 LabelValueResp.extra，类型为 Object */
  extra?: unknown
}
