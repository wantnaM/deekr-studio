import store, { useAppSelector } from '@renderer/store'
import { setAccessToken, setRefreshToken } from '@renderer/store/auth'

export function useAuth() {
  const auth = useAppSelector((state) => state.auth)
  return {
    ...auth
  }
}

export const getAccessToken = () => {
  return store.getState().auth.accessToken
}

export const getRefreshToken = () => {
  return store.getState().auth.refreshToken
}

export const removeToken = () => {
  store.dispatch(setAccessToken(''))
  store.dispatch(setRefreshToken(''))
}

export const setToken = (accessToken: string, refreshToken: string) => {
  store.dispatch(setAccessToken(accessToken))
  store.dispatch(setRefreshToken(refreshToken))
}
