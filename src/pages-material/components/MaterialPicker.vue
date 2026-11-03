<script lang="ts" setup>
import type { MaterialItem } from '../mock'
import { computed, ref } from 'vue'
import { MATERIALS } from '../mock'

defineOptions({ name: 'MaterialPicker' })

const emit = defineEmits<{ confirm: [items: MaterialItem[]] }>()

const visible = ref(false)
const keyword = ref('')
const materials = ref<MaterialItem[]>([])
const loading = ref(false)
/** 已选物资 id（打开弹窗时重置，不保留上次选择） */
const selectedIds = ref<string[]>([])

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw)
    return materials.value
  return materials.value.filter(m => m.name.toLowerCase().includes(kw) || m.code.toLowerCase().includes(kw))
})

async function open() {
  keyword.value = ''
  selectedIds.value = []
  visible.value = true
  loading.value = true
  try {
    materials.value = MATERIALS
  }
  finally {
    loading.value = false
  }
}

function toggle(material: MaterialItem) {
  const index = selectedIds.value.indexOf(String(material.id))
  if (index >= 0)
    selectedIds.value.splice(index, 1)
  else
    selectedIds.value.push(String(material.id))
}

function handleConfirm() {
  emit('confirm', materials.value.filter(m => selectedIds.value.includes(String(m.id))))
  visible.value = false
}

defineExpose({ open })
</script>

<template>
  <wd-popup v-model="visible" position="bottom" custom-class="rounded-t-2xl">
    <view class="flex flex-col">
      <view class="flex items-center justify-between px-4 pt-4">
        <text class="text-4 text-#1d2129 font-medium">选择物资</text>
        <text class="i-carbon-close text-5 text-#86909c" @click="visible = false" />
      </view>
      <wd-search v-model="keyword" placeholder="搜索物资名称 / 编码" />
      <scroll-view scroll-y class="h-[50vh]">
        <view
          v-for="material in filtered"
          :key="material.id"
          class="flex items-center gap-3 px-4 py-3 active:bg-#f2f3f5"
          @click="toggle(material)"
        >
          <text
            class="text-6"
            :class="selectedIds.includes(String(material.id)) ? 'i-carbon-checkmark-filled text-[var(--wot-color-theme,#4d80f0)]' : 'i-carbon-circle-dash text-#c9cdd4'"
          />
          <view class="flex-1">
            <view class="flex items-center gap-2">
              <text class="text-4 text-#1d2129">{{ material.name }}</text>
              <text class="text-2 text-#86909c">{{ material.code }}</text>
            </view>
            <text class="mt-1 block text-3 text-#86909c">{{ material.spec }} · 库存 {{ material.stock }} {{ material.unit }}</text>
          </view>
        </view>
        <wd-loading v-if="loading" />
        <wd-empty v-else-if="!filtered.length" description="未找到相关物资" />
      </scroll-view>
      <view class="flex items-center gap-3 border-t border-#f2f3f5 border-solid px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
        <text class="flex-1 text-3 text-#86909c">已选 {{ selectedIds.length }} 种物资</text>
        <wd-button round :disabled="!selectedIds.length" size="small" @click="handleConfirm">
          确定
        </wd-button>
      </view>
    </view>
  </wd-popup>
</template>
