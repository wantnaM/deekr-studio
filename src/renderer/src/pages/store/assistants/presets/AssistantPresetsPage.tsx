import { CloudSyncOutlined, ImportOutlined, PlusOutlined } from '@ant-design/icons'
import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import { HStack } from '@renderer/components/Layout'
import ListItem from '@renderer/components/ListItem'
import GeneralPopup from '@renderer/components/Popups/GeneralPopup'
import Scrollbar from '@renderer/components/Scrollbar'
import { useAgents } from '@renderer/hooks/useAgents'
import { useUser } from '@renderer/hooks/useUser'
import { syncAgentsToStudents } from '@renderer/services/AdminService/Agent'
import { getStudentsList } from '@renderer/services/AdminService/Students'
import CustomTag from '@renderer/components/Tags/CustomTag'
import { useAssistantPresets } from '@renderer/hooks/useAssistantPresets'
import { useNavbarPosition } from '@renderer/hooks/useSettings'
import { createAssistantFromAgent } from '@renderer/services/AssistantService'
import type { AssistantPreset } from '@renderer/types'
import { uuid } from '@renderer/utils'
import { Button, Checkbox, Empty, Flex, Input, message, Modal, Table } from 'antd'
import { omit } from 'lodash'
import { Import, Plus, Rss, Search } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'

import { groupByCategories, useSystemAssistantPresets } from '.'
import { groupTranslations } from './assistantPresetGroupTranslations'
import AddAssistantPresetPopup from './components/AddAssistantPresetPopup'
import AssistantPresetCard from './components/AssistantPresetCard'
import { AssistantPresetGroupIcon } from './components/AssistantPresetGroupIcon'
import AssistantsSubscribeUrlSettings from './components/AssistantsSubscribeUrlSettings'
import ImportAssistantPresetPopup from './components/ImportAssistantPresetPopup'

