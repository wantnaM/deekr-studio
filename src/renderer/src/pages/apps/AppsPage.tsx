import { SearchOutlined } from '@ant-design/icons'
import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import { Center } from '@renderer/components/Layout'
import { useMinapps } from '@renderer/hooks/useMinapps'
import { Empty, Input } from 'antd'
import { groupBy, isEmpty } from 'lodash'
import React, { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import App from './App'

const AppsPage: FC = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { minapps } = useMinapps()

  const filteredApps = search
    ? minapps.filter(
        (app) => app.name.toLowerCase().includes(search.toLowerCase()) || app.url.includes(search.toLowerCase())
      )
    : minapps

  // 按分组分类，未分组的应用归类到'其他'
  const groupedApps = groupBy(filteredApps, (app) => app.group || t('common.other'))

  // 禁用右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <Container onContextMenu={handleContextMenu}>
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none', justifyContent: 'space-between' }}>
          {t('minapp.title')}
          <Input
            placeholder={t('common.search')}
            className="nodrag"
            style={{ width: '30%', height: 28 }}
            size="small"
            variant="filled"
            suffix={<SearchOutlined />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ width: 80 }} />
        </NavbarCenter>
      </Navbar>
      <ContentContainer id="content-container">
        {isEmpty(filteredApps) ? (
          <Center>
            <Empty />
          </Center>
        ) : (
          <div style={{ width: '100%', maxWidth: 930 }}>
            {Object.entries(groupedApps).map(([groupName, apps]) => (
              <div key={groupName} style={{ marginBottom: 40 }}>
                <GroupTitle>{groupName}</GroupTitle>
                <AppsContainer>
                  {apps.map((app) => (
                    <App key={app.id} app={app} />
                  ))}
                </AppsContainer>
              </div>
            ))}
          </div>
        )}
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
  flex-direction: column;
  align-items: center;
  padding: 30px 50px;
  overflow-y: auto;
`

const AppsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, 90px);
  gap: 25px;
  justify-content: center;
  margin-top: 15px;
`

const GroupTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-soft);
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
  margin-bottom: 15px;
`

export default AppsPage
