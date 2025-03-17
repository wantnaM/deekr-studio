import { useDefaultModel } from '@renderer/hooks/useAssistant'
import useAvatar from '@renderer/hooks/useAvatar'
import { useProviders } from '@renderer/hooks/useProvider'
import { useSettings } from '@renderer/hooks/useSettings'
import { changePassword, getApiKey, login, logout } from '@renderer/services/AdminService'
import { useAppDispatch } from '@renderer/store'
import { initialState } from '@renderer/store/llm'
import { setUserName, setUserState } from '@renderer/store/settings'
import { Avatar, Button, Form, Input, message, Modal, Space } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { Center, HStack } from '../Layout'
import { TopView } from '../TopView'

interface Props {
  resolve: (data: any) => void
}

const PopupContainer: React.FC<Props> = ({ resolve }) => {
  // 使用 useState 钩子来管理模态框的显示状态，初始值为 true
  const [open, setOpen] = useState(true)
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const dispatch = useAppDispatch()
  const avatar = useAvatar()
  const { userName, user } = useSettings()
  const { isLoggedIn, username } = user
  const { setDefaultModel, setTopicNamingModel, setTranslateModel } = useDefaultModel()
  const { updateProviders } = useProviders()

  // 新增密码修改相关状态
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
      // 使用feach请求后端登录端口，url是ADMIN_API_URL
      const data = await login(values)
      dispatch(
        setUserState({
          isLoggedIn: true,
          userId: data.userId,
          username: values.username,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresTime: data.expiresTime
        })
      )
      const apiKey = await getApiKey(data.userId, data.accessToken)
      updateProviders(apiKey.providers)
      setDefaultModel(apiKey.defaultModel)
      setTopicNamingModel(apiKey.topicNamingModel)
      setTranslateModel(apiKey.translateModel)

      setOpen(false)
      resolve({ success: true })
      message.success(t('login.success')) // 显示登录成功的消息
    } catch (error) {
      const msg = (error as Error).message
      if (msg) message.error(msg)
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
    // updateProviders([])
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
                <Button key="confirm" type="primary" onClick={() => setOpen(false)}>
                  {t('common.save')}
                </Button>
              </Space>
            </div>
          ) : (
            [
              <Button key="submit" type="primary" htmlType="submit" onClick={handleLogin}>
                {t('login.submit')}
              </Button>
            ]
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
          </>
        ) : (
          <>
            <Form form={form} layout="vertical">
              <Form.Item
                name="username"
                label={t('login.username.label')}
                rules={[{ required: true, message: t('login.username.required') }]}>
                <Input placeholder={t('login.username.placeholder')} />
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

            {/* <HStack justifyContent="space-between" style={{ marginTop: -10 }}>
              <a>{t('login.forgot_password')}</a>
              <a>{t('login.register')}</a>
            </HStack> */}
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
