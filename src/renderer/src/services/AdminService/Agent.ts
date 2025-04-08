import request from '@renderer/utils/axios'

export const createAgent = async (data: any) => {
  return await request.post({ url: `/ds/agent/create`, data })
}

export const updateAgent = async (data: any) => {
  return await request.put({ url: `/ds/agent/update-by-id`, data })
}

export const deleteAgent = async (id: string) => {
  return await request.delete({ url: `/ds/agent/delete-by-id?id=${id}` })
}
