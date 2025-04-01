import { SearchOutlined } from '@ant-design/icons'
import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import { Center } from '@renderer/components/Layout'
import { useMinapps } from '@renderer/hooks/useMinapps'
import { SubjectTypes } from '@renderer/types'
import { Empty, Input, Tag } from 'antd'
import { groupBy, isEmpty } from 'lodash'
import React, { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import App from './App'

const AppsPage: FC = () => {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<SubjectTypes | null>(null)
  const { minapps } = useMinapps()

  const filteredApps = search
    ? minapps.filter(
        (app) => app.name.toLowerCase().includes(search.toLowerCase()) || app.url.includes(search.toLowerCase())
      )
    : minapps

  // 按学科筛选
  const subjectFilteredApps = selectedSubject
    ? filteredApps.filter((app) => app.subject?.includes(selectedSubject))
    : filteredApps

  // 按分组分类，未分组的应用归类到'其他'
  const groupedApps = groupBy(subjectFilteredApps, (app) => app.group || t('common.other'))

  // 禁用右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
  }

  // 获取所有学科枚举值
  const allSubjects = Object.values(SubjectTypes)

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
        {/* 学科标签筛选区域 */}
        <SubjectFilterContainer>
          <SubjectRow>
            {/* "全部"标签放在第一行第一个位置 */}
            <Tag
              color={!selectedSubject ? 'blue' : 'default'}
              onClick={() => setSelectedSubject(null)}
              style={{ cursor: 'pointer' }}>
              {t('minapp.all')}
            </Tag>
            {/* 第一行显示前8个学科标签 */}
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
          {/* 第二行显示剩余的学科标签 */}
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

        {isEmpty(subjectFilteredApps) ? (
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

export default AppsPage
