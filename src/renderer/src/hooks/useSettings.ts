import store, { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  AssistantIconType,
  SendMessageShortcut,
  setAssistantIconType,
  setAutoCheckUpdate as _setAutoCheckUpdate,
  setEarlyAccess as _setEarlyAccess,
  setLaunchOnBoot,
  setLaunchToTray,
  setPinTopicsToTop,
  setSendMessageShortcut as _setSendMessageShortcut,
  setShowTokens,
  setSidebarIcons,
  setTargetLanguage,
  setTheme,
  SettingsState,
  setTopicPosition,
  setTray as _setTray,
  setTrayOnClose,
  setUserConfigStatus,
  setUserState,
  setWindowStyle
} from '@renderer/store/settings'
import { SidebarIcon, ThemeMode, TranslateLanguageVarious } from '@renderer/types'
import { FeedUrl } from '@shared/config/constant'

export function useSettings() {
  const settings = useAppSelector((state) => state.settings)
  const dispatch = useAppDispatch()

  return {
    ...settings,
    setSendMessageShortcut(shortcut: SendMessageShortcut) {
      dispatch(_setSendMessageShortcut(shortcut))
    },

    setLaunch(isLaunchOnBoot: boolean | undefined, isLaunchToTray: boolean | undefined = undefined) {
      if (isLaunchOnBoot !== undefined) {
        dispatch(setLaunchOnBoot(isLaunchOnBoot))
        window.api.setLaunchOnBoot(isLaunchOnBoot)
      }

      if (isLaunchToTray !== undefined) {
        dispatch(setLaunchToTray(isLaunchToTray))
        window.api.setLaunchToTray(isLaunchToTray)
      }
    },

    setTray(isShowTray: boolean | undefined, isTrayOnClose: boolean | undefined = undefined) {
      if (isShowTray !== undefined) {
        dispatch(_setTray(isShowTray))
        window.api.setTray(isShowTray)
      }
      if (isTrayOnClose !== undefined) {
        dispatch(setTrayOnClose(isTrayOnClose))
        window.api.setTrayOnClose(isTrayOnClose)
      }
    },

    setAutoCheckUpdate(isAutoUpdate: boolean) {
      dispatch(_setAutoCheckUpdate(isAutoUpdate))
      window.api.setAutoUpdate(isAutoUpdate)
    },

    setEarlyAccess(isEarlyAccess: boolean) {
      dispatch(_setEarlyAccess(isEarlyAccess))
      window.api.setFeedUrl(isEarlyAccess ? FeedUrl.EARLY_ACCESS : FeedUrl.PRODUCTION)
    },

    setTheme(theme: ThemeMode) {
      dispatch(setTheme(theme))
    },
    setWindowStyle(windowStyle: 'transparent' | 'opaque') {
      dispatch(setWindowStyle(windowStyle))
    },
    setTargetLanguage(targetLanguage: TranslateLanguageVarious) {
      dispatch(setTargetLanguage(targetLanguage))
    },
    setTopicPosition(topicPosition: 'left' | 'right') {
      dispatch(setTopicPosition(topicPosition))
    },
    setPinTopicsToTop(pinTopicsToTop: boolean) {
      dispatch(setPinTopicsToTop(pinTopicsToTop))
    },
    updateSidebarIcons(icons: { visible: SidebarIcon[]; disabled: SidebarIcon[] }) {
      dispatch(setSidebarIcons(icons))
    },
    updateSidebarVisibleIcons(icons: SidebarIcon[]) {
      dispatch(setSidebarIcons({ visible: icons }))
    },
    updateSidebarDisabledIcons(icons: SidebarIcon[]) {
      dispatch(setSidebarIcons({ disabled: icons }))
    },
    setAssistantIconType(assistantIconType: AssistantIconType) {
      dispatch(setAssistantIconType(assistantIconType))
    },
    setUserConfigStatus(key: string, success: boolean) {
      dispatch(setUserConfigStatus({ key, success }))
    },
    setShowTokens(showTokens: boolean) {
      dispatch(setShowTokens(showTokens))
    }
  }
}

export function useMessageStyle() {
  const { messageStyle } = useSettings()
  const isBubbleStyle = messageStyle === 'bubble'

  return {
    isBubbleStyle
  }
}

export const getStoreSetting = (key: keyof SettingsState) => {
  return store.getState().settings[key]
}

export const getAccessToken = () => {
  return store.getState().settings.user.accessToken
}

export const getRefreshToken = () => {
  return store.getState().settings.user.refreshToken
}

// 新增：直接导出的 token 操作函数
export const removeToken = () => {
  store.dispatch(setUserState({ accessToken: '', refreshToken: '' }))
}

export const setToken = (accessToken: string, refreshToken: string) => {
  store.dispatch(setUserState({ accessToken, refreshToken }))
}
