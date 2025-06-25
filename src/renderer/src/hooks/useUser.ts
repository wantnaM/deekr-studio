import store, { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  setAccessToken,
  setClassroom,
  setExpiresTime,
  setGrade,
  setIsLoggedIn,
  setMobile,
  setNickname,
  setRefreshToken,
  setSchool,
  setSubject,
  setType,
  setUserConfigStatus as _setUserConfigStatus,
  setUserId,
  setUsername,
  UserState
} from '@renderer/store/user'

export function useUser() {
  const user = useAppSelector((state) => state.user)
  const dispatch = useAppDispatch()

  return {
    ...user,
    setUserConfigStatus(key: string, success: boolean) {
      dispatch(_setUserConfigStatus({ key, success }))
    },
    setUserState(user: UserState) {
      dispatch(setNickname(user.nickname))
      dispatch(setUserId(user.userId))
      dispatch(setUsername(user.username))
      dispatch(setMobile(user.mobile))
      dispatch(setSchool(user.school))
      dispatch(setSubject(user.subject))
      dispatch(setGrade(user.grade))
      dispatch(setClassroom(user.classroom))
      dispatch(setAccessToken(user.accessToken))
      dispatch(setRefreshToken(user.refreshToken))
      dispatch(setExpiresTime(user.expiresTime))
      dispatch(setIsLoggedIn(user.isLoggedIn))
      dispatch(setType(user.type))
      dispatch(_setUserConfigStatus({ key: 'model', success: user.configStatus.model }))
      dispatch(_setUserConfigStatus({ key: 'agent', success: user.configStatus.agent }))
      dispatch(_setUserConfigStatus({ key: 'topic', success: user.configStatus.topic }))
      dispatch(_setUserConfigStatus({ key: 'miniApp', success: user.configStatus.miniApp }))
    },
    setLoginInfo(user: any) {
      dispatch(setUserId(user.userId))
      dispatch(setUsername(user.username))
      dispatch(setIsLoggedIn(true))
      dispatch(setType(user.type))
      dispatch(setAccessToken(user.accessToken))
      dispatch(setRefreshToken(user.refreshToken))
      dispatch(setExpiresTime(user.expiresTime))
    },
    setUserInfo(user: any) {
      dispatch(setNickname(user.nickname))
      dispatch(setMobile(user.mobile))
      dispatch(setSchool(user.school))
      dispatch(setSubject(user.subject))
      dispatch(setGrade(user.grade))
      dispatch(setClassroom(user.classroom))
    }
  }
}

export const getAccessToken = () => {
  return store.getState().user.accessToken
}

export const getRefreshToken = () => {
  return store.getState().user.refreshToken
}

export const removeToken = () => {
  store.dispatch(setAccessToken(''))
  store.dispatch(setRefreshToken(''))
}

export const setToken = (accessToken: string, refreshToken: string) => {
  store.dispatch(setAccessToken(accessToken))
  store.dispatch(setRefreshToken(refreshToken))
}
