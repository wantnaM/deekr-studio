import { loggerService } from '@logger'
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

const logger = loggerService.withContext('AuthStore')

export interface User {
  id: string
  username: string
  email?: string
  displayName?: string
  avatar?: string
  createdAt?: string
  lastLoginAt?: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  rememberMe: boolean
  autoLogin: boolean
  isLoading: boolean
  error: string | null
}

export const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  rememberMe: false,
  autoLogin: false,
  isLoading: false,
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
    setRememberMe: (state, action: PayloadAction<boolean>) => {
      state.rememberMe = action.payload
    },
    setAutoLogin: (state, action: PayloadAction<boolean>) => {
      state.autoLogin = action.payload
    },
    loginStart: (state) => {
      state.isLoading = true
      state.error = null
    },
    loginSuccess: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.isAuthenticated = true
      state.user = action.payload.user
      state.token = action.payload.token
      state.isLoading = false
      state.error = null
      logger.info(`User logged in successfully: ${action.payload.user.username}`)
    },
    loginFailure: (state, action: PayloadAction<string>) => {
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.isLoading = false
      state.error = action.payload
      logger.error(`Login failed: ${action.payload}`)
    },
    logout: (state) => {
      const username = state.user?.username
      state.isAuthenticated = false
      state.user = null
      state.token = null
      state.isLoading = false
      state.error = null
      logger.info(`User logged out: ${username}`)
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload
    }
  }
})

export const {
  setAuthLoading,
  setAuthError,
  setRememberMe,
  setAutoLogin,
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  updateUser,
  setToken
} = authSlice.actions

export default authSlice.reducer
