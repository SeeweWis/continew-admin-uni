<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui'
import { useConfirmDialog } from '@/utils/dialog'
import { CABINET, CABINET_BODY_CHECKS, CABINET_CHECK_LINES } from '../../mock'
import MaterialBottomBar from '../../components/MaterialBottomBar.vue'
import MaterialPhotoPicker from '../../components/MaterialPhotoPicker.vue'

definePage({
  style: {
    navigationBarTitleText: '应急柜点检',
  },
})

const toast = useToast()
const confirmDialog = useConfirmDialog()

const lines = ref(CABINET_CHECK_LINES.map(line => ({ ...line })))
const bodyChecks = ref(CABINET_BODY_CHECKS.map(item => ({ ...item })))
const photoPickerRef = ref<InstanceType<typeof MaterialPhotoPicker>>()

const STATE_OPTIONS = [
  { label: '在位', value: 'normal' },
  { label: '异常', value: 'abnormal' },
  { label: '缺失', value: 'missing' },
]
const BODY_STATE_OPTIONS = [
  { label: '正常', value: 'normal' },
  { label: '异常', value: 'abnormal' },
]

/** 点检进度：已确认状态的项 / 总项数 */
const checkedCount = computed(() => lines.value.filter(line => line.state !== '').length + bodyChecks.value.filter(item => item.state !== '').length)
const totalCount = computed(() => lines.value.length + bodyChecks.value.length)
const checkedPercent = computed(() => Math.round((checkedCount.value / totalCount.value) * 100))
const hasAbnormal = computed(() =>
  lines.value.some(line => line.state === 'abnormal' || line.state === 'missing')
  || bodyChecks.value.some(item => item.state === 'abnormal'),
)

const submitting = ref(false)

/** mock：模拟提交点检结果；后端定稿后改为 submitCabinetCheck(cabinetCode, lines, photos) */
async function handleSubmit() {
  if (checkedCount.value < totalCount.value) {
    toast.show('还有检查项未确认，请逐项点检')
    return
  }
  if (lines.value.some(line => line.state !== 'normal' && line.state !== '' && !line.remark.trim())) {
    toast.show('异常或缺失的物品请填写说明')
    return
  }
  if (!await confirmDialog(hasAbnormal.value ? '存在异常项，提交后将生成整改提醒，确认提交吗？' : '全部检查项正常，确认提交点检结果吗？'))
    return
  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  submitting.value = false
  toast.success(hasAbnormal.value ? '已提交，异常项将通知整改' : '点检完成')
  setTimeout(() => uni.navigateBack(), 800)
}
</script>

<template>
  <view class="page-material-cabinet-check min-h-screen bg-#f2f3f5 px-4 pb-[140px] pt-3">
    <!-- 柜体信息 -->
    <view class="rounded-lg bg-white p-4">
      <view class="flex items-center justify-between">
        <view class="flex items-center gap-2">
          <text class="text-5 text-#1d2129 font-medium">{{ CABINET.name }}</text>
          <text class="text-3 text-#86909c">{{ CABINET.code }}</text>
        </view>
        <wd-tag :type="CABINET.lastCheckResult === '正常' ? 'success' : 'danger'" custom-class="!text-2">
          上次点检{{ CABINET.lastCheckResult }}
        </wd-tag>
      </view>
      <view class="mt-3 flex items-center justify-between">
        <text class="text-3 text-#86909c">{{ CABINET.location }}</text>
        <text class="text-2 text-#86909c">{{ CABINET.lastCheckTime }}</text>
      </view>
    </view>

    <!-- 点检进度 -->
    <view class="mt-3 rounded-lg bg-white p-4">
      <view class="flex items-center justify-between">
        <text class="text-4 text-#1d2129 font-medium">点检进度</text>
        <text class="text-3 text-#86909c">{{ checkedCount }}/{{ totalCount }} 项</text>
      </view>
      <view class="mt-3">
        <wd-progress :percentage="checkedPercent" />
      </view>
    </view>

    <!-- 物品点检 -->
    <view class="mt-3 rounded-lg bg-white p-4">
      <text class="text-4 text-#1d2129 font-medium">物品点检</text>
      <view class="mt-1">
        <view
          v-for="(line, index) in lines"
          :key="line.name"
          class="py-4"
          :class="index > 0 ? 'border-t border-solid border-#f2f3f5' : ''"
        >
          <view class="flex items-start justify-between gap-3">
            <view class="flex-1">
              <view class="flex items-center gap-2">
                <text class="text-4 text-#1d2129">{{ line.name }}</text>
                <wd-tag v-if="line.state === 'missing'" type="danger" custom-class="!text-2">
                  缺失
                </wd-tag>
                <wd-tag v-else-if="line.state === 'abnormal'" type="warning" custom-class="!text-2">
                  异常
                </wd-tag>
              </view>
              <text class="mt-1 block text-3 text-#86909c">{{ line.standard }} · 应备 {{ line.standardQty }}</text>
            </view>
            <wd-segmented v-model:value="line.state" :options="STATE_OPTIONS" size="small" />
          </view>
          <view v-if="line.state === 'abnormal' || line.state === 'missing'" class="mt-3 rounded-lg bg-#f7f8fa px-3 py-2">
            <wd-input v-model="line.remark" :placeholder="line.state === 'missing' ? '请说明缺失情况' : '请说明异常情况'" />
          </view>
        </view>
      </view>
    </view>

    <!-- 柜体状态 -->
    <view class="mt-3 rounded-lg bg-white p-4">
      <text class="text-4 text-#1d2129 font-medium">柜体状态</text>
      <view class="mt-1">
        <view
          v-for="(item, index) in bodyChecks"
          :key="item.label"
          class="flex items-center justify-between gap-3 py-4"
          :class="index > 0 ? 'border-t border-solid border-#f2f3f5' : ''"
        >
          <text class="text-4 text-#1d2129">{{ item.label }}</text>
          <wd-segmented v-model:value="item.state" :options="BODY_STATE_OPTIONS" size="small" />
        </view>
      </view>
    </view>

    <!-- 现场照片 -->
    <view class="mt-3 rounded-lg bg-white p-4">
      <text class="text-4 text-#1d2129 font-medium">现场照片</text>
      <view class="mt-3">
        <MaterialPhotoPicker ref="photoPickerRef" :max="6" />
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
        提交点检结果
      </wd-button>
    </MaterialBottomBar>
  </view>
</template>

<style lang="scss" scoped>
</style>
