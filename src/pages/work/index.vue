<script lang="ts" setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { usePageRefresh } from '@/hooks/usePageRefresh'
import { fetchUserInfo } from '@/services/auth'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'
import type { WorkbenchMenuItem } from './workbench-menu'
import { getVisibleWorkbenchMenus } from './workbench-menu'

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
const { userInfo } = storeToRefs(userStore)
const displayName = computed(() => userInfo.value.nickname || userInfo.value.username || '开发者')

// 下拉刷新：重新拉取当前登录用户信息（未登录时忽略）
usePageRefresh(async () => {
  if (!tokenStore.updateNowTime().hasLogin) {
    return
  }
  await fetchUserInfo()
})

const quickActions = computed(() => getVisibleWorkbenchMenus({
  roles: userInfo.value.roles,
  permissions: userInfo.value.permissions,
}))

const featureItems = [
  { type: '路由', title: '约定式路由与分包', meta: '页面即路由，按需加载模块', tone: 'blue' },
  { type: '请求', title: '统一请求与鉴权', meta: '拦截器、Token 与错误归一', tone: 'amber' },
  { type: '跨端', title: '多端构建能力', meta: 'H5 · 微信小程序 · App', tone: 'teal' },
]

const recentRecords = [
  { type: '框架', title: 'Vue 3 + TypeScript', meta: '组合式 API · 类型安全', tone: 'blue' },
  { type: '样式', title: 'UnoCSS + Wot UI', meta: '原子化样式 · 跨端组件', tone: 'green' },
  { type: '工具', title: 'Vitest + ESLint', meta: '测试与代码质量检查', tone: 'red' },
]

const quickToneClasses: Record<string, string> = {
  blue: 'text-#165DFF bg-#E8F3FF',
  teal: 'text-#0FC6C2 bg-#E8FFFB',
  red: 'text-#F53F3F bg-#FFF1F0',
  amber: 'text-#FF7D00 bg-#FFF3E8',
}

const featureToneClasses: Record<string, string> = {
  blue: 'text-#165DFF bg-#E8F3FF',
  amber: 'text-#FF7D00 bg-#FFF3E8',
  teal: 'text-#0FC6C2 bg-#E8FFFB',
}

const recentToneClasses: Record<string, string> = {
  red: 'bg-#F53F3F',
  green: 'bg-#00B42A',
  blue: 'bg-#165DFF',
}

function handleQuickAction(action: WorkbenchMenuItem) {
  uni.navigateTo({ url: action.route })
}
</script>

