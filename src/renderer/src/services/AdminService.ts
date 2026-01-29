import request from '@renderer/utils/axios'

export const getDictData = async (dictType: string) => {
  return await request.get({ url: `/system/dict-data/list-simple?dictType=${dictType}` })
}

export const submitFeedback = async (data: any) => {
  return await request.post({
    url: `/ds/feedback/create`,
    data,
    headers: {
      'Content-Type': 'multipart/form-data' // 确保设置正确的Content-Type
    }
  })
}

export const getStudentsList = async () => {
  return await request.get({ url: `/system/user/list-students` })
}

export const importStudentsTemplate = () => {
  return request.download({ url: '/system/user/get-students-import-template' })
}

export const exportStudents = (id) => {
  return request.download({ url: '/system/user/export-students', params: { id } })
}

export const getWebDavUser = async () => {
  return await request.get({ url: `/ds/user-webdav/get` })
}

export const getTeachersBySchoolAndKeyword = async (school, keyword) => {
  return await request.get({
    url: `/system/user/getTeachersBySchoolAndKeyword`,
    params: {
      school,
      keyword
    }
  })
}

export const deleteStudents = async (ids: string[]) => {
  return await request.delete({ url: `/system/user/delete-students`, data: ids })
}

export const resetStudentsPassword = async (ids: string[]) => {
  return await request.post({ url: `/system/user/reset-students-password`, data: ids })
}
