import { EditOutlined, MenuOutlined } from '@ant-design/icons'
import DragableList from '@renderer/components/DragableList'
import { Box, HStack } from '@renderer/components/Layout'
import { TopView } from '@renderer/components/TopView'
import { useAgents } from '@renderer/hooks/useAgents'
import { useAssistants } from '@renderer/hooks/useAssistant'
import { Agent, Assistant } from '@renderer/types'
import { Button, Empty, Form, Input, Modal } from 'antd'
import { FC, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const { TextArea } = Input

interface UnorganizedItem {
  id: string
  name: string
  type: 'agent' | 'assistant'
  data: Agent | Assistant
}

const PopupContainer: FC = () => {
  const [open, setOpen] = useState(true)
  const { t } = useTranslation()
  const { agents } = useAgents()
  const { assistants } = useAssistants()
  const [selectedItem, setSelectedItem] = useState<UnorganizedItem | null>(null)
  const [form] = Form.useForm()

  // 收集未整理的智能体和助手
  const unorganizedItems = useMemo(() => {
    const items: UnorganizedItem[] = []

    // 未整理的助手是没有设置主题或学科的
    assistants.forEach((assistant) => {
      if (!assistant.topics || assistant.topics.length === 0) {
        items.push({
          id: assistant.id,
          name: assistant.name,
          type: 'assistant',
          data: assistant
        })
      }
    })

    // 未整理的智能体是没有设置主题或学科的
    agents.forEach((agent) => {
      if (!agent.topics || agent.topics.length === 0) {
        items.push({
          id: agent.id,
          name: agent.name,
          type: 'agent',
          data: agent
        })
      }
    })

    return items
  }, [agents, assistants])

  const onOk = () => {
    setOpen(false)
  }

  const onCancel = () => {
    setOpen(false)
  }

  const onClose = async () => {
    OrganizeAgentsPopup.hide()
  }

  const handleItemSelect = (item: UnorganizedItem) => {
    setSelectedItem(item)
    form.setFieldsValue({
      name: item.name,
      prompt: item.type === 'assistant' ? (item.data as Assistant).prompt : '',
      subjects: [],
      theme: ''
    })
  }

  const handleSaveChanges = () => {
    const values = form.getFieldsValue()
    // 这里应该添加保存修改的逻辑
    console.log('保存修改:', values)
  }

  useEffect(() => {
    if (agents.length === 0 && assistants.length === 0) {
      setOpen(false)
    }
  }, [agents, assistants])

  return (
    <Modal
      title={t('agents.organize.title')}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      afterClose={onClose}
      footer={null}
      centered
      width={800}>
      <Container>
        <ContentWrapper>
          <LeftPanel>
            <PanelTitle>{t('agents.unorganizedList')}</PanelTitle>
            <ScrollableList>
              {unorganizedItems.length > 0 ? (
                <DragableList list={unorganizedItems} onUpdate={() => {}}>
                  {(item) => (
                    <AgentItem onClick={() => handleItemSelect(item)} $selected={selectedItem?.id === item.id}>
                      <Box mr={8}>
                        {item.emoji} {item.name} (
                        {item.type === 'assistant' ? t('agents.assistant') : t('agents.agent')})
                      </Box>
                      <HStack gap="15px">
                        <MenuOutlined style={{ cursor: 'move' }} />
                      </HStack>
                    </AgentItem>
                  )}
                </DragableList>
              ) : (
                <Empty description={t('agents.noUnorganizedItems')} />
              )}
            </ScrollableList>
          </LeftPanel>

          <RightPanel>
            <PanelTitle>{t('agents.organizeSettings')}</PanelTitle>
            {selectedItem ? (
              <FormContainer>
                <Form form={form} layout="vertical">
                  <Form.Item name="name" label={t('agents.name')}>
                    <Input />
                  </Form.Item>

                  <Form.Item name="prompt" label={t('agents.prompt')}>
                    <TextArea rows={4} />
                  </Form.Item>

                  <Form.Item name="subjects" label={t('agents.subjects')}>
                    {/* <Select mode="multiple">
                      {Object.values(SubjectTypes).map((subject) => (
                        <Option key={subject} value={subject}>
                          {subject}
                        </Option>
                      ))}
                    </Select> */}
                  </Form.Item>

                  <Form.Item name="theme" label={t('agents.theme')}>
                    <Input />
                  </Form.Item>

                  <ActionButtons>
                    <Button type="primary" icon={<EditOutlined />} onClick={handleSaveChanges}>
                      {t('common.save')}
                    </Button>
                  </ActionButtons>
                </Form>
              </FormContainer>
            ) : (
              <Empty description={t('agents.selectItemToEdit')} />
            )}
          </RightPanel>
        </ContentWrapper>
      </Container>
    </Modal>
  )
}

const Container = styled.div`
  padding: 12px 0;
  height: 60vh;
`

const ContentWrapper = styled.div`
  display: flex;
  height: 100%;
  gap: 16px;
`

const LeftPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--color-border);
  padding-right: 16px;
`

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`

const PanelTitle = styled.h3`
  margin-bottom: 16px;
  font-size: 16px;
  color: var(--color-text);
`

const ScrollableList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: var(--color-border);
    border-radius: 3px;
  }
`

const AgentItem = styled.div<{ $selected?: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-radius: 8px;
  user-select: none;
  background-color: ${({ $selected }) => ($selected ? 'var(--color-background-mute)' : 'var(--color-background-soft)')};
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s ease;

  .anticon {
    font-size: 16px;
    color: var(--color-icon);
  }

  &:hover {
    background-color: var(--color-background-mute);
  }
`

const FormContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
`

export default class OrganizeAgentsPopup {
  static topviewId = 0
  static hide() {
    TopView.hide('OrganizeAgentsPopup')
  }
  static show() {
    TopView.show(<PopupContainer />, 'OrganizeAgentsPopup')
  }
}
