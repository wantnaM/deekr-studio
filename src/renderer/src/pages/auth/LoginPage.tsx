import { LockOutlined, UserOutlined } from '@ant-design/icons'
import type { LoginCredentials } from '@renderer/services/AuthService'
import authService from '@renderer/services/AuthService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { loginFailure, loginStart, loginSuccess, setAutoLogin, setRememberMe } from '@renderer/store/auth'
import { Button, Checkbox, Form, Input } from 'antd'
import type { FC } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const LoginPage: FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { isLoading, error } = useAppSelector((state) => state.auth)
  const [form] = Form.useForm()
  const [username, setUsername] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [rememberMe, setRememberMeState] = useState<boolean>(false)
  const [autoLogin, setAutoLoginState] = useState<boolean>(false)
  const [isFocused, setIsFocused] = useState<string | null>(null)

  useEffect(() => {
    const rememberedUsername = authService.getRememberedUsername()
    if (rememberedUsername) {
      setUsername(rememberedUsername)
      setRememberMeState(true)
    }
  }, [])

  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (authService.isAutoLoginEnabled()) {
        const result = await authService.autoLogin()
        if (result) {
          dispatch(loginSuccess(result))
          dispatch(setAutoLogin(true))
          dispatch(setRememberMe(true))
          navigate('/', { replace: true })
        }
      }
    }
    attemptAutoLogin()
  }, [dispatch, navigate])

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      dispatch(loginFailure('请输入用户名和密码'))
      return
    }

    dispatch(loginStart())
    dispatch(setRememberMe(rememberMe))
    dispatch(setAutoLogin(autoLogin))

    try {
      const credentials: LoginCredentials = {
        username: username.trim(),
        password: password.trim(),
        rememberMe,
        autoLogin
      }

      const result = await authService.login(credentials)
      dispatch(loginSuccess(result))

      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username.trim())
      } else {
        localStorage.removeItem('rememberedUsername')
      }

      if (autoLogin) {
        localStorage.setItem('autoLoginEnabled', 'true')
      } else {
        localStorage.removeItem('autoLoginEnabled')
      }

      navigate('/', { replace: true })
    } catch (err) {
      dispatch(loginFailure(err instanceof Error ? err.message : '登录失败，请检查用户名和密码'))
    }
  }

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      dispatch(loginFailure('请输入用户名和密码'))
      return
    }

    dispatch(loginStart())

    try {
      const result = await authService.register(username.trim(), password.trim())
      dispatch(loginSuccess(result))
      navigate('/', { replace: true })
    } catch (err) {
      dispatch(loginFailure(err instanceof Error ? err.message : '注册失败，请重试'))
    }
  }

  return (
    <Container>
      <LoginCard>
        <Form form={form} layout="vertical" size="large">
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <StyledInput
              prefix={<UserOutlined />}
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onPressEnter={() => {}}
              isFocused={isFocused === 'username'}
              onFocus={() => setIsFocused('username')}
              onBlur={() => setIsFocused(null)}
            />
          </Form.Item>

          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <StyledInput
              prefix={<LockOutlined />}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={handleLogin}
              isFocused={isFocused === 'password'}
              onFocus={() => setIsFocused('password')}
              onBlur={() => setIsFocused(null)}
            />
          </Form.Item>

          <Form.Item>
            <OptionsContainer>
              <StyledCheckbox
                checked={rememberMe}
                onChange={(e) => setRememberMeState(e.target.checked)}
              >
                记住用户名
              </StyledCheckbox>
              <StyledCheckbox
                checked={autoLogin}
                onChange={(e) => setAutoLoginState(e.target.checked)}
              >
                自动登录
              </StyledCheckbox>
            </OptionsContainer>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <ButtonContainer>
              <StyledButton
                type="primary"
                block
                size="large"
                loading={isLoading}
                onClick={handleLogin}
                variant="primary"
              >
                {isLoading ? '登录中...' : '登录'}
              </StyledButton>
            </ButtonContainer>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <StyledButton
              block
              size="large"
              onClick={handleRegister}
              variant="secondary"
            >
              注册新账号
            </StyledButton>
          </Form.Item>
        </Form>
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
  background-image: url('https://sfile.chatglm.cn/testpath/d1100df1bab84130ab20c91a405b29f2_0.jpg?image_process=format,webp');
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
    background: rgba(0, 0, 0, 0.1);
  }
`

const LoginCard = styled.div`
  width: 100%;
  max-width: 420px;
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
`

const StyledInput = styled(Input)<{ isFocused?: boolean }>`
  border-radius: 8px;
  border: 1px solid ${props => props.isFocused ? '#667eea' : '#e1e1e1'};
  box-shadow: ${props => props.isFocused ? '0 0 0 3px rgba(102, 126, 234, 0.1)' : 'none'};
  transition: all 0.3s ease;
  height: 44px;
  background-color: rgba(255, 255, 255, 0.8);

  &:hover {
    border-color: #667eea;
  }

  .ant-input {
    background-color: transparent;
  }
`

const StyledCheckbox = styled(Checkbox)`
  .ant-checkbox-checked .ant-checkbox-inner {
    background-color: #667eea;
    border-color: #667eea;
  }

  .ant-checkbox-wrapper:hover .ant-checkbox-inner,
  .ant-checkbox:hover .ant-checkbox-inner {
    border-color: #667eea;
  }
`

const OptionsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 8px;
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

  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
      background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
    }

    &:active {
      transform: translateY(0);
    }
  ` : `
    background: transparent;
    border: 1px solid #667eea;
    color: #667eea;

    &:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #5a6fd6;
      border-color: #5a6fd6;
    }
  `}

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`

export default LoginPage
