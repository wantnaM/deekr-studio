import { DownloadOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/context/ThemeProvider'
import { getStudentsList, importStudentsTemplate } from '@renderer/services/AdminService/Students'
import { config } from '@renderer/utils/axios/config'
import type { UploadProps } from 'antd'
import { Button, Input, message, Table, Upload } from 'antd'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { SettingContainer, SettingDivider, SettingGroup, SettingTitle } from '.'

interface Student {
  key: string
  username: string
  nickname: string
  grade: string
  classroom: string
}

const StudentsSettings: FC = () => {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const [students, setStudents] = useState<Student[]>([])
  const [messageApi, contextHolder] = message.useMessage()
  const [searchText, setSearchText] = useState('')
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])

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

  const handleDownloadTemplate = async () => {
    const res = await importStudentsTemplate()

    // 创建 blob
    const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
    // 创建 href 超链接，点击进行下载
    window.URL = window.URL || window.webkitURL
    const href = URL.createObjectURL(blob)
    const downA = document.createElement('a')
    downA.href = href
    downA.download = '学生导入模版.xlsx'
    downA.click()
    // 销毁超连接
    window.URL.revokeObjectURL(href)
    messageApi.success('下载模板成功')
  }

  const handleSearch = (value: string) => {
    setSearchText(value)
    if (!value) {
      setFilteredStudents(students)
      return
    }
    const filtered = students.filter((student) => {
      return (
        student.username.toLowerCase().includes(value.toLowerCase()) ||
        student.nickname.toLowerCase().includes(value.toLowerCase()) ||
        student.grade.toLowerCase().includes(value.toLowerCase()) ||
        student.classroom.toLowerCase().includes(value.toLowerCase())
      )
    })
    setFilteredStudents(filtered)
  }

  useEffect(() => {
    const fetchData = async () => {
      const res = await getStudentsList()
      setStudents(res)
      setFilteredStudents(res)
    }

    fetchData()
  }, [])

  const props: UploadProps = {
    name: 'file',
    action: config.base_url + '/system/user/import-students',
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
    },
    maxCount: 1
  }

  return (
    <SettingContainer theme={theme}>
      {contextHolder}
      <SettingGroup theme={theme}>
        <SettingTitle>{t('settings.students.title')}</SettingTitle>
        <SettingDivider />
        <SettingTitle
          style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>学生列表</span>
          <ActionButtons>
            <Upload {...props}>
              <Button type="primary" icon={<UploadOutlined />}>
                导入文件
              </Button>
              <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate} style={{ marginLeft: 10 }}>
                下载模板
              </Button>
            </Upload>
          </ActionButtons>
        </SettingTitle>

        <SearchContainer>
          <Input
            placeholder="搜索学生"
            allowClear
            suffix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ width: 250, marginTop: 10 }}
          />
        </SearchContainer>

        <StudentsTable
          dataSource={filteredStudents}
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
`

const StudentsTable = styled(Table)`
  margin-top: 5px;

  .ant-table-thead > tr > th {
    background-color: var(--color-bg-2);
  }

  .ant-table-tbody > tr > td {
    border-bottom: 1px solid var(--color-border);
  }
`

const SearchContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`

export default StudentsSettings
