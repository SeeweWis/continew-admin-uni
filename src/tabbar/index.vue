<script setup lang="ts">
import { ref } from 'vue'
import { customTabbarEnable, needHideNativeTabbar, tabbarCacheEnable } from './config'
import { setTabbarItem } from './i18n'
import { tabbarList, tabbarStore } from './store'
import TabbarItem from './TabbarItem.vue'
// #ifdef MP-WEIXIN
// 将自定义节点设置成虚拟的（去掉自定义组件包裹层），更加接近Vue组件的表现，能更好的使用flex属性
defineOptions({
  virtualHost: true,
})
// #endif

const menuOpen = ref(false)
const quickActions = [
  { key: 'scan', label: '扫码', icon: 'i-carbon-scan', route: '/pages-scan/index' },
  { key: 'workbench', label: '工作台', icon: 'i-carbon-apps', route: '/pages-workbench/index' },
  { key: 'approval', label: '审批中心', icon: 'i-carbon-task-approved', route: '/pages-approval/index' },
]

function closeMenu() {
  menuOpen.value = false
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
}

function openAction(route: string) {
  closeMenu()
  uni.navigateTo({ url: route })
}

function handleClick(index: number) {
  const item = tabbarList.value[index]
  if (!item)
    return
  closeMenu()
  if (index === tabbarStore.curIdx)
    return
  const url = item.pagePath
  tabbarStore.setCurIdx(index)
  if (tabbarCacheEnable)
    uni.switchTab({ url })
  else
    uni.navigateTo({ url })
}
// #ifndef MP-WEIXIN || MP-ALIPAY
// 因为有了 custom:true， 微信里面不需要多余的hide操作
onLoad(() => {
  // 解决原生 tabBar 未隐藏导致有2个 tabBar 的问题
  needHideNativeTabbar
  && uni.hideTabBar({
    fail(err) {
      console.log('hideTabBar fail: ', err)
    },
  })
})
// #endif

// #ifdef MP-ALIPAY
onMounted(() => {
  // 解决支付宝自定义tabbar 未隐藏导致有2个 tabBar 的问题; 注意支付宝很特别，需要在 onMounted 钩子调用
  customTabbarEnable // 另外，支付宝里面，只要是 customTabbar 都需要隐藏
  && uni.hideTabBar({
    fail(err) {
      console.log('hideTabBar fail: ', err)
    },
  })
})
// #endif
const activeColor = 'var(--wot-color-theme, #165dff)'
const inactiveColor = '#666'
function getColorByIndex(index: number) {
  return tabbarStore.curIdx === index ? activeColor : inactiveColor
}

// 注意，上面处理的是自定义tabbar，下面处理的是原生tabbar，参考：https://unibest.tech/base/10-i18n
onShow(() => {
  setTabbarItem()
})
onHide(closeMenu)
</script>

<template>
  <view v-if="customTabbarEnable" class="h-56px pb-safe">
    <view class="fan-menu-mask" :class="{ 'is-open': menuOpen }" @click="closeMenu" @touchmove.stop.prevent />
    <view class="fan-menu" :class="{ 'is-open': menuOpen }" @touchmove.stop.prevent>
      <view
        v-for="action in quickActions"
        :key="action.key"
        class="fan-action"
        :class="`fan-action-${action.key}`"
        @click.stop="openAction(action.route)"
      >
        <view class="fan-action-icon">
          <text :class="action.icon" />
        </view>
        <text class="fan-action-label">{{ action.label }}</text>
      </view>
    </view>
    <view class="capsule-fixed rounded-full bg-white" @touchmove.stop.prevent>
      <view class="h-56px flex items-center px-2">
        <view
          v-for="(item, index) in tabbarList.slice(0, 2)" :key="item.pagePath"
          class="flex flex-1 flex-col items-center justify-center"
          :style="{ color: getColorByIndex(index) }"
          @click="handleClick(index)"
        >
          <TabbarItem :item="item" :index="index" class="relative px-1 text-center" />
        </view>
        <view class="w-120rpx flex-none" />
        <view
          v-for="(item, index) in tabbarList.slice(2)" :key="item.pagePath"
          class="flex flex-1 flex-col items-center justify-center"
          :style="{ color: getColorByIndex(index + 2) }"
          @click="handleClick(index + 2)"
        >
          <TabbarItem :item="item" :index="index + 2" class="relative px-1 text-center" />
        </view>
        <view class="bulge" :class="{ 'bulge-open': menuOpen }" aria-label="展开功能菜单" @click.stop="toggleMenu">
          <text class="i-carbon-apps text-32px" />
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
// 胶囊状悬浮 tabbar：距底部为安全区距离 + 16px，左右留边悬浮
.capsule-fixed {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 16px);
  left: 32rpx;
  right: 32rpx;
  z-index: 1003;
  box-sizing: border-box;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.12);
}
// 中间悬浮按钮：真实尺寸圆钮（不缩放，边缘清晰平滑），白环与胶囊衔接，浮起带柔和投影
.bulge {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -45%);
  display: flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
  width: 120rpx;
  height: 120rpx;
  border: 8rpx solid #fff;
  border-radius: 50%;
  background: linear-gradient(160deg, #5b8dff 0%, var(--wot-color-theme, #165dff) 100%);
  color: #fff;
  box-shadow: 0 10rpx 24rpx rgba(22, 93, 255, 0.35);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;

  &:active {
    transform: translate(-50%, -43%) scale(0.94);
    box-shadow: 0 6rpx 14rpx rgba(22, 93, 255, 0.3);
  }
}

.bulge-open {
  box-shadow: 0 8rpx 20rpx rgba(22, 93, 255, 0.25);
}

.fan-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 1001;
  background: rgba(16, 30, 45, 0.32);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease;

  &.is-open {
    opacity: 1;
    pointer-events: auto;
  }
}

.fan-menu {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 72px);
  left: 50%;
  z-index: 1002;
  width: 600rpx;
  height: 470rpx;
  max-width: 100vw;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);
  transition: opacity 0.2s ease;

  &.is-open {
    opacity: 1;
    pointer-events: auto;
    .fan-action {
      opacity: 1;
      transform: translateX(-50%) translate(0, 0) scale(1);
    }
  }
}

.fan-action {
  position: absolute;
  z-index: 1;
  display: flex;
  align-items: center;
  width: 150rpx;
  flex-direction: column;
  text-align: center;
  opacity: 0;
  transition:
    opacity 0.2s ease,
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.fan-action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 104rpx;
  height: 104rpx;
  border: 6rpx solid #fff;
  border-radius: 50%;
  color: #165dff;
  font-size: 42rpx;
  background: #e8f3ff;
  box-shadow: 0 8rpx 20rpx rgba(22, 93, 255, 0.16);
}

.fan-action-workbench .fan-action-icon {
  color: #fff;
  background: #165dff;
}

.fan-action-label {
  margin-top: 6rpx;
  color: #fff;
  font-size: 22rpx;
  font-weight: 600;
  line-height: 1.3;
  overflow-wrap: break-word;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.4);
}

.fan-action-scan {
  left: 126rpx;
  top: 220rpx;
  transform: translateX(-50%) translate(174rpx, 150rpx) scale(0.55);
}

.fan-action-workbench {
  left: 300rpx;
  top: 140rpx;
  transform: translateX(-50%) translate(0, 230rpx) scale(0.55);
}

.fan-action-approval {
  left: 474rpx;
  top: 220rpx;
  transform: translateX(-50%) translate(-174rpx, 150rpx) scale(0.55);
}
</style>
