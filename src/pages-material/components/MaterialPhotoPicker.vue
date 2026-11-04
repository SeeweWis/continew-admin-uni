<script lang="ts" setup>
import { ref } from 'vue'

defineOptions({ name: 'MaterialPhotoPicker' })

const props = withDefaults(defineProps<{ max?: number }>(), { max: 6 })

/**
 * 现场照片选择（本地临时路径预览）。
 * mock 说明：后端 OSS 上传接口定稿后，提交时改走 @/services/upload（uploadOssFile）+ @/utils/uploadFile 上传并回填远程地址。
 */
const photos = ref<string[]>([])

function choose() {
  const remaining = props.max - photos.value.length
  if (remaining <= 0)
    return
  uni.chooseImage({
    count: remaining,
    sizeType: ['compressed'],
    success: (res) => {
      const paths = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths]
      photos.value = photos.value.concat(paths)
    },
  })
}

function preview(index: number) {
  uni.previewImage({ urls: photos.value, current: photos.value[index] })
}

function remove(index: number) {
  photos.value.splice(index, 1)
}

/** 供页面提交前读取已选照片（本地路径数组） */
function getPhotos() {
  return photos.value
}

defineExpose({ getPhotos })
</script>

<template>
  <view class="flex flex-wrap gap-3">
    <view
      v-for="(photo, index) in photos"
      :key="photo"
      class="relative h-160rpx w-160rpx overflow-hidden rounded-lg"
      @click="preview(index)"
    >
      <image :src="photo" mode="aspectFill" class="h-full w-full" />
      <view class="absolute right-0 top-0 h-44rpx w-44rpx center bg-black/50" @click.stop="remove(index)">
        <view class="mdi mdi-close text-3 text-white" />
      </view>
    </view>
    <view
      v-if="photos.length < max"
      class="h-160rpx w-160rpx center flex-col gap-1 border border-#e5e6eb rounded-lg border-dashed bg-#f7f8fa active:bg-#eff0f1"
      @click="choose"
    >
      <view class="mdi mdi-camera-outline text-8 text-#86909c" />
      <text class="text-2 text-#86909c">{{ photos.length }}/{{ max }}</text>
    </view>
  </view>
</template>
