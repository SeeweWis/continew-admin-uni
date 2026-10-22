# 请求库

项目使用 `src/http/http.ts` 的简单版封装，不引入 alova / vue-query。

## 关于 http 使用

```ts
import { http } from '@/http/http'

interface IUserInfoRes {
  id: number
  nickname: string
}

export function getUserInfo() {
  return http.get<IUserInfoRes>('/user/info')
}

export function updateUserInfo(data: Partial<IUserInfoRes>) {
  return http.post('/user/update', data)
}
```

响应成功时会返回业务 `data`；业务错误、登录失效、HTTP 状态码异常和网络异常会统一 reject `HttpError`：

```ts
import type { HttpError } from '@/http/types'

try {
  const userInfo = await getUserInfo()
  console.log(userInfo.nickname)
}
catch (error) {
  const httpError = error as HttpError
  console.log(httpError.type, httpError.message, httpError.statusCode)
}
```

## 与 ContiNew Admin 后端对齐

- 小程序登录调用 `POST /auth/login`，传 `clientId`、`authType: "MINI_PROGRAM"` 和 `wx.getPhoneNumber` 返回的一次性 `code`。
- 后端返回 camelCase 的 `accessToken`、`tokenType`、`expiresIn`、`refreshToken`、`refreshExpiresIn`；普通请求由拦截器携带 `Authorization: Bearer <accessToken>`，并附加 `clientid` 头（当前 admin 源码登录只读取请求体 `clientId`，该头保留用于兼容 Starter 版本）。
- Access Token 本地过期时，请求层以 BODY 模式调用 `POST /auth/refresh`，请求体含 `refreshToken`；服务端返回 401 时同样刷新并最多重放一次。刷新失败清除登录态并唤起登录弹窗。文件上传在开始前使用同一刷新流程，避免过期令牌上传。
- 当前用户信息由 `GET /auth/user/info` 获取。
- 通用文件上传走 `POST /system/common/file`，multipart 字段为 `file`，响应为 `{ id, url, thUrl, metadata }`。
- 当前后端没有小程序业务路由 `/app/material/*`；物料、领用页面使用本地 mock 数据，`src/api` 不再定义这些接口。

如果调用方需要自行处理错误提示，可以传入 `hideErrorToast: true`：

```ts
http.get<IUserInfoRes>('/user/info', undefined, undefined, {
  hideErrorToast: true,
})
```

## roadmap

菲鸽最近在优化脚手架，后续可以选择是否使用第三方请求库，以及选择具体请求库。
