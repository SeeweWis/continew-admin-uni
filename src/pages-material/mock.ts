/**
 * 物资分包共享类型与演示数据
 *
 * ⚠️ 全部为 mock：后端物资域接口尚未提供；接口定稿后再新增 src/api 定义并替换本地数据。
 */

/** 物资 */
export interface MaterialItem {
  id: string
  /** 物资编码（扫码页 MAT/WL 前缀路由的目标载体） */
  code: string
  name: string
  spec: string
  unit: string
  category: '消防器材' | '急救用品' | '防护用品' | '应急工具'
  stock: number
  /** 安全库存，低于时物资详情给出补货提醒 */
  safetyStock: number
  location: string
  keeper: string
  /** 是否按批次管理有效期（如灭火器、药品） */
  expiryRequired: boolean
  /** 最近有效期（expiryRequired 时展示） */
  nearestExpiry?: string
}

export const MATERIALS: MaterialItem[] = [
  { id: 'm1', code: 'MAT2026001', name: '干粉灭火器', spec: 'MFZ/ABC4', unit: '具', category: '消防器材', stock: 42, safetyStock: 20, location: '1号应急柜·A层', keeper: '陈志强', expiryRequired: true, nearestExpiry: '2027-06' },
  { id: 'm2', code: 'MAT2026002', name: '急救箱', spec: '标准型·30人份', unit: '箱', category: '急救用品', stock: 12, safetyStock: 10, location: '1号应急柜·B层', keeper: '陈志强', expiryRequired: true, nearestExpiry: '2026-12' },
  { id: 'm3', code: 'MAT2026003', name: '过滤式消防自救呼吸器', spec: 'TZL30', unit: '具', category: '防护用品', stock: 30, safetyStock: 15, location: '1号应急柜·C层', keeper: '林晓芸', expiryRequired: false },
  { id: 'm4', code: 'MAT2026004', name: '强光手电', spec: 'LED·充电式', unit: '把', category: '应急工具', stock: 8, safetyStock: 10, location: '2号应急柜·A层', keeper: '林晓芸', expiryRequired: false },
  { id: 'm5', code: 'MAT2026005', name: '消防安全绳', spec: '20m·承重1t', unit: '条', category: '应急工具', stock: 16, safetyStock: 8, location: '2号应急柜·B层', keeper: '周凯', expiryRequired: false },
  { id: 'm6', code: 'MAT2026006', name: '一次性雨衣', spec: '加厚型', unit: '件', category: '防护用品', stock: 120, safetyStock: 60, location: '综合库房·B区', keeper: '周凯', expiryRequired: false },
  { id: 'm7', code: 'MAT2026007', name: '警戒带', spec: '100m/卷', unit: '卷', category: '应急工具', stock: 24, safetyStock: 12, location: '综合库房·B区', keeper: '吴文静', expiryRequired: false },
  { id: 'm8', code: 'MAT2026008', name: '灭火毯', spec: '1.5m×1.5m', unit: '块', category: '消防器材', stock: 18, safetyStock: 10, location: '综合库房·A区', keeper: '吴文静', expiryRequired: false },
]

/** 领用单状态 */
export type RequisitionStatus
  = | 'pending' // 待审批
    | 'approved' // 审批通过，待出库
    | 'outbound' // 已出库，待签收
    | 'signed' // 已签收，使用中
    | 'returning' // 领用人已登记归还，待仓管验收
    | 'returned' // 归还验收完成
    | 'rejected' // 已驳回
    | 'cancelled' // 已撤销

/** 状态 → 文案与 wd-tag type（TagType 不含 info，撤销态用 default 灰） */
export const REQUISITION_STATUS: Record<RequisitionStatus, { text: string, tag: 'primary' | 'success' | 'danger' | 'warning' | 'default' }> = {
  pending: { text: '待审批', tag: 'warning' },
  approved: { text: '待出库', tag: 'primary' },
  outbound: { text: '待签收', tag: 'primary' },
  signed: { text: '使用中', tag: 'primary' },
  returning: { text: '归还中', tag: 'primary' },
  returned: { text: '已归还', tag: 'success' },
  rejected: { text: '已驳回', tag: 'danger' },
  cancelled: { text: '已撤销', tag: 'default' },
}

/** 领用单流程步骤（详情页步骤条） */
export const REQUISITION_STEPS = ['提交申请', '审批', '出库', '签收', '归还']

/** 领用单明细行 */
export interface RequisitionLine {
  materialId: string
  name: string
  spec: string
  unit: string
  quantity: number
}

