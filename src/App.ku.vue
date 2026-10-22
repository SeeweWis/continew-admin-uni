<script setup lang="ts">
import { computed, ref } from 'vue'
import FgLoginPopup from '@/components/fg-login-popup.vue'
import FgNavbar from '@/components/fg-navbar/fg-navbar.vue'
import FgTabbar from '@/tabbar/index.vue'
import { navbarState, SCAN_PAGE } from '@/hooks/useNavbar'
import { pageRefreshState } from '@/hooks/usePageRefresh'
import { isPageTabbar } from './tabbar/store'
import { currRoute } from './utils'
import { useSiteConfigStore } from '@/store/site'

const siteConfigStore = useSiteConfigStore()
const routePath = ref('/')
const isCurrentPageTabbar = ref(true)
/** 状态栏高度：仅导航栏隐藏的页面用它撑起顶部，内容从状态栏之下开始 */
const statusBarHeight = ref(0)

/** 与 fg-navbar 的全局显隐规则一致：扫码页与页面级自绘导航栏的路由不显示全局导航栏 */
const navbarVisible = computed(() => {
  return !!routePath.value && routePath.value !== SCAN_PAGE && !navbarState.customRoutes.has(routePath.value)
})

/** 扫码页满屏摄像头，滚动区内不滚动 */
const scrollEnabled = computed(() => routePath.value !== SCAN_PAGE)

/** 下拉刷新：当前路由注册了刷新处理器时启用，触发后等待 handler 完成再收起 */
const refreshing = ref(false)
const currentRefreshHandler = computed(() => pageRefreshState.handlers.get(routePath.value))

async function handleRefresh() {
  const handler = currentRefreshHandler.value
  if (!handler) {
    refreshing.value = false
    return
  }
  refreshing.value = true
  try {
    await handler()
  }
  finally {
    refreshing.value = false
  }
}

onShow(() => {
  void siteConfigStore.load()
  const { path } = currRoute()
  routePath.value = path
  const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
  statusBarHeight.value = info.statusBarHeight ?? 0
  // “蜡笔小开心”提到本地是 '/pages/work/index'，线上是 '/' 导致线上 tabbar 不见了
  // 所以这里需要判断一下，如果是 '/' 就当做首页，也要显示 tabbar
  isCurrentPageTabbar.value = path === '/' ? true : isPageTabbar(path)
})

/**
 * 滚动区触底事件：分页列表页可 uni.$on('app:scrolltolower') 后调用 useScroll 的 loadMore
 */
function emitScrollBottom() {
  uni.$emit('app:scrolltolower')
}
</script>

<template>
  <!-- 全局页面壳：顶部（导航栏/状态栏） → 内容滚动区 → tabbar -->
  <view class="h-screen flex flex-col overflow-hidden bg-#F2F3F5">
    <view v-if="navbarVisible" class="flex-none">
      <!-- 全局导航栏：流内布局参与分栏，自带状态栏安全区，不随内容滚动 -->
      <FgNavbar global :fixed="false" :placeholder="false" />
    </view>
    <view v-else class="flex-none" :style="{ height: `${statusBarHeight}px` }" />

    <!-- 内容滚动区：顶部区域之下、tabbar 之上；页面通过 usePageRefresh 注册后启用下拉刷新 -->
    <scroll-view
      class="relative min-h-0 flex-1"
      :scroll-y="scrollEnabled"
      :refresher-enabled="!!currentRefreshHandler"
      :refresher-triggered="refreshing"
      refresher-default-style="black"
      @scrolltolower="emitScrollBottom"
      @refresherrefresh="handleRefresh"
    >
      <KuRootView />
    </scroll-view>

    <FgTabbar v-if="isCurrentPageTabbar" />

    <!-- 全局登录弹窗（任意页面可通过 useLoginPopup().open() 唤起） -->
    <FgLoginPopup />
  </view>
</template>
