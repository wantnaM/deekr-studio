import store from '@renderer/store'
import { setAssistantPresets } from '@renderer/store/assistants'
import type { AssistantPreset, MinAppType, Model, Provider, Topic } from '@renderer/types'
import request from '@renderer/utils/axios'

export interface UserDataConfig {
  userId: number
  assistants: AssistantPreset[]
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

    this.currentUserId = userId

    await this.loadAssistantsConfig(userId)
  }

  async loadAssistantsConfig(userId: number): Promise<void> {
    const presets = await this.getAssistants(userId)
    // 更新我的助手
    store.dispatch(setAssistantPresets(presets))
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
  }

  async getAssistants(userId: number): Promise<AssistantPreset[]> {
    const response = await request.get({
      url: `/ds/agent/list?creator=${userId}`
    })
    if (this.currentConfig) {
      this.currentConfig.assistants = response
    }
    return response || []
  }

  async createAssistant(assistant: AssistantPreset): Promise<void> {
    await request.post({
      url: `/ds/agent/create`,
      data: assistant
    })
  }

  async updateAssistant(assistant: AssistantPreset): Promise<void> {
    await request.put({
      url: `/ds/agent/update-by-id`,
      data: assistant
    })
  }

  async deleteAssistant(id: string): Promise<void> {
    await request.delete({ url: `/ds/agent/delete-by-id?id=${id}` })
  }

  async syncAssistantsToStudents(data: any): Promise<void> {
    await request.post({ url: `/ds/agent/sync-to-students`, data })
  }
}

export default UserDataService.getInstance()
