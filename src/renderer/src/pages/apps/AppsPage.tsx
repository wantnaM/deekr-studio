import { Navbar, NavbarMain } from '@renderer/components/app/Navbar'
import { useMinapps } from '@renderer/hooks/useMinapps'
import { Button, Input } from 'antd'
import { Search, SettingsIcon, X } from 'lucide-react'
import React, { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router'
import styled from 'styled-components'

import App from './App'
import MiniAppSettings from './MiniappSettings/MiniAppSettings'
import NewAppButton from './NewAppButton'

const AppsPage: FC = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const { minapps } = useMinapps()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const location = useLocation()

  const filteredApps = search
    ? minapps.filter(
        (app) => app.name.toLowerCase().includes(search.toLowerCase()) || app.url.includes(search.toLowerCase())
      )
    : minapps

  // Calculate the required number of lines
  const itemsPerRow = Math.floor(930 / 115) // Maximum width divided by the width of each item (including spacing)
  const rowCount = Math.ceil((filteredApps.length + 1) / itemsPerRow) // +1 for the add button
  // Each line height is 85px (60px icon + 5px margin + 12px text + spacing)
  const containerHeight = rowCount * 85 + (rowCount - 1) * 25 // 25px is the line spacing.

  // 禁用右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  useEffect(() => {
    setIsSettingsOpen(false)
  }, [location.key])

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
              borderRadius: 15,
              position: 'absolute',
              left: '50vw',
              transform: 'translateX(-50%)'
            }}
            size="small"
            variant="filled"
            suffix={<Search size={18} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isSettingsOpen}
          />
          <Button
            type="text"
            className="nodrag"
            icon={isSettingsOpen ? <X size={18} /> : <SettingsIcon size={18} color="var(--color-text-2)" />}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          />
        </NavbarMain>
      </Navbar>
      <ContentContainer id="content-container">
        {isSettingsOpen && <MiniAppSettings />}
        {!isSettingsOpen && (
          <AppsContainer style={{ height: containerHeight }}>
            {filteredApps.map((app) => (
              <App key={app.id} app={app} />
            ))}
            <NewAppButton />
          </AppsContainer>
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

// const GroupTitle = styled.div`
//   font-size: 16px;
//   font-weight: 600;
//   color: var(--color-text-soft);
//   padding-bottom: 8px;
//   border-bottom: 1px solid #eee;
//   margin-bottom: 15px;
// `

// const SubjectFilterContainer = styled.div`
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   margin-bottom: 20px;
//   width: 100%;
//   max-width: 930px;
// `

// const SubjectRow = styled.div`
//   display: flex;
//   justify-content: center;
//   flex-wrap: wrap;
//   gap: 8px;
//   width: 100%;
//   margin-bottom: 8px;
// `

export default AppsPage
