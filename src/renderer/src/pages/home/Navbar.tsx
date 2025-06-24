import { Navbar, NavbarLeft, NavbarRight } from '@renderer/components/app/Navbar'
import { HStack } from '@renderer/components/Layout'
import FloatingSidebar from '@renderer/components/Popups/FloatingSidebar'
import MinAppsPopover from '@renderer/components/Popups/MinAppsPopover'
import SearchPopup from '@renderer/components/Popups/SearchPopup'
import { isMac } from '@renderer/config/constant'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { useFullscreen } from '@renderer/hooks/useFullscreen'
import { modelGenerating } from '@renderer/hooks/useRuntime'
import { useSettings } from '@renderer/hooks/useSettings'
import { useShortcut } from '@renderer/hooks/useShortcuts'
import { useShowAssistants, useShowTopics } from '@renderer/hooks/useStore'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { useAppDispatch } from '@renderer/store'
import { setNarrowMode } from '@renderer/store/settings'
import { Assistant, Topic } from '@renderer/types'
import { Tooltip } from 'antd'
import { t } from 'i18next'
import { LayoutGrid, MessageSquareDiff, PanelLeftClose, PanelRightClose, Search } from 'lucide-react'
import { FC, useCallback, useState } from 'react'
import styled from 'styled-components'

import SelectModelButton from './components/SelectModelButton'
import UpdateAppButton from './components/UpdateAppButton'

interface Props {
  activeAssistant: Assistant
  activeTopic: Topic
  setActiveTopic: (topic: Topic) => void
  setActiveAssistant: (assistant: Assistant) => void
  position: 'left' | 'right'
}

