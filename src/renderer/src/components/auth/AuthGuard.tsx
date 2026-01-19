import { useAppSelector } from '@renderer/store'
import { useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import styled, { keyframes } from 'styled-components'

const AuthGuard: React.FC = () => {
  const navigate = useNavigate()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  const isLoading = useAppSelector((state) => state.auth.isLoading)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate])

  if (isLoading) {
    return (
      <LoadingContainer>
        <Spinner />
        <LoadingText>正在验证登录状态...</LoadingText>
      </LoadingContainer>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <Outlet />
}

export default AuthGuard

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: var(--color-background);
`

const Spinner = styled.div`
  width: 48px;
  height: 48px;
  border: 4px solid var(--color-border);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`

const LoadingText = styled.p`
  margin-top: 20px;
  font-size: 16px;
  color: var(--color-text);
`
