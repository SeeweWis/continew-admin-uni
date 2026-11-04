<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui'
import { useConfirmDialog } from '@/utils/dialog'
import { STOCKTAKE_LINES, STOCKTAKE_TASK } from '../../mock'
import MaterialBottomBar from '../../components/MaterialBottomBar.vue'

definePage({
  style: {
    navigationBarTitleText: '扫码盘点',
  },
})

const toast = useToast('stocktake')
const confirmDialog = useConfirmDialog()

const lines = ref(STOCKTAKE_LINES.map(line => ({ ...line })))

/** 差异：>0 盘盈，<0 盘亏 */
function diffOf(line: { bookQty: number, actualQty: number }) {
  return line.actualQty - line.bookQty
}

const diffCount = computed(() => lines.value.filter(line => diffOf(line) !== 0).length)
const overCount = computed(() => lines.value.filter(line => diffOf(line) > 0).length)
const lossCount = computed(() => lines.value.filter(line => diffOf(line) < 0).length)

const submitting = ref(false)

/** mock：模拟提交盘点结果；后端定稿后改为 submitStocktake(taskCode, lines) */
async function handleSubmit() {
  if (diffCount.value > 0 && lines.value.some(line => diffOf(line) !== 0 && !line.remark.trim())) {
    toast.show('存在差异的物资请填写原因')
    return
  }
  if (!await confirmDialog(diffCount.value > 0 ? `盘点存在 ${diffCount.value} 项差异，提交后将生成复核单，确认提交吗？` : '全部账实一致，确认提交盘点结果吗？'))
    return
  submitting.value = true
  await new Promise(resolve => setTimeout(resolve, 500))
  submitting.value = false
  toast.success(diffCount.value > 0 ? '盘点已提交，差异项将进入复核' : '盘点完成')
  setTimeout(() => uni.navigateBack(), 800)
}
</script>

<template>
  <view class="page-material-stock-stocktake min-h-screen bg-#f2f3f5 px-4 pb-[140px] pt-3">
    <wd-toast selector="stocktake" />
    <wd-notice-bar text="逐项清点后填写实盘数，系统自动计算账实差异" />

    <!-- 盘点任务 -->
    <view class="mt-3 rounded-lg bg-white p-4">
      <view class="flex items-center justify-between">
        <text class="text-5 text-#1d2129 font-medium">{{ STOCKTAKE_TASK.scope }}</text>
        <text class="text-3 text-#86909c">{{ STOCKTAKE_TASK.code }}</text>
      </view>
      <wd-cell-group border custom-class="mt-3">
        <wd-cell title="盘点人" :value="STOCKTAKE_TASK.checker" />
        <wd-cell title="截止时间" :value="STOCKTAKE_TASK.deadline" />
      </wd-cell-group>
      <view class="mt-3 flex items-center gap-4">
        <view class="flex items-center gap-1">
          <text class="text-4 text-#1d2129 font-medium">{{ lines.length - diffCount }}</text>
          <text class="text-2 text-#86909c">一致</text>
        </view>
        <view class="flex items-center gap-1">
          <text class="text-4 text-[var(--wot-color-theme,#4d80f0)] font-medium">{{ overCount }}</text>
          <text class="text-2 text-#86909c">盘盈</text>
        </view>
        <view class="flex items-center gap-1">
          <text class="text-4 text-[#e34d59] font-medium">{{ lossCount }}</text>
          <text class="text-2 text-#86909c">盘亏</text>
        </view>
      </view>
    </view>

    <!-- 盘点清单 -->
    <view class="mt-3 rounded-lg bg-white p-4">
      <text class="text-4 text-#1d2129 font-medium">盘点清单</text>
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
              <text class="mt-1 block text-3 text-#86909c">账面 {{ line.bookQty }}{{ line.unit }}</text>
            </view>
            <wd-tag v-if="diffOf(line) > 0" type="primary" custom-class="!text-2">
              盘盈 {{ diffOf(line) }}
            </wd-tag>
            <wd-tag v-else-if="diffOf(line) < 0" type="danger" custom-class="!text-2">
              盘亏 {{ -diffOf(line) }}
            </wd-tag>
            <wd-tag v-else type="success" custom-class="!text-2">
              一致
            </wd-tag>
          </view>
          <view class="mt-3 flex items-center justify-between gap-3">
            <text class="flex-none text-3 text-#4e5969">实盘</text>
            <wd-input-number v-model="line.actualQty" :min="0" :max="9999" />
          </view>
          <view v-if="diffOf(line) !== 0" class="mt-3 rounded-lg bg-#f7f8fa px-3 py-2">
            <wd-input v-model="line.remark" placeholder="请填写差异原因" />
          </view>
        </view>
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
        提交盘点结果
      </wd-button>
    </MaterialBottomBar>
  </view>
</template>

<style lang="scss" scoped>
</style>
