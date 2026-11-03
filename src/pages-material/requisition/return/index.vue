<script lang="ts" setup>
import type { RequisitionOrder } from '../../mock'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui'
import dayjs from 'dayjs'
import { useConfirmDialog } from '@/utils/dialog'
import { ORDERS, REQUISITION_STATUS } from '../../mock'
import MaterialBottomBar from '../../components/MaterialBottomBar.vue'
import MaterialPhotoPicker from '../../components/MaterialPhotoPicker.vue'

definePage({
  style: {
    navigationBarTitleText: '归还登记',
  },
})

const toast = useToast()
const confirmDialog = useConfirmDialog()

const order = ref<RequisitionOrder | null>(null)

/** 归还行：归还数量与物资状态 */
interface ReturnLine {
  materialId: string
  name: string
  spec: string
  unit: string
  outboundQty: number
  returnQty: number
  /** ok-完好 damaged-损坏 lost-遗失 */
  condition: 'ok' | 'damaged' | 'lost'
  remark: string
}
const lines = ref<ReturnLine[]>([])
const remark = ref('')
const photoPickerRef = ref<InstanceType<typeof MaterialPhotoPicker>>()

onLoad((options) => {
  // mock：后端接口定稿后改为 getRequisitionOrder(id)
  const id = options?.id ?? ''
  const found = ORDERS.find(o => o.id === id && o.status === 'signed')
  if (found) {
    order.value = found
    lines.value = found.lines.map(line => ({
      materialId: line.materialId,
      name: line.name,
      spec: line.spec,
      unit: line.unit,
      outboundQty: line.quantity,
      returnQty: line.quantity,
      condition: 'ok',
      remark: '',
    }))
  }
})

/** 是否存在损坏或遗失的物资 */
const hasAbnormal = computed(() => lines.value.some(line => line.condition !== 'ok'))

const CONDITION_OPTIONS = [
  { label: '完好', value: 'ok' },
  { label: '损坏', value: 'damaged' },
  { label: '遗失', value: 'lost' },
]

const submitting = ref(false)

/** mock：模拟归还登记；后端定稿后改为 returnRequisition(id, lines, remark, photos) */
async function handleSubmit() {
  if (hasAbnormal.value && lines.value.some(line => line.condition !== 'ok' && !line.remark.trim())) {
    toast.show('损坏或遗失的物资请逐项填写说明')
    return
  }
  if (!await confirmDialog('提交后由仓管员验收，确认归还信息无误吗？'))
    return
  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  submitting.value = false
  if (order.value)
    Object.assign(order.value, { status: 'returning', returnTime: dayjs().format('YYYY-MM-DD HH:mm') })
  toast.success('归还登记成功，等待仓管验收')
  setTimeout(() => uni.navigateBack(), 800)
}
</script>

<template>
  <view class="page-material-requisition-return min-h-screen bg-#f2f3f5 px-4 pb-[140px] pt-3">
    <template v-if="order">
      <!-- 单据信息 -->
      <view class="rounded-lg bg-white p-4">
        <view class="flex items-center justify-between">
          <text class="text-3 text-#4e5969 font-medium">{{ order.code }}</text>
          <wd-tag :type="REQUISITION_STATUS[order.status].tag">
            {{ REQUISITION_STATUS[order.status].text }}
          </wd-tag>
        </view>
        <wd-cell-group border custom-class="mt-3">
          <wd-cell title="领用人" :value="order.applicant" />
          <wd-cell title="签收时间" :value="order.signTime ?? ''" />
          <wd-cell title="预计归还" :value="order.expectReturnDate || '未填写'" />
        </wd-cell-group>
      </view>

      <!-- 归还清单 -->
      <view class="mt-3 rounded-lg bg-white p-4">
        <text class="text-4 text-#1d2129 font-medium">归还清单</text>
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
                <text class="mt-1 block text-3 text-#86909c">出库 {{ line.outboundQty }}{{ line.unit }}</text>
              </view>
              <wd-tag v-if="line.condition === 'lost'" type="danger" custom-class="!text-2">
                遗失 {{ line.outboundQty - line.returnQty }}{{ line.unit }}
              </wd-tag>
            </view>
            <view class="mt-3 flex items-center justify-between gap-3">
              <view class="flex flex-1 items-center gap-2">
                <text class="flex-none text-3 text-#4e5969">归还</text>
                <wd-input-number v-model="line.returnQty" :min="0" :max="line.outboundQty" />
              </view>
            </view>
            <view class="mt-3 flex items-center justify-between gap-3">
              <text class="flex-none text-3 text-#4e5969">状态</text>
              <wd-radio-group v-model="line.condition">
                <wd-radio v-for="option in CONDITION_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </wd-radio>
              </wd-radio-group>
            </view>
            <view v-if="line.condition !== 'ok'" class="mt-3 rounded-lg bg-#f7f8fa px-3 py-2">
              <wd-input v-model="line.remark" :placeholder="line.condition === 'lost' ? '请说明遗失情况' : '请说明损坏情况'" />
            </view>
          </view>
        </view>
      </view>

      <!-- 现场照片与备注 -->
      <view class="mt-3 rounded-lg bg-white p-4">
        <text class="text-4 text-#1d2129 font-medium">现场照片</text>
        <view class="mt-3">
          <MaterialPhotoPicker ref="photoPickerRef" :max="6" />
        </view>
      </view>
      <view class="mt-3 rounded-lg bg-white p-4">
        <text class="text-4 text-#1d2129 font-medium">备注</text>
        <view class="mt-2 rounded-lg bg-#f7f8fa px-3 py-2">
          <wd-textarea
            v-model="remark"
            placeholder="请填写归还备注"
            :maxlength="100"
            :show-word-limit="true"
            auto-height
          />
        </view>
      </view>

      <MaterialBottomBar>
        <wd-button
          round
          block
          type="primary"
          :loading="submitting"
          :disabled="submitting"
          @click="handleSubmit"
        >
          提交归还
        </wd-button>
      </MaterialBottomBar>
    </template>

    <wd-empty v-else class="mt-20" description="未找到使用中的领用单" />
  </view>
</template>

<style lang="scss" scoped>
</style>
