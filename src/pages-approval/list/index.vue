<script setup lang="ts">
import type { ApprovalListItem } from '@/api/approval'
import { onLoad } from '@dcloudio/uni-app'
import { computed, ref } from 'vue'
import { fetchMyApprovalPage } from '@/api/approval'
import { useListPage } from '@/hooks/useListPage'

definePage({
  style: { navigationBarTitleText: '审批中心' },
})

const kind = ref<'application' | 'task'>('application')
const title = computed(() => kind.value === 'application' ? '我的申请' : '我的待办')
const statusLabels: Record<string, string> = {
  PENDING: '待审批',
  IN_PROGRESS: '审批中',
  APPROVED: '已通过',
  REJECTED: '已拒绝',
  CANCELLED: '已撤销',
  TRANSFERRED: '已转办',
}

onLoad((options) => {
  kind.value = options?.kind === 'task' ? 'task' : 'application'
  uni.setNavigationBarTitle({ title: title.value })
})

const { list, loading, finished, error, refresh, loadMore } = useListPage<ApprovalListItem>({
  fetchData: async (page, size) => (await fetchMyApprovalPage(kind.value, page, size)).list,
})
</script>

<template>
  <view class="min-h-screen bg-#F5F7FA p-32rpx">
    <text class="mb-24rpx block text-34rpx text-#1D2129 font-bold">{{ title }}</text>
    <view v-if="list.length" class="flex flex-col gap-16rpx">
      <view v-for="item in list" :key="item.id" class="rounded-16rpx bg-white p-28rpx">
        <view class="flex items-center justify-between gap-16rpx">
          <text class="min-w-0 flex-1 truncate text-27rpx text-#1D2129 font-semibold">{{ item.title }}</text>
          <text class="flex-none text-22rpx text-#165DFF">{{ statusLabels[item.status] ?? item.status }}</text>
        </view>
        <text v-if="item.currentNodeName || item.nodeName" class="mt-12rpx block text-23rpx text-#4E5969">
          {{ item.currentNodeName || item.nodeName }}
        </text>
        <text class="mt-12rpx block text-21rpx text-#86909C">{{ item.startTime || item.createTime || '' }}</text>
      </view>
      <view v-if="error" class="py-24rpx text-center">
        <wd-button round size="small" plain @click="loadMore">
          加载失败，重试
        </wd-button>
      </view>
      <wd-loadmore v-else :state="finished ? 'finished' : 'loading'" finished-text="没有更多了" />
    </view>
    <view v-else-if="loading" class="py-72rpx text-center text-#86909C">
      正在加载…
    </view>
    <view v-else-if="error" class="py-72rpx text-center">
      <wd-button round size="small" plain @click="refresh">
        加载失败，重试
      </wd-button>
    </view>
    <wd-empty v-else-if="finished" class="mt-72rpx" :description="kind === 'application' ? '暂无申请' : '暂无待办'" />
  </view>
</template>
