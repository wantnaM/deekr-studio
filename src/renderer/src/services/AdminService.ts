import { ADMIN_API_URL } from '@renderer/config/env'
import { getToken } from '@renderer/hooks/useSettings'
const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number): Promise<Response> => {
  const timeoutPromise = new Promise<Response>((_, reject) => {
    setTimeout(() => reject(new Error('Request timed out')), timeout)
  })

  const fetchPromise = fetch(url, options)

  return Promise.race([fetchPromise, timeoutPromise])
}

export const login = async (values: any) => {
  const response = await fetchWithTimeout(
    `${ADMIN_API_URL}/admin-api/system/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(values)
    },
    10000
  ) // 设置超时时间为5000毫秒（5秒）

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const res = await response.json()
  if (res.code !== 0) {
    throw new Error(res.msg)
  }
  return res.data
}

export const getApiKey = async (userId: number) => {
  const response = await fetchWithTimeout(
    `${ADMIN_API_URL}/admin-api/ds/llm/get-api-key`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        userId: userId
      })
    },
    20000
  ) // 设置超时时间为5000毫秒（5秒）

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const res = await response.json()
  if (res.code !== 0) {
    throw new Error(res.msg)
  }
  return res.data
}

// 登出
export const logout = async () => {
  const response = await fetchWithTimeout(
    `${ADMIN_API_URL}/admin-api/system/auth/logout`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      }
    },
    10000
  ) // 设置超时时间为5000毫秒（5秒）

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const res = await response.json()
  if (res.code !== 0) {
    throw new Error(res.msg)
  }
  return res.data
}
