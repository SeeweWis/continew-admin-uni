<script lang="ts" setup>
import type { MessageItem } from '@/api/types/message'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui'
import { fetchGetMessageDetail, fetchGetMessagePage, fetchGetMessageUnread, fetchReadAllMessages } from '@/api/message'
import { usePageRefresh } from '@/hooks/usePageRefresh'

definePage({
  style: {
    navigationBarTitleText: '消息中心',
  },
})

const toast = useToast('message')
const unread = ref(0)
const activeTab = ref<'all' | 'unread'>('all')
const detail = ref<MessageItem | null>(null)
const detailVisible = ref(false)
const list = ref<MessageItem[]>([])
const loading = ref(false)
const finished = ref(false)
const error = ref(false)
let page = 1
let requestVersion = 0

async function loadMore() {
  if (loading.value || finished.value)
    return

  const currentVersion = requestVersion
  const currentPage = page
  loading.value = true
  error.value = false
  try {
    const result = await fetchGetMessagePage({
      page: currentPage,
      size: 10,
      ...(activeTab.value === 'unread' ? { isRead: false } : {}),
    })
    if (currentVersion !== requestVersion)
      return
    list.value.push(...result.list)
    finished.value = result.list.length < 10 || list.value.length >= result.total
    page++
  }
  catch {
    if (currentVersion === requestVersion)
      error.value = true
  }
  finally {
    if (currentVersion === requestVersion)
      loading.value = false
  }
}

async function refresh() {
  requestVersion++
  page = 1
  list.value = []
  finished.value = false
  loading.value = false
  await loadMore()
}

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
  void refresh()
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

watch(activeTab, () => {
  void refresh()
})

async function handleReadAll() {
  if (!unread.value)
    return
  try {
    await fetchReadAllMessages()
    unread.value = 0
    await refresh()
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
    await refresh()
  }
  catch {
    // 错误提示由 http 层统一处理
  }
}
</script>

<template>
  <view class="min-h-screen bg-#f2f3f5 p-3">
    <wd-toast selector="message" />

    <view class="message-tabs">
      <wd-tabs v-model="activeTab" color="#165DFF" line-theme="text">
        <wd-tab title="全部" name="all" />
        <wd-tab :title="unread ? `未读 ${unread}` : '未读'" name="unread" />
      </wd-tabs>
    </view>

    <view class="mb-3 mt-2 flex items-center justify-between px-1">
      <text class="text-3 text-#86909c">{{ activeTab === 'unread' ? '未读消息' : '全部消息' }}</text>
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

      <view v-if="error" class="py-3 text-center">
        <wd-button round size="small" plain @click="loadMore">
          加载失败，重试
        </wd-button>
      </view>
      <wd-loadmore v-else :state="loading ? 'loading' : finished ? 'finished' : 'loading'" finished-text="没有更多了" />
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
    <wd-empty v-else-if="finished" class="mt-20" :description="activeTab === 'unread' ? '暂无未读消息' : '暂无消息'" />

    <wd-popup v-model="detailVisible" position="bottom" custom-class="rounded-t-2xl">
      <view class="max-h-[70vh] overflow-y-auto p-4">
        <view class="flex items-center justify-between gap-3">
          <text class="min-w-0 flex-1 text-4 text-#1d2129 font-medium">{{ detail?.title }}</text>
          <view class="mdi mdi-close flex-none text-5 text-#86909c" @click="detailVisible = false" />
        </view>
        <text class="mt-2 block text-2 text-#86909c">{{ detail?.createTime || '' }}</text>
        <text class="mt-4 block whitespace-pre-wrap text-3 text-#4e5969">{{ detail?.content || '暂无内容' }}</text>
      </view>
    </wd-popup>
  </view>
</template>

<style lang="scss" scoped>
.message-tabs {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
}
</style>