const AssistantPresetsPage: FC = () => {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [activeGroup, setActiveGroup] = useState('我的')
  const [agentGroups, setAgentGroups] = useState<Record<string, Agent[]>>({})
  const systemAgents = useSystemAgents()
  const { agents: userAgents } = useAgents()
  const { isLoggedIn, type } = useUser()
  console.log('type', type)

  // 在 AgentsPage 组件内添加状态
  const [syncModalVisible, setSyncModalVisible] = useState(false)
  const [selectedAgents, setSelectedAgents] = useState<string[]>([])
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  // 添加学生接口定义
  interface Student {
    id: string
    username: string
    nickname: string
    grade: string
    classroom: string
  }

  // 模拟学生数据
  const [students, setStudents] = useState<Student[]>([])

  const handleSyncToStudents = async () => {
    const res = await getStudentsList()
    setStudents(res)
    setSyncModalVisible(true)
    setSelectedAgents([])
    setSelectedStudents([])
  }

  const handleSyncConfirm = async () => {
    if (selectedAgents.length === 0 || selectedStudents.length === 0) {
      message.warning('请选择要同步的智能体和学生')
      return
    }

    try {
      // 调用同步接口
      await syncAgentsToStudents({
        ids: selectedAgents,
        studentIds: selectedStudents
      })

      message.success('同步成功')
      setSyncModalVisible(false)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    const systemAgentsGroupList = groupByCategories(systemPresets)
    const agentsGroupList = {
      我的: userPresets,
      精选: [],
      ...systemAgentsGroupList
    } as Record<string, AssistantPreset[]>
    setAgentGroups(agentsGroupList)
  }, [systemPresets, userPresets])

  const filteredPresets = useMemo(() => {
    // 搜索框为空直接返回「我的」分组下的 agent
    if (!search.trim()) {
      return agentGroups[activeGroup] || []
    }
    const uniquePresets = new Map<string, AssistantPreset>()
    Object.entries(agentGroups).forEach(([, agents]) => {
      agents.forEach((agent) => {
        if (
          agent.name.toLowerCase().includes(search.toLowerCase()) ||
          agent.description?.toLowerCase().includes(search.toLowerCase())
        ) {
          uniquePresets.set(agent.id, agent)
        }
      })
    })
    return Array.from(uniquePresets.values())
  }, [agentGroups, activeGroup, search])

  const { t, i18n } = useTranslation()

  const onAddPresetConfirm = useCallback(
    (preset: AssistantPreset) => {
      window.modal.confirm({
        title: preset.name,
        content: (
          <Flex gap={16} vertical style={{ width: 'calc(100% + 12px)' }}>
            {preset.description && <AgentDescription>{preset.description}</AgentDescription>}

            {preset.prompt && (
              <AgentPrompt className="markdown">
                <ReactMarkdown>{preset.prompt}</ReactMarkdown>
              </AgentPrompt>
            )}
          </Flex>
        ),
        width: 600,
        icon: null,
        closable: true,
        maskClosable: true,
        centered: true,
        okButtonProps: { type: 'primary' },
        okText: t('assistants.presets.add.button'),
        onOk: () => createAssistantFromAgent(preset)
      })
    },
    [t]
  )

  const getPresetFromSystemPreset = useCallback((preset: (typeof systemPresets)[number]) => {
    return {
      ...omit(preset, 'group'),
      name: preset.name,
      id: uuid(),
      topics: [],
      type: 'agent'
    }
  }, [])

  const getLocalizedGroupName = useCallback(
    (group: string) => {
      const currentLang = i18n.language
      return groupTranslations[group]?.[currentLang] || group
    },
    [i18n.language]
  )

  const handleSearch = () => {
    if (searchInput.trim() === '') {
      setSearch('')
      setActiveGroup('我的')
    } else {
      setActiveGroup('')
      setSearch(searchInput)
    }
  }

  const handleSearchClear = () => {
    setSearch('')
    setSearchInput('')
    setActiveGroup('我的')
    setIsSearchExpanded(false)
  }

  const handleSearchIconClick = () => {
    if (!isSearchExpanded) {
      setIsSearchExpanded(true)
    } else {
      handleSearch()
    }
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchInput(value)
    // 如果输入内容为空，折叠搜索框
    if (value.trim() === '') {
      setIsSearchExpanded(false)
      setSearch('')
      setActiveGroup('我的')
    }
  }

  const handleSearchInputBlur = () => {
    // 如果输入内容为空，失焦时折叠搜索框
    if (searchInput.trim() === '') {
      setIsSearchExpanded(false)
    }
  }

  const handleGroupClick = (group: string) => () => {
    setSearch('')
    setSearchInput('')
    setActiveGroup(group)
  }

  const handleAddAgent = () => {
    AddAssistantPresetPopup.show().then(() => {
      handleSearchClear()
    })
  }

  const handleImportAgent = async () => {
    try {
      await ImportAssistantPresetPopup.show()
    } catch (error) {
      window.toast.error(error instanceof Error ? error.message : t('message.agents.import.error'))
    }
  }

  const handleSubscribeSettings = () => {
    GeneralPopup.show({
      title: t('assistants.presets.settings.title'),
      content: <AssistantsSubscribeUrlSettings />,
      footer: null,
      width: 600
    })
  }

  return (
    <Container>
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none', justifyContent: 'space-between' }}>
          {t('assistants.presets.title')}
          <Input
            placeholder={t('common.search')}
            className="nodrag"
            style={{ width: '30%', height: 28, borderRadius: 15, paddingLeft: 12 }}
            size="small"
            variant="filled"
            allowClear
            onClear={handleSearchClear}
            suffix={<Search size={14} color="var(--color-icon)" onClick={handleSearch} />}
            value={searchInput}
            maxLength={50}
            onChange={handleSearchInputChange}
            onPressEnter={handleSearch}
            onBlur={handleSearchInputBlur}
          />
          <div style={{ width: 80 }} />
        </NavbarCenter>
      </Navbar>

      <Main id="content-container">
        <AgentsGroupList>
          {Object.entries(agentGroups).map(([group]) => (
            <ListItem
              active={activeGroup === group && !search.trim()}
              key={group}
              title={
                <Flex gap={16} align="center" justify="space-between">
                  <Flex gap={10} align="center">
                    <AssistantPresetGroupIcon groupName={group} />
                    {getLocalizedGroupName(group)}
                  </Flex>
                  {
                    <HStack alignItems="center" justifyContent="center" style={{ minWidth: 40 }}>
                      <CustomTag color="#A0A0A0" size={8}>
                        {agentGroups[group].length}
                      </CustomTag>
                    </HStack>
                  }
                </Flex>
              }
              style={{ margin: '0 8px', paddingLeft: 16, paddingRight: 16 }}
              onClick={handleGroupClick(group)}></ListItem>
          ))}
        </AgentsGroupList>

        <AgentsListContainer>
          <AgentsListHeader>
            <AgentsListTitle>
              {search.trim() ? (
                <>
                  <AssistantPresetGroupIcon groupName="搜索" size={24} />
                  {search.trim()}{' '}
                </>
              ) : (
                <>
                  <AssistantPresetGroupIcon groupName={activeGroup} size={24} />
                  {getLocalizedGroupName(activeGroup)}
                </>
              )}

              {
                <CustomTag color="#A0A0A0" size={10}>
                  {filteredPresets.length}
                </CustomTag>
              }
            </AgentsListTitle>
            <Flex gap={8}>
              {isLoggedIn && (
                <>
                  {type === 3 && (
                    <Button type="text" icon={<CloudSyncOutlined />} onClick={handleSyncToStudents}>
                      {t('agents.sync.to_student')}
                    </Button>
                  )}
                </>
              )}
              <Button type="text" onClick={handleImportAgent} icon={<ImportOutlined />}>
                {t('agents.import.title')}
              </Button>
              <Button type="text" onClick={handleAddAgent} icon={<Plus size={18} color="var(--color-icon)" />}>
                {t('assistants.presets.add.title')}
              </Button>
            </Flex>
          </AgentsListHeader>

          {filteredPresets.length > 0 ? (
            <AgentsList>
              {filteredPresets.map((agent, index) => (
                <AssistantPresetCard
                  key={agent.id || index}
                  onClick={() => onAddPresetConfirm(getPresetFromSystemPreset(agent))}
                  preset={agent}
                  activegroup={activeGroup}
                  getLocalizedGroupName={getLocalizedGroupName}
                />
              ))}
            </AgentsList>
          ) : (
            <EmptyView>
              <Empty description={t('assistants.presets.search.no_results')} />
            </EmptyView>
          )}
        </AgentsListContainer>
      </Main>

      <Modal
        title="同步智能体给学生"
        open={syncModalVisible}
        onOk={handleSyncConfirm}
        onCancel={() => setSyncModalVisible(false)}
        width={800}>
        <div style={{ marginBottom: 24 }}>
          <h4>选择智能体</h4>
          <Checkbox
            indeterminate={selectedAgents.length > 0 && selectedAgents.length < userAgents.length}
            checked={selectedAgents.length === userAgents.length}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedAgents(userAgents.map((agent) => agent.id))
              } else {
                setSelectedAgents([])
              }
            }}>
            全选
          </Checkbox>
          <div style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}>
            <Table
              dataSource={userAgents}
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
                onChange: (selectedRowKeys) => setSelectedStudents(selectedRowKeys as string[])
              }}
              columns={[
                {
                  title: '姓名',
                  dataIndex: 'username',
                  key: 'username',
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
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
`

const AgentsGroupList = styled(Scrollbar)`
  min-width: 160px;
  height: calc(100vh - var(--navbar-height));
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-right: 0.5px solid var(--color-border);
  border-top-left-radius: inherit;
  border-bottom-left-radius: inherit;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`

const Main = styled.div`
  flex: 1;
  display: flex;
`

const AgentsListContainer = styled.div`
  height: calc(100vh - var(--navbar-height));
  flex: 1;
  display: flex;
  flex-direction: column;
`

const AgentsListHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 12px;
`

const AgentsListTitle = styled.div`
  font-size: 16px;
  line-height: 18px;
  font-weight: 500;
  color: var(--color-text-1);
  display: flex;
  align-items: center;
  gap: 8px;
`

const AgentsList = styled(Scrollbar)`
  flex: 1;
  padding: 8px 16px 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-auto-rows: 160px;
  gap: 16px;
`

const AgentDescription = styled.div`
  color: var(--color-text-2);
  font-size: 12px;
`

const AgentPrompt = styled.div`
  max-height: 60vh;
  overflow-y: scroll;
  background-color: var(--color-background-soft);
  padding: 8px;
  border-radius: 10px;
`

const EmptyView = styled.div`
  height: 100%;
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  color: var(--color-text-secondary);
`

export default AssistantPresetsPage
