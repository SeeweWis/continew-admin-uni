<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui'
import { DEFAULT_SCAN_ROUTE, resolveScanTarget } from '@/modules/registry'
import { usePromptDialog } from '@/utils/dialog'

definePage({
  style: {
    navigationBarTitleText: '扫码',
  },
})

const cameraError = ref(false)
/** scope.camera 授权状态：false 表示用户已拒绝授权 */
const authDenied = ref(false)
const flashOn = ref(false)
/** 识别锁：处理结果期间不再响应重复识别，返回本页时在 onShow 解锁 */
const locked = ref(false)
/** 轻提示（必须在 setup 顶层调用，内部依赖 inject） */
const toast = useToast()

/** 任一异常时显示兜底提示层 */
const cameraBlocked = computed(() => cameraError.value || authDenied.value)

/** 摄像头初始化失败（摄像头故障或硬件不可用） */
function onCameraError() {
  cameraError.value = true
}

/** 检查摄像头授权状态（scope.camera 为 false 时用户已拒绝，需引导到设置页开启） */
function checkCameraAuth() {
  uni.getSetting({
    success: (res) => {
      authDenied.value = res.authSetting['scope.camera'] === false
    },
  })
}

function openSetting() {
  uni.openSetting({
    success: (res) => {
      // 用户从设置页返回后立即刷新授权状态，恢复摄像头
      authDenied.value = res.authSetting['scope.camera'] === false
    },
  })
}

onShow(() => {
  // 从识别结果页返回本页时恢复扫码
  locked.value = false
  // 每次进入/返回本页时刷新授权状态（用户可能已在设置页开启授权）
  checkCameraAuth()
})
onHide(() => {
  flashOn.value = false
})

/** 摄像头连续取景识别到码（camera mode="scanCode"，仅微信小程序） */
function onScancode(e: any) {
  const result = e?.detail?.result
  if (result) {
    handleScanResult(result)
  }
}

function handleScanResult(code: string) {
  if (locked.value || !code) {
    return
  }
  locked.value = true
  uni.vibrateShort({})
  const target = resolveScanTarget(code)
  toast.show(`识别成功：${target?.label ?? '业务码'}`)
  setTimeout(() => {
    uni.navigateTo({
      url: target?.route ?? DEFAULT_SCAN_ROUTE,
      fail: () => (locked.value = false),
    })
  }, 600)
}

/** 手动输入编码（也作为不支持摄像头的端的兜底入口） */
const promptDialog = usePromptDialog()
async function handleManualInput() {
  const value = await promptDialog({
    title: '手动输入编码',
    inputProps: { placeholder: '请输入业务编码' },
  })
  if (value) {
    handleScanResult(value.trim())
  }
}
</script>

<template>
  <view class="scan-page relative min-h-screen overflow-hidden bg-black">
    <!-- #ifdef MP-WEIXIN -->
    <camera
      v-if="!cameraError"
      class="absolute inset-0 h-full w-full"
      mode="scanCode"
      device-position="back"
      :flash="flashOn ? 'torch' : 'off'"
      @scancode="onScancode"
      @error="onCameraError"
    />
    <!-- 摄像头不可用（未授权/故障）：引导开启授权或提示故障 -->
    <view v-if="cameraBlocked" class="absolute inset-0 center flex-col bg-black/85" @click="openSetting">
      <text class="i-carbon-camera text-120rpx text-white/40" />
      <text class="mt-24rpx text-26rpx text-white/70">{{ authDenied ? '摄像头授权已拒绝，点击前往设置开启' : '摄像头不可用，请检查设备或重启小程序' }}</text>
    </view>
    <!-- #endif -->

    <!-- #ifndef MP-WEIXIN -->
    <view class="absolute inset-0 center flex-col from-#1f1f1f to-black bg-gradient-to-b">
      <text class="i-carbon-qr-code text-140rpx text-white/30" />
      <text class="mt-24rpx px-10 text-center text-26rpx text-white/60">当前端不支持摄像头取景，请使用微信小程序扫码或手动输入编码</text>
    </view>
    <!-- #endif -->

    <!-- 取景框：四角括号 + 扫描线，框外整体压暗 -->
    <view class="pointer-events-none absolute inset-0 center flex-col">
      <view class="scan-frame relative h-440rpx w-440rpx">
        <view class="corner left-top" />
        <view class="corner right-top" />
        <view class="corner left-bottom" />
        <view class="corner right-bottom" />
        <view class="scan-line" />
      </view>
      <text class="mt-40rpx text-24rpx text-white/80">
        将业务编码对准取景框
      </text>
    </view>

    <!-- 底部操作区（预留安全区及顶部导航栏的裁切空间） -->
    <view class="scan-controls absolute inset-x-0 flex items-start justify-center gap-120rpx">
      <!-- #ifdef MP-WEIXIN -->
      <view v-if="!cameraBlocked" class="w-120rpx center flex-col gap-12rpx" @click="flashOn = !flashOn">
        <view class="h-96rpx w-96rpx center rounded-full" :class="flashOn ? 'bg-#1890ff' : 'bg-white/15'">
          <text class="i-carbon-flash text-44rpx" :class="flashOn ? 'text-white' : 'text-white/80'" />
        </view>
        <text class="text-22rpx text-white/80">{{ flashOn ? '关闭手电' : '手电筒' }}</text>
      </view>
      <!-- #endif -->
      <view class="w-120rpx center flex-col gap-12rpx" @click="handleManualInput">
        <view class="h-96rpx w-96rpx center rounded-full bg-white/15">
          <text class="i-carbon-keyboard text-44rpx text-white/80" />
        </view>
        <text class="text-22rpx text-white/80">手动输入</text>
      </view>
    </view>

    <!-- 轻提示与手动输入编码弹窗（useToast / usePromptDialog 依赖页面内的挂载点） -->
    <wd-toast />
    <wd-dialog />
  </view>
</template>

<style lang="scss" scoped>
// 取景框：本体透明透视摄像头画面，超大 box-shadow 把框外压暗
.scan-frame {
  box-shadow: 0 0 0 2000rpx rgba(0, 0, 0, 0.45);
  border-radius: 24rpx;
}

// 四角括号
.corner {
  position: absolute;
  width: 52rpx;
  height: 52rpx;
  border: 6rpx solid var(--wot-color-theme, #1890ff);
}

.left-top {
  top: 0;
  left: 0;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 20rpx;
}

.right-top {
  top: 0;
  right: 0;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 20rpx;
}

.left-bottom {
  bottom: 0;
  left: 0;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 20rpx;
}

.right-bottom {
  bottom: 0;
  right: 0;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 20rpx;
}

// 扫描线上下往复
.scan-line {
  position: absolute;
  top: 10%;
  right: 20rpx;
  left: 20rpx;
  height: 6rpx;
  border-radius: 6rpx;
  background: linear-gradient(90deg, transparent, var(--wot-color-theme, #1890ff), transparent);
  box-shadow: 0 0 16rpx var(--wot-color-theme, #1890ff);
  animation: scan-move 2.4s ease-in-out infinite;
}

@keyframes scan-move {
  0% {
    top: 8%;
  }

  50% {
    top: 90%;
  }

  100% {
    top: 8%;
  }
}

// 取景页不显示 TabBar；底部留白用于避开全局导航栏占用的可视高度
.scan-controls {
  bottom: calc(env(safe-area-inset-bottom) + 190rpx);
}
</style>
