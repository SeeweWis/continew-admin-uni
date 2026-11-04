<script lang="ts" setup>
import type { RequisitionOrder } from '../../mock'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui'
import dayjs from 'dayjs'
import { useConfirmDialog } from '@/utils/dialog'
import { ORDERS, REQUISITION_STATUS } from '../../mock'
import MaterialBottomBar from '../../components/MaterialBottomBar.vue'

definePage({
  style: {
    navigationBarTitleText: '出库作业',
  },
})

const toast = useToast('requisition-outbound')
const confirmDialog = useConfirmDialog()

const order = ref<RequisitionOrder | null>(null)

/** 出库行：实发数量与批次号 */
interface OutboundLine {
  materialId: string
  name: string
  spec: string
  unit: string
  requestQty: number
  actualQty: number
  batchNo: string
}
const lines = ref<OutboundLine[]>([])
const remark = ref('')

onLoad((options) => {
  // mock：后端接口定稿后改为 getRequisitionOrder(id)
  const id = options?.id ?? ''
  const found = ORDERS.find(o => o.id === id && o.status === 'approved')
  if (found) {
    order.value = found
    lines.value = found.lines.map(line => ({
      materialId: line.materialId,
      name: line.name,
      spec: line.spec,
      unit: line.unit,
      requestQty: line.quantity,
      actualQty: line.quantity,
      batchNo: '',
    }))
  }
})

/** 是否存在缺发出库（实发 < 应发） */
const hasShortage = computed(() => lines.value.some(line => line.actualQty < line.requestQty))

const submitting = ref(false)

/** mock：模拟出库；后端定稿后改为 outboundRequisition(id, lines, remark) */
async function handleSubmit() {
  if (hasShortage.value && !remark.value.trim()) {
    toast.show('存在缺发物资，请填写备注说明原因')
    return
  }
  if (!await confirmDialog('出库后单据将进入待签收状态，确认出库吗？'))
    return
  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  submitting.value = false
  if (order.value) {
    Object.assign(order.value, {
      status: 'outbound',
      outboundBy: '周凯',
      outboundTime: dayjs().format('YYYY-MM-DD HH:mm'),
    })
  }
  toast.success('出库成功，等待领用人签收')
  setTimeout(() => uni.navigateBack(), 800)
}
</script>

<template>
  <view class="page-material-requisition-outbound min-h-screen bg-#f2f3f5 px-4 pb-[140px] pt-3">
    <wd-toast selector="requisition-outbound" />
    <template v-if="order">
      <!-- 单据信息 -->
      <view class="rounded-lg bg-white p-4">
        <view class="flex items-center justify-between">
          <text class="text-3 text-#4e5969 font-medium">{{ order.code }}</text>
          <wd-tag :type="REQUISITION_STATUS[order.status].tag">
            {{ REQUISITION_STATUS[order.status].text }}
          </wd-tag>
        </view>
        <text class="mt-3 block text-4 text-#1d2129">{{ order.purpose }}</text>
        <view class="mt-1 flex items-center gap-2">
          <text class="text-3 text-#86909c">{{ order.applicant }}（{{ order.department }}）</text>
          <wd-tag v-if="order.urgent" type="danger" custom-class="!text-2">
            紧急
          </wd-tag>
        </view>
      </view>

      <!-- 出库清单 -->
      <view class="mt-3 rounded-lg bg-white p-4">
        <text class="text-4 text-#1d2129 font-medium">出库清单</text>
        <view class="mt-1">
          <view
            v-for="(line, index) in lines"
            :key="line.materialId"
            class="py-4"
            :class="index > 0 ? 'border-t border-solid border-#f2f3f5' : ''"
          >
            <view class="flex items-start justify-between">
              <view class="flex-1">
                <view class="flex items-center gap-2">
                  <text class="text-4 text-#1d2129">{{ line.name }}</text>
                  <text class="text-2 text-#86909c">{{ line.spec }}</text>
                </view>
                <text class="mt-1 block text-3 text-#86909c">应发 {{ line.requestQty }}{{ line.unit }}</text>
              </view>
              <wd-tag v-if="line.actualQty < line.requestQty" type="warning" custom-class="!text-2">
                缺发 {{ line.requestQty - line.actualQty }}{{ line.unit }}
              </wd-tag>
            </view>
            <view class="mt-3 flex items-center justify-between gap-3">
              <view class="flex flex-1 items-center gap-2">
                <text class="flex-none text-3 text-#4e5969">实发</text>
                <wd-input-number v-model="line.actualQty" :min="0" :max="line.requestQty" />
              </view>
              <view class="flex flex-1 items-center gap-2">
                <text class="flex-none text-3 text-#4e5969">批次</text>
                <view class="flex-1 rounded-lg bg-#f7f8fa px-3 py-1">
                  <wd-input v-model="line.batchNo" placeholder="选填" />
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 备注 -->
      <view class="mt-3 rounded-lg bg-white p-4">
        <text class="text-4 text-#1d2129 font-medium">备注<text v-if="hasShortage" class="text-3 text-[var(--wot-color-theme,#4d80f0)]">（缺发时必填）</text></text>
        <view class="mt-2 rounded-lg bg-#f7f8fa px-3 py-2">
          <wd-textarea
            v-model="remark"
            placeholder="请填写出库备注"
            :maxlength="100"
            :show-word-limit="true"
            auto-height
          />
        </view>
      </view>

      <MaterialBottomBar>
        <text class="flex-1 text-3 text-#86909c">共 {{ lines.length }} 种物资</text>
        <wd-button
          round
          custom-class="flex-1"
          type="primary"
          :loading="submitting"
          :disabled="submitting"
          @click="handleSubmit"
        >
          确认出库
        </wd-button>
      </MaterialBottomBar>
    </template>

    <wd-empty v-else class="mt-20" description="未找到待出库的领用单" />
  </view>
</template>

<style lang="scss" scoped>
</style>
