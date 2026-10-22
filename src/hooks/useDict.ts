import type { MaybeRefOrGetter } from 'vue'
import { computed, reactive, ref, toValue, watch } from 'vue'
import { fetchGetDict } from '@/api/dict'
import type { DictItem } from '@/api/types/dict'

const dictData = reactive<Record<string, DictItem[]>>({})
const pending = new Map<string, Promise<DictItem[] | undefined>>()

/** 按字典编码加载并缓存公共字典 */
export function useDict(dictCode: MaybeRefOrGetter<string>, immediate = true) {
  const code = computed(() => toValue(dictCode))
  const loading = ref(false)
  const error = ref<unknown>(null)
  const data = computed(() => dictData[code.value] ?? [])
  const options = computed(() => data.value.map(item => ({ label: item.label, value: item.value })))
  const record = computed<Record<string, string>>(() =>
    Object.fromEntries(data.value.map(item => [item.value, item.label])),
  )

  async function load() {
    const currentCode = code.value
    if (!currentCode || Object.prototype.hasOwnProperty.call(dictData, currentCode))
      return dictData[currentCode]

    let request = pending.get(currentCode)
    if (!request) {
      request = fetchGetDict(currentCode)
        .then((items) => {
          dictData[currentCode] = items
          return items
        })
        .catch(() => undefined)
        .finally(() => pending.delete(currentCode))
      pending.set(currentCode, request)
    }

    loading.value = true
    error.value = null
    try {
      const items = await request
      if (!items && code.value === currentCode)
        error.value = new Error('字典加载失败')
      return items
    }
    finally {
      if (code.value === currentCode)
        loading.value = false
    }
  }

  watch(code, () => void load(), { immediate })

  return { data, options, record, loading, error, load }
}
