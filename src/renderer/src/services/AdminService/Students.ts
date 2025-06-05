import request from '@renderer/utils/axios'

export const getStudentsList = async () => {
  return await request.get({ url: `/system/user/list-students` })
}
