<script lang="ts" setup>
import type { MenuNode } from '@/store/menu'
import { onShow } from '@dcloudio/uni-app'
import { useToast } from '@wot-ui/ui'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { usePageRefresh } from '@/hooks/usePageRefresh'
import { getMiniMenuIcon, miniMenuPages } from '@/modules/menu-config'
import { useMenuStore } from '@/store/menu'
import { isPageTabbar } from '@/tabbar/store'

definePage({
  style: { navigationBarTitleText: '审批中心' },
})

const menuStore = useMenuStore()
const toast = useToast('approval')
const { rootMenus, status } = storeToRefs(menuStore)
const approvalRoot = computed(() => rootMenus.value.find(menu => menu.name === 'Approval'))
const approvalMenus = computed(() => {
  const result: MenuNode[] = []
  function visit(nodes: MenuNode[]) {
    nodes.forEach((node) => {
      if (node.type === 2)
        result.push(node)
      visit(node.children)
    })
  }
  visit(approvalRoot.value?.children ?? [])
  return result
})

onShow(() => {
  void menuStore.load().catch(() => {})
})
usePageRefresh(async () => {
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
  <view class="min-h-screen bg-#F5F7FA p-32rpx">
    <wd-toast selector="approval" />
    <view class="rounded-20rpx bg-#165DFF p-32rpx text-white">
      <text class="block text-36rpx font-bold">审批中心</text>
      <text class="mt-10rpx block text-22rpx opacity-85">可用审批功能由后台权限决定</text>
    </view>
    <view v-if="status === 'loading' && !rootMenus.length" class="py-72rpx text-center text-#86909C">
      正在加载审批菜单…
    </view>
    <view v-else-if="status === 'error'" class="mt-24rpx rounded-16rpx bg-white p-36rpx text-center">
      <text class="mb-20rpx block text-26rpx text-#4E5969">菜单加载失败</text>
      <wd-button round size="small" plain @click="menuStore.load(true).catch(() => {})">
        重试
      </wd-button>
    </view>
    <view v-else-if="!approvalRoot" class="mt-24rpx rounded-16rpx bg-white p-36rpx text-center text-#86909C">
      暂无审批中心权限
    </view>
    <view v-else-if="!approvalMenus.length" class="mt-24rpx rounded-16rpx bg-white p-36rpx text-center text-#86909C">
      暂无可用审批功能
    </view>
    <view v-else class="grid grid-cols-2 mt-24rpx gap-12rpx rounded-16rpx bg-white px-12rpx py-16rpx">
      <view
        v-for="menu in approvalMenus"
        :key="menu.name"
        class="min-h-176rpx min-w-0 flex flex-col items-center justify-center gap-10rpx rounded-12rpx px-12rpx py-20rpx text-center active:bg-#F5F8FC"
        @click="openMenu(menu)"
      >
        <view class="h-76rpx w-76rpx flex flex-none items-center justify-center rounded-20rpx bg-#E8F3FF text-36rpx text-#165DFF">
          <view :class="getMiniMenuIcon(menu.icon)" />
        </view>
        <text class="max-w-full truncate text-25rpx text-#1D2129 font-semibold">{{ menu.title }}</text>
        <text class="max-w-full truncate text-20rpx text-#86909C">{{ miniMenuPages[menu.name]?.hint ?? '暂未接入小程序' }}</text>
      </view>
    </view>
  </view>
</template>
