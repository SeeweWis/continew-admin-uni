import { onMounted, onUnmounted } from 'vue'
import { usePageRefresh } from './usePageRefresh'
import { useScroll } from './useScroll'

interface UseListPageOptions<T> {
  fetchData: (page: number, pageSize: number) => Promise<T[]>
  pageSize?: number
}

/**
 * 通用分页列表：在 useScroll 之上统一注册全局触底与下拉刷新
 * 页面只需要提供 fetchData，并处理筛选条件变化时调用 refresh
 */
export function useListPage<T>(options: UseListPageOptions<T>) {
  const state = useScroll<T>(options)

  onMounted(() => {
    uni.$on('app:scrolltolower', state.loadMore)
  })
  onUnmounted(() => {
    uni.$off('app:scrolltolower', state.loadMore)
  })

  usePageRefresh(() => state.refresh())

  return state
}
