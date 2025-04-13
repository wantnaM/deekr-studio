import { TopView } from '@renderer/components/TopView'
import { useAgents } from '@renderer/hooks/useAgents'
import { getDictData } from '@renderer/services/AdminService/Dict'
import { Agent, DICT_TYPE } from '@renderer/types'
import { Button, Empty, List, Modal, Select, Skeleton } from 'antd'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

const PopupContainer: FC = () => {
  const [open, setOpen] = useState(true)
  const { t } = useTranslation()
  const { agents, updateAgents } = useAgents()
  const [saving, setSaving] = useState(false)
  const [list, setList] = useState<Agent[]>([])
  const [subjList, setSubjList] = useState([])
  const [themeList, setThemeList] = useState([])

  useEffect(() => {
    const initListData: Agent[] = []

    agents.forEach((agent) => {
      initListData.push({ ...agent })
    })

    initListData.sort((a, b) => {
      const aMissing = !a.subject || !a.theme
      const bMissing = !b.subject || !b.theme

      if (aMissing && !bMissing) {
        return -1 // a comes first
      }
      if (!aMissing && bMissing) {
        return 1 // b comes first
      }
      return 0 // keep original order if both have or both don't have
    })

    setList(initListData)
  }, [agents])

  const getDict = async () => {
    const res = await getDictData(DICT_TYPE.DS_SUBJECT)
    setSubjList(res)
    const res2 = await getDictData(DICT_TYPE.DS_THEME)
    setThemeList(res2)
  }

  useEffect(() => {
    getDict()
  }, [])

  const onClose = async () => {
    OrganizeAgentsPopup.hide()
  }

  const handleSaveAll = async () => {
    setSaving(true)

    try {
      // 使用map创建新的agents数组，避免直接修改原状态
      const updateds = agents.map((agent) => {
        const matchedItem = list.find((item) => item.id === agent.id)

        // 如果找到匹配项，则更新主题和学科
        if (matchedItem) {
          const { theme, subject } = matchedItem
          return { ...agent, theme, subject }
        }

        return agent
      })

      await updateAgents(updateds)

      setOpen(false)
    } catch (error) {
      console.error('保存失败:', error)
      // message.error('保存失败，请重试');
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
        list.length > 0 && (
          <Button key="save" type="primary" loading={saving} onClick={handleSaveAll}>
            {t('common.save')}
          </Button>
        )
      ]}
      centered
      width={800}>
      <Container>
        {list.length > 0 ? (
          <>
            <Header>
              <HeaderLeft>{t('agents.organize.agentName')}</HeaderLeft>
              <HeaderRight>
                <HeaderItem>{t('agents.organize.subject')}</HeaderItem>
                <HeaderItem>{t('agents.organize.theme')}</HeaderItem>
              </HeaderRight>
            </Header>
            <List
              itemLayout="horizontal"
              dataSource={list}
              renderItem={(item, index) => (
                <ListItem key={item.id}>
                  <LeftContent>
                    <Skeleton avatar title={false} loading={false} active>
                      <List.Item.Meta avatar={item.emoji} title={item.name} />
                    </Skeleton>
                  </LeftContent>
                  <SelectsContainer>
                    <Select
                      placeholder={t('agents.organize.placeholderSubject')}
                      value={item.subject}
                      style={{ width: 180 }}
                      options={subjList}
                      showSearch
                      onChange={(value) => {
                        const newList = [...list]
                        newList[index].subject = value
                        setList(newList)
                      }}
                    />
                    <Select
                      placeholder={t('agents.organize.placeholderTheme')}
                      value={item.theme}
                      style={{ width: 180, marginLeft: 20 }}
                      options={themeList}
                      showSearch
                      onChange={(value) => {
                        const newList = [...list]
                        newList[index].theme = value
                        setList(newList)
                      }}
                    />
                  </SelectsContainer>
                </ListItem>
              )}
            />
          </>
        ) : (
          <Empty description={t('agents.organize.noUnorganizedItems')} />
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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
  font-weight: bold;
`

const HeaderLeft = styled.div`
  flex: 1;
  min-width: 200px;
`

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex: 2;
  min-width: 400px;
  padding: 0 30px;
`

const HeaderItem = styled.div`
  width: 180px;
  &:last-child {
    margin-left: 20px;
  }
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
