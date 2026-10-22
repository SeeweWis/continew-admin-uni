# ContiNew 后端与小程序适配分析

## 项目边界

- 后端是 `continew-single-admin`，基于 Spring Boot 3.5 / Java 17 的 Maven 多模块项目。`continew-server` 提供运行入口和全局配置，`continew-system` 提供认证、系统用户和文件等接口。
- 小程序是 `continew-single-uni`，基于 uni-app、Vue 3、TypeScript。页面使用 `src/api` → `src/http` → `uni.request`，上传通过 `src/utils/uploadFile.ts`。
- 两端分属独立 Git 仓库，当前分别在 `dev` 和 `main` 分支。小程序仓库已有未提交改动，本次沿用并保留。

## 可直接对接的后端能力

| 能力 | 后端契约 | 小程序接入 |
| --- | --- | --- |
| 微信手机号登录 | `POST /auth/login`；`authType: "MINI_PROGRAM"`、`clientId`、`code`。后端将微信手机号授权码兑换成手机号，按手机号查找或注册用户。 | `src/api/login.ts`、`src/services/auth/index.ts`、`fg-login-popup.vue` |
| 账号密码登录 | 同一登录地址，`authType: "ACCOUNT"`、`username`、RSA 加密的 `password`，验证码使用 `captcha`、`uuid`。 | `src/http/crypto.ts`、`src/services/auth/index.ts` |
| 图片验证码 | `GET /captcha/image`，响应字段包括 `isEnabled`、`uuid`、`img`、`expireTime`。 | `src/api/login.ts`、`src/api/types/login.ts` |
| 当前用户 | `GET /auth/user/info`，返回 `id`、`username`、`nickname`、`avatar`、`roles`、`permissions` 等字段。 | `src/services/auth/index.ts` 映射为小程序用户状态 |
| 刷新与退出会话 | `POST /auth/refresh`、`POST /auth/logout`。BODY 模式分别提交 `refreshToken`；成功登录须返回完整令牌及有效期。 | `src/http/http.ts`、`src/api/login.ts` |
| 文件上传 | `POST /system/common/file`，multipart 文件字段名 `file`，可选查询参数 `parentPath`，返回 `id`、`url`、`thUrl`、`metadata`。 | `src/api/oss.ts`、`src/services/upload.ts`、`src/utils/uploadFile.ts` |

后端证据：`continew-system/src/main/java/top/continew/admin/auth/controller/AuthController.java`、`SessionController.java`、`handler/MiniProgramLoginHandler.java`、`continew-server/src/main/java/top/continew/admin/controller/CaptchaController.java`、`continew-system/src/main/java/top/continew/admin/system/controller/CommonController.java`。认证类型和验证码由各自请求/响应模型定义；账号密码解密使用后端 `RsaProperties`。

## 接入前须配置

这些是部署配置要求，仓库代码无法替运行环境创建或验证它们。

1. 在后端「系统管理 / 系统配置 / 客户端配置」创建启用的小程序客户端，认证类型包含 `MINI_PROGRAM`（如需账号登录，再包含 `ACCOUNT`）。将它的 `clientId` 配置到小程序 `VITE_APP_CLIENT_ID`。初始化 SQL 当前只插入 PC 账号客户端，没有提供小程序客户端；不要把 `env/.env` 里的旧 ID 当作已部署 ID。
2. 小程序客户端的 Refresh Token 传输模式必须是 `BODY`。`application.yml` 明确规定 App / 小程序走 BODY；`SessionController` 会从请求体读取令牌。确认数据库客户端配置与该模式一致，否则登录可能不返回小程序所需的刷新令牌。
3. 在后端登录选项中配置 `MINI_PROGRAM_APP_ID` 和 `MINI_PROGRAM_APP_SECRET`。其中 AppID 必须与微信公众平台的小程序一致；仅配置前端 `VITE_WX_APPID` 不会配置后端微信凭据。
4. 小程序 API 基地址应指向后端服务。后端开发默认端口是 `8000`；仓库本地忽略的 `env/.env` 当前设为 `http://localhost:8080`，两者不匹配。微信开发者工具中的 `localhost` 指向工具运行的电脑；真机联调应配置可从手机访问的局域网地址或 HTTPS 域名，并满足微信合法域名要求。
5. 账号密码登录用的 RSA 公钥须与后端 `continew-starter.encrypt.field.public-key` 配对。当前本地 `VITE_API_ENCRYPT_PUBLIC_KEY` 与后端开发公钥不匹配；按目标环境配置正确公钥，不要提交私钥。小程序一键登录本身不经过该密码加密步骤。

## 当前小程序与业务缺口

- 认证、刷新、用户信息、上传已有明确后端契约。已对齐登录请求字段、验证码响应字段和扁平用户信息映射；过期令牌会先尝试刷新，普通请求收到 401 后只重放一次并保留查询参数，上传开始前也会刷新令牌。
- `src/api/material.ts` 调用的 `/app/material/*` 在当前后端源码中没有对应控制器；`src/pages-material` 及培训、应急示例页包含本地 Mock 或页面骨架。它们无法通过修改 URL 接到现有服务，需要后端补齐领域接口后逐项适配 DTO、分页和状态流转。
- `src/pages-profile/info/index.vue` 仍是占位页。现有后端用户资料 API 虽然存在，但要支持小程序个人资料维护，还需逐字段对齐其更新请求和权限边界；本轮不把占位页包装成已经接通。
- 目前无法验证实际登录、微信手机号兑换、令牌 BODY 返回、上传存储及小程序真机网络；这些依赖客户端配置、微信 AppID/Secret、数据库、Redis 和可访问的后端环境。

## 本轮改动与验证

- 保留原有未提交改动，补充验证码响应类型和令牌字段校验，防止字段不匹配的响应被保存为登录态。
- 本地 Access Token 到期时先刷新令牌；统一请求收到 401 后刷新并最多重放一次，保留原查询参数；上传前也先刷新。
- `pnpm build:mp`、`pnpm test:run`（7 个套件、30 项）、改动文件 ESLint 均通过。`pnpm type-check` 仍被已安装的 Wot UI 组件类型错误和未改动的 `src/tabbar/store.ts` 类型错误阻塞；首次构建前还需要生成的声明文件，构建完成后已不再是阻塞项。
