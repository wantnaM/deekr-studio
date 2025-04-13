import request from '@renderer/utils/axios'

export const getDictData = async (dictType: string) => {
  return await request.get({ url: `/system/dict-data/list-simple?dictType=${dictType}` })
}
