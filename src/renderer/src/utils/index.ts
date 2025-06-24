import Logger from '@renderer/config/logger'
import { Model } from '@renderer/types'
import { ModalFuncProps } from 'antd/es/modal/interface'
// @ts-ignore next-line`
import { v4 as uuidv4 } from 'uuid'

/**
 * 异步执行一个函数。
 * @param {() => void} fn 要执行的函数
 * @returns {Promise<void>} 执行结果
 */
export const runAsyncFunction = async (fn: () => void): Promise<void> => {
  await fn()
}

/**
 * 创建一个延迟的 Promise，在指定秒数后解析。
 * @param {number} seconds 延迟的秒数
 * @returns {Promise<any>} 在指定秒数后解析的 Promise
 */
export const delay = (seconds: number): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, seconds * 1000)
  })
}

/**
 * 等待异步函数返回 true。
 * @param {() => Promise<any>} fn 要等待的异步函数
 * @param {number} [interval=200] 检查间隔时间（毫秒）
 * @param {number} [stopTimeout=60000] 停止等待的超时时间（毫秒）
 * @returns {Promise<any>} 异步函数返回 true 后的 Promise
 */
export const waitAsyncFunction = (
  fn: () => Promise<any>,
  interval: number = 200,
  stopTimeout: number = 60000
): Promise<any> => {
  let timeout = false
  const timer = setTimeout(() => (timeout = true), stopTimeout)

  return (async function check(): Promise<any> {
    if (await fn()) {
      clearTimeout(timer)
      return Promise.resolve()
    } else if (!timeout) {
      return delay(interval / 1000).then(check)
    } else {
      return Promise.resolve()
    }
  })()
}

export const uuid = () => uuidv4()

export function isFreeModel(model: Model) {
  return (model.id + model.name).toLocaleLowerCase().includes('free')
}

export async function isProduction() {
  const { isPackaged } = await window.api.getAppInfo()
  return isPackaged
}

export async function isDev() {
  const isProd = await isProduction()
  return !isProd
}

/**
 * 从错误对象中提取错误信息。
 * @param {any} error 错误对象或字符串
 * @returns {string} 提取的错误信息，如果没有则返回空字符串
 */
export function getErrorMessage(error: any): string {
  if (!error) {
    return ''
  }

  if (typeof error === 'string') {
    return error
  }

  if (error?.error) {
    return getErrorMessage(error.error)
  }

  if (error?.message) {
    return error.message
  }

  return ''
}

/**
 * 移除字符串中的引号。
 * @param {string} str 输入字符串
 * @returns {string} 新字符串
 */
export function removeQuotes(str: string): string {
  return str.replace(/['"]+/g, '')
}

/**
 * 移除字符串中的特殊字符。
 * @param {string} str 输入字符串
 * @returns {string} 新字符串
 */
export function removeSpecialCharacters(str: string): string {
  // First remove newlines and quotes, then remove other special characters
  return str.replace(/[\n"]/g, '').replace(/[\p{M}\p{P}]/gu, '')
}

/**
 * 检查 URL 是否是有效的代理 URL。
 * @param {string} url 代理 URL
 * @returns {boolean} 是否有效
 */
export const isValidProxyUrl = (url: string): boolean => {
  return url.includes('://')
}

/**
 * 动态加载 JavaScript 脚本。
 * @param url 脚本的 URL 地址
 * @returns Promise<void> 脚本加载成功或失败的 Promise
 */
export function loadScript(url: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = url

    script.onload = resolve
    script.onerror = reject

    document.head.appendChild(script)
  })
}

/**
 * 检查 URL 是否包含路径部分。
 * @param {string} url 输入 URL 字符串
 * @returns {boolean} 如果 URL 包含路径则返回 true，否则返回 false
 */
export function hasPath(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.pathname !== '/' && parsedUrl.pathname !== ''
  } catch (error) {
    console.error('Invalid URL:', error)
    return false
  }
}

/**
 * 比较两个版本号字符串。
 * @param {string} v1 第一个版本号
 * @param {string} v2 第二个版本号
 * @returns {number} 比较结果，1 表示 v1 大于 v2，-1 表示 v1 小于 v2，0 表示相等
 */
export const compareVersions = (v1: string, v2: string): number => {
  const v1Parts = v1.split('.').map(Number)
  const v2Parts = v2.split('.').map(Number)

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0
    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }
  return 0
}

/**
 * 显示确认模态框。
 * @param {ModalFuncProps} params 模态框参数
 * @returns {Promise<boolean>} 用户确认返回 true，取消返回 false
 */
export function modalConfirm(params: ModalFuncProps): Promise<boolean> {
  return new Promise((resolve) => {
    window.modal.confirm({
      centered: true,
      ...params,
      onOk: () => resolve(true),
      onCancel: () => resolve(false)
    })
  })
}

/**
 * 检查对象是否包含特定键。
 * @param {any} obj 输入对象
 * @param {string} key 要检查的键
 * @returns {boolean} 包含该键则返回 true，否则返回 false
 */
export function hasObjectKey(obj: any, key: string): boolean {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }

  return Object.keys(obj).includes(key)
}

/**
 * 从npm readme中提取 npx mcp config
 * @param {string} readme readme字符串
 * @returns {Record<string, any> | null} mcp config sample
 */
export function getMcpConfigSampleFromReadme(readme: string): Record<string, any> | null {
  if (readme) {
    try {
      const regex = /"mcpServers"\s*:\s*({(?:[^{}]*|{(?:[^{}]*|{[^{}]*})*})*})/g
      for (const match of readme.matchAll(regex)) {
        let orgSample = JSON.parse(match[1])
        orgSample = orgSample[Object.keys(orgSample)[0] ?? '']
        if (orgSample.command === 'npx') {
          return orgSample
        }
      }
    } catch (e) {
      Logger.log('getMcpConfigSampleFromReadme', e)
    }
  }
  return null
}

export * from './file'
export * from './image'
export * from './json'
export * from './naming'
export * from './sort'
export * from './style'
