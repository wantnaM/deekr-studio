import { CloudOutlined,EditOutlined, KeyOutlined, LogoutOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/context/ThemeProvider'
import { SettingContainer, SettingDivider, SettingGroup, SettingRow, SettingRowTitle, SettingTitle } from '@renderer/pages/settings'
import authService from '@renderer/services/AuthService'
import userDataService from '@renderer/services/UserDataService'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { logout, updateUser } from '@renderer/store/auth'
import {Button, Form, Input, message, Modal, Space, Typography } from 'antd'
import type { FC } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const { Text } = Typography

const UserInfoPage: FC = () => {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const { theme } = useTheme()
  const [isEditModalVisible, setIsEditModalVisible] = useState(false)
  const [isChangePasswordModalVisible, setIsChangePasswordModalVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editForm] = Form.useForm()
  const [changePasswordForm] = Form.useForm()

  const handleLogout = async () => {
    Modal.confirm({
      title: t('settings.user.logout.confirm'),
      content: t('settings.user.logout.message'),
      okText: t('common.confirm', '确认'),
      cancelText: t('common.cancel', '取消'),
      onOk: async () => {
        userDataService.clearCurrentUser()
        dispatch(logout())
        await authService.logout()
        message.success(t('settings.user.logout.success', '退出登录成功'))
      }
    })
  }

  const handleRefreshProfile = async () => {
    setLoading(true)
    try {
      const profile = await authService.getUserProfile()
      dispatch(updateUser(profile))
      message.success(t('settings.user.refresh.success', '刷新用户信息成功'))
    } catch (error) {
      message.error(t('settings.user.refresh.error', '刷新用户信息失败'))
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
      mobile: user?.mobile || '',
      school: user?.school || '',
      subject: user?.subject || '',
      grade: user?.grade || '',
      classroom: user?.classroom || ''
    })
    setIsEditModalVisible(true)
  }

  const handleEditSubmit = async (values: any) => {
    try {
      setLoading(true)
      // 这里调用更新用户信息的API
      // await authService.updateUserProfile(values)
      dispatch(updateUser(values))
      message.success(t('settings.user.edit.success', '修改信息成功'))
      setIsEditModalVisible(false)
    } catch (error) {
      message.error(t('settings.user.edit.error', '修改信息失败'))
    } finally {
      setLoading(false)
    }
  }

  const handleChangePasswordSubmit = async (values: any) => {
    try {
      setLoading(true)
      // 这里调用修改密码的API
      // await authService.changePassword(values)
      message.success(t('settings.user.changePassword.success', '密码修改成功'))
      setIsChangePasswordModalVisible(false)
      changePasswordForm.resetFields()
    } catch (error) {
      message.error(t('settings.user.changePassword.error', '密码修改失败'))
    } finally {
      setLoading(false)
    }
  }

  const formatMobile = (mobile: string | null): string => {
    if (!mobile || mobile.length < 11) return mobile || '-'
    return `${mobile.slice(0, 3)}****${mobile.slice(-4)}`
  }

  const getUserTypeLabel = (type: number | null): string => {
    if (type === null) return t('settings.user.type.unknown', '未知')
    switch (type) {
      case 4:
        return t('settings.user.type.student', '学生')
      case 3:
        return t('settings.user.type.teacher', '教师')
      default:
        return t('settings.user.type.other', '其他')
    }
  }

  const getUserInfoItems = () => [
    { label: t('settings.user.username', '用户名'), value: user?.username || '-' },
    { label: t('settings.user.nickname', '昵称'), value: user?.nickname || '-' },
    { label: t('settings.user.mobile', '手机号'), value: formatMobile(user?.mobile || null)},
    { label: t('settings.user.type', '用户类型'), value: getUserTypeLabel(user?.type || null) },
    { label: t('settings.user.school', '学校'), value: user?.school || '-' },
    { label: t('settings.user.subject', '学科'), value: user?.subject || '-' },
    { label: t('settings.user.grade', '年级'), value: user?.grade || '-' },
    { label: t('settings.user.classroom', '班级'), value: user?.classroom || '-' }
  ]

  return (
    <SettingContainer theme={theme}>
      <SettingGroup theme={theme}>
        <SettingTitle>{t('settings.user.title', '用户信息')}</SettingTitle>
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
        <SettingTitle>{t('settings.user.actions.title')}</SettingTitle>
        <SettingDivider />
          <SettingRow>
          <SettingRowTitle>{t('settings.user.backup.title', '云备份')}</SettingRowTitle>
            <ActionButtons>
              <BackupInfo>
                {t('settings.user.backup.last', '上一次备份时间')}：
                <Text type="secondary">{t('settings.user.backup.never', '从未备份')}</Text>
              </BackupInfo>
              <Button icon={<CloudOutlined />}>
                {t('settings.user.backup.go', '去设置')}
              </Button>
            </ActionButtons>
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.user.config.title', '配置')}</SettingRowTitle>
            <Button icon={<ReloadOutlined />} onClick={handleRefreshProfile} loading={loading}>
                {t('settings.user.config.refresh')}
              </Button>
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingRowTitle>{t('settings.user.actions.account')}</SettingRowTitle>
            <ActionButtons>
              <Button variant="solid" icon={<EditOutlined />} onClick={handleEditInfo}>
                {t('settings.user.actions.editButton', '修改信息')}
              </Button>
              <Button color="primary" variant="solid" icon={<KeyOutlined />} onClick={handleChangePassword}>
                {t('settings.user.actions.changePasswordButton', '修改密码')}
              </Button>
              <Button danger icon={<LogoutOutlined />} onClick={handleLogout}>
                {t('settings.user.logout.button', '退出登录')}
              </Button>
            </ActionButtons>
          </SettingRow>
      </SettingGroup>

      <EditInfoModal
        title={t('settings.user.edit.title', '修改信息')}
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        footer={null}
        destroyOnClose
      >
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
          }}
        >
          <Form.Item
            name="nickname"
            label={t('settings.user.nickname', '昵称')}
          >
            <Input placeholder={t('settings.user.nickname.placeholder', '请输入昵称')} />
          </Form.Item>
          <Form.Item
            name="mobile"
            label={t('settings.user.mobile', '手机号')}
          >
            <Input placeholder={t('settings.user.mobile.placeholder', '请输入手机号')} />
          </Form.Item>
          <Form.Item
            name="school"
            label={t('settings.user.school', '学校')}
          >
            <Input placeholder={t('settings.user.school.placeholder', '请输入学校')} />
          </Form.Item>
          <Form.Item
            name="subject"
            label={t('settings.user.subject', '学科')}
          >
            <Input placeholder={t('settings.user.subject.placeholder', '请输入学科')} />
          </Form.Item>
          <Form.Item
            name="grade"
            label={t('settings.user.grade', '年级')}
          >
            <Input placeholder={t('settings.user.grade.placeholder', '请输入年级')} />
          </Form.Item>
          <Form.Item
            name="classroom"
            label={t('settings.user.classroom', '班级')}
          >
            <Input placeholder={t('settings.user.classroom.placeholder', '请输入班级')} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setIsEditModalVisible(false)}>
                {t('common.cancel', '取消')}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {t('common.save', '保存')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </EditInfoModal>

      <ChangePasswordModal
        title={t('settings.user.changePassword.title', '修改密码')}
        open={isChangePasswordModalVisible}
        onCancel={() => setIsChangePasswordModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={changePasswordForm}
          layout="vertical"
          onFinish={handleChangePasswordSubmit}
        >
          <Form.Item
            name="oldPassword"
            label={t('settings.user.changePassword.old', '旧密码')}
            rules={[{ required: true, message: t('settings.user.changePassword.old.required', '请输入旧密码') }]}
          >
            <Input.Password placeholder={t('settings.user.changePassword.old.placeholder', '请输入旧密码')} />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label={t('settings.user.changePassword.new', '新密码')}
            rules={[{ required: true, message: t('settings.user.changePassword.new.required', '请输入新密码') }]}
          >
            <Input.Password placeholder={t('settings.user.changePassword.new.placeholder', '请输入新密码')} />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={t('settings.user.changePassword.confirm', '确认新密码')}
            rules={[
              { required: true, message: t('settings.user.changePassword.confirm.required', '请确认新密码') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error(t('settings.user.changePassword.confirm.mismatch', '两次输入的密码不一致')))
                }
              })
            ]}
          >
            <Input.Password placeholder={t('settings.user.changePassword.confirm.placeholder', '请再次输入新密码')} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button onClick={() => setIsChangePasswordModalVisible(false)}>
                {t('common.cancel', '取消')}
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {t('settings.user.changePassword.submit', '修改密码')}
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

const AvatarColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`

const AvatarUploadWrapper = styled.div`
  position: relative;
  cursor: pointer;

  &:hover .avatar-edit {
    opacity: 1;
  }
`

const AvatarWrapper = styled.div`
  position: relative;
  display: inline-block;
`

const AvatarEditIcon = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  opacity: 0;
  transition: opacity 0.2s;
`

const AvatarText = styled(Text)`
  font-size: 12px;
  color: var(--color-text-3);
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

const ActionContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 48px;
  padding: 8px 0;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
`

const ActionLabel = styled.div`
  flex-shrink: 0;
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
