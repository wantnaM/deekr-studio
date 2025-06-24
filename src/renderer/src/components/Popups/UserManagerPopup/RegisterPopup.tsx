import { register } from '@renderer/services/AdminService/login'
import { SubjectTypes } from '@renderer/types'
import { Button, Col, Form, Input, message, Modal, Radio, Row, Select, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface RegisterModalProps {
  visible: boolean
  onCancel: () => void
}

const RegisterModal = ({ visible, onCancel }: RegisterModalProps) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const [selectedRole, setSelectedRole] = useState<'3' | '4'>('3') // '4'代表学生，'3'代表教师

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
              teacherMobile: values.teacherMobile
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
        teacherMobile: undefined
      })
    }
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
                  { pattern: /^[a-zA-Z0-9]{4,30}$/, message: '用户账号由数字、字母组成' },
                  { min: 4, max: 30, message: '用户账号长度为4-30个字符' }
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
                <Input placeholder="请输入昵称" />
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
              <Form.Item name="school" label={t('register.school')} rules={[{ required: true, message: '请填写学校' }]}>
                <Input placeholder="请填写您的学校" />
              </Form.Item>
            </Col>
          </Row>

          {selectedRole === '4' && (
            <>
              <Form.Item
                name="teacherMobile"
                label="教师手机号"
                rules={[
                  { required: true, message: '请输入教师手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                ]}>
                <Input placeholder="请输入教师的手机号" />
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
