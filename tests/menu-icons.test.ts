import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createMdiCss } from '../vite-plugins/mdi-icons'
import { getUserRoutes } from '../src/api/login'
import { getMiniMenuIcon } from '../src/modules/menu-config'
import { useMenuStore } from '../src/store/menu'

vi.mock('../src/api/login', () => ({ getUserRoutes: vi.fn() }))
vi.mock('../src/store/token', () => ({ useTokenStore: () => ({ tokenInfo: { token: 'test' } }) }))

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('backend menu icons', () => {
  it('keeps backend icon fields at each menu level and uses them independently of route names', async () => {
    vi.mocked(getUserRoutes).mockResolvedValue([{
      id: 1,
      parentId: 0,
      name: 'CustomRoot',
      title: '目录',
      type: 1,
      icon: 'mdi:cog-outline',
      children: [{ id: 2, parentId: 1, name: 'CustomMenu', title: '功能', type: 2, icon: 'mdi:account-outline' }],
    }])
    const store = useMenuStore()
    await store.load()
    expect(getMiniMenuIcon(store.rootMenus[0].icon)).toBe('mdi mdi-cog-outline')
    expect(getMiniMenuIcon(store.workbenchMenus[0].icon)).toBe('mdi mdi-account-outline')
  })

  it('uses a fallback for missing or unsafe icon names', () => {
    for (const icon of [undefined, '', 'carbon:user', 'mdi:', 'mdi:account extra-class', 'mdi:../account'])
      expect(getMiniMenuIcon(icon)).toBe('mdi mdi-folder-outline')
  })

  it('packages dynamic MDI icons and an offline font, with a fallback for unknown names', () => {
    const css = createMdiCss()
    expect(css).toContain('data:font/woff2;base64,d09GMg')
    expect(css).not.toMatch(/https?:|\.\.\/fonts/)
    expect(css).toMatch(/\.mdi::before\{[^}]*content:"\\F0256"/)
    expect(css).toMatch(/\.mdi-cog-outline::before\s*\{\s*content: "\\F08BB"/)
    expect(css).toMatch(/\.mdi-monitor-dashboard::before\s*\{\s*content: "\\F0A07"/)
    expect(css).toMatch(/\.mdi-clipboard-check-outline::before/)

    // 固定图标与后台动态图标共用字体，防止迁移后出现不存在的类名。
    const sourceDir = fileURLToPath(new URL('../src', import.meta.url))
    for (const file of readdirSync(sourceDir, { recursive: true }) as string[]) {
      if (!/\.(?:vue|ts)$/.test(file))
        continue
      const source = readFileSync(`${sourceDir}/${file}`, 'utf8')
      expect(source).not.toContain('i-carbon-')
      for (const [, name] of source.matchAll(/mdi mdi-([a-z0-9-]+)/g))
        expect(css, `${file}: ${name}`).toContain(`.mdi-${name}::before`)
    }
  })
})
