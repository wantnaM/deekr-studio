import { Navbar, NavbarMain } from '@renderer/components/app/Navbar'
import App from '@renderer/components/MinApp/MinApp'
import Scrollbar from '@renderer/components/Scrollbar'
import { useMinapps } from '@renderer/hooks/useMinapps'
import { useNavbarPosition } from '@renderer/hooks/useSettings'
import { Button, Empty, Input } from 'antd'
import { groupBy, isEmpty } from 'lodash'
import { Search, SettingsIcon } from 'lucide-react'
import type { FC } from 'react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import MinappSettingsPopup from './MiniappSettings/MinappSettingsPopup'
import NewAppButton from './NewAppButton'

const AppsPage: FC = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { minapps } = useMinapps()
  const { isTopNavbar } = useNavbarPosition()

  const filteredApps = search
    ? minapps.filter(
        (app) => app.name.toLowerCase().includes(search.toLowerCase()) || app.url.includes(search.toLowerCase())
      )
    : minapps

  // 按分组分类，未分组的应用归类到'其他'
  const groupedApps = groupBy(filteredApps, (app) => (app as any).group || '其他')

  // Disable right-click menu in blank area
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  return (
    <Container onContextMenu={handleContextMenu}>
      <Navbar>
        <NavbarMain>
          {t('minapp.title')}
          <Input
            placeholder={t('common.search')}
            className="nodrag"
            style={{
              width: '30%',
              height: 28,
              borderRadius: 15
            }}
            size="small"
            variant="filled"
            suffix={<Search size={18} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            type="text"
            className="nodrag"
            icon={<SettingsIcon size={18} color="var(--color-text-2)" />}
            onClick={MinappSettingsPopup.show}
          />
          <NoticeText>小程序为第三方应用，需要用户自行登录</NoticeText>
        </NavbarMain>
      </Navbar>
      <ContentContainer id="content-container">
        <MainContainer>
          <RightContainer>
            {isTopNavbar && (
              <HeaderContainer>
                <Input
                  placeholder={t('common.search')}
                  className="nodrag"
                  style={{ width: '30%', borderRadius: 15 }}
                  variant="filled"
                  suffix={<Search size={18} />}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button
                  type="text"
                  className="nodrag"
                  icon={<SettingsIcon size={18} color="var(--color-text-2)" />}
                  onClick={() => MinappSettingsPopup.show()}
                />
              </HeaderContainer>
            )}
            <AppsContainerWrapper>
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
                  <NewAppButton />
                </div>
              )}
            </AppsContainerWrapper>
          </RightContainer>
        </MainContainer>
      </ContentContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: center;
  height: 100%;
`

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 60px;
  width: 100%;
  gap: 10px;
`

const MainContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  height: calc(100vh - var(--navbar-height));
  width: 100%;
`

const RightContainer = styled(Scrollbar)`
  display: flex;
  flex: 1 1 0%;
  min-width: 0;
  flex-direction: column;
  height: 100%;
  align-items: center;
  height: calc(100vh - var(--navbar-height));
`

const AppsContainerWrapper = styled(Scrollbar)`
  display: flex;
  flex: 1;
  flex-direction: row;
  justify-content: center;
  padding: 50px 0;
  width: 100%;
  margin-bottom: 20px;
  [navbar-position='top'] & {
    padding: 20px 0;
  }
`

const AppsContainer = styled.div`
  display: grid;
  min-width: 0;
  max-width: 930px;
  margin: 0 20px;
  width: 100%;
  grid-template-columns: repeat(auto-fill, 90px);
  gap: 25px;
  justify-content: center;
`

export default AppsPage

const Center = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`

const GroupTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-soft);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 15px;
`

const NoticeText = styled.div`
  font-size: 12px;
  color: var(--color-text-2);
  position: fixed;
  top: 60px;
  right: 20px;
  z-index: 100;
`
