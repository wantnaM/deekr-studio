import { SearchOutlined, SwapOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import Scrollbar from '@renderer/components/Scrollbar'
import { useAgents } from '@renderer/hooks/useAgents'
import { createAssistantFromAgent } from '@renderer/services/AssistantService'
import { Agent } from '@renderer/types'
import { uuid } from '@renderer/utils'
import { Badge, Button, Col, Empty, Input, Row, Tabs as TabsAntd, Typography } from 'antd'
import { groupBy, omit } from 'lodash'
import { FC, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactMarkdown from 'react-markdown'
import styled from 'styled-components'

import { getAgentsFromSystemAgents, useAllAgents } from '.'
import { groupTranslations } from './agentGroupTranslations'
import AgentCard from './components/AgentCard'
import MyAgents from './components/MyAgents'
import OrganizeAgentsPopup from './components/OrganizeAgentsPopup'

const { Title } = Typography

const AgentsPage: FC = () => {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [subjectViewMode, setSubjectViewMode] = useState(true)
  const systemAgents = useAllAgents()
  const { agents } = useAgents()
  const [hasUnorganizedAgents, setHasUnorganizedAgents] = useState(false)

  const agentGroups = useMemo(() => {
    return groupBy(getAgentsFromSystemAgents(systemAgents, subjectViewMode), 'group')
  }, [systemAgents, subjectViewMode])

  const { t, i18n } = useTranslation()

  const filteredAgentGroups = useMemo(() => {
    const groups: Record<string, Agent[]> = {
      我的: []
    }

    if (!search.trim()) {
      Object.entries(agentGroups).forEach(([group, agents]) => {
        if (!groups[group]) {
          groups[group] = agents
        }
      })
      return groups
    }

    const uniqueAgents = new Map<string, Agent>()

    Object.entries(agentGroups).forEach(([, agents]) => {
      agents.forEach((agent) => {
        if (
          (agent.name.toLowerCase().includes(search.toLowerCase()) ||
            agent.description?.toLowerCase().includes(search.toLowerCase())) &&
          !uniqueAgents.has(agent.name)
        ) {
          uniqueAgents.set(agent.name, agent)
        }
      })
    })

    return { 搜索结果: Array.from(uniqueAgents.values()) }
  }, [agentGroups, search])

  // 初始化或agents变化时检查未整理项
  useEffect(() => {
    setHasUnorganizedAgents(agents.some((agent) => !agent.subject || !agent.theme))
  }, [agents])

  // 点击整理按钮时设为false
  const handleOrganizeClick = () => {
    setHasUnorganizedAgents(false)
    OrganizeAgentsPopup.show()
  }

  const onAddAgentConfirm = useCallback(
    (agent: Agent) => {
      window.modal.confirm({
        title: agent.name,
        content: (
          <AgentPrompt>
            <ReactMarkdown className="markdown">{agent.description || agent.prompt}</ReactMarkdown>
          </AgentPrompt>
        ),
        width: 600,
        icon: null,
        closable: true,
        maskClosable: true,
        centered: true,
        okButtonProps: { type: 'primary' },
        okText: t('agents.add.button'),
        onOk: () => createAssistantFromAgent(agent)
      })
    },
    [t]
  )

  const getAgentFromSystemAgent = useCallback((agent: (typeof systemAgents)[number]) => {
    return {
      ...omit(agent, 'group'),
      name: agent.name,
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

  const renderAgentList = useCallback(
    (agents: Agent[]) => {
      return (
        <Row gutter={[20, 20]}>
          {agents.map((agent, index) => (
            <Col span={6} key={agent.id || index} style={{ minWidth: '250px' }}>
              <AgentCard
                onClick={() => onAddAgentConfirm(getAgentFromSystemAgent(agent as any))}
                agent={agent as any}
              />
            </Col>
          ))}
        </Row>
      )
    },
    [getAgentFromSystemAgent, onAddAgentConfirm]
  )

  const tabItems = useMemo(() => {
    const groups = Object.keys(filteredAgentGroups)

    return groups.map((group, i) => {
      const id = String(i + 1)
      const localizedGroupName = getLocalizedGroupName(group)
      const agents = filteredAgentGroups[group] || []

      return {
        label: localizedGroupName,
        key: id,
        children: (
          <TabContent key={group}>
            <Title
              level={5}
              key={group}
              style={{ marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {localizedGroupName}
              {group === '我的' && (
                <Button
                  type="text"
                  icon={
                    <Badge dot={hasUnorganizedAgents}>
                      <UnorderedListOutlined />
                    </Badge>
                  }
                  onClick={handleOrganizeClick}
                  style={{ marginLeft: 8, padding: '0 4px', color: '#0958d9' }}>
                  {t('agents.organize.button')}
                </Button>
              )}
            </Title>
            {group === '我的' ? <MyAgents onClick={onAddAgentConfirm} search={search} /> : renderAgentList(agents)}
          </TabContent>
        )
      }
    })
  }, [filteredAgentGroups, getLocalizedGroupName, onAddAgentConfirm, search, renderAgentList, hasUnorganizedAgents, t])

  const handleSearch = () => {
    if (searchInput.trim() === '') {
      setSearch('')
    } else {
      setSearch(searchInput)
    }
  }

  return (
    <Container>
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none', justifyContent: 'space-between' }}>
          <div>
            {t('agents.title')}
            <Button
              className="nodrag"
              color="default"
              style={{ marginLeft: 20 }}
              type="text"
              icon={<SwapOutlined />}
              onClick={() => setSubjectViewMode(!subjectViewMode)}
            />
            {subjectViewMode ? t('agents.changeSubject') : t('agents.changeTheme')}
          </div>
          <Input
            placeholder={t('common.search')}
            className="nodrag"
            style={{ width: '30%', height: 28 }}
            size="small"
            variant="filled"
            allowClear
            onClear={() => setSearch('')}
            suffix={<SearchOutlined onClick={handleSearch} />}
            value={searchInput}
            maxLength={50}
            onChange={(e) => setSearchInput(e.target.value)}
            onPressEnter={handleSearch}
          />
          <div style={{ width: 80 }} />
        </NavbarCenter>
      </Navbar>
      <ContentContainer id="content-container">
        <AssistantsContainer>
          {Object.values(filteredAgentGroups).flat().length > 0 ? (
            search.trim() ? (
              <TabContent>{renderAgentList(Object.values(filteredAgentGroups).flat())}</TabContent>
            ) : (
              <Tabs tabPosition="right" animated={false} items={tabItems} $language={i18n.language} />
            )
          ) : (
            <EmptyView>
              <Empty description={t('agents.search.no_results')} />
            </EmptyView>
          )}
        </AssistantsContainer>
      </ContentContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: center;
  height: 100%;
  padding: 0 10px;
  padding-left: 0;
  border-top: 0.5px solid var(--color-border);
`

const AssistantsContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  height: calc(100vh - var(--navbar-height));
`

const TabContent = styled(Scrollbar)`
  height: calc(100vh - var(--navbar-height));
  padding: 10px 10px 10px 15px;
  margin-right: -4px;
  padding-bottom: 20px !important;
  overflow-x: hidden;
  transform: translateZ(0);
  will-change: transform;
  -webkit-font-smoothing: antialiased;
`

const AgentPrompt = styled.div`
  max-height: 60vh;
  overflow-y: scroll;
  max-width: 560px;
`

const EmptyView = styled.div`
  display: flex;
  flex: 1;
  justify-content: center;
  align-items: center;
  font-size: 16px;
  color: var(--color-text-secondary);
`

const Tabs = styled(TabsAntd)<{ $language: string }>`
  display: flex;
  flex: 1;
  flex-direction: row-reverse;

  .ant-tabs-tabpane {
    padding-right: 0 !important;
  }
  .ant-tabs-nav {
    min-width: ${({ $language }) => ($language.startsWith('zh') ? '120px' : '140px')};
    max-width: ${({ $language }) => ($language.startsWith('zh') ? '120px' : '140px')};
    position: relative;
    overflow: hidden;
  }
  .ant-tabs-nav-list {
    padding: 10px 8px;
  }
  .ant-tabs-nav-operations {
    display: none !important;
  }
  .ant-tabs-tab {
    margin: 0 !important;
    border-radius: var(--list-item-border-radius);
    margin-bottom: 5px !important;
    font-size: 13px;
    justify-content: left;
    padding: 7px 15px !important;
    border: 0.5px solid transparent;
    justify-content: ${({ $language }) => ($language.startsWith('zh') ? 'center' : 'flex-start')};
    user-select: none;
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
    outline: none !important;
    .ant-tabs-tab-btn {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100px;
      transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
      outline: none !important;
    }
    &:hover {
      color: var(--color-text) !important;
      background-color: var(--color-background-soft);
    }
  }
  .ant-tabs-tab-active {
    background-color: var(--color-background-soft);
    border: 0.5px solid var(--color-border);
    transform: scale(1.02);
  }
  .ant-tabs-content-holder {
    border-left: 0.5px solid var(--color-border);
    border-right: none;
  }
  .ant-tabs-ink-bar {
    display: none;
  }
  .ant-tabs-tab-btn:active {
    color: var(--color-text) !important;
  }
  .ant-tabs-tab-active {
    .ant-tabs-tab-btn {
      color: var(--color-text) !important;
    }
  }
  .ant-tabs-content {
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  }
`

export default AgentsPage
