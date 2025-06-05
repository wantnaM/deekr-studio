import { DownloadOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/context/ThemeProvider'
import { getStudentsList } from '@renderer/services/AdminService/Students'
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
        <SettingTitle
          style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>学生列表</span>
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
