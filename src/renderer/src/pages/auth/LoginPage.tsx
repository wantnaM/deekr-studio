import { LockOutlined, UserOutlined } from '@ant-design/icons'
import logo from '@renderer/assets/images/logo.png'
import { WindowRestoreIcon } from '@renderer/components/WindowControls'
import { ControlButton, WindowControlsContainer } from '@renderer/components/WindowControls/WindowControls.styled'
import { isLinux, isWin } from '@renderer/config/constant'
import type { LoginCredentials } from '@renderer/services/AuthService'
import authService from '@renderer/services/AuthService'
import { startAutoSync } from '@renderer/services/BackupService'
import userDataService from '@renderer/services/UserDataService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { loginFailure, loginStart, loginSuccess, setAuthError, updateUser } from '@renderer/store/auth'
import { Alert, Button, Form, Input } from 'antd'
import { Minus, Square, X } from 'lucide-react'
import type { FC } from 'react'
import { useEffect, useState } from 'react'

import RegisterForm from './RegisterForm'

const LoginPage: FC = () => {
  const dispatch = useAppDispatch()
  const { isLoading, error } = useAppSelector((state) => state.auth)
  const [form] = Form.useForm()
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    void window.api.windowControls.isMaximized().then(setIsMaximized)
    const unsubscribe = window.api.windowControls.onMaximizedChange(setIsMaximized)
    return unsubscribe
  }, [])

  useEffect(() => {
    dispatch(setAuthError(null))
  }, [dispatch])

  const handleLogin = async (values: { username: string; password: string }) => {
    dispatch(loginStart())
    try {
      const credentials: LoginCredentials = {
        username: values.username.trim(),
        password: values.password.trim()
      }
      const loginResult = await authService.login(credentials)
      await dispatch(
        loginSuccess({
          user: {
            id: loginResult.userId,
            type: loginResult.type,
            username: values.username.trim(),
            nickname: null,
            mobile: null,
            school: null,
            subject: null,
            grade: null,
            classroom: null
          },
          accessToken: loginResult.accessToken,
          refreshToken: loginResult.refreshToken,
          expiresTime: loginResult.expiresTime
        })
      )
      const userProfile = await authService.getUserProfile()
      await dispatch(updateUser(userProfile))
      await userDataService.getDataConfigWithApi(loginResult.userId)
      startAutoSync(true, 'webdav')
    } catch (err) {
      dispatch(loginFailure(err instanceof Error ? err.message : '登录失败，请检查用户名和密码'))
    }
  }

  const handleMinimize = () => void window.api.windowControls.minimize()
  const handleMaximize = () =>
    void (isMaximized ? window.api.windowControls.unmaximize() : window.api.windowControls.maximize())
  const handleQuit = () => void window.api.quit()

  return (
    <div className="flex h-screen w-screen flex-col">
      <div className="drag flex w-full shrink-0 items-center justify-end" style={{ height: 'var(--navbar-height)' }}>
        {(isWin || isLinux) && (
          <WindowControlsContainer>
            <ControlButton onClick={handleMinimize}>
              <Minus size={14} />
            </ControlButton>
            <ControlButton onClick={handleMaximize}>
              {isMaximized ? <WindowRestoreIcon size={14} /> : <Square size={14} />}
            </ControlButton>
            <ControlButton $isClose onClick={handleQuit}>
              <X size={17} />
            </ControlButton>
          </WindowControlsContainer>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'hidden', padding: '0 8px 8px' }}>
        <div
          style={{
            height: '100%',
            overflowY: 'auto',
            borderRadius: 12,
            background: 'var(--color-background)'
          }}>
          <div
            style={{
              minHeight: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px'
            }}>
            <div
              style={{ width: '100%', maxWidth: isRegisterMode ? 576 : 448 }}
              className="flex flex-col items-center gap-6">
              <img src={logo} alt="Deekr Studio" className="h-16 w-16 rounded-xl" />

              <div className="flex flex-col items-center gap-1">
                <h1 className="m-0 text-2xl font-semibold text-(--color-text)">欢迎使用 Deekr Studio</h1>
                <p className="m-0 text-sm text-(--color-text-2)">
                  {isRegisterMode ? '创建您的账号' : '请登录以继续使用'}
                </p>
              </div>

              <div style={{ width: '100%' }}>
                {isRegisterMode ? (
                  <RegisterForm onCancel={() => setIsRegisterMode(false)} />
                ) : (
                  <>
                    {error && <Alert message={error} type="error" showIcon className="mb-4 rounded-lg" />}
                    <Form form={form} layout="vertical" size="large" onFinish={handleLogin}>
                      <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input prefix={<UserOutlined />} placeholder="请输入用户名" className="rounded-lg" />
                      </Form.Item>
                      <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="请输入密码"
                          className="rounded-lg"
                          onPressEnter={() => form.submit()}
                        />
                      </Form.Item>
                      <Form.Item style={{ marginBottom: 12 }}>
                        <Button
                          type="primary"
                          htmlType="submit"
                          block
                          size="large"
                          loading={isLoading}
                          className="h-11 rounded-lg! font-semibold">
                          {isLoading ? '登录中...' : '登录'}
                        </Button>
                      </Form.Item>
                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button
                          block
                          size="large"
                          onClick={() => setIsRegisterMode(true)}
                          className="h-11 rounded-lg! font-semibold">
                          注册新账号
                        </Button>
                      </Form.Item>
                    </Form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
