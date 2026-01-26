import { CloudOutlined, EditOutlined, KeyOutlined, LogoutOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/context/ThemeProvider'
import {
  SettingContainer,
  SettingDivider,
  SettingGroup,
  SettingRow,
  SettingRowTitle,
  SettingTitle
} from '@renderer/pages/settings'
import authService from '@renderer/services/AuthService'
import userDataService from '@renderer/services/UserDataService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { logout, updateUser } from '@renderer/store/auth'
import { Button, Form, Input, message, Modal, Space, Typography } from 'antd'
import dayjs from 'dayjs'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const { Text } = Typography

const UserInfoPage: FC = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const { webdavSync } = useAppSelector((state) => state.backup)
  const { webdavAutoSync } = useAppSelector((state) => state.settings)

  const { theme } = useTheme()
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editForm] = Form.useForm()
  const [changePasswordForm] = Form.useForm()

  const handleLogout = async () => {
    Modal.confirm({
      title: '确认退出登录？',
      content: '退出登录后无法使用相关功能',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        userDataService.clearCurrentUser()
        dispatch(logout())
        await authService.logout()
        message.success('已登出')
      }
    })
  }

  const handleRefreshProfile = async () => {
    setLoading(true)
    try {
      const profile = await authService.getUserProfile()
      dispatch(updateUser(profile))
      message.success('刷新用户信息成功')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = () => {
    setIsChangePasswordModalVisible(true)
  }

  const handleEditInfo = () => {
    editForm.setFieldsValue({
      nickname: user?.nickname || '',
      subject: user?.subject || '',
      grade: user?.grade || '',
      classroom: user?.classroom || ''
    })
    setIsEditModalVisible(true)
  }

  const handleEditSubmit = async (values: any) => {
    try {
      setLoading(true)
      await authService.updateProfile(values)
      dispatch(updateUser(values))
      message.success('修改信息成功')
      setIsEditModalVisible(false)
    } finally {
      setLoading(false)
    }
  }

  const handleChangePasswordSubmit = async (values: any) => {
    try {
      setLoading(true)
      await authService.changePassword(values)
      message.success('密码修改成功')
      setIsChangePasswordModalVisible(false)
      changePasswordForm.resetFields()
    } finally {
      setLoading(false)
    }
  }

  const formatMobile = (mobile: string | null): string => {
    if (!mobile || mobile.length < 11) return mobile || '-'
    return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
  }

  const getUserTypeLabel = (type: number | null): string => {
    if (type === null) return '未知'
    switch (type) {
      case 4:
        return '学生'
      case 3:
        return '教师'
      default:
        return '其他'
    }
  }

  const getUserInfoItems = () => [
    { label: '用户名', value: user?.username || '-' },
    { label: '昵称', value: user?.nickname || '-' },
    { label: '手机号', value: formatMobile(user?.mobile || null) },
    { label: '用户类型', value: getUserTypeLabel(user?.type || null) },
    { label: '学校', value: user?.school || '-' },
    { label: '学科', value: user?.subject || '-' },
    { label: '年级', value: user?.grade || '-' },
    { label: '班级', value: user?.classroom || '-' }
  ]

  const handleToBackup = () => {
    navigate('/settings/data?tab=webdav')
  }

  const handleCloseChangePasswordModal = () => {
    setIsChangePasswordModalVisible(false)
    changePasswordForm.resetFields()
  }

  return (
    <SettingContainer theme={theme}>
      <SettingGroup theme={theme}>
        <SettingTitle>用户信息</SettingTitle>
        <SettingDivider />
        <UserInfoContent>
          <InfoColumn>
            <InfoGrid>
              {getUserInfoItems().map((item, index) => (
                <InfoItem key={index}>
                  <InfoLabel>{item.label}：</InfoLabel>
                  <InfoValue>{item.value}</InfoValue>
                </InfoItem>
              ))}
            </InfoGrid>
          </InfoColumn>
        </UserInfoContent>
      </SettingGroup>

      <SettingGroup theme={theme}>
        <SettingTitle>用户操作</SettingTitle>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>云备份</SettingRowTitle>
          <ActionButtons>
            <BackupInfo>
            {webdavAutoSync ? (
              webdavSync.lastSyncTime ? (
                <Text type="secondary">上一次备份时间：{dayjs(webdavSync.lastSyncTime).format('YYYY-MM-DD HH:mm:ss')}</Text>
              ) : (
                <Text type="secondary">从未备份</Text>
              )
            ) : (
              <Text type="secondary">自动备份已关闭</Text>
            )}
            </BackupInfo>
            <Button icon={<CloudOutlined />} onClick={handleToBackup}>去设置</Button>
          </ActionButtons>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>配置</SettingRowTitle>
          <Button icon={<ReloadOutlined />} onClick={handleRefreshProfile} loading={loading}>
            刷新
          </Button>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitle>账户</SettingRowTitle>
          <ActionButtons>
            <Button variant="solid" icon={<EditOutlined />} onClick={handleEditInfo}>
              修改信息
            </Button>
            <Button color="primary" variant="solid" icon={<KeyOutlined />} onClick={handleChangePassword}>
              修改密码
            </Button>
            <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
              退出登录
            </Button>
          </ActionButtons>
        </SettingRow>
      </SettingGroup>

      <EditInfoModal
        title="修改信息"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}>
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
          initialValues={{
            nickname: user?.nickname || '',
            mobile: user?.mobile || '',
            school: user?.school || '',
            subject: user?.subject || '',
            grade: user?.grade || '',
            classroom: user?.classroom || ''
          }}>
          <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="subject" label="学科">
            <Input />
          </Form.Item>
          <Form.Item name="grade" label="年级">
            <Input />
          </Form.Item>
          <Form.Item name="classroom" label="班级">
            <Input />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setIsEditModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </EditInfoModal>

      <ChangePasswordModal
        title="修改密码"
        open={isChangePasswordModalVisible}
        onCancel={handleCloseChangePasswordModal}
        footer={null}>
        <Form form={changePasswordForm} layout="vertical" onFinish={handleChangePasswordSubmit}>
          <Form.Item name="oldPassword" label="旧密码" rules={[{ required: true, message: '请输入旧密码' }]}>
            <Input.Password placeholder="请输入旧密码" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                }
              })
            ]}>
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={handleCloseChangePasswordModal}>取消</Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                修改密码
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </ChangePasswordModal>
    </SettingContainer>
  )
}

const UserInfoContent = styled.div`
  display: flex;
  gap: 24px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`

const InfoColumn = styled.div`
  flex: 1;
  min-width: 0;
`

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 32px;
  overflow: hidden;
`

const InfoLabel = styled(Text)`
  font-size: 14px;
  color: var(--color-text-2);
  flex-shrink: 0;
`

const InfoValue = styled(Text)`
  font-size: 14px;
  color: var(--color-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;
  }
`

const BackupInfo = styled.div`
  font-size: 14px;
  color: var(--color-text-2);
  margin-right: 12px;
`

const EditInfoModal = styled(Modal)`
  .ant-modal-body {
    padding-top: 20px;
  }
`

const ChangePasswordModal = styled(Modal)`
  .ant-modal-body {
    padding-top: 20px;
  }
`

export default UserInfoPage
