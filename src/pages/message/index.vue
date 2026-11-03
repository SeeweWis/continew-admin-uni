<script lang="ts" setup>
import type { MessageItem } from '@/api/types/message'
import { onMounted, onUnmounted, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui'
import { fetchGetMessageDetail, fetchGetMessagePage, fetchGetMessageUnread, fetchReadAllMessages } from '@/api/message'
import { usePageRefresh } from '@/hooks/usePageRefresh'
import { useScroll } from '@/hooks/useScroll'

definePage({
  style: {
    navigationBarTitleText: '消息中心',
  },
})

const toast = useToast()
const unread = ref(0)
const detail = ref<MessageItem | null>(null)
const detailVisible = ref(false)

async function fetchMessages(page: number, pageSize: number): Promise<MessageItem[]> {
  const result = await fetchGetMessagePage({ page, size: pageSize })
  return result.list
}

const { list, loading, finished, error, refresh, loadMore } = useScroll<MessageItem>({
  fetchData: fetchMessages,
})

async function loadUnread() {
  try {
    const result = await fetchGetMessageUnread()
    unread.value = result.total
  }
  catch {
    // 错误提示由 http 层统一处理
  }
}

onMounted(() => {
  void loadUnread()
  uni.$on('app:scrolltolower', loadMore)
})
onUnmounted(() => {
  uni.$off('app:scrolltolower', loadMore)
})

let hasShown = false
onShow(() => {
  if (hasShown) {
    if (!loading.value)
      void refresh()
    void loadUnread()
  }
  hasShown = true
})

usePageRefresh(async () => {
  await Promise.all([refresh(), loadUnread()])
})

async function handleReadAll() {
  if (!unread.value)
    return
  try {
    await fetchReadAllMessages()
    list.value.forEach(item => (item.isRead = true))
    unread.value = 0
    toast.success('已全部标记为已读')
  }
  catch {
    // 错误提示由 http 层统一处理
  }
}

async function openMessage(item: MessageItem) {
  try {
    const data = await fetchGetMessageDetail(item.id)
    if (!item.isRead)
      unread.value = Math.max(0, unread.value - 1)
    item.isRead = true
    detail.value = data
    detailVisible.value = true
  }
  catch {
    // 错误提示由 http 层统一处理
  }
}
</script>

<template>
  <view class="min-h-screen bg-#f2f3f5 p-3">
    <wd-toast />

    <view class="mb-3 flex items-center justify-between rounded-16rpx bg-white px-4 py-3">
      <view class="flex items-center gap-2">
        <text class="text-4 text-#1d2129 font-medium">消息中心</text>
        <text v-if="unread" class="rounded-full bg-#FFF1F0 px-2 py-1 text-2 text-#F53F3F">
          {{ unread }} 条未读
        </text>
      </view>
      <wd-button round size="small" plain :disabled="!unread" @click="handleReadAll">
        全部已读
      </wd-button>
    </view>

    <view v-if="list.length" class="flex flex-col gap-3">
      <view
        v-for="item in list"
        :key="item.id"
        class="rounded-16rpx bg-white p-4 active:bg-#fafafa"
        @click="openMessage(item)"
      >
        <view class="flex items-center gap-2">
          <view v-if="!item.isRead" class="h-2 w-2 flex-none rounded-full bg-#F53F3F" />
          <text class="min-w-0 flex-1 truncate text-3 text-#1d2129 font-medium">{{ item.title }}</text>
          <text class="flex-none text-2 text-#86909c">{{ item.createTime || '' }}</text>
        </view>
        <text v-if="item.content" class="mt-2 block truncate text-3 text-#86909c">{{ item.content }}</text>
      </view>

      <wd-loadmore :state="loading ? 'loading' : 'finished'" finished-text="没有更多了" />
    </view>

    <view v-else-if="loading" class="mt-20 text-center text-#86909C">
      正在加载消息…
    </view>
    <view v-else-if="error" class="mt-20 text-center">
      <text class="mb-20rpx block text-#86909C">加载失败</text>
      <wd-button round size="small" plain @click="refresh">
        重试
      </wd-button>
    </view>
    <wd-empty v-else-if="finished" class="mt-20" description="暂无消息" />

    <wd-popup v-model="detailVisible" position="bottom" custom-class="rounded-t-2xl">
      <view class="max-h-[70vh] overflow-y-auto p-4">
        <view class="flex items-center justify-between gap-3">
          <text class="min-w-0 flex-1 text-4 text-#1d2129 font-medium">{{ detail?.title }}</text>
          <text class="i-carbon-close flex-none text-5 text-#86909c" @click="detailVisible = false" />
        </view>
        <text class="mt-2 block text-2 text-#86909c">{{ detail?.createTime || '' }}</text>
        <text class="mt-4 block whitespace-pre-wrap text-3 text-#4e5969">{{ detail?.content || '暂无内容' }}</text>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
</style>
