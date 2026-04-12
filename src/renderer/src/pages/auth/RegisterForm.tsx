import { getDictData, getTeachersBySchoolAndKeyword } from '@renderer/services/AdminService'
import type { RegisterCredentials } from '@renderer/services/AuthService'
import authService from '@renderer/services/AuthService'
import type { DictDataType } from '@renderer/types'
import { Button, Col, Form, Input, message, Radio, Row, Select } from 'antd'
import { debounce } from 'lodash'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'

const RegisterForm: FC<{ onCancel: () => void }> = ({ onCancel }) => {
  const [form] = Form.useForm()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<'3' | '4'>('3')
  const [step1Values, setStep1Values] = useState<Record<string, any>>({})
  const [schools, setSchools] = useState<DictDataType[]>([])
  const [teachers, setTeachers] = useState<any[]>([])
  const [fetchingTeachers, setFetchingTeachers] = useState(false)
  const [customSchoolInput, setCustomSchoolInput] = useState('')
  const [isAddingSchool, setIsAddingSchool] = useState(false)

  const gradeOptions = [
    { value: '一年级', label: '一年级' },
    { value: '二年级', label: '二年级' },
    { value: '三年级', label: '三年级' },
    { value: '四年级', label: '四年级' },
    { value: '五年级', label: '五年级' },
    { value: '六年级', label: '六年级' },
    { value: '初一', label: '初一' },
    { value: '初二', label: '初二' },
    { value: '初三', label: '初三' },
    { value: '高一', label: '高一' },
    { value: '高二', label: '高二' },
    { value: '高三', label: '高三' }
  ]

  const subjectOptions = [
    { label: '语文', value: '语文' },
    { label: '数学', value: '数学' },
    { label: '英语', value: '英语' },
    { label: '物理', value: '物理' },
    { label: '化学', value: '化学' },
    { label: '历史', value: '历史' },
    { label: '生物', value: '生物' },
    { label: '地理', value: '地理' },
    { label: '信息科技', value: '信息科技' },
    { label: '通用技术', value: '通用技术' },
    { label: '音乐', value: '音乐' },
    { label: '美术', value: '美术' },
    { label: '体育', value: '体育' },
    { label: '科学', value: '科学' },
    { label: '劳动', value: '劳动' },
    { label: '综合实践', value: '综合实践' },
    { label: 'STEM', value: 'STEM' }
  ]

  const handleNext = async () => {
    try {
      const values = await form.validateFields(['type', 'username', 'nickname', 'password'])
      setStep1Values(values)
      setStep(2)
    } catch {
      // validation errors shown by antd
    }
  }

  const handleRegister = async () => {
    try {
      const step2 = await form.validateFields()
      const values = { ...step1Values, ...step2 }
      const registerData: RegisterCredentials = {
        username: values.username,
        password: values.password,
        nickname: values.nickname,
        type: parseInt(values.type),
        school: values.school,
        ...(values.type === '4'
          ? {
              grade: values.grade,
              classroom: values.classroom,
              teacherId: values.teacherId
            }
          : {
              subject: values.subject,
              mobile: values.mobile,
              grade: values.grade
            })
      }
      await authService.register(registerData)
      message.success('注册成功')
      form.resetFields()
      setStep(1)
      setStep1Values({})
      onCancel()
    } catch {
      // validation errors or API errors
    }
  }

  const handleRoleChange = (e: any) => {
    const type = e.target.value
    setSelectedRole(type)
    if (type === '4') {
      form.setFieldsValue({ subject: undefined, mobile: undefined })
    } else {
      form.setFieldsValue({ classroom: undefined, teacherId: undefined })
    }
  }

  const handleSchoolSearch = (input: string, option: any) => {
    return option?.value?.toLowerCase().indexOf(input.toLowerCase()) >= 0
  }

  const handleSchoolChange = (schoolValue: string) => {
    fetchTeachers('', schoolValue)
  }

  const handleAddCustomSchool = () => {
    if (customSchoolInput.trim()) {
      form.setFieldsValue({ school: customSchoolInput.trim() })
      setCustomSchoolInput('')
      setIsAddingSchool(false)
      fetchTeachers('', customSchoolInput.trim())
    }
  }

  const fetchTeachers = async (searchText: string = '', schoolValue: string = '') => {
    try {
      setFetchingTeachers(true)
      const res = await getTeachersBySchoolAndKeyword(schoolValue, searchText)
      setTeachers(res)
    } finally {
      setFetchingTeachers(false)
    }
  }

  const debouncedFetchTeachers = useMemo(() => debounce(fetchTeachers, 500), [])

  const handleTeacherSearch = (value: string) => {
    debouncedFetchTeachers(value, form.getFieldValue('school'))
  }

  useEffect(() => {
    const fetchData = async () => {
      const res = await getDictData('ds_school')
      setSchools(res)
    }
    fetchData()
  }, [])

  const handleBack = () => {
    if (step === 2) {
      setStep(1)
    } else {
      onCancel()
    }
  }

  return (
    <Form form={form} layout="vertical" initialValues={{ type: '3' }}>
      {step === 1 && (
        <>
          <Form.Item name="type" rules={[{ required: true }]} label="角色">
            <Radio.Group onChange={handleRoleChange} buttonStyle="solid">
              <Radio.Button value="3">教师</Radio.Button>
              <Radio.Button value="4">学生</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户账号"
                rules={[
                  { required: true, message: '用户账号不能为空' },
                  { pattern: /^\d{8,30}$/, message: '用户账号必须为8-30位数字' }
                ]}>
                <Input placeholder="纯数字，推荐使用手机号" allowClear maxLength={30} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nickname"
                label="用户昵称"
                rules={[
                  { required: true, message: '用户昵称不能为空' },
                  { max: 30, message: '用户昵称长度不能超过30个字符' }
                ]}>
                <Input placeholder="请输入昵称或姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '密码不能为空' },
              { min: 4, max: 16, message: '密码长度为4-16位' }
            ]}>
            <Input.Password placeholder="请输入密码" maxLength={16} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 12 }}>
            <Button type="primary" block size="large" onClick={handleNext} className="h-11 rounded-lg! font-semibold">
              下一步
            </Button>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button block size="large" onClick={onCancel} className="h-11 rounded-lg! font-semibold">
              返回登录
            </Button>
          </Form.Item>
        </>
      )}

      {step === 2 && (
        <>
          <Form.Item name="school" label="学校" rules={[{ required: true, message: '请选择学校' }]}>
            <Select
              showSearch
              placeholder="请选择或输入学校"
              optionFilterProp="children"
              filterOption={handleSchoolSearch}
              allowClear
              notFoundContent="未找到匹配的学校"
              onChange={handleSchoolChange}
              popupRender={(menu) => (
                <div>
                  {menu}
                  {!isAddingSchool ? (
                    <Button
                      type="link"
                      onClick={() => setIsAddingSchool(true)}
                      style={{ width: '100%', textAlign: 'center' }}>
                      添加新学校
                    </Button>
                  ) : (
                    <div style={{ padding: 8 }}>
                      <Input
                        placeholder="请输入学校名称"
                        value={customSchoolInput}
                        onChange={(e) => setCustomSchoolInput(e.target.value)}
                        onPressEnter={handleAddCustomSchool}
                        style={{ marginBottom: 8 }}
                      />
                      <Button type="primary" onClick={handleAddCustomSchool} size="small">
                        添加
                      </Button>
                      <Button onClick={() => setIsAddingSchool(false)} size="small" style={{ marginLeft: 8 }}>
                        取消
                      </Button>
                    </div>
                  )}
                </div>
              )}>
              {schools.map((school, index) => (
                <Select.Option key={index} value={school.value}>
                  {school.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {selectedRole === '4' && (
            <>
              <Form.Item name="teacherId" label="所属教师" rules={[{ required: true, message: '请选择所属教师' }]}>
                <Select
                  showSearch
                  placeholder="请选择学校所属教师"
                  defaultActiveFirstOption={false}
                  allowClear
                  filterOption={false}
                  onSearch={handleTeacherSearch}
                  notFoundContent={fetchingTeachers ? '搜索中...' : '未找到根据学校匹配的教师'}
                  loading={fetchingTeachers}>
                  {teachers.map((teacher) => (
                    <Select.Option key={teacher.id} value={teacher.id}>
                      {teacher.nickname} - {teacher.username}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请选择年级' }]}>
                    <Select placeholder="请选择年级" options={gradeOptions} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="classroom" label="班级" rules={[{ required: true, message: '请输入班级' }]}>
                    <Input placeholder="例如：三年二班" />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          {selectedRole === '3' && (
            <>
              <Form.Item
                name="mobile"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}>
                <Input placeholder="请输入您的手机号" />
              </Form.Item>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="subject" label="学科" rules={[{ required: true, message: '请选择学科' }]}>
                    <Select placeholder="请选择学科" options={subjectOptions} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="grade" label="任课年级" rules={[{ required: true, message: '请选择任课年级' }]}>
                    <Select placeholder="请选择任课年级" options={gradeOptions} />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Form.Item style={{ marginBottom: 12 }}>
            <Button
              type="primary"
              block
              size="large"
              onClick={handleRegister}
              className="h-11 rounded-lg! font-semibold">
              注册
            </Button>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button block size="large" onClick={handleBack} className="h-11 rounded-lg! font-semibold">
              上一步
            </Button>
          </Form.Item>
        </>
      )}
    </Form>
  )
}

export default RegisterForm
