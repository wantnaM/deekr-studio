import { loggerService } from '@logger'
import type { Assistant, MinAppType, Model, Provider, Topic } from '@renderer/types'
import request from '@renderer/utils/axios'
const logger = loggerService.withContext('UserDataService')

export interface UserDataConfig {
  userId: number
  assistants: Assistant[]
  providers: Provider[]
  topics?: Topic[]
  miniApps?: MinAppType[]
  defaultModel: Model
  quickModel: Model
  translateModel: Model
}

class UserDataService {
  private static instance: UserDataService

  private currentConfig: UserDataConfig | null = null
  private currentUserId: number | null = null

  private constructor() {}

  static getInstance(): UserDataService {
    if (!UserDataService.instance) {
      UserDataService.instance = new UserDataService()
    }
    return UserDataService.instance
  }

  async getDataConfigWithApi(userId: number): Promise<void> {
    const response = await request.get({
      url: `/ds/config/get-by-user?id=${userId}`
    })
    const configData = JSON.parse(response.info)

    this.currentConfig = {
      userId,
      assistants: [],
      providers: configData.llm?.providers || [],
      topics: [],
      miniApps: [],
      defaultModel: configData.llm?.defaultModel || null,
      quickModel: configData.llm?.topicNamingModel || null,
      translateModel: configData.llm?.translateModel || null
    }

    console.log(this.currentConfig)

    this.currentUserId = userId
  }

  getCurrentUserId(): number | null {
    return this.currentUserId
  }

  getCurrentUser(): UserDataConfig | null {
    return this.currentConfig
  }

  clearCurrentUser(): void {
    this.currentConfig = null
    this.currentUserId = null
    logger.info('Current user cleared')
  }

  async getAssistants(userId: number): Promise<Assistant[]> {
    const response = await request.get({
      url: `/ds/agent/list?creator=${userId}`
    })
    return response || []
  }

  async createAssistant(assistant: Assistant): Promise<Assistant> {
    const response = await request.post({
      url: `/ds/agent/create`,
      data: assistant
    })
    return response
  }

  async updateAssistant(assistant: Assistant): Promise<Assistant> {
    const response = await request.put({
      url: `/ds/agent/update-by-id`,
      data: assistant
    })
    return response
  }

  async deleteAssistant(id: string): Promise<void> {
    await request.delete({ url: `/ds/agent/delete-by-id?id=${id}` })
  }

  async syncAssistantsToStudents(data: any): Promise<void> {
    await request.post({ url: `/ds/agent/sync-to-students`, data })
  }
}

export default UserDataService.getInstance()
