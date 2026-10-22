import type {
  BehaviorCaptchaChallenge,
  BehaviorCaptchaCheckReq,
  BehaviorCaptchaCheckResp,
  CaptchaType,
  CaptchaVerificationParams,
} from './types/captcha'
import { http } from '@/http/http'

/** 获取行为验证码挑战数据（公开接口） */
export function fetchBehaviorCaptcha(params?: { captchaType?: CaptchaType }) {
  return http.get<BehaviorCaptchaChallenge>('/captcha/behavior', params, undefined, {
    skipAuthRefresh: true,
  })
}

/** 校验行为验证码（公开接口） */
export function fetchCheckBehaviorCaptcha(data: BehaviorCaptchaCheckReq) {
  return http.post<BehaviorCaptchaCheckResp>('/captcha/behavior', data, undefined, undefined, {
    skipAuthRefresh: true,
  })
}

/** 发送短信验证码（需先完成行为验证） */
export function fetchSendSmsCaptcha(phone: string, params: CaptchaVerificationParams) {
  return http.get<void>('/captcha/sms', { phone, ...params }, undefined, {
    skipAuthRefresh: true,
  })
}

/** 发送邮箱验证码（需先完成行为验证） */
export function fetchSendEmailCaptcha(email: string, params: CaptchaVerificationParams) {
  return http.get<void>('/captcha/mail', { email, ...params }, undefined, {
    skipAuthRefresh: true,
  })
}
