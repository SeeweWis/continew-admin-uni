<script lang="ts" setup>
import type { MaterialItem } from '../../mock'
import { ref } from 'vue'
import { useToast } from '@wot-ui/ui'
import dayjs from 'dayjs'
import MaterialBottomBar from '../../components/MaterialBottomBar.vue'
import MaterialPicker from '../../components/MaterialPicker.vue'

definePage({
  style: {
    navigationBarTitleText: '领用申请',
  },
})

const toast = useToast()
const pickerRef = ref<InstanceType<typeof MaterialPicker>>()

/** 已选物资行 */
interface ApplyLine {
  material: MaterialItem
  quantity: number
}
const lines = ref<ApplyLine[]>([])

/** 扫码添加：待扫码页支持回传编码后开放（switchTab 会离开本页丢失表单） */
function openPicker() {
  pickerRef.value?.open()
}

function handlePicked(items: MaterialItem[]) {
  for (const material of items) {
    if (!lines.value.some(line => line.material.id === material.id))
      lines.value.push({ material, quantity: 1 })
  }
}

function removeLine(index: number) {
  lines.value.splice(index, 1)
}

const minDate = Date.now()
const form = ref({
  purpose: '',
  place: '',
  expectReturnDate: dayjs().add(7, 'day').valueOf(),
  urgent: 'normal',
})

const submitting = ref(false)

async function handleSubmit() {
  if (!lines.value.length) {
    toast.show('请先添加领用物资')
    return
  }
  if (!form.value.purpose.trim()) {
    toast.show('请填写领用用途')
    return
  }
  if (!form.value.place.trim()) {
    toast.show('请填写使用地点')
    return
  }
  submitting.value = true
  try {
    // 后端 /app/material/* 尚未提供，先保留本地演示提交
    await new Promise(resolve => setTimeout(resolve, 500))
    toast.success('提交成功，等待审批')
    setTimeout(() => uni.navigateBack(), 800)
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <view class="page-material-requisition-apply min-h-screen bg-#f2f3f5 px-4 pb-[140px] pt-3">
    <!-- 领用物资 -->
    <view class="rounded-lg bg-white p-4">
      <view class="flex items-center justify-between">
        <text class="text-4 text-#1d2129 font-medium">领用物资</text>
        <wd-button size="small" plain @click="openPicker">
          添加物资
        </wd-button>
      </view>

      <view v-if="lines.length" class="mt-1">
        <view
          v-for="(line, index) in lines"
          :key="line.material.id"
          class="flex items-start justify-between py-3"
          :class="index > 0 ? 'border-t border-solid border-#f2f3f5' : ''"
        >
          <view class="flex-1">
            <view class="flex items-center gap-2">
              <text class="text-4 text-#1d2129">{{ line.material.name }}</text>
              <text class="text-2 text-#86909c">{{ line.material.code }}</text>
            </view>
            <text class="mt-1 block text-3 text-#86909c">{{ line.material.spec }} · 库存 {{ line.material.stock }}{{ line.material.unit }}</text>
          </view>
          <view class="ml-3 flex items-center gap-3">
            <wd-input-number v-model="line.quantity" :min="1" :max="line.material.stock" />
            <text class="i-carbon-delete text-5 text-#86909c" @click="removeLine(index)" />
          </view>
        </view>
      </view>
      <view v-else class="center flex-col gap-2 py-8">
        <text class="i-carbon-box text-10 text-#c9cdd4" />
        <text class="text-3 text-#86909c">暂未添加物资，点击右上角按钮选择</text>
      </view>
    </view>

    <!-- 领用信息 -->
    <view class="mt-3 rounded-lg bg-white p-4">
      <text class="text-4 text-#1d2129 font-medium">领用信息</text>

      <view class="mt-3">
        <text class="form-label">领用用途<text class="text-[var(--wot-color-theme,#4d80f0)]">*</text></text>
        <view class="mt-2 rounded-lg bg-#f7f8fa px-3 py-2">
          <wd-textarea
            v-model="form.purpose"
            placeholder="请填写领用用途，如演练、补充、检修"
            :maxlength="100"
            :show-word-limit="true"
            auto-height
          />
        </view>
      </view>

      <view class="mt-4">
        <text class="form-label">使用地点<text class="text-[var(--wot-color-theme,#4d80f0)]">*</text></text>
        <view class="mt-2 rounded-lg bg-#f7f8fa px-3 py-2">
          <wd-input v-model="form.place" placeholder="请填写使用地点" />
        </view>
      </view>

      <wd-datetime-picker v-model="form.expectReturnDate" type="date" :min-date="minDate" title="预计归还日期">
        <wd-cell title="预计归还日期" required is-link :value="dayjs(form.expectReturnDate).format('YYYY-MM-DD')" />
      </wd-datetime-picker>

      <view class="flex items-center justify-between py-3">
        <text class="form-label">紧急程度</text>
        <wd-radio-group v-model="form.urgent">
          <wd-radio value="normal">
            一般
          </wd-radio>
          <wd-radio value="urgent">
            紧急
          </wd-radio>
        </wd-radio-group>
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
        提交申请
      </wd-button>
    </MaterialBottomBar>
  </view>
</template>

<style lang="scss" scoped>
.form-label {
  display: block;
  color: #1d2129;
  font-size: 26rpx;
  font-weight: 500;
}
</style>
