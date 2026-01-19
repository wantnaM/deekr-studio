import { loggerService } from '@logger'
import type { User } from '@renderer/store/auth'
import { uuid } from '@renderer/utils'

const logger = loggerService.withContext('AuthService')

export interface LoginCredentials {
  username: string
  password: string
  rememberMe: boolean
  autoLogin: boolean
}

export interface LoginResponse {
  user: User
  token: string
}

export interface UserStorageData {
  user: User
  token: string
  rememberedUsername: string
  autoLoginEnabled: boolean
}

export const STORAGE_KEY = 'cherry-studio-auth-data'

class AuthService {
  private static instance: AuthService

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private hashPassword(password: string): string {
    let hash = 0
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash.toString(16)
  }

  private async validateWithApi(username: string, password: string): Promise<LoginResponse | null> {
    try {
      const apiUrl = 'https://api.example.com/auth/login'
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      })

      if (response.ok) {
        const data = await response.json()
        return {
          user: data.user,
          token: data.token
        }
      }
      return null
    } catch (error) {
      logger.warn('API authentication failed, falling back to local validation:', error as Error)
      return null
    }
  }

  private async validateLocally(username: string, password: string): Promise<LoginResponse | null> {
    const stored = this.loadStoredData()
    if (!stored || stored.user.username !== username) {
      return null
    }

    const passwordHash = this.hashPassword(password)
    const expectedHash = window.api?.auth ? await window.api.auth.getPasswordHash(username) : null

    if (expectedHash && passwordHash === expectedHash) {
      return {
        user: stored.user,
        token: stored.token
      }
    }

    return null
  }

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    logger.info(`Attempting login for user: ${credentials.username}`)

    const apiResponse = await this.validateWithApi(credentials.username, credentials.password)
    if (apiResponse) {
      this.saveAuthData({
        user: apiResponse.user,
        token: apiResponse.token,
        rememberedUsername: credentials.rememberMe ? credentials.username : '',
        autoLoginEnabled: credentials.autoLogin
      })
      return apiResponse
    }

    const localResponse = await this.validateLocally(credentials.username, credentials.password)
    if (localResponse) {
      this.saveAuthData({
        user: localResponse.user,
        token: localResponse.token,
        rememberedUsername: credentials.rememberMe ? credentials.username : '',
        autoLoginEnabled: credentials.autoLogin
      })
      return localResponse
    }

    throw new Error('Invalid username or password')
  }

  async register(username: string, password: string, email?: string): Promise<LoginResponse> {
    logger.info(`Registering new user: ${username}`)

    const passwordHash = this.hashPassword(password)

    if (window.api?.auth) {
      await window.api.auth.savePasswordHash(username, passwordHash)
    }

    const user: User = {
      id: uuid(),
      username,
      email,
      displayName: username,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    }

    const token = this.generateToken(user)

    this.saveAuthData({
      user,
      token,
      rememberedUsername: username,
      autoLoginEnabled: true
    })

    logger.info(`User registered successfully: ${username}`)
    return { user, token }
  }

  async autoLogin(): Promise<LoginResponse | null> {
    const stored = this.loadStoredData()
    if (!stored || !stored.autoLoginEnabled || !stored.rememberedUsername) {
      return null
    }

    logger.info(`Attempting auto-login for user: ${stored.rememberedUsername}`)

    const passwordHash = window.api?.auth ? await window.api.auth.getPasswordHash(stored.rememberedUsername) : null

    if (passwordHash && stored.user) {
      stored.user.lastLoginAt = new Date().toISOString()
      this.saveAuthData(stored)

      return {
        user: stored.user,
        token: stored.token
      }
    }

    return null
  }

  logout(): void {
    logger.info('Logging out user')
    this.clearAuthData()
  }

  private generateToken(user: User): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const payload = btoa(
      JSON.stringify({ sub: user.id, username: user.username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })
    )
    const signature = btoa(`${header}.${payload}.secret`)
    return `${header}.${payload}.${signature}`
  }

  private saveAuthData(data: UserStorageData): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      logger.info('Auth data saved to local storage')
    } catch (error) {
      logger.error('Failed to save auth data:', error as Error)
    }
  }

  private loadStoredData(): UserStorageData | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        return JSON.parse(data)
      }
    } catch (error) {
      logger.error('Failed to load auth data:', error as Error)
    }
    return null
  }

  private clearAuthData(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
      logger.info('Auth data cleared from local storage')
    } catch (error) {
      logger.error('Failed to clear auth data:', error as Error)
    }
  }

  getRememberedUsername(): string | null {
    const stored = this.loadStoredData()
    return stored?.rememberedUsername || null
  }

  isAutoLoginEnabled(): boolean {
    const stored = this.loadStoredData()
    return stored?.autoLoginEnabled || false
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      const [, payload] = token.split('.')
      const decoded = JSON.parse(atob(payload))
      return decoded.exp > Date.now()
    } catch {
      return false
    }
  }
}

export default AuthService.getInstance()
