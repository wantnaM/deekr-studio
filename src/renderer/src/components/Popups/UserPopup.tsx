import { ReloadOutlined } from '@ant-design/icons'
import { UserAddOutlined } from '@ant-design/icons'
import { useDefaultModel } from '@renderer/hooks/useAssistant'
import useAvatar from '@renderer/hooks/useAvatar'
import { useProviders } from '@renderer/hooks/useProvider'
import { useSettings } from '@renderer/hooks/useSettings'
import { useWebSearchProviders } from '@renderer/hooks/useWebSearchProviders'
import { getAgents } from '@renderer/services/AdminService/Agent'
import { changePassword, getConfig, login, logout, register } from '@renderer/services/AdminService/Login'
import { useAppDispatch } from '@renderer/store'
import { updateAgents } from '@renderer/store/agents'
import { initialState } from '@renderer/store/llm'
import { setUserName, setUserState } from '@renderer/store/settings'
import { setDefaultProvider } from '@renderer/store/websearch'
import { initialState as initialStateWebSearch } from '@renderer/store/websearch'
import { SubjectTypes } from '@renderer/types'
import { Avatar, Button, Form, Input, List, message, Modal, Select, Space, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { Center, HStack } from '../Layout'
import { TopView } from '../TopView'

interface Props {
  resolve: (data: any) => void
}

interface ConfigItem {
  key: string
  label: string
  success: boolean
  loading: boolean
}

const PopupContainer: React.FC<Props> = ({ resolve }) => {
  const [open, setOpen] = useState(true)
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const dispatch = useAppDispatch()
  const avatar = useAvatar()
  const { userName, user, setUserConfigStatus } = useSettings()
  const { isLoggedIn, username } = user
  const { setDefaultModel, setTopicNamingModel, setTranslateModel } = useDefaultModel()
  const { updateProviders } = useProviders()
  const { updateWebSearchProviders } = useWebSearchProviders()
  const [isRegistering, setIsRegistering] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const [configItems, setConfigItems] = useState<ConfigItem[]>([
    { key: 'model', label: 'user.configModel', success: user.configStatus.model, loading: false },
    { key: 'agent', label: 'user.configAgent', success: user.configStatus.agent, loading: false }
    // { key: 'topic', label: 'user.configTopic', success: user.configStatus.topic, loading: false },
    // { key: 'miniApp', label: 'user.configMiniApp', success: user.configStatus.miniApp, loading: false }
  ])
  // 新增密码修改相关状态
  const [changePasswordVisible, setChangePasswordVisible] = useState(false)
  const [formPassword] = Form.useForm()

  const handleRegister = async () => {
    try {
      const values = await form.validateFields()
      // 调用注册API（需要实现register服务）
      await register({
        username: values.username,
        password: values.password,
        school: values.school,
        subject: values.subject,
        educationLevel: values.educationLevel,
        mobile: values.mobile,
        nickname: values.nickname
      })

      setRegistrationSuccess(true) // 显示注册成功状态
      form.resetFields()
    } catch (error) {
      const msg = (error as Error).message
      if (msg) message.error(msg)
    }
  }

  // 修改密码处理
  const handleChangePassword = async () => {
    try {
      const values = await formPassword.validateFields()

      await changePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword
      })

      message.success(t('user.changePasswordSuccess'))
      setChangePasswordVisible(false)
      formPassword.resetFields()
    } catch (error) {
      const msg = (error as Error).message
      if (msg) message.error(msg)
    }
  }

  // 登录处理
  const handleLogin = async () => {
    try {
      const values = await form.validateFields()
      // 使用feach请求后端登录端口，url是ADMIN_API_URL
      const data = await login(values)

      await dispatch(
        setUserState({
          isLoggedIn: true,
          userId: data.userId,
          username: values.username,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresTime: data.expiresTime,
          configStatus: {
            model: false,
            agent: false,
            topic: false,
            miniApp: false
          }
        })
      )

      await getUserConfig(data.userId)

      // setOpen(false)
      resolve({ success: true })
      message.success(t('login.success')) // 显示登录成功的消息
    } catch (error) {
      const msg = (error as Error).message
      if (msg) message.error(msg)
    }
  }

  const updateConfigItem = (key: string, updates: Partial<ConfigItem>) => {
    setConfigItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...updates } : item)))
    setUserConfigStatus(key, updates.success ?? false)
  }

  const loadModelConfig = async (userId) => {
    try {
      const result = await getConfig(userId)
      if (!result) {
        updateConfigItem('model', { loading: false, success: false })
        return
      }
      const config = JSON.parse(result.info)
      // LLM 配置
      updateProviders(config.llm.providers)
      setDefaultModel(config.llm.defaultModel)
      setTopicNamingModel(config.llm.topicNamingModel)
      setTranslateModel(config.llm.translateModel)

      updateWebSearchProviders(config.webSearch.providers)
      dispatch(setDefaultProvider(config.webSearch.defaultProvider))
      updateConfigItem('model', { loading: false, success: true })
    } catch (error) {
      updateConfigItem('model', { loading: false, success: false })
      const msg = (error as Error).message
      if (msg) message.error(msg)
    }
  }

  const loadAgentsConfig = async (userId: string) => {
    try {
      const list = await getAgents(userId)
      dispatch(updateAgents(list))
      updateConfigItem('agent', { loading: false, success: true })
    } catch (error) {
      updateConfigItem('agent', { loading: false, success: false })
      const msg = (error as Error).message
      if (msg) message.error(msg)
    }
  }

  const getUserConfig = (userId) => {
    // 重置所有配置项为加载状态
    setConfigItems((prev) => prev.map((item) => ({ ...item, loading: true, success: false })))

    loadModelConfig(userId)
    loadAgentsConfig(userId)
  }

  const handleRefreshConfig = async () => {
    if (user.userId) {
      await getUserConfig(user.userId)
    }
  }

  // 登出处理
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    dispatch(
      setUserState({
        isLoggedIn: false,
        userId: '',
        username: '',
        accessToken: null,
        refreshToken: null,
        expiresTime: null
      })
    )
    updateProviders(initialState.providers)
    updateWebSearchProviders(initialStateWebSearch.providers)
    dispatch(updateAgents([]))
    setOpen(false)
    resolve({})
    message.success(t('logout.success')) // 显示登出成功的消息
  }

  // 用户名更新
  const handleUpdateUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setUserName(e.target.value))
  }

  const onClose = () => {
    resolve({})
  }

  return (
    <>
      <Modal
        width="400px"
        title={isLoggedIn ? t('user.profile') : isRegistering ? t('login.register') : t('login.title')}
        open={open}
        footer={
          isLoggedIn ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
              <Button key="logout" danger onClick={handleLogout}>
                {t('user.logout')}
              </Button>
              <Space>
                <Button key="changePassword" onClick={() => setChangePasswordVisible(true)}>
                  {t('user.changePassword')}
                </Button>
                <Button key="confirm" type="primary" onClick={() => setOpen(false)}>
                  {t('common.save')}
                </Button>
              </Space>
            </div>
          ) : isRegistering ? null : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
              <Button type="link" icon={<UserAddOutlined />} onClick={() => setIsRegistering(true)}>
                {t('login.register')}
              </Button>
              <Space>
                <Button key="submit" type="primary" htmlType="submit" onClick={handleLogin}>
                  {t('login.submit')}
                </Button>
              </Space>
            </div>
          )
        }
        onCancel={() => setOpen(false)}
        afterClose={onClose}
        centered>
        {isLoggedIn ? (
          <>
            <HStack alignItems="center" justifyContent="center" mt="10px">
              <div>{t('user.current_username') + ': ' + username}</div>
            </HStack>
            <Center mt="20px">
              <UserAvatar src={avatar} />
            </Center>
            <HStack alignItems="center" gap="10px" p="20px">
              <Input
                placeholder={t('settings.general.user_name.placeholder')}
                value={userName}
                onChange={handleUpdateUsername}
                style={{ flex: 1, textAlign: 'center' }}
                maxLength={30}
              />
            </HStack>

            <div style={{ margin: '0 20px' }}>
              <List
                size="small"
                header={
                  <HStack alignItems="center" justifyContent="space-between">
                    <Typography.Text strong>{t('user.configStatus')}</Typography.Text>
                    <Button
                      icon={<ReloadOutlined />}
                      size="small"
                      loading={configItems.some((item) => item.loading)}
                      onClick={handleRefreshConfig}
                    />
                  </HStack>
                }
                bordered
                dataSource={configItems}
                renderItem={(item) => (
                  <List.Item>
                    <HStack alignItems="center" justifyContent="space-between" width="100%">
                      <Typography.Text>{t(item.label)}</Typography.Text>
                      {item.loading ? (
                        <Typography.Text type="secondary">{t('user.configLoading')}</Typography.Text>
                      ) : (
                        <Typography.Text
                          type={item.success ? 'success' : item.success === false ? 'danger' : undefined}>
                          {item.success === null
                            ? t('user.configNotLoaded')
                            : item.success
                              ? t('user.configSuccess')
                              : t('user.configFailed')}
                        </Typography.Text>
                      )}
                    </HStack>
                  </List.Item>
                )}
              />
            </div>
          </>
        ) : isRegistering ? (
          registrationSuccess ? ( // 注册成功时的显示
            <div style={{ textAlign: 'center' }}>
              <Typography.Title level={3} style={{ marginBottom: 16 }}>
                {t('register.success')}
              </Typography.Title>
              <Button
                type="primary"
                onClick={() => {
                  setIsRegistering(false)
                  setRegistrationSuccess(false)
                }}>
                返回登录
              </Button>
            </div>
          ) : (
            <Form form={form} layout="vertical">
              {/* 注册表单字段 */}
              <Form.Item
                name="username"
                label={t('login.username.label')}
                rules={[
                  {
                    required: true,
                    message: '用户账号不能为空'
                  },
                  {
                    pattern: /^[a-zA-Z0-9]{4,30}$/,
                    message: '用户账号由数字、字母组成'
                  },
                  {
                    min: 4,
                    max: 30,
                    message: '用户账号长度为4-30个字符'
                  }
                ]}>
                <Input placeholder={t('register.username.placeholder')} allowClear maxLength={30} />
              </Form.Item>

              <Form.Item
                name="nickname"
                label={t('register.nickname')}
                rules={[
                  {
                    required: true,
                    message: '用户昵称不能为空'
                  },
                  {
                    max: 30,
                    message: '用户昵称长度不能超过30个字符'
                  }
                ]}>
                <Input placeholder="请输入昵称" />
              </Form.Item>

              <Form.Item
                name="password"
                label={t('login.password.label')}
                rules={[
                  {
                    required: true,
                    message: '密码不能为空'
                  },
                  {
                    min: 4,
                    max: 16,
                    message: '密码长度为4-16位'
                  }
                ]}>
                <Input.Password placeholder="请输入密码" maxLength={16} />
              </Form.Item>

              <Form.Item name="school" label={t('register.school')} rules={[{ required: true }]}>
                <Input placeholder="请填写您的学校" />
              </Form.Item>
              <HStack justifyContent="space-between">
                <Form.Item
                  name="subject"
                  style={{ marginRight: '20px' }}
                  label={t('register.subject')}
                  rules={[{ required: true }]}>
                  <Select placeholder="请选择学科" style={{ width: '160px' }}>
                    {Object.entries(SubjectTypes).map(([key, value]) => (
                      <Select.Option key={key} value={value}>
                        {value}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="educationLevel" label={t('register.educationLevel')} rules={[{ required: true }]}>
                  <Select placeholder="请选择学段" style={{ width: '160px' }}>
                    <Select.Option value="小学">小学</Select.Option>
                    <Select.Option value="初中">初中</Select.Option>
                    <Select.Option value="高中">高中</Select.Option>
                  </Select>
                </Form.Item>
              </HStack>

              <Form.Item
                name="mobile"
                label={t('register.mobile')}
                rules={[{ required: true }, { pattern: /^1[3-9]\d{9}$/, message: t('register.mobileInvalid') }]}>
                <Input placeholder="请输入您的手机号" />
              </Form.Item>

              <HStack justifyContent="space-between">
                <Button type="link" onClick={() => setIsRegistering(false)}>
                  {t('register.hasAccount')}
                </Button>
                <Button type="primary" onClick={handleRegister}>
                  {t('register.submit')}
                </Button>
              </HStack>
            </Form>
          )
        ) : (
          <>
            <Form form={form} layout="vertical">
              <Form.Item
                name="username"
                label={t('login.username.label')}
                rules={[{ required: true, message: t('login.username.required') }]}>
                <Input
                  placeholder={t('login.username.placeholder')}
                  onChange={(e) => {
                    form.setFieldsValue({ username: e.target.value.trim() }) // 去掉用户名末尾空格
                  }}
                />
              </Form.Item>

              <Form.Item
                name="password"
                label={t('login.password.label')}
                rules={[{ required: true, message: t('login.password.required') }]}>
                <Input.Password
                  placeholder={t('login.password.placeholder')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault() // 阻止默认回车行为
                      handleLogin() // 直接触发登录
                    }
                  }}
                />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
      <Modal
        title={t('user.changePassword')}
        open={changePasswordVisible}
        onCancel={() => {
          setChangePasswordVisible(false)
          formPassword.resetFields()
        }}
        footer={[
          <Button key="back" onClick={() => setChangePasswordVisible(false)}>
            {t('common.cancel')}
          </Button>,
          <Button key="submit" type="primary" onClick={handleChangePassword}>
            {t('common.submit')}
          </Button>
        ]}
        centered>
        <Form form={formPassword} layout="vertical">
          <Form.Item
            name="oldPassword"
            label={t('user.oldPassword')}
            rules={[{ required: true, message: t('user.oldPasswordRequired') }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t('user.newPassword')}
            rules={[
              { required: true, message: t('user.newPasswordRequired') },
              { min: 6, message: t('user.passwordMinLength') }
            ]}>
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={t('user.confirmPassword')}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: t('user.confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error(t('user.passwordNotMatch')))
                }
              })
            ]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

const UserAvatar = styled(Avatar)`
  cursor: pointer;
  width: 80px;
  height: 80px;
  transition: opacity 0.3s ease;
  &:hover {
    opacity: 0.8;
  }
`

export default class UserPopup {
  static topviewId = 0
  static hide() {
    TopView.hide('UserPopup')
  }
  static show() {
    return new Promise<any>((resolve) => {
      TopView.show(
        <PopupContainer
          resolve={(v) => {
            resolve(v)
            this.hide()
          }}
        />,
        'UserPopup'
      )
    })
  }
}
