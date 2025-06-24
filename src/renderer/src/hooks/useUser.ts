import { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  setAccessToken,
  setRefreshToken,
  setUserConfigStatus as _setUserConfigStatus,
  setUserState as _setUserState,
  UserState
} from '@renderer/store/user'

export function useUser() {
  const user = useAppSelector((state) => state.user)
  const dispatch = useAppDispatch()

  return {
    ...user,
    removeToken() {
      dispatch(setAccessToken(''))
      dispatch(setRefreshToken(''))
    },
    setToken(accessToken: string, refreshToken: string) {
      dispatch(setAccessToken(accessToken))
      dispatch(setRefreshToken(refreshToken))
    },
    setUserConfigStatus(key: string, success: boolean) {
      dispatch(_setUserConfigStatus({ key, success }))
    },
    setUserState(user: UserState) {
      dispatch(_setUserState(user))
    }
  }
}
