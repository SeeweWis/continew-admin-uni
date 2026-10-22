<script lang="ts" setup>
import type { ICommonFileUploadRes } from '@/api/types/oss'
import { computed, ref } from 'vue'
import { useToast } from '@wot-ui/ui'
import { uploadCommonFile } from '@/services/upload'

const props = withDefaults(defineProps<{
  /** 已上传文件列表（v-model） */
  modelValue?: ICommonFileUploadRes[]
  /** 最多可上传数量 */
  max?: number
  /** 单文件大小限制（MB） */
  maxSize?: number
  /** 是否禁用（隐藏删除与添加入口） */
  disabled?: boolean
}>(), {
  modelValue: () => [],
  max: 9,
  maxSize: 10,
  disabled: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: ICommonFileUploadRes[]]
  /** 单个文件上传成功 */
  'success': [item: ICommonFileUploadRes]
  /** 单个文件上传失败 */
  'error': [err: Error]
}>()

// 轻提示（必须在 setup 顶层调用，内部依赖 inject）
const toast = useToast()

/** 上传中的任务（缩略图 + 进度条展示） */
interface UploadingItem {
  key: number
  tempPath: string
  progress: number
}
const uploadingList = ref<UploadingItem[]>([])
let uploadKey = 0

const canAdd = computed(() => !props.disabled && props.modelValue.length + uploadingList.value.length < props.max)

/** 选择文件（微信用 chooseMedia，其他端 chooseImage），逐个上传到后端文件服务 */
function handleChoose() {
  if (!canAdd.value) {
    return
  }
  const remain = props.max - props.modelValue.length - uploadingList.value.length

  // #ifdef MP-WEIXIN
  uni.chooseMedia({
    count: remain,
    mediaType: ['image'],
    success: (res) => {
      res.tempFiles.forEach(file => startUpload(file.tempFilePath, file.size))
    },
  })
  // #endif

  // #ifndef MP-WEIXIN
  uni.chooseImage({
    count: remain,
    success: (res) => {
      // 类型定义为 string | string[]（平台差异），归一化为数组
      const paths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths]
      paths.forEach((path, index) => startUpload(path, res.tempFiles?.[index]?.size))
    },
  })
  // #endif
}

function startUpload(tempPath: string, size?: number) {
  if (size && size / 1024 / 1024 > props.maxSize) {
    toast.show(`文件大小不能超过${props.maxSize}MB`)
    return
  }
  const item: UploadingItem = { key: ++uploadKey, tempPath, progress: 0 }
  uploadingList.value.push(item)

  uploadCommonFile(tempPath, { onProgress: p => (item.progress = p) })
    .then((res) => {
      emit('update:modelValue', [...props.modelValue, res])
      emit('success', res)
    })
    .catch((err: Error) => emit('error', err))
    .finally(() => {
      uploadingList.value = uploadingList.value.filter(i => i.key !== item.key)
    })
}

function handleRemove(index: number) {
  const list = [...props.modelValue]
  list.splice(index, 1)
  emit('update:modelValue', list)
}

function handlePreview(index: number) {
  uni.previewImage({ urls: props.modelValue.map(item => item.url), current: index })
}
</script>

<template>
  <view class="flex flex-wrap gap-16rpx">
    <wd-toast />
    <!-- 已上传：缩略图 + 删除 + 点击预览 -->
    <view v-for="(item, index) in modelValue" :key="item.id" class="relative h-160rpx w-160rpx">
      <image :src="item.url" mode="aspectFill" class="h-full w-full rounded-12rpx" @click="handlePreview(index)" />
      <view
        v-if="!disabled"
        class="absolute h-36rpx w-36rpx flex items-center justify-center rounded-full bg-#F53F3F -right-10rpx -top-10rpx"
        @click.stop="handleRemove(index)"
      >
        <text class="i-carbon-close text-22rpx text-white" />
      </view>
    </view>

    <!-- 上传中：半透明缩略图 + 进度条 -->
    <view
      v-for="item in uploadingList"
      :key="item.key"
      class="relative h-160rpx w-160rpx flex items-center justify-center rounded-12rpx"
    >
      <image :src="item.tempPath" mode="aspectFill" class="h-full w-full rounded-12rpx opacity-40" />
      <view class="absolute bottom-10rpx left-12rpx right-12rpx h-6rpx overflow-hidden rounded-full bg-white/80">
        <view class="h-full rounded-full bg-#165DFF transition-all duration-150" :style="{ width: `${item.progress}%` }" />
      </view>
      <text class="absolute text-20rpx text-white font-semibold">{{ item.progress }}%</text>
    </view>

    <!-- 添加入口 -->
    <view
      v-if="canAdd"
      class="h-160rpx w-160rpx flex flex-col items-center justify-center gap-6rpx border-2rpx border-#C9CDD4 rounded-12rpx border-dashed transition-opacity active:opacity-60"
      @click="handleChoose"
    >
      <text class="i-carbon-add text-44rpx text-#86909C" />
      <text class="text-20rpx text-#86909C">上传</text>
    </view>
  </view>
</template>
