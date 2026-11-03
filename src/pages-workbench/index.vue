<script setup lang="ts">
import type { MenuNode } from '@/store/menu'
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { useToast } from '@wot-ui/ui'
import { usePageRefresh } from '@/hooks/usePageRefresh'
import { getMiniMenuIcon, miniMenuPages } from '@/modules/menu-config'
import { useMenuStore } from '@/store/menu'
import { useTokenStore } from '@/store/token'
import { isPageTabbar } from '@/tabbar/store'
import { openLoginPopup } from '@/utils/loginPopup'

definePage({
  style: {
    navigationBarTitleText: '工作台',
  },
})

const menuStore = useMenuStore()
const tokenStore = useTokenStore()
const toast = useToast()
const { rootMenus, selectedRoot, workbenchMenus, status } = storeToRefs(menuStore)
const rootTitle = computed(() => selectedRoot.value?.title ?? '工作台')

function reload() {
  void menuStore.load(true).catch(() => {})
}

onShow(() => {
  if (tokenStore.updateNowTime().hasLogin)
    void menuStore.load().catch(() => {})
})

usePageRefresh(async () => {
  if (tokenStore.updateNowTime().hasLogin)
    await menuStore.load(true).catch(() => {})
})

function openMenu(menu: MenuNode) {
  const page = miniMenuPages[menu.name]
  if (!page) {
    toast.show('暂未接入小程序')
    return
  }
  if (isPageTabbar(page.route))
    uni.switchTab({ url: page.route })
  else
    uni.navigateTo({ url: page.route })
}
</script>

<template>
  <view class="p-32rpx">
    <wd-toast />
    <view class="mb-24rpx rounded-20rpx bg-#165DFF p-32rpx text-white">
      <text class="block text-22rpx opacity-80">当前目录</text>
      <text class="mt-10rpx block text-40rpx font-bold">{{ rootTitle }}</text>
      <text class="mt-12rpx block text-22rpx opacity-80">选择目录，查看对应功能</text>
    </view>
    <scroll-view v-if="rootMenus.length > 1" scroll-x class="mb-24rpx whitespace-nowrap">
      <view class="inline-flex gap-12rpx pb-4rpx">
        <view
          v-for="root in rootMenus"
          :key="root.name"
          class="rounded-full px-24rpx py-14rpx text-24rpx"
          :class="root.name === selectedRoot?.name ? 'bg-#165DFF text-white' : 'bg-white text-#4E5969'"
          @click="menuStore.selectRoot(root.name)"
        >
          {{ root.title }}
        </view>
      </view>
    </scroll-view>

    <view v-if="!tokenStore.hasLogin" class="rounded-16rpx bg-white p-36rpx text-center">
      <text class="mb-20rpx block text-26rpx text-#4E5969">登录后查看可用菜单</text>
      <wd-button round size="small" @click="openLoginPopup">
        登录
      </wd-button>
    </view>
    <view v-else-if="status === 'loading' && !selectedRoot" class="py-72rpx text-center text-#86909C">
      正在加载菜单…
    </view>
    <view v-else-if="status === 'error'" class="rounded-16rpx bg-white p-36rpx text-center">
      <text class="mb-20rpx block text-26rpx text-#4E5969">菜单加载失败</text>
      <wd-button round size="small" plain @click="reload">
        重试
      </wd-button>
    </view>
    <view v-else-if="!selectedRoot || !workbenchMenus.length" class="rounded-16rpx bg-white p-36rpx text-center text-#86909C">
      暂无可用菜单
    </view>
    <view v-else class="overflow-hidden rounded-16rpx bg-white">
      <view
        v-for="(menu, index) in workbenchMenus"
        :key="menu.name"
        class="mx-24rpx min-h-116rpx flex items-center"
        :class="index < workbenchMenus.length - 1 ? 'border-b border-#F2F3F5' : ''"
        @click="openMenu(menu)"
      >
        <view class="h-64rpx w-64rpx flex flex-none items-center justify-center rounded-16rpx bg-#E8F3FF text-30rpx text-#165DFF">
          <text :class="getMiniMenuIcon(menu.name)" />
        </view>
        <view class="ml-20rpx min-w-0 flex-1">
          <text class="block truncate text-27rpx text-#1D2129 font-semibold">{{ menu.title }}</text>
          <text class="mt-4rpx block text-20rpx text-#86909C">
            {{ miniMenuPages[menu.name]?.hint ?? (miniMenuPages[menu.name] ? '点击进入' : '暂未接入小程序') }}
          </text>
        </view>
        <text v-if="miniMenuPages[menu.name]" class="i-carbon-chevron-right text-28rpx text-#C9CDD4" />
      </view>
    </view>
  </view>
</template>
