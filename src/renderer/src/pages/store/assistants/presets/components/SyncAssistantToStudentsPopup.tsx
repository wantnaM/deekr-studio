import { TopView } from '@renderer/components/TopView'
import { useAssistantPresets } from '@renderer/hooks/useAssistantPresets'
import { getStudentsList, syncAgentsToStudents } from '@renderer/services/AdminService'
import { Checkbox, message,Modal, Table } from 'antd'
import { useEffect, useState } from 'react'

interface Props {
  resolve: (data: any) => void
}

const SyncAssistantToStudentsPopupComponent: React.FC<Props> = ({ resolve }) => {
  const [open, setOpen] = useState(true)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [loading, setLoading] = useState(false)

  // Get user agents from store
  const { presets: userPresets } = useAssistantPresets()

  // Check if there are any agents
  useEffect(() => {
    if (userPresets.length === 0) {
      message.info('暂无智能体可同步')
      setOpen(false)
    }
  }, [userPresets])

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const data = await getStudentsList()
      if (data) {
        setStudents(data)
      }
    } catch (error) {
      message.error('获取学生列表失败')
    }
  }

  const handleSyncConfirm = async () => {
    if (selectedAgents.length === 0) {
      message.warning('请选择要同步的智能体')
      return
    }
    if (selectedStudents.length === 0) {
      message.warning('请选择要同步的学生')
      return
    }

    setLoading(true)
    try {
      await syncAgentsToStudents(selectedAgents, selectedStudents)
      message.success('同步成功')
      resolve({ success: true })
      setOpen(false)
    } catch (error) {
      message.error('同步失败')
    } finally {
      setLoading(false)
    }
  }

  const onClose = () => {
    resolve(null)
    TopView.hide(TopViewKey)
  }

  return (
    <Modal
      title="同步智能体给学生"
      open={open}
      onOk={handleSyncConfirm}
      onCancel={() => setOpen(false)}
      afterClose={onClose}
      confirmLoading={loading}
      width={800}
      centered
      transitionName="animation-move-down"
      maskClosable={false}>
      <div style={{ marginBottom: 24 }}>
        <h4>选择智能体</h4>
        <Checkbox
          indeterminate={selectedAgents.length > 0 && selectedAgents.length < userPresets.length}
          checked={selectedAgents.length === userPresets.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedAgents(userPresets.map((agent) => agent.id))
            } else {
              setSelectedAgents([])
            }
          }}>
          全选
        </Checkbox>
        <div style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}>
          <Table
            dataSource={userPresets}
            rowKey="id"
            pagination={false}
            size="small"
            rowSelection={{
              selectedRowKeys: selectedAgents,
              onChange: (selectedRowKeys) => setSelectedAgents(selectedRowKeys as string[])
            }}
            columns={[
              {
                title: '名称',
                dataIndex: 'name',
                key: 'name'
              }
            ]}
          />
        </div>
      </div>

      <div>
        <h4>选择学生</h4>
        <Checkbox
          indeterminate={selectedStudents.length > 0 && selectedStudents.length < students.length}
          checked={selectedStudents.length === students.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedStudents(students.map((student) => student.id))
            } else {
              setSelectedStudents([])
            }
          }}>
          全选
        </Checkbox>
        <div style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}>
          <Table
            dataSource={students}
            rowKey="id"
            pagination={false}
            size="small"
            rowSelection={{
              selectedRowKeys: selectedStudents,
              onChange: (selectedRowKeys) => setSelectedStudents(selectedRowKeys as number[])
            }}
            columns={[
              {
                title: '姓名',
                dataIndex: 'nickname',
                key: 'nickname',
                filters: students.map((student) => ({
                  text: student.nickname,
                  value: student.nickname
                })),
                onFilter: (value, record) => record.nickname.includes(value as string),
                filterSearch: true
              },
              {
                title: '年级',
                dataIndex: 'grade',
                key: 'grade',
                filters: Array.from(new Set(students.map((student) => student.grade))).map((grade) => ({
                  text: grade,
                  value: grade
                })),
                onFilter: (value, record) => record.grade.includes(value as string),
                filterSearch: true
              },
              {
                title: '班级',
                dataIndex: 'classroom',
                key: 'classroom',
                filters: Array.from(new Set(students.map((student) => student.classroom))).map((classroom) => ({
                  text: classroom,
                  value: classroom
                })),
                onFilter: (value, record) => record.classroom.includes(value as string),
                filterSearch: true
              }
            ]}
          />
        </div>
      </div>
    </Modal>
  )
}

const TopViewKey = 'SyncAssistantToStudentsPopup'

export default class SyncAssistantToStudentsPopup {
  static topviewId = 0

  static hide() {
    TopView.hide(TopViewKey)
  }

  static show() {
    return new Promise<any>((resolve) => {
      TopView.show(
        <SyncAssistantToStudentsPopupComponent
          resolve={(v) => {
            resolve(v)
            this.hide()
          }}
        />,
        TopViewKey
      )
    })
  }
}
