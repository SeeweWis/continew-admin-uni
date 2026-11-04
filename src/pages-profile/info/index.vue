<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { useToast } from '@wot-ui/ui'
import { fetchUpdateProfileAvatar, fetchUpdateProfileBasic, fetchUpdateProfilePassword } from '@/api/profile'
import { fetchUserInfo } from '@/services/auth'
import { useDict } from '@/hooks/useDict'
import { useUserStore } from '@/store'
import { useTokenStore } from '@/store/token'

definePage({
  style: {
    navigationBarTitleText: '个人信息',
  },
})

const userStore = useUserStore()
const tokenStore = useTokenStore()
const { userInfo } = storeToRefs(userStore)
const toast = useToast('profile-info')
const { options: genderOptions } = useDict('gender_enum')

const profile = reactive({
  nickname: '',
  gender: 0 as 0 | 1 | 2,
})

function syncProfile() {
  profile.nickname = userInfo.value.nickname || ''
  profile.gender = (userInfo.value.gender ?? 0) as 0 | 1 | 2
}
syncProfile()
watch(() => [userInfo.value.nickname, userInfo.value.gender], syncProfile)

const password = reactive({
  old: '',
  next: '',
  confirm: '',
})

const savingBasic = ref(false)
const savingPassword = ref(false)
const savingAvatar = ref(false)

const displayName = computed(() => userInfo.value.nickname || userInfo.value.username || '未登录')
const avatarUrl = computed(() => {
  const avatar = userInfo.value.avatar
  return avatar && avatar.startsWith('http') ? avatar : ''
})

// #ifdef MP-WEIXIN
async function uploadAvatar(filePath: string) {
  if (!filePath || savingAvatar.value)
    return
  savingAvatar.value = true
  try {
    const { avatar } = await fetchUpdateProfileAvatar(filePath)
    if (!avatar)
      throw new Error('服务器未返回头像地址')
    userStore.setUserAvatar(avatar)
    toast.success('头像已更新')
  }
  catch (error) {
    if ((error as { type?: string })?.type !== 'auth')
      toast.show(error instanceof Error ? error.message : (error as { message?: string })?.message || '头像上传失败')
  }
  finally {
    savingAvatar.value = false
  }
}

function chooseAlbumAvatar() {
  if (savingAvatar.value)
    return
  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sourceType: ['album'],
    success: ({ tempFiles }) => void uploadAvatar(tempFiles[0]?.tempFilePath || ''),
  })
}

function chooseWechatAvatar(event: { detail?: { avatarUrl?: string } }) {
  void uploadAvatar(event.detail?.avatarUrl || '')
}
// #endif

onShow(() => {
  if (tokenStore.updateNowTime().hasLogin)
    void fetchUserInfo()
})

async function saveBasic() {
  if (!profile.nickname.trim()) {
    toast.show('请输入昵称')
    return
  }
  savingBasic.value = true
  try {
    await fetchUpdateProfileBasic({
      nickname: profile.nickname.trim(),
      gender: profile.gender,
    })
    userStore.setUserInfo({
      ...userInfo.value,
      nickname: profile.nickname.trim(),
      gender: profile.gender,
    })
    toast.success('基础信息已保存')
  }
  finally {
    savingBasic.value = false
  }
}

async function savePassword() {
  if (!password.old || !password.next) {
    toast.show('请填写当前密码和新密码')
    return
  }
  if (password.next !== password.confirm) {
    toast.show('两次输入的新密码不一致')
    return
  }
  savingPassword.value = true
  try {
    await fetchUpdateProfilePassword({
      oldPassword: password.old,
      newPassword: password.next,
    })
    toast.success('密码已修改')
    password.old = ''
    password.next = ''
    password.confirm = ''
  }
  finally {
    savingPassword.value = false
  }
}
</script>