<template>
  <view class="p-32rpx">
    <view class="flex items-center justify-between">
      <view>
        <text class="block text-22rpx text-#86909C tracking-2rpx">seewis-single-uni</text>
        <text class="mt-10rpx block text-42rpx text-#1D2129 font-bold leading-tight">欢迎使用，{{ displayName }}</text>
        <text class="mt-10rpx block text-24rpx text-#4E5969">从页面、组件到请求，快速搭建多端小程序</text>
      </view>
      <view class="h-80rpx w-80rpx flex items-center justify-center border-6rpx border-#D6E4FF rounded-full bg-#165DFF text-30rpx text-white font-bold">
        <text>{{ displayName.slice(0, 1) }}</text>
      </view>
    </view>

    <view class="relative mt-30rpx overflow-hidden rounded-16px bg-#165DFF p-30rpx text-white shadow-[0_16rpx_36rpx_rgba(22,93,255,0.22)]">
      <text class="pointer-events-none absolute z-0 text-330rpx text-white/5 font-bold leading-none -right-28rpx -top-78rpx -rotate-8">S</text>
      <view class="relative z-1 flex items-start justify-between">
        <view>
          <text class="block text-22rpx text-white/60">模板状态</text>
          <text class="mt-8rpx block text-32rpx font-bold">开发环境就绪</text>
        </view>
        <view class="flex items-center border border-white/18 rounded-full bg-white/8 px-14rpx py-8rpx text-22rpx text-white">
          <view class="mr-8rpx h-12rpx w-12rpx rounded-full bg-#00B42A" />
          <text>正常</text>
        </view>
      </view>
      <view class="relative z-1 mt-32rpx flex border-t border-white/14 pt-24rpx">
        <view class="flex-1 border-r border-white/14">
          <text class="block text-center text-34rpx font-bold">Vue 3</text>
          <text class="mt-6rpx block text-center text-20rpx text-white/60">核心框架</text>
        </view>
        <view class="flex-1 border-r border-white/14">
          <text class="block text-center text-34rpx font-bold">TS</text>
          <text class="mt-6rpx block text-center text-20rpx text-white/60">类型支持</text>
        </view>
        <view class="flex-1 border-r-0">
          <text class="block text-center text-34rpx font-bold">Vite 5</text>
          <text class="mt-6rpx block text-center text-20rpx text-white/60">构建工具</text>
        </view>
      </view>
    </view>

    <view class="mx-4rpx mb-18rpx mt-36rpx flex items-center justify-between">
      <text class="text-30rpx text-#1d2129 font-bold">示例模块</text>
      <text class="text-22rpx text-#86909c">按需替换为你的业务</text>
    </view>
    <view class="grid grid-cols-3 gap-16rpx">
      <view
        v-for="action in quickActions"
        :key="action.key"
        class="min-w-0 flex flex-col items-center border border-#f2f3f5 rounded-16px bg-white p-[18rpx_8rpx_16rpx] transition-transform duration-120 active:scale-97"
        @click="handleQuickAction(action)"
      >
        <view
          class="h-66rpx w-66rpx flex items-center justify-center rounded-20rpx text-32rpx"
          :class="quickToneClasses[action.tone]"
        >
          <text :class="action.icon" />
        </view>
        <text class="mt-12rpx whitespace-nowrap text-22rpx text-#1d2129 font-semibold">{{ action.label }}</text>
        <text class="mt-6rpx whitespace-nowrap text-17rpx text-#86909c">{{ action.hint }}</text>
      </view>
    </view>

    <view class="mx-4rpx mb-18rpx mt-36rpx flex items-center justify-between">
      <text class="text-30rpx text-#1d2129 font-bold">模板能力</text>
      <text class="text-22rpx text-#86909c">开箱即用</text>
    </view>
    <view class="overflow-hidden border border-#f2f3f5 rounded-16px bg-white">
      <view
        v-for="(item, index) in featureItems"
        :key="item.title"
        class="mx-24rpx min-h-110rpx flex items-center border-b border-#f2f3f5"
        :class="{ 'border-b-0': index === featureItems.length - 1 }"
      >
        <view
          class="mr-18rpx h-36rpx w-62rpx flex items-center justify-center rounded-10rpx text-20rpx"
          :class="featureToneClasses[item.tone]"
        >
          {{ item.type }}
        </view>
        <view class="min-w-0 flex flex-1 flex-col">
          <text class="overflow-hidden text-ellipsis whitespace-nowrap text-25rpx text-#1d2129 font-semibold">{{ item.title }}</text>
          <text class="mt-8rpx text-20rpx text-#86909c">{{ item.meta }}</text>
        </view>
      </view>
    </view>

    <view class="grid grid-cols-2 mt-16rpx gap-16rpx">
      <view class="min-w-0 border border-#f2f3f5 rounded-16px bg-white p-24rpx">
        <view class="flex items-center justify-between">
          <text class="text-24rpx text-#1d2129 font-semibold">开发体验</text>
          <text class="text-18rpx text-#86909c">默认配置</text>
        </view>
        <view class="mt-22rpx text-44rpx text-#1d2129 font-bold">
          100<text>%</text>
        </view>
        <text class="mt-2rpx block text-20rpx text-#86909c">基础能力已接入</text>
        <view class="mt-20rpx h-10rpx overflow-hidden rounded-full bg-#f2f3f5">
          <view class="h-full w-full rounded-full bg-primary" />
        </view>
        <view class="mt-10rpx flex justify-between text-18rpx text-#4e5969">
          <text>页面与路由</text>
          <text>请求与状态</text>
        </view>
      </view>

      <view class="min-w-0 border border-#f2f3f5 rounded-16px bg-white p-24rpx">
        <view class="flex items-center justify-between">
          <text class="text-24rpx text-#1d2129 font-semibold">跨端支持</text>
          <text class="text-18rpx text-#86909c">3 个目标</text>
        </view>
        <view class="mt-22rpx text-44rpx text-#1d2129 font-bold">
          3<text>端</text>
        </view>
        <text class="mt-2rpx block text-20rpx text-#86909c">H5 / 小程序 / App</text>
        <view class="mt-20rpx h-10rpx overflow-hidden rounded-full bg-#f2f3f5">
          <view class="h-full w-full rounded-full bg-#0fc6c2" />
        </view>
        <text class="mt-10rpx block text-18rpx text-#4e5969">按需选择目标平台</text>
      </view>
    </view>

    <view class="mx-4rpx mb-18rpx mt-36rpx flex items-center justify-between">
      <text class="text-30rpx text-#1d2129 font-bold">开发提示</text>
      <text class="text-22rpx text-#86909c">示例数据</text>
    </view>
    <view class="overflow-hidden border border-#f2f3f5 rounded-16px bg-white">
      <view
        v-for="(item, index) in recentRecords"
        :key="item.title"
        class="mx-24rpx min-h-108rpx flex items-center border-b border-#f2f3f5"
        :class="{ 'border-b-0': index === recentRecords.length - 1 }"
      >
        <view class="mr-18rpx h-54rpx w-6rpx rounded-full" :class="recentToneClasses[item.tone]" />
        <view class="min-w-0 flex flex-1 flex-col">
          <text class="text-18rpx text-#86909c">{{ item.type }}</text>
          <text class="mt-4rpx overflow-hidden text-ellipsis whitespace-nowrap text-24rpx text-#1d2129 font-semibold">{{ item.title }}</text>
          <text class="mt-8rpx text-20rpx text-#86909c">{{ item.meta }}</text>
        </view>
        <text v-if="index === 0" class="mt--34rpx self-start text-18rpx text-#F53F3F">刚刚</text>
      </view>
    </view>
  </view>
</template>
