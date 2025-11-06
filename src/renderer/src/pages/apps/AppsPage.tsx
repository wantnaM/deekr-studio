import { Navbar, NavbarMain } from '@renderer/components/app/Navbar'
import { Center } from '@renderer/components/Layout'
import { useMinapps } from '@renderer/hooks/useMinapps'
import { SubjectTypes } from '@renderer/types'
import { Button, Empty, Input, Tag } from 'antd'
import { groupBy, isEmpty } from 'lodash'
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
  const [selectedSubject, setSelectedSubject] = useState<SubjectTypes | null>(null)
  const allSubjects = Object.values(SubjectTypes)

  const filteredApps = minapps.filter((app) => {
    const matchesSearch = search
      ? app.name.toLowerCase().includes(search.toLowerCase()) || app.url.includes(search.toLowerCase())
      : true

    const matchesSubject = selectedSubject ? (app.subject ? app.subject.includes(selectedSubject) : false) : true

    return matchesSearch && matchesSubject
  })

  // Calculate the required number of lines
  // const itemsPerRow = Math.floor(930 / 115) // Maximum width divided by the width of each item (including spacing)
  // const rowCount = Math.ceil((filteredApps.length + 1) / itemsPerRow) // +1 for the add button
  // Each line height is 85px (60px icon + 5px margin + 12px text + spacing)
  // const containerHeight = rowCount * 85 + (rowCount - 1) * 25 // 25px is the line spacing.

  // Disable right-click menu in blank area
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  // 按学科筛选
  const subjectFilteredApps = selectedSubject
    ? filteredApps.filter((app) => app.subject?.includes(selectedSubject))
    : filteredApps

  // 按分组分类，未分组的应用归类到'其他'
  const groupedApps = groupBy(subjectFilteredApps, (app) => app.group || t('common.other'))

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
          <>
            <SubjectFilterContainer>
              <SubjectRow>
                <Tag
                  color={!selectedSubject ? 'blue' : 'default'}
                  onClick={() => setSelectedSubject(null)}
                  style={{ cursor: 'pointer' }}>
                  {t('minapp.all')}
                </Tag>
                {allSubjects.slice(0, 9).map((subject) => (
                  <Tag
                    key={subject}
                    color={selectedSubject === subject ? 'blue' : 'default'}
                    onClick={() => setSelectedSubject(subject)}
                    style={{ cursor: 'pointer' }}>
                    {subject}
                  </Tag>
                ))}
              </SubjectRow>
              {allSubjects.length > 9 && (
                <SubjectRow>
                  {allSubjects.slice(9).map((subject) => (
                    <Tag
                      key={subject}
                      color={selectedSubject === subject ? 'blue' : 'default'}
                      onClick={() => setSelectedSubject(subject)}
                      style={{ cursor: 'pointer' }}>
                      {subject}
                    </Tag>
                  ))}
                </SubjectRow>
              )}
            </SubjectFilterContainer>

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
          </>
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
  min-width: 0;
  max-width: 930px;
  width: 100%;
  grid-template-columns: repeat(auto-fill, 90px);
  gap: 25px;
  justify-content: center;
`

const SubjectFilterContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  width: 100%;
  max-width: 930px;
`

const SubjectRow = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 8px;
  width: 100%;
  margin-bottom: 8px;
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
