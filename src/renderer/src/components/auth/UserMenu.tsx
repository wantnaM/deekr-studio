import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import authService from '@renderer/services/AuthService'
import userDataService from '@renderer/services/UserDataService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { logout } from '@renderer/store/auth'
import { Button, Dropdown } from 'antd'
import type { FC } from 'react'
import { useNavigate } from 'react-router-dom'

const UserMenu: FC = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.auth.user)

  const handleLogout = () => {
    userDataService.clearCurrentUser()
    dispatch(logout())
    authService.logout()
    navigate('/login', { replace: true })
  }

  return (
    <Dropdown
      menu={{
        items: [
          {
            key: 'username',
            label: `用户名: ${user?.username || '未登录'}`
          },
          {
            key: 'divider',
            type: 'divider'
          },
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            danger: true,
            onClick: handleLogout
          }
        ]
      }}
      trigger={['click']}
      placement="bottomRight">
      <Button type="text" icon={<UserOutlined />} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {user?.displayName || user?.username || '用户'}
      </Button>
    </Dropdown>
  )
}

export default UserMenu
