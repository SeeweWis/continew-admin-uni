<script lang="ts" setup>
import type { RequisitionOrder } from '../../mock'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui'
import dayjs from 'dayjs'
import { useConfirmDialog } from '@/utils/dialog'
import { ORDERS, REQUISITION_STATUS, REQUISITION_STEPS } from '../../mock'
import MaterialBottomBar from '../../components/MaterialBottomBar.vue'

definePage({
  style: {
    navigationBarTitleText: '领用单详情',
  },
})

const toast = useToast()
const confirmDialog = useConfirmDialog()

const order = ref<RequisitionOrder | null>(null)

onLoad((options) => {
  // mock：后端接口定稿后改为 getRequisitionOrder(id)
  const id = options?.id ?? ''
  order.value = ORDERS.find(o => o.id === id) ?? null
})

/** 步骤条进度：驳回/撤销停在提交申请节点 */
const stepActive = computed(() => {
  switch (order.value?.status) {
    case 'returned':
      return 4
    case 'returning':
    case 'signed':
      return 3
    case 'outbound':
      return 2
    case 'approved':
      return 1
    default:
      return 0
  }
})

/** 流转记录（按单据时间字段推导） */
const records = computed(() => {
  const list: { title: string, by?: string, time?: string, comment?: string }[] = []
  const o = order.value
  if (!o)
    return list
  list.push({ title: '提交申请', by: `${o.applicant}（${o.department}）`, time: o.applyTime })
  if (o.approveTime)
    list.push({ title: o.status === 'rejected' ? '审批驳回' : '审批通过', by: o.approver, time: o.approveTime, comment: o.approveComment })
  if (o.outboundTime)
    list.push({ title: '仓库出库', by: o.outboundBy, time: o.outboundTime })
  if (o.signTime)
    list.push({ title: '领用签收', by: o.applicant, time: o.signTime })
  if (o.returnTime)
    list.push({ title: '归还登记', by: o.applicant, time: o.returnTime })
  return list
})

const submitting = ref(false)

/** mock：本地直接推进单据状态用于演示交互；后端定稿后改为接口调用 + 刷新详情 */
function patchOrder(patch: Partial<RequisitionOrder>) {
  if (order.value)
    Object.assign(order.value, patch)
}

async function handleCancel() {
  if (!await confirmDialog('撤销后本单将终止流转，确定撤销申请吗？'))
    return
  patchOrder({ status: 'cancelled' })
  toast.success('已撤销申请')
}

function goOutbound() {
  uni.navigateTo({ url: `/pages-material/requisition/outbound/index?id=${order.value?.id ?? ''}` })
}

async function handleSign() {
  if (!await confirmDialog('请核对实物与数量一致后再签收，签收后进入使用中状态。'))
    return
  submitting.value = true
  // mock：模拟接口耗时
  await new Promise(resolve => setTimeout(resolve, 500))
  submitting.value = false
  patchOrder({ status: 'signed', signTime: dayjs().format('YYYY-MM-DD HH:mm') })
  toast.success('签收成功')
}

function goReturn() {
  uni.navigateTo({ url: `/pages-material/requisition/return/index?id=${order.value?.id ?? ''}` })
}
</script>

