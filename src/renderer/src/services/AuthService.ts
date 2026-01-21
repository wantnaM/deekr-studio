import { loggerService } from '@logger'
import type { User } from '@renderer/store/auth'
import request from '@renderer/utils/axios'

const logger = loggerService.withContext('AuthService')

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterCredentials {
  username: string
  nickname: string
  mobile: string
  school: string
  subject: string
  grade: string
  classroom: string
  type: number
}

export interface LoginResponse {
  userId: number
  accessToken: string
  refreshToken: string
  expiresTime: number
  type: number
}

class AuthService {
  private static instance: AuthService

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    logger.info(`Attempting login for user: ${credentials.username}`)

    return await request.post({
      url: `/system/auth/login`,
      data: {
        username: credentials.username,
        password: credentials.password
      }
    })
  }

  async register(credentials: RegisterCredentials): Promise<any> {
    logger.info(`Registering new user: ${credentials.username}`)

    return await request.post({ url: `/ds/user-audit/register`, data: credentials })
  }

  async logout(): Promise<any> {
    logger.info('Logging out user')

    return await request.post({
      url: `/system/auth/logout`
    })
  }

  async getUserProfile(): Promise<User> {
    logger.info(`Fetching user profile for user`)

    const response = await request.get({
      url: `/system/user/profile/get`
    })

    return response
  }
}

export default AuthService.getInstance()
