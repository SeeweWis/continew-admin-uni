<script lang="ts" setup>
import type { MessageItem } from '@/api/types/message'
import type { MenuNode } from '@/store/menu'
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { fetchGetMessagePage, fetchGetMessageUnread } from '@/api/message'
import { usePageRefresh } from '@/hooks/usePageRefresh'
import { getMiniMenuIcon } from '@/modules/menu-config'
import { fetchUserInfo } from '@/services/auth'
import { useUserStore } from '@/store'
import { useMenuStore } from '@/store/menu'
import { useSiteConfigStore } from '@/store/site'
import { useTokenStore } from '@/store/token'
import { openLoginPopup } from '@/utils/loginPopup'

defineOptions({
  name: 'Home',
})

definePage({
  type: 'home',
  style: {
    navigationBarTitleText: '首页',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
const siteStore = useSiteConfigStore()
const menuStore = useMenuStore()
const { userInfo } = storeToRefs(userStore)
const { siteTitle } = storeToRefs(siteStore)
const { rootMenus, status: menuStatus } = storeToRefs(menuStore)
const displayName = computed(() => userInfo.value.nickname || userInfo.value.username || '用户')
const recentMessages = ref<MessageItem[]>([])
const unreadCount = ref(0)
const messageStatus = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
let messageRequestId = 0

watch(() => tokenStore.tokenInfo.token, (token) => {
  messageRequestId++
  recentMessages.value = []
  unreadCount.value = 0
  messageStatus.value = 'idle'
  if (token) {
    void menuStore.load().catch(() => {})
    void loadMessages()
  }
})

async function loadMessages() {
  const requestId = ++messageRequestId
  messageStatus.value = 'loading'
  try {
    const [unread, page] = await Promise.all([
      fetchGetMessageUnread(),
      fetchGetMessagePage({ page: 1, size: 3 }),
    ])
    if (requestId !== messageRequestId || !tokenStore.updateNowTime().hasLogin)
      return
    unreadCount.value = unread.total
    recentMessages.value = page.list
    messageStatus.value = 'ready'
  }
  catch {
    if (requestId === messageRequestId)
      messageStatus.value = 'error'
  }
}

onShow(() => {
  if (!tokenStore.updateNowTime().hasLogin)
    return
  void menuStore.load().catch(() => {})
  void loadMessages()
})

usePageRefresh(async () => {
  if (!tokenStore.updateNowTime().hasLogin)
    return
  await Promise.allSettled([fetchUserInfo(), menuStore.load(true), loadMessages()])
})

function openRoot(menu: MenuNode) {
  menuStore.selectRoot(menu.name)
  openPage('/pages-workbench/index')
}

function openPage(url: string) {
  uni.navigateTo({ url })
}

function openTab(url: string) {
  uni.switchTab({ url })
}
</script>

<template>
  <view class="min-h-screen bg-#F5F7FA p-32rpx">
    <view class="rounded-24rpx bg-#165DFF p-36rpx text-white">
      <view class="flex items-center justify-between">
        <view class="min-w-0 flex-1">
          <text class="block text-22rpx tracking-2rpx opacity-80">{{ siteTitle }}</text>
          <text class="mt-12rpx block text-40rpx font-bold leading-tight">欢迎使用，{{ displayName }}</text>
          <text class="mt-12rpx block text-23rpx opacity-85">常用服务与最新消息，尽在首页</text>
        </view>
        <view class="ml-20rpx h-80rpx w-80rpx flex flex-none items-center justify-center rounded-full bg-white/20 text-30rpx font-bold">
          {{ displayName.slice(0, 1) }}
        </view>
      </view>
    </view>

    <view class="mt-32rpx rounded-20rpx bg-white p-28rpx">
      <text class="block text-30rpx text-#1D2129 font-semibold">快捷入口</text>
      <view class="mt-28rpx flex justify-around">
        <view class="flex flex-col items-center" @click="openPage('/pages-scan/index')">
          <view class="h-88rpx w-88rpx flex items-center justify-center rounded-22rpx bg-#E8F3FF text-40rpx text-#165DFF">
            <view class="mdi mdi-qrcode" />
          </view>
          <text class="mt-12rpx text-24rpx text-#4E5969">扫码</text>
        </view>
        <view class="flex flex-col items-center" @click="openPage('/pages-workbench/index')">
          <view class="h-88rpx w-88rpx flex items-center justify-center rounded-22rpx bg-#E8F3FF text-40rpx text-#165DFF">
            <view class="mdi mdi-view-dashboard-outline" />
          </view>
          <text class="mt-12rpx text-24rpx text-#4E5969">工作台</text>
        </view>
        <view class="flex flex-col items-center" @click="openTab('/pages/message/index')">
          <view class="h-88rpx w-88rpx flex items-center justify-center rounded-22rpx bg-#E8F3FF text-40rpx text-#165DFF">
            <view class="mdi mdi-bell-outline" />
          </view>
          <text class="mt-12rpx text-24rpx text-#4E5969">消息</text>
        </view>
      </view>
    </view>

    <view class="mt-32rpx rounded-20rpx bg-white p-28rpx">
      <view class="flex items-center justify-between">
        <text class="text-30rpx text-#1D2129 font-semibold">我的功能</text>
        <text class="text-22rpx text-#86909C">由后台权限决定</text>
      </view>
      <view v-if="!tokenStore.hasLogin" class="py-48rpx text-center">
        <text class="mb-20rpx block text-25rpx text-#86909C">登录后查看可用功能</text>
        <wd-button round size="small" @click="openLoginPopup">
          登录
        </wd-button>
      </view>
      <view v-else-if="menuStatus === 'loading' && !rootMenus.length" class="py-48rpx text-center text-25rpx text-#86909C">
        正在加载功能…
      </view>
      <view v-else-if="menuStatus === 'error'" class="py-48rpx text-center">
        <text class="mb-20rpx block text-25rpx text-#86909C">功能加载失败</text>
        <wd-button round size="small" plain @click="menuStore.load(true).catch(() => {})">
          重试
        </wd-button>
      </view>
      <view v-else-if="!rootMenus.length" class="py-48rpx text-center text-25rpx text-#86909C">
        暂无可用功能
      </view>
      <view v-else class="grid grid-cols-3 mt-28rpx gap-y-28rpx">
        <view v-for="menu in rootMenus" :key="menu.name" class="flex flex-col items-center" @click="openRoot(menu)">
          <view class="h-88rpx w-88rpx flex items-center justify-center rounded-22rpx bg-#E8F3FF text-40rpx text-#165DFF">
            <view :class="getMiniMenuIcon(menu.icon)" />
          </view>
          <text class="mt-12rpx max-w-180rpx truncate text-24rpx text-#4E5969">{{ menu.title }}</text>
        </view>
      </view>
    </view>

    <view class="mt-32rpx rounded-20rpx bg-white p-28rpx">
      <view class="flex items-center justify-between">
        <view class="flex items-center">
          <text class="text-30rpx text-#1D2129 font-semibold">最近消息</text>
          <text v-if="unreadCount" class="ml-12rpx rounded-full bg-#FFF1F0 px-12rpx py-4rpx text-20rpx text-#F53F3F">{{ unreadCount }} 条未读</text>
        </view>
        <text class="text-23rpx text-#165DFF" @click="openTab('/pages/message/index')">查看全部 ›</text>
      </view>
      <view v-if="!tokenStore.hasLogin" class="py-48rpx text-center text-25rpx text-#86909C">
        登录后查看消息
      </view>
      <view v-else-if="messageStatus === 'loading' && !recentMessages.length" class="py-48rpx text-center text-25rpx text-#86909C">
        正在加载消息…
      </view>
      <view v-else-if="messageStatus === 'error'" class="py-48rpx text-center">
        <text class="mb-20rpx block text-25rpx text-#86909C">消息加载失败</text>
        <wd-button round size="small" plain @click="loadMessages">
          重试
        </wd-button>
      </view>
      <view v-else-if="!recentMessages.length" class="py-48rpx text-center text-25rpx text-#86909C">
        暂无消息
      </view>
      <view v-else class="mt-12rpx">
        <view
          v-for="(item, index) in recentMessages"
          :key="item.id"
          class="flex items-center py-22rpx"
          :class="index < recentMessages.length - 1 ? 'border-b border-#F2F3F5' : ''"
          @click="openTab('/pages/message/index')"
        >
          <view v-if="!item.isRead" class="mr-12rpx h-12rpx w-12rpx flex-none rounded-full bg-#F53F3F" />
          <text class="min-w-0 flex-1 truncate text-25rpx text-#1D2129">{{ item.title }}</text>
          <text class="ml-12rpx flex-none text-20rpx text-#86909C">{{ item.createTime || '' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>
