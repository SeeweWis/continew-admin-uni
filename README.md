<p align="center">
  <a href="https://github.com/seewe-yolo/seewis-single-uni">
    <img width="160" src="./src/static/logo.svg">
  </a>
</p>

<h1 align="center">
  <a href="https://github.com/seewe-yolo/seewis-single-uni" target="_blank">seewis-single-uni - uni-app 小程序开发模板</a>
</h1>

<div align="center">
  [![GitHub](https://img.shields.io/badge/GitHub-seewe--yolo%2Fseewis--single--uni-181717?logo=github)](https://github.com/seewe-yolo/seewis-single-uni)
  ![node version](https://img.shields.io/badge/node-%3E%3D20-green)
  ![pnpm version](https://img.shields.io/badge/pnpm-%3E%3D9-green)
  ![license](https://img.shields.io/badge/license-MIT-blue)

</div>

`seewis-single-uni` 是一个面向小程序开发的 `uni-app` 模板，由 `Vue3` + `TypeScript` + `Vite5` + `UnoCSS` + `Wot UI` + `z-paging` 构成，支持通过命令行运行 H5、微信小程序和 App。

模板内置了 `约定式路由`、`分包`、`请求封装`、`登录拦截`、`UnoCSS`、`i18n 多语言`、`Pinia` 和测试基础设施，可直接作为新小程序项目的起点。

![](https://raw.githubusercontent.com/andreasbm/readme/master/screenshots/lines/rainbow.png)

<p align="center">
  <a href="https://github.com/seewe-yolo/seewis-single-uni" target="_blank">📦 源码仓库</a>
  <span style="margin:0 10px;">|</span>
  <a href="https://github.com/feige996/unibest" target="_blank">🔗 上游框架</a>
</p>

---

本项目保留了部分业务示例页面，实际项目使用时可按模块替换为自己的业务领域。

## 平台兼容性

| H5  | IOS | 安卓 | 微信小程序 | 字节小程序 | 快手小程序 | 支付宝小程序 | 钉钉小程序 | 百度小程序 |
| --- | --- | ---- | ---------- | ---------- | ---------- | ------------ | ---------- | ---------- |
| √   | √   | √    | √          | √          | √          | √            | √          | √          |

注意每种 `UI框架` 支持的平台有所不同，详情请查看对应组件库文档。

## ⚙️ 环境

- node>=20
- pnpm>=9
- Vue Official>=2.1.10
- TypeScript>=5.0

## 项目定位

- `main`：模板主分支
- `src/pages-*`：业务分包页面

## &#x1F4C2; 快速开始

执行 `git clone https://github.com/seewe-yolo/seewis-single-uni.git` 获取项目
执行 `cd seewis-single-uni`
执行 `pnpm i` 安装依赖
执行 `pnpm dev` 运行 `H5`
执行 `pnpm dev:mp` 运行 `微信小程序`

## 📦 运行（支持热更新）

- web平台： `pnpm dev:h5`, 然后打开 [http://localhost:9000/](http://localhost:9000/)。
- weixin平台：`pnpm dev:mp` 然后打开微信开发者工具，导入本地文件夹，选择本项目的`dist/dev/mp-weixin` 文件。
- APP平台：`pnpm dev:app`, 然后打开 `HBuilderX`，导入刚刚生成的`dist/dev/app` 文件夹，选择运行到模拟器(开发时优先使用)，或者运行的安卓/ios基座。(如果是 `安卓` 和 `鸿蒙` 平台，则不用这个方式，可以把整个项目导入到 HBuilderX，通过 HBuilderX 的菜单来运行到对应的平台。)

## 🔗 发布

- web平台： `pnpm build:h5`，打包后的文件在 `dist/build/h5`，可以放到web服务器，如nginx运行。如果最终不是放在根目录，可以在 `manifest.config.ts` 文件的 `h5.router.base` 属性进行修改。
- weixin平台：`pnpm build:mp`, 打包后的文件在 `dist/build/mp-weixin`，然后通过微信开发者工具导入，并点击右上角的“上传”按钮进行上传。
- APP平台：`pnpm build:app`, 然后打开 `HBuilderX`，导入刚刚生成的`dist/build/app` 文件夹，选择发行 - APP云打包。(如果是 `安卓` 和 `鸿蒙` 平台，则不用这个方式，可以把整个项目导入到 HBuilderX，通过 HBuilderX 的菜单来发行到对应的平台。)

## 📄 License

[MIT](https://opensource.org/license/mit/)

Copyright (c) 2025 菲鸽
