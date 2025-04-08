import request from '@renderer/utils/axios'

export const login = async (data: any) => {
  return await request.post({ url: `/system/auth/login`, data })
}

export const getApiKey = async (userId: number) => {
  return await request.post({
    url: `/ds/llm/get-api-key`,
    data: {
      userId
    }
  })
}

// 登出
export const logout = async () => {
  return await request.post({
    url: `/system/auth/logout`
  })
}

export const changePassword = async (data: any) => {
  return await request.put({
    url: `/system/user/profile/update-password`,
    data
  })
}

export const getConfig = async (userId: number) => {
  return await request.get({
    url: `/ds/config/get-by-user?id=${userId}`
  })
}