<template>
  <view class="min-h-screen bg-#f2f3f5 p-3">
    <wd-toast selector="profile-info" />

    <!-- 基础信息 -->
    <view class="rounded-16rpx bg-white p-4">
      <view class="flex items-center gap-3">
        <image
          v-if="avatarUrl"
          :src="avatarUrl"
          mode="aspectFill"
          class="h-110rpx w-110rpx flex-none rounded-full bg-#E8F3FF"
        />
        <view
          v-else
          class="h-110rpx w-110rpx flex flex-none items-center justify-center rounded-full bg-#E8F3FF text-40rpx text-#165DFF font-bold"
        >
          {{ displayName.slice(0, 1) }}
        </view>
        <view class="min-w-0 flex-1">
          <text class="block text-4 text-#1d2129 font-medium">{{ displayName }}</text>
          <text class="mt-1 block text-3 text-#86909c">账号 {{ userInfo.username }}</text>
          <text v-if="userInfo.deptName" class="mt-1 block text-3 text-#86909c">{{ userInfo.deptName }}</text>
        </view>
      </view>

      <!-- #ifdef MP-WEIXIN -->
      <view class="mt-4 flex flex-wrap gap-2">
        <wd-button round size="small" plain :loading="savingAvatar" :disabled="savingAvatar" open-type="chooseAvatar" @chooseavatar="chooseWechatAvatar">
          使用微信头像
        </wd-button>
        <wd-button round size="small" plain :disabled="savingAvatar" @click="chooseAlbumAvatar">
          从相册上传
        </wd-button>
      </view>
      <!-- #endif -->

      <view class="mt-5">
        <text class="mb-2 block text-3 text-#4e5969">昵称</text>
        <!-- #ifdef MP-WEIXIN -->
        <input v-model="profile.nickname" type="nickname" :maxlength="30" placeholder="输入昵称或选用微信昵称" class="h-88rpx border-b border-#E5E6EB text-30rpx text-#1D2129">
        <text class="mt-2 block text-22rpx text-#86909C">点击输入框可选择微信昵称，保存后生效</text>
        <!-- #endif -->
        <!-- #ifndef MP-WEIXIN -->
        <wd-input v-model="profile.nickname" placeholder="请输入昵称" :maxlength="30" />
        <!-- #endif -->
      </view>

      <view class="mt-4">
        <text class="mb-2 block text-3 text-#4e5969">性别</text>
        <wd-radio-group v-model="profile.gender" inline>
          <wd-radio v-for="item in genderOptions" :key="item.value" :value="Number(item.value)">
            {{ item.label }}
          </wd-radio>
        </wd-radio-group>
      </view>

      <wd-button

        round
        block
        type="primary"
        class="mt-6"
        :loading="savingBasic"
        :disabled="savingBasic"
        @click="saveBasic"
      >
        保存基础信息
      </wd-button>
    </view>

    <!-- 联系方式 -->
    <view class="mt-3 rounded-16rpx bg-white px-4 py-2">
      <text class="block py-3 text-4 text-#1d2129 font-medium">联系方式</text>
      <wd-cell title="手机号" :value="userInfo.phone || '未绑定'" />
      <wd-cell title="邮箱" :value="userInfo.email || '未绑定'" />
      <text class="block py-3 text-2 text-#86909c">
        修改手机号/邮箱需要短信或邮箱验证码，待行为验证码组件接入后开放
      </text>
    </view>

    <!-- 修改密码 -->
    <view class="mt-3 rounded-16rpx bg-white p-4">
      <text class="mb-3 block text-4 text-#1d2129 font-medium">修改密码</text>
      <view class="flex flex-col gap-3">
        <wd-input v-model="password.old" show-password placeholder="请输入当前密码" />
        <wd-input v-model="password.next" show-password placeholder="请输入新密码" />
        <wd-input v-model="password.confirm" show-password placeholder="请再次输入新密码" />
      </view>
      <wd-button
        round

        plain block
        class="mt-4"
        :loading="savingPassword"
        :disabled="savingPassword"
        @click="savePassword"
      >
        修改密码
      </wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
</style>
