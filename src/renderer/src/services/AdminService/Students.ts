import request from '@renderer/utils/axios'

export const getStudentsList = async () => {
  return await request.get({ url: `/system/user/list-students` })
}

export const importStudentsTemplate = () => {
  return request.download({ url: '/system/user/get-students-import-template' })
}
