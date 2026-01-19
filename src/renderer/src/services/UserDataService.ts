import { loggerService } from '@logger'
import type { User } from '@renderer/store/auth'

const logger = loggerService.withContext('UserDataService')

export interface UserDataConfig {
  userId: string
  userName: string
}

class UserDataService {
  private static instance: UserDataService

  private currentUser: UserDataConfig | null = null
  private currentUserId: string | null = null

  private constructor() {}

  static getInstance(): UserDataService {
    if (!UserDataService.instance) {
      UserDataService.instance = new UserDataService()
    }
    return UserDataService.instance
  }

  setCurrentUser(user: User): void {
    this.currentUser = {
      userId: user.id,
      userName: user.username
    }
    this.currentUserId = user.id
    this.saveUserSettings(user)
    logger.info(`Current user set: ${user.username}, ${user.id}`)
  }

  getCurrentUserId(): string | null {
    return this.currentUserId
  }

  getCurrentUser(): UserDataConfig | null {
    return this.currentUser
  }

  getUserDataPrefix(): string {
    const userId = this.getCurrentUserId()
    return userId ? `user_${userId}_` : ''
  }

  clearCurrentUser(): void {
    this.currentUser = null
    this.currentUserId = null
    this.clearUserSettings()
    logger.info('Current user cleared')
  }

  private saveUserSettings(user: User): void {
    try {
      localStorage.setItem(
        'currentUser',
        JSON.stringify({
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          avatar: user.avatar,
          createdAt: user.createdAt,
          lastLoginAt: new Date().toISOString()
        })
      )
    } catch (error) {
      logger.error('Failed to save user settings:', error as Error)
    }
  }

  private clearUserSettings(): void {
    try {
      localStorage.removeItem('currentUser')
    } catch (error) {
      logger.error('Failed to clear user settings:', error as Error)
    }
  }

  loadUserSettings(): UserDataConfig | null {
    try {
      const saved = localStorage.getItem('currentUser')
      if (saved) {
        const user = JSON.parse(saved)
        this.currentUser = {
          userId: user.id,
          userName: user.username
        }
        this.currentUserId = user.id
        return this.currentUser
      }
    } catch (error) {
      logger.error('Failed to load user settings:', error as Error)
    }
    return null
  }

  getUserSpecificKey(baseKey: string): string {
    const prefix = this.getUserDataPrefix()
    return prefix + baseKey
  }

  getUserSpecificStateKey(sliceName: string): string {
    const prefix = this.getUserDataPrefix()
    return prefix + sliceName
  }
}

export default UserDataService.getInstance()
