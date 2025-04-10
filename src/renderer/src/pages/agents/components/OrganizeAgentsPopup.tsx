import { TopView } from '@renderer/components/TopView'
import { useAgents } from '@renderer/hooks/useAgents'
import { useAssistants } from '@renderer/hooks/useAssistant'
import { Agent } from '@renderer/types'
import { Button, Empty, List, message, Modal, Select, Skeleton } from 'antd'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const PopupContainer: FC = () => {
  const [open, setOpen] = useState(true)
  const { t } = useTranslation()
  const { agents, updateAgents } = useAgents()
  const { assistants } = useAssistants()
  const [saving, setSaving] = useState(false)
  const [list, setList] = useState<Agent[]>([])

  useEffect(() => {
    const initListData: Agent[] = []

    agents.forEach((agent) => {
      if (!agent.theme || !agent.subject) {
        initListData.push({ ...agent })
      }
    })

    setList(initListData)
  }, [agents, assistants])

  const onClose = async () => {
    OrganizeAgentsPopup.hide()
  }

  const handleSaveAll = async () => {
    setSaving(true)
    try {
      message.success(t('common.saveSuccess'))
      setOpen(false)
    } catch (error) {
      message.error(t('common.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title={t('agents.organize.title')}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel')}
        </Button>,
        <Button key="save" type="primary" loading={saving} onClick={handleSaveAll}>
          {t('common.save')}
        </Button>
      ]}
      centered
      width={800}>
      <Container>
        {list.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={list}
            renderItem={(item) => (
              <ListItem key={item.id}>
                <LeftContent>
                  <Skeleton avatar title={false} loading={false} active>
                    <List.Item.Meta avatar={item.emoji} title={item.name} />
                  </Skeleton>
                </LeftContent>
                <SelectsContainer>
                  <Select
                    mode="tags"
                    placeholder={t('agents.organize.placeholderSubject')}
                    value={item.subject}
                    style={{ width: 180 }}
                  />
                  <Select
                    mode="tags"
                    placeholder={t('agents.organize.placeholderTheme')}
                    value={item.theme}
                    style={{ width: 180, marginLeft: 20 }}
                  />
                </SelectsContainer>
              </ListItem>
            )}
          />
        ) : (
          <Empty description={t('agents.noUnorganizedItems')} />
        )}
      </Container>
    </Modal>
  )
}

const Container = styled.div`
  padding: 12px 0;
  height: 60vh;
  overflow-y: auto;
`

const ListItem = styled(List.Item)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
`

const LeftContent = styled.div`
  flex: 1;
  min-width: 200px;
`

const SelectsContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 2;
  min-width: 400px;
  padding: 0 30px;
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
