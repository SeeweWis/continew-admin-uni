<script setup lang="ts">
import { ref } from 'vue'
// i-carbon-code
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

const scanMenuOpen = ref(false)

const scanActions = [
  { label: '表单示例', icon: 'i-carbon-box', className: 'scan-action-center', route: '/pages-material/requisition/apply/index' },
  { label: '列表示例', icon: 'i-carbon-download', className: 'scan-action-right', route: '/pages-material/requisition/list/index' },
]

function closeScanMenu() {
  scanMenuOpen.value = false
}

function handleScanAction(action: typeof scanActions[number]) {
  closeScanMenu()
  uni.navigateTo({ url: action.route })
}

/** tabbarItem 点击事件：中央鼓包展开模板示例菜单 */
function handleClick(index: number) {
  const list = tabbarList.value
  const item = list[index]
  if (!item) {
    return
  }

  if (item.isBulge) {
    scanMenuOpen.value = !scanMenuOpen.value
    return
  }

  closeScanMenu()
  if (index === tabbarStore.curIdx) {
    return
  }

  const url = item.pagePath
  tabbarStore.setCurIdx(index)
  if (tabbarCacheEnable) {
    uni.switchTab({ url })
  }
  else {
    uni.navigateTo({ url })
  }
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
</script>

<template>
  <view v-if="customTabbarEnable" class="h-56px pb-safe">
    <!-- 常驻渲染 + is-open 类切换，保证展开/收起过渡动画生效 -->
    <view
      class="scan-menu-mask"
      :class="{ 'is-open': scanMenuOpen }"
      @click="closeScanMenu"
      @touchmove.stop.prevent
    />
    <view class="scan-menu" :class="{ 'is-open': scanMenuOpen }" @touchmove.stop.prevent>
      <view
        v-for="action in scanActions"
        :key="action.label"
        class="scan-action"
        :class="action.className"
        @click.stop="handleScanAction(action)"
      >
        <view class="scan-action-icon">
          <text :class="action.icon" />
          <text class="scan-action-label">
            {{ action.label }}
          </text>
        </view>
      </view>
    </view>
    <view class="capsule-fixed rounded-full bg-white" @touchmove.stop.prevent>
      <view class="h-56px flex items-center px-2">
        <view
          v-for="(item, index) in tabbarList" :key="index"
          class="flex flex-1 flex-col items-center justify-center"
          :style="{ color: getColorByIndex(index) }"
          @click="handleClick(index)"
        >
          <view v-if="item.isBulge" class="relative">
            <!-- 中间一个鼓包tabbarItem的处理 -->
            <view class="bulge" :class="{ 'bulge-open': scanMenuOpen }">
              <TabbarItem :item="item" :index="index" class="text-center" is-bulge />
            </view>
          </view>
          <TabbarItem v-else :item="item" :index="index" class="relative px-3 text-center" />
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
  z-index: 1000;
  box-sizing: border-box;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.12);
}
// 中间悬浮按钮：真实尺寸圆钮（不缩放，边缘清晰平滑），白环与胶囊衔接，浮起带柔和投影
.bulge {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -66%);
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
    transform: translate(-50%, -64%) scale(0.94);
    box-shadow: 0 6rpx 14rpx rgba(22, 93, 255, 0.3);
  }
}

.bulge-open {
  box-shadow: 0 8rpx 20rpx rgba(22, 93, 255, 0.25);
}

.scan-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 1001;
  background: rgba(16, 30, 26, 0.28);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.22s ease;

  &.is-open {
    opacity: 1;
    pointer-events: auto;
  }
}

.scan-menu {
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 122rpx + 16px);
  left: 50%;
  z-index: 1002;
  width: 560rpx;
  height: 340rpx;
  pointer-events: none;
  transform: translateX(-50%);
}

.scan-menu::before {
  position: absolute;
  bottom: 35rpx;
  left: 50%;
  width: 470rpx;
  height: 220rpx;
  border-top: 4rpx solid rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  content: '';
  pointer-events: none;
  transform: translateX(-50%);
}

.scan-action {
  position: absolute;
  display: flex;
  align-items: center;
  width: 150rpx;
  flex-direction: column;
  z-index: 1;
  // 收起态：缩向中央鼓包原点并隐藏；展开时带回弹的扇形过渡
  opacity: 0;
  pointer-events: none;
  transform: scale(0.3);
  transition:
    transform 0.28s cubic-bezier(0.34, 1.4, 0.64, 1),
    opacity 0.18s ease;
}

.scan-action-left {
  bottom: 24rpx;
  left: 0;
  transform: translate(210rpx, 110rpx) scale(0.3);
}

.scan-action-center {
  bottom: 148rpx;
  left: 50%;
  transform: translateX(-50%) translateY(150rpx) scale(0.3);
}

.scan-action-right {
  right: 0;
  bottom: 24rpx;
  transform: translate(-210rpx, 110rpx) scale(0.3);
}

/* 展开态：错峰展开（中钮先弹出，左右随后扇开）；收起时无延迟快速归位 */
.scan-menu.is-open {
  .scan-action {
    opacity: 1;
    pointer-events: auto;
  }

  .scan-action-center {
    transform: translateX(-50%);
    transition-delay: 0ms;
  }

  .scan-action-left {
    transform: none;
    transition-delay: 60ms;
  }

  .scan-action-right {
    transform: none;
    transition-delay: 100ms;
  }
}

.scan-action-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 128rpx;
  height: 128rpx;
  border: 8rpx solid #ffffff;
  border-radius: 50%;
  color: #165dff;
  font-size: 32rpx;
  background: #e8f3ff;
  box-shadow: 0 8rpx 24rpx rgba(22, 93, 255, 0.14);
}

.scan-action-center .scan-action-icon {
  color: #0fc6c2;
  background: #e8fffb;
}

.scan-action-right .scan-action-icon {
  color: #165dff;
  background: #e8f3ff;
}

.scan-action-label {
  margin-top: 6rpx;
  color: currentColor;
  font-size: 18rpx;
  font-weight: 600;
  line-height: 1;
  white-space: nowrap;
}
</style>
