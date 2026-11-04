import type { IUserRoute } from '@/api/types/login'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { getUserRoutes } from '@/api/login'
import { useTokenStore } from './token'

export interface MenuNode {
  name: string
  title: string
  icon?: string
  type: 1 | 2
  children: MenuNode[]
}

type MenuStatus = 'idle' | 'loading' | 'ready' | 'error'

/** HTTP 响应边界：只保留可展示的目录/菜单，遵循后台排序与隐藏配置。 */
function normalizeMenuTree(data: unknown): MenuNode[] {
  if (!Array.isArray(data))
    throw new Error('路由菜单响应格式错误')

  return data
    .filter((item): item is IUserRoute => item !== null && typeof item === 'object'
      && typeof item.name === 'string' && !!item.name
      && typeof item.title === 'string' && (item.type === 1 || item.type === 2)
      && item.isHidden !== true && item.isExternal !== true)
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map(item => ({
      name: item.name,
      title: item.title,
      icon: typeof item.icon === 'string' ? item.icon : undefined,
      type: item.type,
      children: normalizeMenuTree(item.children ?? []),
    }))
}

export const useMenuStore = defineStore('menu', () => {
  const tokenStore = useTokenStore()
  const routes = ref<MenuNode[]>([])
  const selectedRootName = ref('')
  const status = ref<MenuStatus>('idle')
  const rootMenus = computed(() => routes.value)
  const selectedRoot = computed(() => rootMenus.value.find(item => item.name === selectedRootName.value) ?? rootMenus.value[0])
  const workbenchMenus = computed(() => {
    const root = selectedRoot.value
    if (!root)
      return []
    if (root.type === 2)
      return [root]
    const menus: MenuNode[] = []
    const visit = (nodes: MenuNode[]) => {
      nodes.forEach((node) => {
        if (node.type === 2)
          menus.push(node)
        visit(node.children)
      })
    }
    visit(root.children)
    return menus
  })

  let request: Promise<void> | undefined
  let generation = 0

  function clear() {
    generation++
    request = undefined
    routes.value = []
    selectedRootName.value = ''
    status.value = 'idle'
  }

  watch(() => tokenStore.tokenInfo.token, (token) => {
    if (!token)
      clear()
  }, { flush: 'sync' })

  function selectRoot(name: string) {
    if (rootMenus.value.some(item => item.name === name))
      selectedRootName.value = name
  }

  async function load(force = false) {
    if (!tokenStore.tokenInfo.token) {
      clear()
      return
    }
    if (request)
      return request
    if (!force && status.value === 'ready')
      return

    const currentGeneration = ++generation
    status.value = 'loading'
    const pending = getUserRoutes().then((data) => {
      const normalized = normalizeMenuTree(data)
      if (currentGeneration !== generation)
        return
      routes.value = normalized
      if (!normalized.some(item => item.name === selectedRootName.value))
        selectedRootName.value = normalized[0]?.name ?? ''
      status.value = 'ready'
    }).catch((error: unknown) => {
      if (currentGeneration === generation) {
        routes.value = []
        status.value = 'error'
      }
      throw error
    })
    request = pending
    try {
      await pending
    }
    finally {
      if (request === pending)
        request = undefined
    }
  }

  return { routes, rootMenus, selectedRoot, workbenchMenus, status, selectRoot, load, clear }
})
