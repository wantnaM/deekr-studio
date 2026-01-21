import { loggerService } from '@logger'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

const logger = loggerService.withContext('AuthStore')

export interface User {
  id: number
  username: string
  nickname: string | null
  mobile: string | null
  school: string | null
  subject: string | null
  grade: string | null
  classroom: string | null
  type: number | null
}

export interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  expiresTime: number | null
  error: string | null
}

export const initialState: AuthState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresTime: null,
  error: null
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string; expiresTime: number }>
    ) => {
      state.isAuthenticated = true
      state.user = action.payload.user
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.expiresTime = action.payload.expiresTime
      state.isLoading = false
      state.error = null
      logger.info(`User logged in successfully: ${action.payload.user.username}`)
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.expiresTime = null
      state.isLoading = false
      state.error = action.payload
      logger.error(`Login failed: ${action.payload}`)
    },
    logout: (state) => {
      const username = state.user?.username
      state.isAuthenticated = false
      state.user = null
      state.accessToken = null
      state.refreshToken = null
      state.expiresTime = null
      state.isLoading = false
      state.error = null
      logger.info(`User logged out: ${username}`)
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload
    },
    setRefreshToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload
    }
  }
})

export const {
  setAuthLoading,
  setAuthError,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  setAccessToken,
  setRefreshToken
} = authSlice.actions

export default authSlice.reducer
