import request from '@renderer/utils/axios'

export const submitFeedback = async (data: any) => {
  return await request.post({
    url: `/ds/feedback/create`,
    data,
    headers: {
      'Content-Type': 'multipart/form-data' // 确保设置正确的Content-Type
    }
  })
}
