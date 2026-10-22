<script setup lang="ts">
withDefaults(defineProps<{
  loading?: boolean
  error?: string | null
  empty?: boolean
  emptyText?: string
  padded?: boolean
}>(), {
  loading: false,
  error: null,
  empty: false,
  emptyText: '暂无数据',
  padded: true,
})
</script>

<template>
  <view class="min-h-screen bg-#f2f3f5" :class="padded ? 'px-4 pb-[140px]' : ''">
    <slot name="header" />

    <view v-if="loading" class="center flex-col py-30">
      <wd-loading />
      <text class="mt-3 text-3 text-#86909c">加载中...</text>
    </view>

    <view v-else-if="error" class="center flex-col py-30">
      <text class="text-3 text-#86909c">{{ error }}</text>
      <slot name="error" />
    </view>

    <view v-else-if="empty" class="py-10">
      <wd-empty :description="emptyText" />
    </view>

    <slot v-else />

    <slot name="footer" />
  </view>
</template>
