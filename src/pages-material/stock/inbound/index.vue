<script lang="ts" setup>
import type { MaterialItem } from '../../mock'
import { ref } from 'vue'
import { useToast } from '@wot-ui/ui'
import dayjs from 'dayjs'
import { useConfirmDialog } from '@/utils/dialog'
import MaterialBottomBar from '../../components/MaterialBottomBar.vue'
import MaterialPhotoPicker from '../../components/MaterialPhotoPicker.vue'
import MaterialPicker from '../../components/MaterialPicker.vue'

definePage({
  style: {
    navigationBarTitleText: '扫码入库',
  },
})

const toast = useToast()
const confirmDialog = useConfirmDialog()
const pickerRef = ref<InstanceType<typeof MaterialPicker>>()
const photoPickerRef = ref<InstanceType<typeof MaterialPhotoPicker>>()

/** 入库行 */
interface InboundLine {
  material: MaterialItem
  quantity: number
  /** 有效期（按批次管理的物资填写，时间戳） */
  expiryDate: number
}
const lines = ref<InboundLine[]>([])

const minDate = Date.now()
const form = ref({
  /** purchase-采购入库 return-归还入库 transfer-调拨入库 */
  type: 'purchase',
  supplier: '',
  remark: '',
})

const TYPE_OPTIONS = [
  { label: '采购入库', value: 'purchase' },
  { label: '归还入库', value: 'return' },
  { label: '调拨入库', value: 'transfer' },
]

function openPicker() {
  pickerRef.value?.open()
}

function handlePicked(items: MaterialItem[]) {
  for (const material of items)
    lines.value.push({ material, quantity: 1, expiryDate: minDate })
}

function removeLine(index: number) {
  lines.value.splice(index, 1)
}

const submitting = ref(false)

/** mock：模拟提交入库；后端定稿后改为 createInbound(form, lines, photos) */
async function handleSubmit() {
  if (!lines.value.length) {
    toast.show('请先添加入库物资')
    return
  }
  if (!form.value.supplier.trim() && form.value.type === 'purchase') {
    toast.show('采购入库请填写供应商')
    return
  }
  if (!await confirmDialog('提交后按实入库数量更新库存，确认入库吗？'))
    return
  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  submitting.value = false
  toast.success('入库成功')
  setTimeout(() => uni.navigateBack(), 800)
}
</script>

<template>
  <view class="page-material-stock-inbound min-h-screen bg-#f2f3f5 px-4 pb-[140px] pt-3">
    <wd-notice-bar text="扫码入库：可在扫码页扫描物资码自动带出入库信息（集成后开放），当前支持手动选择" />

    <!-- 入库类型 -->
    <view class="mt-3 rounded-lg bg-white p-4">
      <text class="text-4 text-#1d2129 font-medium">入库类型</text>
      <view class="mt-3 flex items-center gap-6">
        <wd-radio-group v-model="form.type" inline>
          <wd-radio v-for="option in TYPE_OPTIONS" :key="option.value" :value="option.value">
            {{ option.label }}
          </wd-radio>
        </wd-radio-group>
      </view>
    </view>

    <!-- 入库物资 -->
    <view class="mt-3 rounded-lg bg-white p-4">
      <view class="flex items-center justify-between">
        <text class="text-4 text-#1d2129 font-medium">入库物资</text>
        <wd-button size="small" plain @click="openPicker">
          添加物资
        </wd-button>
      </view>

      <view v-if="lines.length" class="mt-1">
        <view
          v-for="(line, index) in lines"
          :key="line.material.id"
          class="py-4"
          :class="index > 0 ? 'border-t border-solid border-#f2f3f5' : ''"
        >
          <view class="flex items-start justify-between">
            <view class="flex-1">
              <view class="flex items-center gap-2">
                <text class="text-4 text-#1d2129">{{ line.material.name }}</text>
                <text class="text-2 text-#86909c">{{ line.material.code }}</text>
              </view>
              <text class="mt-1 block text-3 text-#86909c">{{ line.material.spec }} · 当前库存 {{ line.material.stock }}{{ line.material.unit }}</text>
            </view>
            <text class="i-carbon-delete text-5 text-#86909c" @click="removeLine(index)" />
          </view>
          <view class="mt-3 flex items-center justify-between gap-3">
            <text class="flex-none text-3 text-#4e5969">入库数量</text>
            <wd-input-number v-model="line.quantity" :min="1" :max="9999" />
          </view>
          <wd-datetime-picker
            v-if="line.material.expiryRequired"
            v-model="line.expiryDate"
            type="date"
            :min-date="minDate"
            title="选择有效期"
          >
            <wd-cell title="有效期至" is-link :value="dayjs(line.expiryDate).format('YYYY-MM-DD')" />
          </wd-datetime-picker>
        </view>
      </view>
      <view v-else class="center flex-col gap-2 py-8">
        <text class="i-carbon-box text-10 text-#c9cdd4" />
        <text class="text-3 text-#86909c">暂未添加物资，点击右上角按钮选择</text>
      </view>
    </view>

    <!-- 入库信息 -->
    <view class="mt-3 rounded-lg bg-white p-4">
      <text class="text-4 text-#1d2129 font-medium">入库信息</text>
      <wd-cell-group border custom-class="mt-2">
        <wd-cell title="供应商" center>
          <wd-input v-model="form.supplier" placeholder="采购入库时填写" custom-class="text-right" />
        </wd-cell>
      </wd-cell-group>
      <view class="mt-3">
        <text class="text-3 text-#4e5969">入库凭证</text>
        <view class="mt-3">
          <MaterialPhotoPicker ref="photoPickerRef" :max="6" />
        </view>
      </view>
      <view class="mt-3">
        <text class="text-3 text-#4e5969">备注</text>
        <view class="mt-2 rounded-lg bg-#f7f8fa px-3 py-2">
          <wd-textarea
            v-model="form.remark"
            placeholder="请填写入库备注"
            :maxlength="100"
            :show-word-limit="true"
            auto-height
          />
        </view>
      </view>
    </view>

    <MaterialPicker ref="pickerRef" @confirm="handlePicked" />

    <MaterialBottomBar>
      <text class="flex-1 text-3 text-#86909c">共 {{ lines.length }} 种物资</text>
      <wd-button
        custom-class="flex-1"
        type="primary"
        :loading="submitting"
        :disabled="submitting"
        @click="handleSubmit"
      >
        提交入库
      </wd-button>
    </MaterialBottomBar>
  </view>
</template>

<style lang="scss" scoped>
</style>
