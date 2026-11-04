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
const toast = useToast('profile')

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
const extraRoleCount = computed(() => Math.max(0, roleLabels.value.length - 1))
/** 卡片信息栅格：未绑定的字段给出占位，避免信息区留白 */
const infoItems = computed(() => [
  { label: '手机号', value: userInfo.value.phone || '未绑定' },
  { label: '所属部门', value: userInfo.value.deptName || '未分配' },
  { label: '注册时间', value: userInfo.value.registrationDate || '—' },
  { label: '邮箱', value: userInfo.value.email || '未绑定' },
])
/** 远程头像直接展示，本地默认图与空值回退为首字圆形 */
const avatarUrl = computed(() => {
  const avatar = userInfo.value.avatar
  return avatar && avatar.startsWith('http') ? avatar : ''
})

const menus = [
  { label: '个人信息', hint: '查看与维护基础资料', icon: 'mdi mdi-account-circle-outline', tone: 'blue', route: '/pages-profile/info/index' },
  { label: '培训记录', hint: '参训与学时归档', icon: 'mdi mdi-school-outline', tone: 'teal', route: '/pages-profile/training-record/index' },
  { label: '消息中心', hint: '系统消息与公告', icon: 'mdi mdi-bell-outline', tone: 'amber', route: '/pages/message/index' },
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
  <view class="profile-page">
    <wd-dialog />
    <wd-toast selector="profile" />
    <view class="profile-cover" />
    <view
      class="profile-card relative transition-transform duration-120 active:scale-99"
      @click="guardNavigate('/pages-profile/info/index')"
    >
      <view class="profile-card-top">
        <image v-if="loggedIn && avatarUrl" :src="avatarUrl" class="profile-avatar" mode="aspectFill" />
        <view v-else class="profile-avatar profile-avatar-fallback">
          <text v-if="loggedIn">{{ displayName.slice(0, 1) }}</text>
          <view v-else class="mdi mdi-account-circle-outline" />
        </view>
        <view class="profile-card-action">
          <wd-button
            round
            size="small"
            :custom-style="loggedIn
              ? 'height:60rpx;padding:0 20rpx;border:none;background:#fff1eb;color:#a34222;font-size:21rpx;font-weight:600;'
              : 'height:60rpx;padding:0 20rpx;border:none;background:#eaf2ff;color:#315cb3;font-size:21rpx;font-weight:600;'"
            @click.stop="guardNavigate('/pages-profile/info/index')"
          >
            <view class="flex items-center gap-8rpx">
              <view :class="loggedIn ? 'mdi mdi-pencil-outline' : 'mdi mdi-login'" />
              {{ loggedIn ? '个人资料' : '立即登录' }}
            </view>
          </wd-button>
        </view>
      </view>
      <view class="profile-identity">
        <view class="profile-name-row">
          <text class="profile-name">{{ loggedIn ? displayName : '未登录' }}</text>
          <view v-if="loggedIn && roleLabels.length" class="profile-role">
            {{ roleLabels[0] }}
          </view>
          <text v-if="loggedIn && extraRoleCount" class="profile-role-count">+{{ extraRoleCount }}</text>
        </view>
        <text class="profile-subtitle">
          {{ loggedIn ? `账号 ${userInfo.username}` : '登录后查看个人资料与消息' }}
        </text>
      </view>
      <view v-if="loggedIn" class="profile-stats">
        <view v-for="item in infoItems" :key="item.label" class="profile-stat">
          <text class="profile-stat-value">{{ item.value }}</text>
          <text class="profile-stat-label">{{ item.label }}</text>
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
          <view :class="item.icon" />
        </view>
        <view class="ml-20rpx min-w-0 flex-1">
          <text class="block text-27rpx text-#1d2129 font-semibold">{{ item.label }}</text>
          <text class="mt-4rpx block text-20rpx text-#86909c">{{ item.hint }}</text>
        </view>
        <view class="mdi mdi-chevron-right flex-none text-28rpx text-#C9CDD4" />
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

<style scoped lang="scss">
.profile-page {
  padding: 0 32rpx 32rpx;
}

.profile-cover {
  height: 300rpx;
  margin: 0 -32rpx;
  background: linear-gradient(to bottom, var(--wot-color-theme, #165dff) 0%, #fff 100%);
}

.profile-card {
  margin: -166rpx 0 0;
  padding: 0 28rpx 24rpx;
  border: 1rpx solid rgb(21 35 48 / 5%);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 14rpx 36rpx rgb(17 30 43 / 14%);
}

.profile-card-top {
  position: relative;
  height: 98rpx;
}

.profile-avatar {
  position: absolute;
  top: -58rpx;
  left: 0;
  width: 136rpx;
  height: 136rpx;
  box-sizing: border-box;
  border: 6rpx solid #fff;
  border-radius: 50%;
  background: #e9eef4;
  box-shadow: 0 8rpx 20rpx rgb(14 31 46 / 18%);
}

.profile-avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #54708a;
  font-size: 48rpx;
}

.profile-card-action {
  position: absolute;
  top: 16rpx;
  right: 0;
}

.profile-identity {
  min-width: 0;
}

.profile-name-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12rpx;
}

.profile-name {
  max-width: 68%;
  overflow: hidden;
  color: #202a34;
  font-size: 32rpx;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-role {
  flex: none;
  max-width: 25%;
  overflow: hidden;
  padding: 4rpx 12rpx;
  border-radius: 999rpx;
  color: #315cb3;
  background: #eaf2ff;
  font-size: 19rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-role-count {
  flex: none;
  color: #697781;
  font-size: 19rpx;
}

.profile-subtitle {
  display: block;
  margin-top: 8rpx;
  overflow: hidden;
  color: #6e7a84;
  font-size: 22rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-top: 22rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #edf0f3;
}

.profile-stat {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: center;
  padding: 0 6rpx;
}

.profile-stat-value {
  width: 100%;
  overflow: hidden;
  color: #263543;
  font-size: 21rpx;
  font-weight: 700;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-stat-label {
  margin-top: 6rpx;
  color: #697781;
  font-size: 18rpx;
  text-align: center;
}
</style>
