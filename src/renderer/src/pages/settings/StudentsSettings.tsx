import { DownloadOutlined, ExportOutlined, SearchOutlined, SyncOutlined, UploadOutlined } from '@ant-design/icons'
import { useTheme } from '@renderer/context/ThemeProvider'
import { getAccessToken } from '@renderer/hooks/useAuth'
import { exportStudents, getStudentsList, importStudentsTemplate } from '@renderer/services/AdminService'
import userDataService from '@renderer/services/UserDataService'
import { config } from '@renderer/utils/axios/config'
import type { UploadProps } from 'antd'
import { Button, Input, message, Row, Table, Tooltip, Upload } from 'antd'
import { CircleHelp } from 'lucide-react'
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
  const [exportLoading, setExportLoading] = useState(false)
  const userId = userDataService.getCurrentUserId()

  const [studentTip] = useState(
    '教师账号可以创建账号给学生使用。请下载模板后填写表格内容后导入，用户名推荐使用姓名拼音+班级学号，例如：zhangsan001。如果需要修改学生昵称或其他信息可使用导入文件修改，用户名作为唯一标识。学生初始密码是123456'
  )

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
      key: 'grade',
      sorter: true
    },
    {
      title: '班级',
      dataIndex: 'classroom',
      key: 'classroom',
      sorter: true
    },
    {
      title: '创建日期',
      dataIndex: 'createTime',
      key: 'createTime',
      render: (text: string) => formatDate(text),
      sorter: (a, b) => a.createTime - b.createTime
    }
  ]

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  const handleDownloadTemplate = async () => {
    const res = await importStudentsTemplate()

    const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
    window.URL = window.URL || window.webkitURL
    const href = URL.createObjectURL(blob)
    const downA = document.createElement('a')
    downA.href = href
    downA.download = '学生导入模版.xlsx'
    downA.click()
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
    fetchData()
  }, [])

  const fetchData = async () => {
    const res = await getStudentsList()
    setStudents(res)
    setFilteredStudents(res)
  }

  const handleExportStudents = async () => {
    setExportLoading(true)
    try {
      const res = await exportStudents(userId)

      if (res) {
        const blob = new Blob([res], { type: 'application/vnd.ms-excel' })
        window.URL = window.URL || window.webkitURL
        const href = URL.createObjectURL(blob)
        const downA = document.createElement('a')
        downA.href = href
        downA.download = '学生列表.xlsx'
        downA.click()
        window.URL.revokeObjectURL(href)

        messageApi.success('导出成功')
      }
    } finally {
      setExportLoading(false)
    }
  }

  const props: UploadProps = {
    name: 'file',
    action: config.base_url + '/system/user/import-students',
    headers: {
      authorization: 'Bearer ' + getAccessToken()
    },
    onChange(info) {
      if (info.file.status === 'done') {
        if (info.file.response && info.file.response.code === 0) {
          messageApi.success(`文件导入成功`)
          fetchData()
        } else {
          messageApi.error(`文件导入失败: ${info.file.response ? info.file.response.msg : '未知错误'}`)
        }
      } else if (info.file.status === 'error') {
        messageApi.error(`文件导入失败`)
      }
    },
    maxCount: 1,
    showUploadList: false
  }

  return (
    <SettingContainer theme={theme}>
      {contextHolder}
      <SettingGroup theme={theme}>
        <Row align="middle" justify="space-between">
          <SettingTitle>{t('settings.students.title')}</SettingTitle>
          <Tooltip placement="right" title={studentTip} arrow>
            <Row align="middle" style={{ marginLeft: 10 }}>
              <span style={{ fontSize: 12, marginRight: 4 }}>说明</span>
              <QuestionIcon size={14} />
            </Row>
          </Tooltip>
        </Row>

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
            <Button icon={<ExportOutlined />} onClick={handleExportStudents} loading={exportLoading}>
              导出文件
            </Button>
          </ActionButtons>
        </SettingTitle>

        <SearchContainer>
          <Button icon={<SyncOutlined />} onClick={() => fetchData()} style={{ marginTop: 10 }}></Button>
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
  user-select: auto;

  .ant-table-thead > tr > th {
    background-color: var(--color-bg-2);
  }

  .ant-table-tbody > tr > td {
    border-bottom: 1px solid var(--color-border);
  }
`

const SearchContainer = styled.div`
  display: flex;
  justify-content: space-between;
`

const QuestionIcon = styled(CircleHelp)`
  cursor: pointer;
  color: var(--color-text-3);
`

export default StudentsSettings
