<script setup lang="ts">
// 全局导航栏已上移至 App.ku.vue 页面壳（导航栏参与分栏，不再随内容滚动）。
// 扫码页（pages/scan/index）自动隐藏；页面模板中自行渲染 <fg-navbar>（用左右插槽）时同路由自动隐藏。
</script>

<template>
  <slot />
</template>
