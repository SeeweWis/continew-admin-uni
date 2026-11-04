<script lang="ts" setup>
import type { MaterialItem } from '../../mock'
import { computed, ref } from 'vue'
import { MATERIALS, ORDERS, REQUISITION_STATUS } from '../../mock'
import MaterialBottomBar from '../../components/MaterialBottomBar.vue'

definePage({
  style: {
    navigationBarTitleText: '物资详情',
  },
})

/** 分类图标 */
const CATEGORY_ICONS: Record<MaterialItem['category'], string> = {
  消防器材: 'mdi mdi-fire',
  急救用品: 'mdi mdi-medical-bag',
  防护用品: 'mdi mdi-package-variant-closed',
  应急工具: 'mdi mdi-tools',
}

const material = ref<MaterialItem | null>(null)

onLoad((options) => {
  // 扫码页按 MAT/WL 前缀路由进入（传 code），列表/盘点等入口传 id
  // mock：后端接口定稿后改为 getMaterial(id | code)；无参数时默认展示第一个物资便于独立预览
  const id = options?.id ?? ''
  const code = options?.code?.toUpperCase() ?? ''
  material.value = MATERIALS.find(m => m.id === id)
    ?? MATERIALS.find(m => m.code.toUpperCase() === code)
    ?? MATERIALS[0]
})

/** 库存预警：低于安全库存时提醒补货 */
const stockWarning = computed(() => !!material.value && material.value.stock < material.value.safetyStock)

/** 该物资的最近领用记录（复用领用单 mock 数据） */
const relatedOrders = computed(() => {
  if (!material.value)
    return []
  return ORDERS.filter(order => order.lines.some(line => line.materialId === material.value!.id)).slice(0, 3)
})

function goApply() {
  uni.navigateTo({ url: `/pages-material/requisition/apply/index?id=${material.value?.id ?? ''}` })
}

function goInbound() {
  uni.navigateTo({ url: '/pages-material/stock/inbound/index' })
}

function goOrder(orderId: string) {
  uni.navigateTo({ url: `/pages-material/requisition/detail/index?id=${orderId}` })
}
</script>

<template>
  <view class="page-material-material-detail min-h-screen bg-#f2f3f5 px-4 pb-[140px] pt-3">
    <template v-if="material">
      <!-- 物资概览 -->
      <view class="rounded-lg bg-white p-4">
        <view class="flex items-start gap-4">
          <view class="h-120rpx w-120rpx center flex-none rounded-lg bg-[var(--wot-color-theme,#4d80f0)]/10">
            <view class="text-10 text-[var(--wot-color-theme,#4d80f0)]" :class="CATEGORY_ICONS[material.category]" />
          </view>
          <view class="flex-1">
            <view class="flex items-center gap-2">
              <text class="text-5 text-#1d2129 font-medium">{{ material.name }}</text>
              <wd-tag type="lightblue" custom-class="!text-2">
                {{ material.category }}
              </wd-tag>
            </view>
            <text class="mt-2 block text-3 text-#86909c">{{ material.code }} · {{ material.spec }}</text>
            <text class="mt-1 block text-3 text-#86909c">{{ material.location }}</text>
          </view>
        </view>

        <view class="mt-4 flex items-end justify-between rounded-lg bg-#f7f8fa p-4">
          <view>
            <text class="text-10 text-#1d2129 font-medium">{{ material.stock }}</text>
            <text class="ml-1 text-3 text-#86909c">{{ material.unit }}（当前库存）</text>
          </view>
          <text class="text-3 text-#86909c">安全库存 {{ material.safetyStock }}{{ material.unit }}</text>
        </view>
      </view>

      <wd-notice-bar v-if="stockWarning" class="mt-3" text="当前库存低于安全库存，请及时补货" />

      <!-- 基本信息 -->
      <view class="mt-3 rounded-lg bg-white p-4">
        <text class="text-4 text-#1d2129 font-medium">基本信息</text>
        <wd-cell-group border custom-class="mt-2">
          <wd-cell title="物资分类" :value="material.category" />
          <wd-cell title="规格型号" :value="material.spec" />
          <wd-cell title="计量单位" :value="material.unit" />
          <wd-cell title="存放位置" :value="material.location" />
          <wd-cell title="保管员" :value="material.keeper" />
          <wd-cell v-if="material.expiryRequired" title="最近有效期" :value="material.nearestExpiry ?? ''" />
          <wd-cell title="更新时间" value="2026-09-13 18:20" />
        </wd-cell-group>
      </view>

      <!-- 领用记录 -->
      <view v-if="relatedOrders.length" class="mt-3 rounded-lg bg-white p-4">
        <text class="text-4 text-#1d2129 font-medium">最近领用</text>
        <view class="mt-1">
          <view
            v-for="(order, index) in relatedOrders"
            :key="order.id"
            class="flex items-center justify-between py-3"
            :class="index > 0 ? 'border-t border-solid border-#f2f3f5' : ''"
            @click="goOrder(order.id)"
          >
            <view>
              <text class="block text-3 text-#4e5969 font-medium">{{ order.code }}</text>
              <text class="mt-1 block text-3 text-#86909c">{{ order.applicant }} · {{ order.applyTime }}</text>
            </view>
            <view class="flex items-center gap-2">
              <text class="text-3 text-#86909c">× {{ order.lines.find(line => line.materialId === material?.id)?.quantity }}{{ material?.unit }}</text>
              <wd-tag :type="REQUISITION_STATUS[order.status].tag" custom-class="!text-2">
                {{ REQUISITION_STATUS[order.status].text }}
              </wd-tag>
            </view>
          </view>
        </view>
      </view>

      <MaterialBottomBar>
        <wd-button round plain custom-class="flex-1" @click="goInbound">
          入库登记
        </wd-button>
        <wd-button round type="primary" custom-class="flex-1" @click="goApply">
          申请领用
        </wd-button>
      </MaterialBottomBar>
    </template>

    <wd-empty v-else class="mt-20" description="未找到物资信息" />
  </view>
</template>

<style lang="scss" scoped>
</style>
