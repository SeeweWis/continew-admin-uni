# 请求层规范

> 事实源:`src/http/http.ts`(请求封装)+ `src/http/interceptor.ts`(拦截器)。本文规则均来自这两个文件的实际行为。

## 1. 分层

```
页面/组件
   ↓ 只调用
src/api/*            # 接口定义 + 类型声明
   ↓ 只调用
src/http/http.ts     # httpGet/httpPost/httpPut/httpDelete
   ↓ 自动经过
src/http/interceptor.ts  # URL 拼接、token 注入、超时
   ↓
uni.request / uni.uploadFile
```

业务代码**禁止**直接调 `uni.request`;新接口一律在 `src/api/` 按模块建文件并声明入参/出参类型。

## 2. 调用方式

```ts
import { httpGet, httpPost } from '@/http'

// GET(query 自动序列化拼接)
const data = await httpGet<IUser>('/user/info', { id: 1 })

// POST:第二参是 body,第三参是 query(微信系接口常用,勿省)
await httpPost<ILoginRes>('/login', { username, password }, { platform: 'wx' })
```

- `http<T>` 直接 resolve 业务 `data`(响应契约 `{ code, data, ... }` 已在封装内拆包)
- 超时 60s、`Authorization: Bearer <token>` 均由拦截器注入,**业务不手写请求头 token**

## 3. 错误处理(类型归一)

catch 到的永远是 `HttpError`,`type` 四选一,按需分支:

| type | 触发 | 默认行为 |
|------|------|---------|
| `Auth` | HTTP 401 或业务码 401 | 封装内已处理(见下),业务只需 catch |
| `Business` | HTTP 2xx 但业务码失败 | 自动 toast 错误消息 |
| `Http` | 非 2xx 状态码 | 自动 toast |
| `Network` | 请求 fail | 自动 toast「网络错误」 |

静默场景(自己处理提示)传 `hideErrorToast`:

```ts
await httpPost('/log/track', payload, undefined, undefined, { hideErrorToast: true })
```

## 4. 401 / token

当前小程序对接 ContiNew Admin 时，登录响应使用 `accessToken`、`tokenType`、`expiresIn`、`refreshToken`、`refreshExpiresIn`。普通请求由拦截器注入 `Authorization` 与 `clientid`。

Access Token 返回 401 后，请求层以 BODY 模式调用 `POST /auth/refresh`，在请求体传入 `refreshToken`，并发请求共用一次刷新；刷新成功后重放原请求。刷新失败才清空用户态并打开登录弹窗。认证 API 自身及已重放请求不会再次触发刷新。

业务页面不要自行读 store 手动拼 Authorization 或处理 401。

## 5. 地址与环境

- 基准地址 `VITE_SERVER_BASEURL`;第二后端用 `VITE_SERVER_BASEURL_SECONDARY`
- H5 dev 开代理时(`VITE_APP_PROXY_ENABLE=true`)自动走 `/fg-api` 前缀,nginx 需同步该前缀
- 微信三环境(开发/体验/正式)用 `VITE_SERVER_BASEURL__WEIXIN_*` 覆写,见 platforms.md 第 4 节
- 对接多个后端:在 `interceptor.ts` 的 URL 拼接处扩展,不在业务层散落拼 URL
