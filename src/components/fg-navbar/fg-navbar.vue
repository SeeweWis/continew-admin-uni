<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { navbarState, useNavbarRegistry } from '@/hooks/useNavbar'
import { isPageTabbar, normalizeRoutePath } from '@/tabbar/store'
import { currRoute, getAllPages } from '@/utils'

const props = withDefaults(defineProps<{
  /** 覆盖自动获取的页面标题（默认取 pages.json 的 navigationBarTitleText） */
  title?: string
  /** 覆盖返回箭头显隐（默认：非 Tab 页显示） */
  leftArrow?: boolean
  /** 全局实例（由布局挂载）：当前路由存在页面级 <fg-navbar> 时自动隐藏 */
  global?: boolean
  /** 是否固定在顶部 */
  fixed?: boolean
  /** 固定后是否生成等高占位（把页面内容顶下来） */
  placeholder?: boolean
  /** 是否自身处理状态栏安全区（App.ku.vue 壳层已提供状态栏占位时传 false） */
  safeAreaInsetTop?: boolean
}>(), {
  title: '',
  leftArrow: undefined,
  global: false,
  fixed: true,
  placeholder: true,
  safeAreaInsetTop: true,
})

const route = ref('')

const { register, unregister } = useNavbarRegistry()

function syncRoute() {
  route.value = normalizeRoutePath(currRoute().path)
}

function syncRouteFromEvent(path?: string) {
  route.value = normalizeRoutePath(path || currRoute().path)
}

onMounted(() => {
  syncRoute()
  uni.$on('app:route-change', syncRouteFromEvent)
  // 页面级实例：注册路由，让全局实例对本页隐藏
  if (!props.global) {
    register(route.value)
  }
})
onUnmounted(() => {
  uni.$off('app:route-change', syncRouteFromEvent)
  if (!props.global) {
    unregister(route.value)
  }
})
onShow(syncRoute)

const visible = computed(() => {
  if (!route.value) {
    return false
  }
  if (props.global && navbarState.customRoutes.has(route.value)) {
    return false
  }
  return true
})

const pageTitle = computed(() => {
  if (props.title) {
    return props.title
  }
  return getAllPages().find(page => page.path === route.value)?.style?.navigationBarTitleText || ''
})

const arrowVisible = computed(() => {
  if (props.leftArrow !== undefined) {
    return props.leftArrow
  }
  return !isPageTabbar(route.value)
})

/** 返回：有上级页面则返回上一页，否则回首页 */
function handleBack() {
  if (getCurrentPages().length > 1) {
    uni.navigateBack()
  }
  else {
    uni.switchTab({ url: '/pages/work/index' })
  }
}
</script>

<template>
  <wd-navbar
    v-if="visible"
    :fixed="fixed"
    :placeholder="placeholder"
    :safe-area-inset-top="safeAreaInsetTop"
    :z-index="99"
    custom-class="fg-navbar-bar"
  >
    <!-- 左侧：返回箭头 + 用户自定义按钮（不绑定 wd-navbar 的 click-left，自定义按钮点击不会误触返回） -->
    <template #left>
      <view v-if="arrowVisible" class="center" @click="handleBack">
        <wd-icon name="left" custom-class="wd-navbar__arrow" />
      </view>
      <slot name="left" />
    </template>
    <template #title>
      <view class="w-full flex items-center justify-center text-center">
        {{ pageTitle }}
      </view>
    </template>
    <template #right>
      <slot name="right" />
    </template>
  </wd-navbar>
</template>

<style lang="scss">
/* 导航栏标准高度兜底：部分设备 navBarHeight（胶囊高度 + 上下间距×2）计算偏小，
   会导致胶囊贴近/溢出条带边缘；min-height 可约束行内 height，无需 !important */
.fg-navbar-bar {
  min-height: 44px;
}
</style>
