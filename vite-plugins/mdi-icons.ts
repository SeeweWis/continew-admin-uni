import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

/** 全量名称保留给后台动态菜单；字体内嵌，微信端不依赖网络字体或本地字体 URL。 */
export function createMdiCss() {
  const source = readFileSync(require.resolve('@mdi/font/css/materialdesignicons.css'), 'utf8')
  const font = readFileSync(require.resolve('@mdi/font/fonts/materialdesignicons-webfont.woff2'))
  const icons = source.match(/\.mdi-[\w-]+::before\s*\{\s*content:\s*"\\[\dA-F]+";\s*\}/g)
  if (!icons?.length)
    throw new Error('MDI 图标字体缺少名称映射')

  return `/*! MDI 7.4.47 - Pictogrammers - Apache-2.0 (font/icons), MIT (code) */
@font-face{font-family:app-mdi;src:url("data:font/woff2;base64,${font.toString('base64')}") format("woff2");font-weight:normal;font-style:normal;font-display:block}
.mdi{display:inline-block;width:1em;height:1em;line-height:1;vertical-align:middle}
.mdi::before{display:inline-block;font-family:app-mdi;font-style:normal;font-weight:normal;font-size:inherit;line-height:1;content:"\\F0256"}
${icons.join('\n')}`
}

export default function mdiIconsPlugin(): Plugin {
  const id = 'virtual:mdi.css'
  return {
    name: 'mdi-icons',
    resolveId: source => source === id ? `\0${id}` : undefined,
    load: source => source === `\0${id}` ? createMdiCss() : undefined,
  }
}
