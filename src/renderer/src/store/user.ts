import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface UserState {
  userId: string | number
  username: string
  nickname: string
  mobile: string
  school: string
  subject: string
  grade: string
  classroom: string
  accessToken: string | null
  refreshToken: string | null
  expiresTime: number | null
  isLoggedIn: boolean
  configStatus: {
    model: boolean
    agent: boolean
    topic: boolean
    miniApp: boolean
  }
  type: number | null
}

const initialState: UserState = {
  isLoggedIn: false,
  userId: '',
  username: '',
  nickname: '',
  mobile: '',
  school: '',
  subject: '',
  grade: '',
  classroom: '',
  accessToken: null,
  refreshToken: null,
  expiresTime: null,
  configStatus: {
    model: false,
    agent: false,
    topic: false,
    miniApp: false
  },
  type: null
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setNickname: (state, action: PayloadAction<string>) => {
      state.nickname = action.payload
    },
    setUserConfigStatus: (state, action: PayloadAction<{ key: string; success: boolean }>) => {
      state.configStatus[action.payload.key] = action.payload.success
    },
    setUserId: (state, action: PayloadAction<string | number>) => {
      state.userId = action.payload
    },
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload
    },
    setMobile: (state, action: PayloadAction<string>) => {
      state.mobile = action.payload
    },
    setSchool: (state, action: PayloadAction<string>) => {
      state.school = action.payload
    },
    setSubject: (state, action: PayloadAction<string>) => {
      state.subject = action.payload
    },
    setGrade: (state, action: PayloadAction<string>) => {
      state.grade = action.payload
    },
    setClassroom: (state, action: PayloadAction<string>) => {
      state.classroom = action.payload
    },
    setAccessToken: (state, action: PayloadAction<string | null>) => {
      state.accessToken = action.payload
    },
    setRefreshToken: (state, action: PayloadAction<string | null>) => {
      state.refreshToken = action.payload
    },
    setExpiresTime: (state, action: PayloadAction<number | null>) => {
      state.expiresTime = action.payload
    },
    setIsLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.isLoggedIn = action.payload
    },
    setType: (state, action: PayloadAction<number | null>) => {
      state.type = action.payload
    }
  }
})

export const {
  setNickname,
  setUserConfigStatus,
  setUserId,
  setUsername,
  setMobile,
  setSchool,
  setSubject,
  setGrade,
  setClassroom,
  setAccessToken,
  setRefreshToken,
  setExpiresTime,
  setIsLoggedIn,
  setType
} = userSlice.actions

export default userSlice.reducer
