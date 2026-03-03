export { default as UserAvatar } from '@renderer/assets/images/avatar.png'
export { default as AppLogo } from '@renderer/assets/images/logo.png'

export const APP_NAME = 'Deekr Studio'
export const isLocalAi = false

export const ADMIN_BASE_URL =
  process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:48080' : 'http://studio-dev.deekr.com.cn'
export const ADMIN_API_URL = '/admin-api'
