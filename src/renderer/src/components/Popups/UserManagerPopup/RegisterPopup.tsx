import { getDictData } from '@renderer/services/AdminService/Dict'
import { getTeachersBySchoolAndKeyword, register } from '@renderer/services/AdminService/login'
import { DictDataType, SubjectTypes } from '@renderer/types'
import { Button, Col, Form, Input, message, Modal, Radio, Row, Select, Typography } from 'antd'
import { debounce } from 'lodash'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface RegisterModalProps {
  visible: boolean
  onCancel: () => void
}

// 教师数据类型定义
interface TeacherDataType {
  id: string
  nickname: string
  school: string
}

const RegisterModal = ({ visible, onCancel }: RegisterModalProps) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const [selectedRole, setSelectedRole] = useState<'3' | '4'>('3') // '4'代表学生，'3'代表教师
  const [schools, setSchools] = useState<DictDataType[]>([])
  const [teachers, setTeachers] = useState<TeacherDataType[]>([]) // 教师列表
  const [fetchingTeachers, setFetchingTeachers] = useState(false) // 是否正在获取教师数据
  const [customSchoolInput, setCustomSchoolInput] = useState('') // 自定义学校输入
  const [isAddingSchool, setIsAddingSchool] = useState(false) // 是否正在添加自定义学校

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

  const handleRegister = async () => {
    try {
      setLoading(true)
      const values = await form.validateFields()

      const registerData = {
        username: values.username,
        password: values.password,
        nickname: values.nickname,
        type: values.type,
        school: values.school,
        ...(values.type === '4' // 学生
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

      await register(registerData)

      setRegistrationSuccess(true)
      message.success(t('register.success'))
      form.resetFields()
      setSelectedRole('3')
      handleBackToLogin()
    } catch (error) {
      const msg = (error as Error).message
      if (msg) message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setRegistrationSuccess(false)
    onCancel()
  }

  const handleRoleChange = (e: any) => {
    const type = e.target.value
    setSelectedRole(type)

    if (type === '4') {
      // 学生
      form.setFieldsValue({
        subject: undefined,
        mobile: undefined
      })
    } else {
      // 教师
      form.setFieldsValue({
        classroom: undefined,
        teacherId: undefined
      })
    }
  }

  // 处理学校搜索
  const handleSchoolSearch = (input: string, option: any) => {
    return option?.value?.toLowerCase().indexOf(input.toLowerCase()) >= 0
  }

  // 处理学校选择变化
  const handleSchoolChange = (schoolValue: string) => {
    fetchTeachers('', schoolValue)
  }

  // 添加自定义学校
  const handleAddCustomSchool = () => {
    if (customSchoolInput.trim()) {
      form.setFieldsValue({ school: customSchoolInput.trim() })
      setCustomSchoolInput('')
      setIsAddingSchool(false)
      fetchTeachers('', customSchoolInput.trim())
    }
  }

  // 获取教师数据 - 根据学校ID和搜索关键词
  const fetchTeachers = async (searchText: string = '', schoolValue: string = '') => {
    try {
      setFetchingTeachers(true)
      const res = await getTeachersBySchoolAndKeyword(schoolValue, searchText)

      setTeachers(res)
    } catch (error) {
      console.error('获取教师数据失败:', error)
      message.error('获取教师数据失败')
    } finally {
      setFetchingTeachers(false)
    }
  }

  // 防抖处理教师搜索
  const debouncedFetchTeachers = debounce(fetchTeachers, 500)

  // 处理教师搜索
  const handleTeacherSearch = (value: string) => {
    debouncedFetchTeachers(value)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const res = await getDictData('ds_school')
    setSchools(res)
  }

  return (
    <Modal
      title={t('login.register')}
      open={visible}
      onCancel={onCancel}
      footer={null}
      centered
      destroyOnClose
      width={500}>
      {registrationSuccess ? (
        <div style={{ textAlign: 'center' }}>
          <Typography.Title level={3} style={{ marginBottom: 16 }}>
            {t('register.success')}
          </Typography.Title>
        </div>
      ) : (
        <Form form={form} layout="vertical" initialValues={{ type: '3' }}>
          <Form.Item name="type" rules={[{ required: true }]} label={t('register.role')}>
            <Radio.Group onChange={handleRoleChange} buttonStyle="solid">
              <Radio.Button value="3">教师</Radio.Button>
              <Radio.Button value="4">学生</Radio.Button>
            </Radio.Group>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label={t('login.username.label')}
                rules={[
                  { required: true, message: '用户账号不能为空' },
                  { pattern: /^\d{8,30}$/, message: '用户账号必须为8-30位数字' }
                ]}>
                <Input placeholder={t('register.username.placeholder')} allowClear maxLength={30} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="nickname"
                label={t('register.nickname')}
                rules={[
                  { required: true, message: '用户昵称不能为空' },
                  { max: 30, message: '用户昵称长度不能超过30个字符' }
                ]}>
                <Input placeholder="请输入昵称或姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="password"
                label={t('login.password.label')}
                rules={[
                  { required: true, message: '密码不能为空' },
                  { min: 4, max: 16, message: '密码长度为4-16位' }
                ]}>
                <Input.Password placeholder={t('login.password.placeholder')} maxLength={16} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="school" label={t('register.school')} rules={[{ required: true, message: '请选择学校' }]}>
                <Select
                  showSearch
                  placeholder="请选择或输入学校"
                  optionFilterProp="children"
                  filterOption={handleSchoolSearch}
                  allowClear
                  notFoundContent="未找到匹配的学校"
                  onChange={handleSchoolChange}
                  dropdownRender={(menu) => (
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
                        <div style={{ padding: '8px' }}>
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
            </Col>
          </Row>

          {selectedRole === '4' && (
            <>
              <Form.Item name="teacherId" label="所属教师" rules={[{ required: true, message: '请选择所属教师' }]}>
                <Select
                  showSearch
                  placeholder="请选择所属教师"
                  defaultActiveFirstOption={false}
                  showArrow={false}
                  filterOption={false}
                  onSearch={handleTeacherSearch}
                  notFoundContent={fetchingTeachers ? '搜索中...' : '未找到匹配的教师'}
                  loading={fetchingTeachers}>
                  {teachers.map((teacher) => (
                    <Select.Option key={teacher.id} value={teacher.id}>
                      {teacher.nickname} - {teacher.school}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="grade" label="年级" rules={[{ required: true, message: '请选择年级' }]}>
                    <Select placeholder="请选择年级">
                      {gradeOptions.map((option) => (
                        <Select.Option key={option.value} value={option.value}>
                          {option.label}
                        </Select.Option>
                      ))}
                    </Select>
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
                label={t('register.mobile')}
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: t('register.mobileInvalid') }
                ]}>
                <Input placeholder="请输入您的手机号" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="subject"
                    label={t('register.subject')}
                    rules={[{ required: true, message: '请选择学科' }]}>
                    <Select placeholder="请选择学科">
                      {Object.entries(SubjectTypes).map(([key, value]) => (
                        <Select.Option key={key} value={value}>
                          {value}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="grade" label="任课年级" rules={[{ required: true, message: '请选择任课年级' }]}>
                    <Select placeholder="请选择任课年级">
                      {gradeOptions.map((option) => (
                        <Select.Option key={option.value} value={option.value}>
                          {option.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" onClick={handleRegister} loading={loading} block size="large">
              {t('register.submit')}
            </Button>
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}

export default RegisterModal
