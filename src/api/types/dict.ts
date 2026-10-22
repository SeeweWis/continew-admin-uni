export interface DictItem {
  label: string
  value: string
  disabled?: boolean
  /** 附加信息（后端 LabelValueResp.extra，类型为 Object） */
  extra?: unknown
}
