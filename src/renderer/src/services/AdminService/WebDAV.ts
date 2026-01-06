import request from '@renderer/utils/axios'

export const getWebDavUser = async () => {
  return await request.get({ url: `/ds/user-webdav/get` })
}
