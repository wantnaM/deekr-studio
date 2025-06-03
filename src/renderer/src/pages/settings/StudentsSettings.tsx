import { DownloadOutlined, UploadOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/context/ThemeProvider'
import type { UploadProps } from 'antd'
import { Button, message, Table, Upload } from 'antd'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { SettingContainer, SettingDivider, SettingGroup, SettingTitle } from '.'

interface Student {
  key: string
  username: string
  nickname: string
  grade: string
  class: string
}

const StudentsSettings: FC = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [students, setStudents] = useState<Student[]>([])
  const [messageApi, contextHolder] = message.useMessage()

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname'
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade'
    },
    {
      title: '班级',
      dataIndex: 'classroom',
      key: 'classroom'
    }
  ]

  const handleDownloadTemplate = () => {
    // Create a CSV template
    const csvContent = 'username,nickname,grade,class\nstudent1,John Doe,1,A\nstudent2,Jane Smith,2,B'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'students_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    messageApi.success(t('settings.students.template_downloaded'))
  }

  const props: UploadProps = {
    name: 'file',
    action: 'https://www.mocky.io/v2/5cc8019d300000980a055e76',
    headers: {
      authorization: 'authorization-text'
    },
    onChange(info) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList)
      }
      if (info.file.status === 'done') {
        messageApi.success(`${info.file.name} ${t('settings.students.upload_success')}`)
        // Here you would process the uploaded file and add students
      } else if (info.file.status === 'error') {
        messageApi.error(`${info.file.name} ${t('settings.students.upload_failed')}`)
      }
    }
  }

  return (
    <SettingContainer theme={theme}>
      {contextHolder}
      <SettingGroup theme={theme}>
        <SettingTitle>{t('settings.students.title')}</SettingTitle>
        <SettingDivider />

        <ActionButtons>
          <Upload {...props}>
            <Button type="primary" icon={<UploadOutlined />}>
              导入文件
            </Button>
          </Upload>
          <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
            下载模板
          </Button>
        </ActionButtons>

        <StudentsTable
          dataSource={students}
          columns={columns}
          bordered
          size="middle"
          locale={{ emptyText: '暂无数据' }}
        />
      </SettingGroup>
    </SettingContainer>
  )
}

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
`

const StudentsTable = styled(Table)`
  margin-top: 16px;

  .ant-table-thead > tr > th {
    background-color: var(--color-bg-2);
  }

  .ant-table-tbody > tr > td {
    border-bottom: 1px solid var(--color-border);
  }
`

export default StudentsSettings
