import { LockOutlined, UserOutlined } from '@ant-design/icons'
import logoBackground from '@renderer/assets/images/logo-background.jpg'
import { useDefaultModel } from '@renderer/hooks/useAssistant'
import { useProviders } from '@renderer/hooks/useProvider'
import type { LoginCredentials } from '@renderer/services/AuthService'
import authService from '@renderer/services/AuthService'
import userDataService from '@renderer/services/UserDataService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { loginFailure, loginStart, loginSuccess, updateUser } from '@renderer/store/auth'
import { Button, Form, Input } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import RegisterForm from './RegisterForm'

const LoginPage: FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { updateProvider } = useProviders()
  const { setDefaultModel, setQuickModel, setTranslateModel } = useDefaultModel()
  const { isLoading } = useAppSelector((state) => state.auth)
  const [form] = Form.useForm()

  // 注册
  const [isRegisterMode, setIsRegisterMode] = useState(false)

  const handleLogin = async (values: { username: string; password: string }) => {
    dispatch(loginStart())

    try {
      const credentials: LoginCredentials = {
        username: values.username.trim(),
        password: values.password.trim()
      }

      const loginResult = await authService.login(credentials)

      dispatch(
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

      dispatch(updateUser(userProfile))

      await userDataService.getDataConfigWithApi(loginResult.userId)

      await loadUserDataConfig()

      navigate('/', { replace: true })
    } catch (err) {
      dispatch(loginFailure(err instanceof Error ? err.message : '登录失败，请检查用户名和密码'))
    }
  }

  const loadUserDataConfig = async () => {
    const userDataConfig = userDataService.getCurrentUser()
    if (!userDataConfig) {
      return
    }

    // LLM 配置
    for (let index = 0; index < userDataConfig.providers.length; index++) {
      const p = userDataConfig.providers[index]
      updateProvider(p)
    }

    setDefaultModel(userDataConfig.defaultModel)
    setQuickModel(userDataConfig.quickModel)
    setTranslateModel(userDataConfig.translateModel)
  }

  return (
    <Container>
      <LoginCard>
        {!isRegisterMode ? (
          <Form form={form} layout="vertical" size="large" onFinish={handleLogin}>
            <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" onPressEnter={() => form.submit()} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 20 }}>
              <ButtonContainer>
                <StyledButton type="primary" htmlType="submit" block size="large" loading={isLoading} variant="primary">
                  {isLoading ? '登录中...' : '登录'}
                </StyledButton>
              </ButtonContainer>
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <StyledButton block size="large" onClick={() => setIsRegisterMode(true)} variant="secondary">
                注册新账号
              </StyledButton>
            </Form.Item>
          </Form>
        ) : (
          <RegisterForm onCancel={() => setIsRegisterMode(false)} />
        )}
      </LoginCard>
    </Container>
  )
}

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-image: url(${logoBackground});
  background-size: cover;
  background-position: center;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
  }

  @media (prefers-color-scheme: dark) {
    &::before {
      background: rgba(0, 0, 0, 0.6);
    }
  }
`

const LoginCard = styled.div`
  width: 100%;
  max-width: 500px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 40px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 1;

  @media (max-width: 480px) {
    padding: 32px 24px;
    border-radius: 12px;
  }

  @media (prefers-color-scheme: dark) {
    background: rgba(30, 30, 30, 0.9);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  }
`

const ButtonContainer = styled.div`
  width: 100%;
`

const StyledButton = styled(Button)<{ variant?: 'primary' | 'secondary' }>`
  height: 44px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.3s ease;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`

export default LoginPage