<template>
  <view class="page-material-requisition-detail min-h-screen bg-#f2f3f5 px-4 pb-[140px] pt-3">
    <template v-if="order">
      <!-- 状态与流程 -->
      <view class="rounded-lg bg-white p-4">
        <view class="flex items-center justify-between">
          <text class="text-3 text-#4e5969 font-medium">{{ order.code }}</text>
          <wd-tag :type="REQUISITION_STATUS[order.status].tag">
            {{ REQUISITION_STATUS[order.status].text }}
          </wd-tag>
        </view>
        <view class="mt-5">
          <wd-steps :active="stepActive">
            <wd-step v-for="step in REQUISITION_STEPS" :key="step" :title="step" />
          </wd-steps>
        </view>
      </view>

      <!-- 物资清单 -->
      <view class="mt-3 rounded-lg bg-white p-4">
        <text class="text-4 text-#1d2129 font-medium">物资清单</text>
        <view class="mt-1">
          <view
            v-for="(line, index) in order.lines"
            :key="line.materialId"
            class="flex items-center justify-between py-3"
            :class="index > 0 ? 'border-t border-solid border-#f2f3f5' : ''"
          >
            <view>
              <text class="block text-4 text-#1d2129">{{ line.name }}</text>
              <text class="mt-1 block text-3 text-#86909c">{{ line.spec }}</text>
            </view>
            <text class="text-4 text-#1d2129 font-medium">× {{ line.quantity }}{{ line.unit }}</text>
          </view>
        </view>
      </view>

      <!-- 单据信息 -->
      <view class="mt-3 rounded-lg bg-white p-4">
        <text class="text-4 text-#1d2129 font-medium">单据信息</text>
        <wd-cell-group border custom-class="mt-2">
          <wd-cell title="申请人" :value="order.applicant" />
          <wd-cell title="所属部门" :value="order.department" />
          <wd-cell title="领用用途" :value="order.purpose" />
          <wd-cell title="使用地点" :value="order.place || '未填写'" />
          <wd-cell title="预计归还" :value="order.expectReturnDate || '未填写'" />
          <wd-cell title="紧急程度" :value="order.urgent ? '紧急' : '一般'" />
        </wd-cell-group>
      </view>

      <!-- 流转记录 -->
      <view class="mt-3 rounded-lg bg-white p-4">
        <text class="text-4 text-#1d2129 font-medium">流转记录</text>
        <view class="mt-4">
          <view v-for="(record, index) in records" :key="record.title" class="record-item">
            <view class="record-rail">
              <view class="record-dot" />
              <view v-if="index < records.length - 1" class="record-line" />
            </view>
            <view class="flex-1 pb-5">
              <view class="flex items-center justify-between">
                <text class="text-4 text-#1d2129 font-medium">{{ record.title }}</text>
                <text v-if="record.time" class="text-2 text-#86909c">{{ record.time }}</text>
              </view>
              <text v-if="record.by" class="mt-1 block text-3 text-#86909c">{{ record.by }}</text>
              <view v-if="record.comment" class="mt-2 rounded-lg bg-#f7f8fa p-3">
                <text class="text-3 text-#4e5969">{{ record.comment }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 状态操作 -->
      <MaterialBottomBar>
        <wd-button
          v-if="order.status === 'pending'"
          round

          plain block
          type="danger"
          :disabled="submitting"
          @click="handleCancel"
        >
          撤销申请
        </wd-button>
        <wd-button
          v-if="order.status === 'approved'"
          round
          block
          type="primary"
          @click="goOutbound"
        >
          出库作业
        </wd-button>
        <wd-button
          v-if="order.status === 'outbound'"
          round
          block
          type="primary"
          :loading="submitting"
          :disabled="submitting"
          @click="handleSign"
        >
          确认签收
        </wd-button>
        <wd-button
          v-if="order.status === 'signed'"
          round
          block
          type="primary"
          @click="goReturn"
        >
          归还登记
        </wd-button>
      </MaterialBottomBar>
    </template>

    <wd-empty v-else class="mt-20" description="未找到领用单" />
  </view>
</template>

<style lang="scss" scoped>
.record-item {
  display: flex;
  gap: 20rpx;
}

.record-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.record-dot {
  flex: none;
  width: 16rpx;
  height: 16rpx;
  margin-top: 10rpx;
  border-radius: 50%;
  background-color: var(--wot-color-theme, #4d80f0);
}

.record-line {
  flex: 1;
  width: 2rpx;
  margin: 6rpx 0;
  background-color: #e5e6eb;
}
</style>