/** 领用单 */
export interface RequisitionOrder {
  id: string
  code: string
  status: RequisitionStatus
  applicant: string
  department: string
  applyTime: string
  purpose: string
  place: string
  /** 预计归还日期 */
  expectReturnDate: string
  urgent: boolean
  lines: RequisitionLine[]
  approver?: string
  approveTime?: string
  approveComment?: string
  outboundBy?: string
  outboundTime?: string
  signTime?: string
  returnTime?: string
}

export const ORDERS: RequisitionOrder[] = [
  {
    id: 'o1',
    code: 'LY20260912-006',
    status: 'pending',
    applicant: '周凯',
    department: '安全管理部',
    applyTime: '2026-09-12 10:24',
    purpose: '三季度消防疏散演练',
    place: '综合楼B座一层',
    expectReturnDate: '2026-09-20',
    urgent: false,
    lines: [
      { materialId: 'm1', name: '干粉灭火器', spec: 'MFZ/ABC4', unit: '具', quantity: 6 },
      { materialId: 'm7', name: '警戒带', spec: '100m/卷', unit: '卷', quantity: 4 },
    ],
  },
  {
    id: 'o2',
    code: 'LY20260910-005',
    status: 'approved',
    applicant: '吴文静',
    department: '物业管理部',
    applyTime: '2026-09-10 15:02',
    purpose: '3号楼灭火器到期批量更换',
    place: '3号楼各楼层',
    expectReturnDate: '2026-09-30',
    urgent: false,
    approver: '陈志强',
    approveTime: '2026-09-11 09:15',
    approveComment: '数量已核实，同意领用。',
    lines: [
      { materialId: 'm1', name: '干粉灭火器', spec: 'MFZ/ABC4', unit: '具', quantity: 12 },
      { materialId: 'm8', name: '灭火毯', spec: '1.5m×1.5m', unit: '块', quantity: 4 },
    ],
  },
  {
    id: 'o3',
    code: 'LY20260908-004',
    status: 'outbound',
    applicant: '林晓芸',
    department: '安全管理部',
    applyTime: '2026-09-08 09:41',
    purpose: '防汛应急演练物资领用',
    place: '地下车库B2层',
    expectReturnDate: '2026-09-12',
    urgent: true,
    approver: '陈志强',
    approveTime: '2026-09-08 11:02',
    approveComment: '同意，演练后注意装备回收。',
    outboundBy: '周凯',
    outboundTime: '2026-09-09 08:55',
    lines: [
      { materialId: 'm6', name: '一次性雨衣', spec: '加厚型', unit: '件', quantity: 40 },
      { materialId: 'm4', name: '强光手电', spec: 'LED·充电式', unit: '把', quantity: 6 },
      { materialId: 'm5', name: '消防安全绳', spec: '20m·承重1t', unit: '条', quantity: 2 },
    ],
  },
  {
    id: 'o4',
    code: 'LY20260906-003',
    status: 'signed',
    applicant: '陈志强',
    department: '安全管理部',
    applyTime: '2026-09-06 14:18',
    purpose: '楼层急救箱过期药品更换',
    place: '综合楼A座各楼层',
    expectReturnDate: '2026-09-13',
    urgent: false,
    approver: '吴文静',
    approveTime: '2026-09-06 16:40',
    approveComment: '同意。',
    outboundBy: '周凯',
    outboundTime: '2026-09-07 10:02',
    signTime: '2026-09-07 11:26',
    lines: [
      { materialId: 'm2', name: '急救箱', spec: '标准型·30人份', unit: '箱', quantity: 3 },
    ],
  },
  {
    id: 'o5',
    code: 'LY20260828-002',
    status: 'returning',
    applicant: '林晓芸',
    department: '安全管理部',
    applyTime: '2026-08-26 09:30',
    purpose: '应急物资季度核查借出',
    place: '库房核查区',
    expectReturnDate: '2026-09-13',
    urgent: false,
    approver: '陈志强',
    approveTime: '2026-08-26 14:05',
    approveComment: '同意，核查后及时归还。',
    outboundBy: '周凯',
    outboundTime: '2026-08-27 09:10',
    signTime: '2026-08-27 09:52',
    returnTime: '2026-09-13 16:40',
    lines: [
      { materialId: 'm4', name: '强光手电', spec: 'LED·充电式', unit: '把', quantity: 4 },
      { materialId: 'm3', name: '过滤式消防自救呼吸器', spec: 'TZL30', unit: '具', quantity: 6 },
    ],
  },
  {
    id: 'o6',
    code: 'LY20260820-001',
    status: 'returned',
    applicant: '周凯',
    department: '安全管理部',
    applyTime: '2026-08-20 10:02',
    purpose: '园区应急通道巡检',
    place: '园区外围',
    expectReturnDate: '2026-08-25',
    urgent: false,
    approver: '陈志强',
    approveTime: '2026-08-20 11:31',
    approveComment: '同意。',
    outboundBy: '吴文静',
    outboundTime: '2026-08-21 08:40',
    signTime: '2026-08-21 09:05',
    returnTime: '2026-08-25 17:12',
    lines: [
      { materialId: 'm7', name: '警戒带', spec: '100m/卷', unit: '卷', quantity: 2 },
      { materialId: 'm6', name: '一次性雨衣', spec: '加厚型', unit: '件', quantity: 10 },
    ],
  },
  {
    id: 'o7',
    code: 'LY20260818-015',
    status: 'rejected',
    applicant: '周凯',
    department: '工程维修部',
    applyTime: '2026-08-18 15:47',
    purpose: '备用',
    place: '',
    expectReturnDate: '',
    urgent: false,
    approver: '陈志强',
    approveTime: '2026-08-19 09:02',
    approveComment: '用途不明确，请补充具体使用场景与责任人后重新提交。',
    lines: [
      { materialId: 'm1', name: '干粉灭火器', spec: 'MFZ/ABC4', unit: '具', quantity: 20 },
    ],
  },
  {
    id: 'o8',
    code: 'LY20260815-014',
    status: 'cancelled',
    applicant: '吴文静',
    department: '物业管理部',
    applyTime: '2026-08-15 14:22',
    purpose: '台风前应急物资前置',
    place: '1号楼大堂',
    expectReturnDate: '2026-08-18',
    urgent: true,
    lines: [
      { materialId: 'm6', name: '一次性雨衣', spec: '加厚型', unit: '件', quantity: 30 },
    ],
  },
]

