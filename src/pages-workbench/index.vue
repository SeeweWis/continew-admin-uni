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
const toast = useToast('workbench')
const { rootMenus, status } = storeToRefs(menuStore)
const menuSections = computed(() => rootMenus.value.map((root) => {
  if (root.type === 2)
    return { name: root.name, title: root.title, menus: [root] }

  const menus: MenuNode[] = []
  function visit(nodes: MenuNode[]) {
    nodes.forEach((node) => {
      if (node.type === 2)
        menus.push(node)
      visit(node.children)
    })
  }
  visit(root.children)
  return { name: root.name, title: root.title, menus }
}))

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
    <wd-toast selector="workbench" />
    <view class="mb-24rpx flex items-end justify-between">
      <view>
        <text class="block text-34rpx text-#1D2129 font-bold">工作台</text>
        <text class="mt-6rpx block text-22rpx text-#86909C">按权限展示可用功能</text>
      </view>
      <text v-if="tokenStore.hasLogin && status === 'ready'" class="text-21rpx text-#86909C">
        {{ menuSections.reduce((total, section) => total + section.menus.length, 0) }} 项功能
      </text>
    </view>

    <view v-if="!tokenStore.hasLogin" class="rounded-16rpx bg-white p-36rpx text-center">
      <text class="mb-20rpx block text-26rpx text-#4E5969">登录后查看可用菜单</text>
      <wd-button round size="small" @click="openLoginPopup">
        登录
      </wd-button>
    </view>
    <view v-else-if="status === 'loading' && !rootMenus.length" class="py-72rpx text-center text-#86909C">
      正在加载菜单…
    </view>
    <view v-else-if="status === 'error'" class="rounded-16rpx bg-white p-36rpx text-center">
      <text class="mb-20rpx block text-26rpx text-#4E5969">菜单加载失败</text>
      <wd-button round size="small" plain @click="reload">
        重试
      </wd-button>
    </view>
    <view v-else-if="!menuSections.length" class="rounded-16rpx bg-white p-36rpx text-center text-#86909C">
      暂无可用菜单
    </view>
    <view v-else class="flex flex-col gap-20rpx">
      <view v-for="section in menuSections" :key="section.name" class="overflow-hidden rounded-16rpx bg-white">
        <view class="flex items-center justify-between px-24rpx pb-8rpx pt-24rpx">
          <view class="min-w-0 flex items-center gap-12rpx">
            <view class="h-38rpx w-6rpx flex-none rounded-full bg-#165DFF" />
            <text class="truncate text-27rpx text-#1D2129 font-semibold">{{ section.title }}</text>
          </view>
          <text class="flex-none text-20rpx text-#86909C">{{ section.menus.length }}</text>
        </view>
        <view v-if="!section.menus.length" class="px-24rpx pb-28rpx text-22rpx text-#86909C">
          暂无可用功能
        </view>
        <view v-else class="grid grid-cols-4 gap-y-8rpx px-12rpx pb-16rpx pt-8rpx">
          <view
            v-for="menu in section.menus"
            :key="menu.name"
            class="min-h-142rpx min-w-0 flex flex-col items-center justify-center gap-10rpx rounded-12rpx px-8rpx py-12rpx active:bg-#F5F8FC"
            @click="openMenu(menu)"
          >
            <view class="h-76rpx w-76rpx flex flex-none items-center justify-center rounded-22rpx bg-#EAF2FF text-36rpx text-#2864C8">
              <view :class="getMiniMenuIcon(menu.icon)" />
            </view>
            <text class="max-w-full truncate text-center text-21rpx text-#3B4652 font-medium">{{ menu.title }}</text>
            <text v-if="!miniMenuPages[menu.name]" class="text-17rpx text-#9AA4AE">暂未接入</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
