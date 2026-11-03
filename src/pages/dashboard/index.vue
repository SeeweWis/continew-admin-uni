<script lang="ts" setup>
import type { DashboardAccessTrend, DashboardChartItem, DashboardOverview } from '@/api/types/dashboard'
import { onShow } from '@dcloudio/uni-app'
import { computed, ref, watch } from 'vue'
import { fetchDashboardIp, fetchDashboardModules, fetchDashboardPv, fetchDashboardTrend } from '@/api/dashboard'
import { usePageRefresh } from '@/hooks/usePageRefresh'
import { useTokenStore } from '@/store/token'
import { openLoginPopup } from '@/utils/loginPopup'

definePage({
  style: { navigationBarTitleText: '仪表盘' },
})

const tokenStore = useTokenStore()
const pv = ref<DashboardOverview | null>(null)
const ip = ref<DashboardOverview | null>(null)
const trend = ref<DashboardAccessTrend[]>([])
const modules = ref<DashboardChartItem[]>([])
const loading = ref(false)
const error = ref(false)
const trendMax = computed(() => Math.max(1, ...trend.value.map(item => Math.max(item.pvCount, item.ipCount))))
const moduleMax = computed(() => Math.max(1, ...modules.value.map(item => item.value)))
let requestId = 0

watch(() => tokenStore.tokenInfo.token, (token) => {
  requestId++
  pv.value = null
  ip.value = null
  trend.value = []
  modules.value = []
  loading.value = false
  error.value = false
  if (token)
    void loadDashboard()
})

async function loadDashboard() {
  if (!tokenStore.updateNowTime().hasLogin)
    return
  const currentRequest = ++requestId
  loading.value = true
  error.value = false
  try {
    const [pvResult, ipResult, trendResult, moduleResult] = await Promise.all([
      fetchDashboardPv(),
      fetchDashboardIp(),
      fetchDashboardTrend(),
      fetchDashboardModules(),
    ])
    if (currentRequest !== requestId)
      return
    pv.value = pvResult
    ip.value = ipResult
    trend.value = trendResult.slice().sort((a, b) => a.date.localeCompare(b.date))
    modules.value = moduleResult.slice(0, 5)
  }
  catch {
    if (currentRequest === requestId)
      error.value = true
  }
  finally {
    if (currentRequest === requestId)
      loading.value = false
  }
}

onShow(() => {
  void loadDashboard()
})
usePageRefresh(loadDashboard)

function barHeight(value: number) {
  return `${String(Math.round(value / trendMax.value * 180))}rpx`
}

function moduleWidth(value: number) {
  return `${String(value / moduleMax.value * 100)}%`
}

function formatCount(value: number) {
  return value.toLocaleString('zh-CN')
}

function formatGrowth(value: number | string) {
  const growth = Number(value)
  return `${(growth > 0 ? '+' : '') + growth}%`
}
</script>

<template>
  <view class="min-h-screen bg-#F5F7FA p-32rpx">
    <view class="mb-28rpx">
      <text class="block text-36rpx text-#1D2129 font-bold">数据概览</text>
      <text class="mt-8rpx block text-22rpx text-#86909C">后台访问统计 · 最近 7 天趋势</text>
    </view>

    <view v-if="!tokenStore.hasLogin" class="rounded-20rpx bg-white p-44rpx text-center">
      <text class="block text-28rpx text-#1D2129 font-semibold">登录后查看仪表盘</text>
      <wd-button round size="small" class="mt-20rpx" @click="openLoginPopup">
        登录
      </wd-button>
    </view>
    <view v-else-if="loading && !pv" class="rounded-20rpx bg-white p-48rpx text-center text-#86909C">
      正在加载统计数据…
    </view>
    <view v-else-if="error && !pv" class="rounded-20rpx bg-white p-48rpx text-center">
      <text class="mb-20rpx block text-#86909C">数据加载失败</text>
      <wd-button round size="small" plain @click="loadDashboard">
        重试
      </wd-button>
    </view>
    <template v-else>
      <view v-if="error" class="mb-20rpx flex items-center justify-between gap-12rpx text-22rpx text-#C00000">
        <text>刷新失败，当前显示上次数据</text>
        <wd-button round size="small" plain @click="loadDashboard">
          重试
        </wd-button>
      </view>
      <view class="flex gap-20rpx">
        <view class="min-w-0 flex-1 rounded-20rpx bg-white p-26rpx">
          <text class="block text-22rpx text-#86909C">总浏览量 PV</text>
          <text class="mt-12rpx block text-38rpx text-#1D2129 font-bold">{{ formatCount(pv?.total ?? 0) }}</text>
          <text class="mt-10rpx block text-20rpx text-#165DFF">今日 {{ formatCount(pv?.today ?? 0) }} · {{ formatGrowth(pv?.growth ?? 0) }}</text>
        </view>
        <view class="min-w-0 flex-1 rounded-20rpx bg-white p-26rpx">
          <text class="block text-22rpx text-#86909C">独立 IP</text>
          <text class="mt-12rpx block text-38rpx text-#1D2129 font-bold">{{ formatCount(ip?.total ?? 0) }}</text>
          <text class="mt-10rpx block text-20rpx text-#0FC6C2">今日 {{ formatCount(ip?.today ?? 0) }} · {{ formatGrowth(ip?.growth ?? 0) }}</text>
        </view>
      </view>

      <view class="mt-24rpx rounded-20rpx bg-white p-28rpx">
        <view class="flex items-center justify-between">
          <text class="text-28rpx text-#1D2129 font-semibold">访问趋势</text>
          <view class="flex gap-18rpx text-20rpx text-#86909C">
            <text>● PV</text><text class="text-#0FC6C2">● IP</text>
          </view>
        </view>
        <view v-if="trend.length" class="mt-28rpx h-230rpx flex items-end justify-around border-b border-#E5E6EB">
          <view v-for="item in trend" :key="item.date" class="h-full min-w-0 flex flex-1 flex-col items-center justify-end">
            <view class="flex items-end gap-4rpx">
              <view class="w-16rpx rounded-t-6rpx bg-#165DFF" :style="{ height: barHeight(item.pvCount) }" />
              <view class="w-16rpx rounded-t-6rpx bg-#0FC6C2" :style="{ height: barHeight(item.ipCount) }" />
            </view>
            <text class="mt-12rpx text-18rpx text-#86909C">{{ item.date.slice(5) }}</text>
          </view>
        </view>
        <view v-else class="py-50rpx text-center text-#86909C">
          暂无趋势数据
        </view>
      </view>

      <view class="mt-24rpx rounded-20rpx bg-white p-28rpx">
        <text class="text-28rpx text-#1D2129 font-semibold">访问模块排行</text>
        <view v-if="modules.length" class="mt-28rpx flex flex-col gap-24rpx">
          <view v-for="item in modules" :key="item.name">
            <view class="mb-8rpx flex justify-between text-22rpx">
              <text class="max-w-70% truncate text-#4E5969">{{ item.name }}</text>
              <text class="text-#1D2129 font-semibold">{{ formatCount(item.value) }}</text>
            </view>
            <view class="h-14rpx overflow-hidden rounded-full bg-#EEF2F7">
              <view class="h-full rounded-full bg-#165DFF" :style="{ width: moduleWidth(item.value) }" />
            </view>
          </view>
        </view>
        <view v-else class="py-50rpx text-center text-#86909C">
          暂无模块数据
        </view>
      </view>
    </template>
  </view>
</template>
