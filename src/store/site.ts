import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { fetchGetSiteOptions } from '@/api/option'

/** 站点公共配置：登录前也可加载，失败时回退到环境变量 */
export const useSiteConfigStore = defineStore('siteConfig', () => {
  const values = ref<Record<string, string>>({})
  const loaded = ref(false)
  let loading: Promise<void> | null = null

  async function load() {
    if (loaded.value)
      return
    if (loading)
      return loading

    loading = (async () => {
      try {
        const options = await fetchGetSiteOptions()
        values.value = Object.fromEntries(options.map(item => [item.label, item.value]))
        loaded.value = true
      }
      catch {
        // 保留环境变量回退，不阻断页面
      }
      finally {
        loading = null
      }
    })()

    return loading
  }

  const siteTitle = computed(() => values.value.SITE_TITLE || import.meta.env.VITE_APP_TITLE || 'seewis-single-uni')
  const siteLogo = computed(() => values.value.SITE_LOGO || '')

  return { values, loaded, load, siteTitle, siteLogo }
})
