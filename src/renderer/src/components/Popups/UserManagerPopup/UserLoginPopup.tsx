import { ReloadOutlined } from '@ant-design/icons'
import { UserAddOutlined } from '@ant-design/icons'
import { useDefaultModel } from '@renderer/hooks/useAssistant'
import { useProviders } from '@renderer/hooks/useProvider'
import { useUser } from '@renderer/hooks/useUser'
import { getAgents } from '@renderer/services/AdminService/Agent'
import { changePassword, getConfig, getUserInfo, login, logout } from '@renderer/services/AdminService/login'
import { getWebDavUser } from '@renderer/services/AdminService/WebDAV'
import { startAutoSync, stopAutoSync } from '@renderer/services/BackupService'
import { useAppDispatch } from '@renderer/store'
import { updateAgents } from '@renderer/store/agents'
import { initialState } from '@renderer/store/llm'
import {
  setWebdavAutoSync,
  setWebdavHost as _setWebdavHost,
  setWebdavMaxBackups as _setWebdavMaxBackups,
  setWebdavPass as _setWebdavPass,
  setWebdavPath as _setWebdavPath,
  setWebdavSyncInterval as _setWebdavSyncInterval,
  setWebdavUser as _setWebdavUser
} from '@renderer/store/settings'
import { setDefaultProvider } from '@renderer/store/websearch'
import { Button, Descriptions, Form, Input, List, message, Modal, Space, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { HStack } from '../../Layout'
import { TopView } from '../../TopView'
import RegisterPopup from './RegisterPopup'

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
  const {
    isLoggedIn,
    username,
    configStatus,
    userId,
    setUserConfigStatus,
    setUserState,
    setLoginInfo,
    setUserInfo,
    type,
    nickname,
    school,
    subject,
    grade,
    classroom
  } = useUser()
  const { setDefaultModel, setTopicNamingModel, setTranslateModel } = useDefaultModel()
  const { updateProvider, updateProviders } = useProviders()
  const [registerModalVisible, setRegisterModalVisible] = useState(false)

  const [configItems, setConfigItems] = useState<ConfigItem[]>([
    { key: 'model', label: 'user.configModel', success: configStatus.model, loading: false },
    { key: 'agent', label: 'user.configAgent', success: configStatus.agent, loading: false }
  ])

  const [changePasswordVisible, setChangePasswordVisible] = useState(false)
  const [formPassword] = Form.useForm()

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
      const data = await login(values)

      await setLoginInfo({
        userId: data.userId,
        username: values.username,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresTime: data.expiresTime,
        type: data.type
      })

      await getUserConfig(data.userId)
      const userInfo = await getUserInfo()

      setUserInfo(userInfo)

      resolve({ success: true })
      message.success(t('login.success'))
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
      for (let index = 0; index < config.llm.providers.length; index++) {
        const p = config.llm.providers[index]
        updateProvider(p)
      }
      setDefaultModel(config.llm.defaultModel)
      setTopicNamingModel(config.llm.topicNamingModel)
      setTranslateModel(config.llm.translateModel)

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

  const loadWebDAV = async () => {
    try {
      const info = await getWebDavUser()
      if (info) {
        dispatch(_setWebdavHost(info.webDAVHost))
        dispatch(_setWebdavMaxBackups(1))
        dispatch(_setWebdavPass(info.password))
        dispatch(_setWebdavPath(info.webDAVPath))
        dispatch(_setWebdavUser(info.username))
        dispatch(_setWebdavSyncInterval(5))
        dispatch(setWebdavAutoSync(true))
        startAutoSync()
      }
    } catch (error) {
      const msg = (error as Error).message
      console.log(msg)
    }
  }

  const getUserConfig = (userId) => {
    // 重置所有配置项为加载状态
    setConfigItems((prev) => prev.map((item) => ({ ...item, loading: true, success: false })))

    loadModelConfig(userId)
    loadAgentsConfig(userId)
    loadWebDAV()
  }

  const handleRefreshConfig = async () => {
    if (userId) {
      await getUserConfig(userId)
    }
  }

  // 登出处理
  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
    setUserState({
      isLoggedIn: false,
      userId: '',
      username: '',
      nickname: '',
      mobile: '',
      school: '',
      subject: '',
      grade: '',
      classroom: '',
      accessToken: null,
      refreshToken: null,
      expiresTime: null,
      configStatus: {
        model: false,
        agent: false,
        topic: false,
        miniApp: false
      },
      type: null
    })
    updateProviders(initialState.providers)
    dispatch(updateAgents([]))
    // 清空webdav
    dispatch(_setWebdavHost(''))
    dispatch(_setWebdavPass(''))
    dispatch(_setWebdavPath(''))
    dispatch(_setWebdavUser(''))
    dispatch(_setWebdavSyncInterval(0))
    dispatch(setWebdavAutoSync(false))
    stopAutoSync()

    setOpen(false)
    resolve({})
    message.success(t('logout.success'))
  }

  const onClose = () => {
    resolve({})
  }

  return (
    <>
      <Modal
        width="400px"
        title={isLoggedIn ? t('user.profile') : t('login.title')}
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
              </Space>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
              <Button type="link" icon={<UserAddOutlined />} onClick={() => setRegisterModalVisible(true)}>
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

            <div style={{ margin: '20px 0' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label={t('user.nickname')}>{nickname || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('user.school')}>{school || '-'}</Descriptions.Item>
                {type === 3 && (
                  <>
                    <Descriptions.Item label={t('user.subject')}>{subject || '-'}</Descriptions.Item>
                    <Descriptions.Item label={t('user.grade2')}>{grade || '-'}</Descriptions.Item>
                  </>
                )}
                {type === 4 && (
                  <>
                    <Descriptions.Item label={t('user.grade')}>{grade || '-'}</Descriptions.Item>
                    <Descriptions.Item label={t('user.classroom')}>{classroom || '-'}</Descriptions.Item>
                  </>
                )}
              </Descriptions>
            </div>

            <div style={{ margin: '20px 0' }}>
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
        ) : (
          <Form form={form} layout="vertical">
            <Form.Item
              name="username"
              label={t('login.username.label')}
              rules={[{ required: true, message: t('login.username.required') }]}>
              <Input
                placeholder={t('login.username.placeholder')}
                onChange={(e) => {
                  form.setFieldsValue({ username: e.target.value.trim() })
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
                    e.preventDefault()
                    handleLogin()
                  }
                }}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <RegisterPopup visible={registerModalVisible} onCancel={() => setRegisterModalVisible(false)} />

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
            {t('common.save')}
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
