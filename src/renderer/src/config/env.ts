export { default as UserAvatar } from '@renderer/assets/images/avatar.png'
export { default as AppLogo } from '@renderer/assets/images/logo.png'

export const APP_NAME = 'Cherry Studio'
export const isLocalAi = false

export const ADMIN_BASE_URL =
  process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:48080' : 'http://8.134.23.119:8080'
export const ADMIN_API_URL = '/admin-api'
