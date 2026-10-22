import uniHelper from '@uni-helper/eslint-config'

export default uniHelper({
  unocss: true,
  vue: true,
  markdown: false,
  ignores: [
    // 忽略uni_modules目录
    '**/uni_modules/',
    // 忽略原生插件目录
    '**/nativeplugins/',
    'dist',
    // unplugin-auto-import 生成的类型文件，每次提交都改变，所以加入这里吧，与 .gitignore 配合使用
    'auto-import.d.ts',
    // vite-plugin-uni-pages 生成的类型文件，每次切换分支都一堆不同的，所以直接 .gitignore
    'uni-pages.d.ts',
    // 插件生成的文件
    'src/pages.json',
    'src/manifest.json',
    // 忽略自动生成文件
    'src/service/**',
    // pnpm 配置由 pnpm 维护，ESLint 格式化会破坏其结构
    'pnpm-workspace.yaml',
    'pnpm-lock.yaml',
  ],
  // https://eslint-config.antfu.me/rules
  rules: {
    'no-useless-return': 'off',
    'no-console': 'off',
    'no-unused-vars': 'off',
    'vue/no-unused-refs': 'off',
    'unused-imports/no-unused-vars': 'off',
    'eslint-comments/no-unlimited-disable': 'off',
    'jsdoc/check-param-names': 'off',
    'jsdoc/require-returns-description': 'off',
    'ts/no-empty-object-type': 'off',
    'no-extend-native': 'off',
    // uni 条件编译注释可能包裹 import，自动排序会破坏平台条件边界
    'perfectionist/sort-imports': 'off',
    'vue/singleline-html-element-content-newline': [
      'error',
      {
        externalIgnores: ['text'],
      },
    ],
    // vue SFC 调换顺序改这里
    'vue/block-order': ['error', {
      order: [['script', 'template'], 'style'],
    }],
  },
  formatters: {
    /**
     * Format CSS, LESS, SCSS files, also the `<style>` blocks in Vue
     * By default uses Prettier
     */
    css: true,
    /**
     * Format HTML files
     * By default uses Prettier
     */
    html: true,
  },
}).append({
  // 轻提示统一走 wd-toast（useToast）：uni.showToast 仅允许在基础设施层使用
  files: ['src/**/*.{ts,tsx,vue}'],
  ignores: [
    'src/store/**',
    'src/http/**',
    // 上传基础设施：非组件上下文，允许原生 toast
    'src/utils/uploadFile.ts',
    'src/services/file.ts',
    // 第三方图表组件拷贝副本
    'src/components/qiun-data-charts/**',
  ],
  rules: {
    'no-restricted-syntax': ['error', {
      selector: 'CallExpression[callee.object.name="uni"][callee.property.name="showToast"]',
      message: '轻提示请使用 wd-toast 的 useToast（页面/组件 setup 内调用，模板挂载 <wd-toast />）；uni.showToast 仅允许在 store/http/上传基础设施层使用',
    }],
  },
})