/** 应急柜点检项 */
export interface CabinetCheckLine {
  name: string
  /** 点检标准 */
  standard: string
  standardQty: number
  /** '' 表示未检查 */
  state: 'normal' | 'abnormal' | 'missing' | ''
  remark: string
}

export interface CabinetBodyCheck {
  label: string
  state: 'normal' | 'abnormal' | ''
}

export const CABINET = {
  code: 'YJG-001',
  name: '1号应急柜',
  location: '综合楼B座一层大厅',
  lastCheckTime: '2026-09-07 16:30',
  lastCheckResult: '正常',
}

export const CABINET_CHECK_LINES: CabinetCheckLine[] = [
  { name: '干粉灭火器', standard: 'MFZ/ABC4·压力表指针在绿区', standardQty: 6, state: '', remark: '' },
  { name: '急救箱', standard: '标准型·药品在有效期内', standardQty: 2, state: '', remark: '' },
  { name: '过滤式消防自救呼吸器', standard: 'TZL30·密封包装完好', standardQty: 4, state: '', remark: '' },
  { name: '强光手电', standard: '满电可点亮', standardQty: 2, state: '', remark: '' },
]

export const CABINET_BODY_CHECKS: CabinetBodyCheck[] = [
  { label: '柜门与锁具', state: '' },
  { label: '标识与点检表', state: '' },
]

/** 盘点任务 */
export const STOCKTAKE_TASK = {
  code: 'PD20260914-02',
  scope: '1号应急柜',
  deadline: '2026-09-15 18:00',
  checker: '林晓芸',
}

export interface StocktakeLine {
  materialId: string
  name: string
  spec: string
  unit: string
  /** 账面数量 */
  bookQty: number
  /** 实盘数量（默认与账面一致，由盘点人核对调整） */
  actualQty: number
  remark: string
}

export const STOCKTAKE_LINES: StocktakeLine[] = [
  { materialId: 'm1', name: '干粉灭火器', spec: 'MFZ/ABC4', unit: '具', bookQty: 6, actualQty: 6, remark: '' },
  { materialId: 'm2', name: '急救箱', spec: '标准型·30人份', unit: '箱', bookQty: 2, actualQty: 2, remark: '' },
  { materialId: 'm3', name: '过滤式消防自救呼吸器', spec: 'TZL30', unit: '具', bookQty: 4, actualQty: 4, remark: '' },
  { materialId: 'm4', name: '强光手电', spec: 'LED·充电式', unit: '把', bookQty: 2, actualQty: 2, remark: '' },
]
