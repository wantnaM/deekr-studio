export { default as UserAvatar } from '@renderer/assets/images/avatar.png'
export { default as AppLogo } from '@renderer/assets/images/logo.png'
export { default as AppLogo2 } from '@renderer/assets/images/logo2.jpg'

export const APP_NAME = '教师智能体'
export const isLocalAi = false
export const ADMIN_API_URL =
  process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:48080' : 'http://8.134.23.119:8080'