const HeaderNavbar: FC<Props> = ({ activeAssistant, setActiveAssistant, activeTopic, setActiveTopic }) => {
  const { assistant } = useAssistant(activeAssistant.id)
  const { showAssistants, toggleShowAssistants } = useShowAssistants()
  const isFullscreen = useFullscreen()
  const { topicPosition, sidebarIcons, narrowMode } = useSettings()
  const { showTopics, toggleShowTopics } = useShowTopics()
  const dispatch = useAppDispatch()
  const [sidebarHideCooldown, setSidebarHideCooldown] = useState(false)

  // Function to toggle assistants with cooldown
  const handleToggleShowAssistants = useCallback(() => {
    if (showAssistants) {
      // When hiding sidebar, set cooldown
      toggleShowAssistants()
      setSidebarHideCooldown(true)
      // setTimeout(() => {
      //   setSidebarHideCooldown(false)
      // }, 10000) // 10 seconds cooldown
    } else {
      // When showing sidebar, no cooldown needed
      toggleShowAssistants()
    }
  }, [showAssistants, toggleShowAssistants])
  const handleToggleShowTopics = useCallback(() => {
    if (showTopics) {
      // When hiding sidebar, set cooldown
      toggleShowTopics()
      setSidebarHideCooldown(true)
      // setTimeout(() => {
      //   setSidebarHideCooldown(false)
      // }, 10000) // 10 seconds cooldown
    } else {
      // When showing sidebar, no cooldown needed
      toggleShowTopics()
    }
  }, [showTopics, toggleShowTopics])

  useShortcut('toggle_show_assistants', handleToggleShowAssistants)

  useShortcut('toggle_show_topics', () => {
    if (topicPosition === 'right') {
      toggleShowTopics()
    } else {
      EventEmitter.emit(EVENT_NAMES.SHOW_TOPIC_SIDEBAR)
    }
  })

  useShortcut('search_message', () => {
    SearchPopup.show()
  })

  const handleNarrowModeToggle = async () => {
    await modelGenerating()
    dispatch(setNarrowMode(!narrowMode))
  }

  return (
    <Navbar className="home-navbar">
      {showAssistants && (
        <NavbarLeft style={{ justifyContent: 'space-between', borderRight: 'none', padding: 0 }}>
          <Tooltip title={t('navbar.hide_sidebar')} mouseEnterDelay={0.8}>
            <NavbarIcon onClick={handleToggleShowAssistants} style={{ marginLeft: isMac && !isFullscreen ? 16 : 0 }}>
              <PanelLeftClose size={18} />
            </NavbarIcon>
          </Tooltip>
          <Tooltip title={t('settings.shortcuts.new_topic')} mouseEnterDelay={0.8}>
            <NavbarIcon onClick={() => EventEmitter.emit(EVENT_NAMES.ADD_NEW_TOPIC)} style={{ marginRight: 5 }}>
              <MessageSquareDiff size={18} />
            </NavbarIcon>
          </Tooltip>
        </NavbarLeft>
      )}
      <NavbarRight style={{ justifyContent: 'space-between', flex: 1 }} className="home-navbar-right">
        <HStack alignItems="center">
          {!showAssistants && !sidebarHideCooldown && (
            <FloatingSidebar
              activeAssistant={assistant}
              setActiveAssistant={setActiveAssistant}
              activeTopic={activeTopic}
              setActiveTopic={setActiveTopic}
              position={'left'}>
              <Tooltip title={t('navbar.show_sidebar')} mouseEnterDelay={2}>
                <NavbarIcon
                  onClick={() => toggleShowAssistants()}
                  style={{ marginRight: 8, marginLeft: isMac && !isFullscreen ? 4 : -12 }}>
                  <PanelRightClose size={18} />
                </NavbarIcon>
              </Tooltip>
            </FloatingSidebar>
          )}
          {!showAssistants && sidebarHideCooldown && (
            <Tooltip title={t('navbar.show_sidebar')} mouseEnterDelay={0.8}>
              <NavbarIcon
                onClick={() => toggleShowAssistants()}
                style={{ marginRight: 8, marginLeft: isMac && !isFullscreen ? 4 : -12 }}
                onMouseOut={() => setSidebarHideCooldown(false)}>
                <PanelRightClose size={18} />
              </NavbarIcon>
            </Tooltip>
          )}
          <SelectModelButton assistant={assistant} />
        </HStack>
        <HStack alignItems="center" gap={8}>
          <UpdateAppButton />
          <Tooltip title={t('chat.assistant.search.placeholder')} mouseEnterDelay={0.8}>
            <NarrowIcon onClick={() => SearchPopup.show()}>
              <Search size={18} />
            </NarrowIcon>
          </Tooltip>
          <Tooltip title={t('navbar.expand')} mouseEnterDelay={0.8}>
            <NarrowIcon onClick={handleNarrowModeToggle}>
              <i className="iconfont icon-icon-adaptive-width"></i>
            </NarrowIcon>
          </Tooltip>
          {sidebarIcons.visible.includes('minapp') && (
            <MinAppsPopover>
              <Tooltip title={t('minapp.title')} mouseEnterDelay={0.8}>
                <NarrowIcon>
                  <LayoutGrid size={18} />
                </NarrowIcon>
              </Tooltip>
            </MinAppsPopover>
          )}
          {topicPosition === 'right' && !showTopics && !sidebarHideCooldown && (
            <FloatingSidebar
              activeAssistant={assistant}
              setActiveAssistant={setActiveAssistant}
              activeTopic={activeTopic}
              setActiveTopic={setActiveTopic}
              position={'right'}>
              <Tooltip title={t('navbar.show_sidebar')} mouseEnterDelay={2}>
                <NavbarIcon onClick={() => toggleShowTopics()}>
                  <PanelLeftClose size={18} />
                </NavbarIcon>
              </Tooltip>
            </FloatingSidebar>
          )}
          {topicPosition === 'right' && !showTopics && sidebarHideCooldown && (
            <Tooltip title={t('navbar.show_sidebar')} mouseEnterDelay={2}>
              <NavbarIcon onClick={() => toggleShowTopics()} onMouseOut={() => setSidebarHideCooldown(false)}>
                <PanelLeftClose size={18} />
              </NavbarIcon>
            </Tooltip>
          )}
          {topicPosition === 'right' && showTopics && (
            <Tooltip title={t('navbar.hide_sidebar')} mouseEnterDelay={2}>
              <NavbarIcon onClick={() => handleToggleShowTopics()}>
                <PanelRightClose size={18} />
              </NavbarIcon>
            </Tooltip>
          )}
        </HStack>
      </NavbarRight>
    </Navbar>
  )
}

export const NavbarIcon = styled.div`
  -webkit-app-region: none;
  border-radius: 8px;
  height: 30px;
  padding: 0 7px;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
  .iconfont {
    font-size: 18px;
    color: var(--color-icon);
    &.icon-a-addchat {
      font-size: 20px;
    }
    &.icon-a-darkmode {
      font-size: 20px;
    }
    &.icon-appstore {
      font-size: 20px;
    }
  }
  .anticon {
    color: var(--color-icon);
    font-size: 16px;
  }
  &:hover {
    background-color: var(--color-background-mute);
    color: var(--color-icon-white);
  }
`

const NarrowIcon = styled(NavbarIcon)`
  @media (max-width: 1000px) {
    display: none;
  }
`

export default HeaderNavbar
