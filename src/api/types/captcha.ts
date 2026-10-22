/** 行为验证码类型 */
export type CaptchaType = 'blockPuzzle' | 'clickWord'

/** GET /captcha/behavior 返回的挑战数据（后端 CaptchaVO） */
export interface BehaviorCaptchaChallenge {
  captchaId?: string
  projectCode?: string
  captchaType?: CaptchaType
  captchaOriginalPath?: string
  captchaFontType?: string
  captchaFontSize?: number
  secretKey?: string
  originalImageBase64?: string
  point?: { x: number, y: number }
  jigsawImageBase64?: string
  wordList?: string[]
  pointList?: { x: number, y: number }[]
  pointJson?: string
  token?: string
  result?: boolean
  captchaVerification?: string
  clientUid?: string
  ts?: number
  browserInfo?: string
}

/** POST /captcha/behavior 校验参数 */
export interface BehaviorCaptchaCheckReq {
  captchaType: CaptchaType
  token: string
  pointJson: string
}

/** POST /captcha/behavior 校验结果 */
export interface BehaviorCaptchaCheckResp {
  repCode: string
  repMsg?: string
  repData?: unknown
}

/** 短信/邮箱验证码需要携带的行为验证结果 */
export interface CaptchaVerificationParams {
  captchaType: CaptchaType
  captchaVerification: string
}
