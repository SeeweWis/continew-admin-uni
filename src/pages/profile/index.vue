<script lang="ts" setup>
import { computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { useToast } from '@wot-ui/ui'
import { openLoginPopup } from '@/utils/loginPopup'
import { useConfirmDialog } from '@/utils/dialog'
import { usePageRefresh } from '@/hooks/usePageRefresh'
import { fetchUserInfo, logout } from '@/services/auth'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'

definePage({
  style: {
    navigationBarTitleText: '我的',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
// 使用storeToRefs解构userInfo
const { userInfo } = storeToRefs(userStore)

// 必须在 setup 顶层调用（内部依赖 inject）
const confirmDialog = useConfirmDialog()
const toast = useToast()

const loggedIn = computed(() => tokenStore.hasLogin)
onShow(() => tokenStore.updateNowTime())

// 下拉刷新：重新拉取当前登录用户信息（未登录时忽略）
usePageRefresh(async () => {
  if (!loggedIn.value) {
    return
  }
  await fetchUserInfo()
})
const displayName = computed(() => userInfo.value.nickname || userInfo.value.username || '未登录')
/** 角色名优先取 roleNames，缺失时回退角色编码 */
const roleLabels = computed(() => {
  const names = userInfo.value.roleNames?.length ? userInfo.value.roleNames : userInfo.value.roles
  return (names || []).filter(Boolean)
})
const visibleRoleLabels = computed(() => roleLabels.value.slice(0, 2))
const extraRoleCount = computed(() => Math.max(0, roleLabels.value.length - 2))
/** 卡片信息栅格：未绑定的字段给出占位，避免信息区留白 */
const infoItems = computed(() => [
  { label: '手机号', value: userInfo.value.phone || '未绑定', icon: 'i-carbon-mobile', tone: 'text-#165DFF bg-#E8F3FF' },
  { label: '所属部门', value: userInfo.value.deptName || '未分配', icon: 'i-carbon-building', tone: 'text-#0FC6C2 bg-#E8FFFB' },
  { label: '注册时间', value: userInfo.value.registrationDate || '—', icon: 'i-carbon-calendar', tone: 'text-#FF7D00 bg-#FFF3E8' },
  { label: '邮箱', value: userInfo.value.email || '未绑定', icon: 'i-carbon-email', tone: 'text-#722ED1 bg-#F5F0FF' },
])
/** 远程头像直接展示，本地默认图与空值回退为首字圆形 */
const avatarUrl = computed(() => {
  const avatar = userInfo.value.avatar
  return avatar && avatar.startsWith('http') ? avatar : ''
})

const menus = [
  { label: '个人信息', hint: '查看与维护基础资料', icon: 'i-carbon-user-avatar', tone: 'blue', route: '/pages-profile/info/index' },
  { label: '培训记录', hint: '参训与学时归档', icon: 'i-carbon-education', tone: 'teal', route: '/pages-profile/training-record/index' },
  { label: '消息中心', hint: '系统消息与公告', icon: 'i-carbon-notification', tone: 'amber', route: '/pages/message/index' },
]

const menuToneClasses: Record<string, string> = {
  blue: 'text-#165DFF bg-#E8F3FF',
  teal: 'text-#0FC6C2 bg-#E8FFFB',
  amber: 'text-#FF7D00 bg-#FFF3E8',
}

/** 未登录时唤起登录弹窗，已登录跳转目标页 */
function guardNavigate(route: string) {
  if (!loggedIn.value) {
    openLoginPopup()
    return
  }
  if (route === '/pages/message/index')
    uni.switchTab({ url: route })
  else
    uni.navigateTo({ url: route })
}

async function handleLogout() {
  if (!(await confirmDialog('确定要退出登录吗？'))) {
    return
  }
  // 退出登录：注销后端会话并清空本地登录态与用户信息
  const result = await logout()
  if (result === true)
    toast.success('退出登录成功')
  else if (result === false)
    toast.show('本地已退出，服务端注销未完成')
}
</script>

<template>
  <!-- 背景与最小高度由 App.ku.vue 全局壳统一控制 -->
  <view class="p-32rpx">
    <wd-dialog />
    <wd-toast />
    <!-- 用户卡片：未登录为登录引导态，已登录展示账号与基础资料 -->
    <view
      class="relative overflow-hidden border border-#f2f3f5 rounded-16px bg-white p-30rpx transition-transform duration-120 active:scale-99"
      @click="guardNavigate('/pages-profile/info/index')"
    >
      <text class="pointer-events-none absolute text-260rpx text-#165DFF/4 font-bold leading-none -right-20rpx -top-64rpx">
        S
      </text>
      <view class="relative flex items-start">
        <image
          v-if="loggedIn && avatarUrl"
          :src="avatarUrl"
          class="h-110rpx w-110rpx flex-none border-4rpx border-#E8F3FF rounded-full bg-#E8F3FF"
          mode="aspectFill"
        />
        <view
          v-else
          class="h-110rpx w-110rpx flex flex-none items-center justify-center rounded-full bg-#E8F3FF text-#165DFF"
          :class="loggedIn ? 'text-40rpx font-bold' : 'text-48rpx'"
        >
          <text v-if="loggedIn">{{ displayName.slice(0, 1) }}</text>
          <text v-else class="i-carbon-user-avatar" />
        </view>
        <view class="ml-24rpx min-w-0 flex-1">
          <view class="flex flex-wrap items-center gap-10rpx">
            <text class="max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-34rpx text-#1D2129 font-bold">
              {{ loggedIn ? displayName : '未登录' }}
            </text>
            <view
              v-for="role in visibleRoleLabels"
              :key="role"
              class="flex-none rounded-8rpx bg-#E8F3FF px-12rpx py-4rpx text-20rpx text-#165DFF"
            >
              {{ role }}
            </view>
            <text v-if="extraRoleCount" class="flex-none text-20rpx text-#86909C">+{{ extraRoleCount }}</text>
          </view>
          <text class="mt-10rpx block text-24rpx text-#86909C">
            {{ loggedIn ? `账号 ${userInfo.username}` : '点击登录，使用模板能力' }}
          </text>
        </view>
        <text v-if="loggedIn" class="i-carbon-chevron-right mt-4rpx flex-none text-28rpx text-#86909C" />
      </view>

      <!-- 已登录：基础资料栅格 -->
      <view v-if="loggedIn" class="relative mt-26rpx border-t border-#F2F3F5 pt-24rpx">
        <view class="grid grid-cols-2 gap-x-16rpx gap-y-22rpx">
          <view v-for="item in infoItems" :key="item.label" class="min-w-0 flex items-center gap-14rpx">
            <view class="h-52rpx w-52rpx flex flex-none items-center justify-center rounded-14rpx text-26rpx" :class="item.tone">
              <text :class="item.icon" />
            </view>
            <view class="min-w-0 flex-1">
              <text class="block text-20rpx text-#86909C">{{ item.label }}</text>
              <text class="mt-2rpx block w-full overflow-hidden text-ellipsis whitespace-nowrap text-24rpx text-#1D2129 font-semibold">
                {{ item.value }}
              </text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="mx-4rpx mb-18rpx mt-36rpx">
      <text class="text-30rpx text-#1d2129 font-bold">我的功能</text>
    </view>
    <view class="overflow-hidden border border-#f2f3f5 rounded-16px bg-white">
      <view
        v-for="(item, index) in menus"
        :key="item.label"
        class="mx-24rpx min-h-116rpx flex items-center transition-transform duration-120 active:bg-#F7F8FA"
        :class="index === menus.length - 1 ? '' : 'border-b border-#f2f3f5'"
        @click="guardNavigate(item.route)"
      >
        <view
          class="h-64rpx w-64rpx flex flex-none items-center justify-center rounded-16rpx text-30rpx"
          :class="menuToneClasses[item.tone]"
        >
          <text :class="item.icon" />
        </view>
        <view class="ml-20rpx min-w-0 flex-1">
          <text class="block text-27rpx text-#1d2129 font-semibold">{{ item.label }}</text>
          <text class="mt-4rpx block text-20rpx text-#86909c">{{ item.hint }}</text>
        </view>
        <text class="i-carbon-chevron-right flex-none text-28rpx text-#C9CDD4" />
      </view>
    </view>

    <!-- 退出登录（仅登录态展示） -->
    <wd-button
      v-if="loggedIn"
      round
      block
      custom-class="profile-logout"
      custom-style="height:96rpx;margin-top:36rpx;border:none;background:#ffffff;color:#F53F3F;font-size:28rpx;font-weight:600;box-shadow:0 4rpx 12rpx rgba(0,0,0,0.04);"
      @click="handleLogout"
    >
      退出登录
    </wd-button>

    <text class="mt-28rpx block text-center text-20rpx text-#C9CDD4">
      seewis-single-uni · uni-app 小程序开发模板
    </text>
  </view>
</template>
