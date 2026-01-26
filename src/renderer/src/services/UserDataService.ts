import store from '@renderer/store'
import {
  addAssistantPreset,
  removeAssistantPreset,
  setAssistantPresets,
  updateAssistantPreset
} from '@renderer/store/assistants'
import type { Assistant, AssistantPreset, MinAppType, Model, Provider, Topic } from '@renderer/types'
import request from '@renderer/utils/axios'

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

    this.currentUserId = userId

    await this.loadAssistantsConfig(userId)
  }

  async loadAssistantsConfig(userId: number): Promise<void> {
    const response = await this.getAssistants(userId)
    // 更新我的助手
    const presets = response.map((assistant) => this.convertToAssistantPreset(assistant))
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

  async getAssistants(userId: number): Promise<Assistant[]> {
    const response = await request.get({
      url: `/ds/agent/list?creator=${userId}`
    })
    if (this.currentConfig) {
      this.currentConfig.assistants = response
    }
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

  // 将Assistant转换为AssistantPreset
  private convertToAssistantPreset(assistant: Assistant): AssistantPreset {
    const { model, ...rest } = assistant
    return {
      ...rest,
      defaultModel: model
    } as AssistantPreset
  }

  // 获取所有助手预设
  getPresets(): AssistantPreset[] {
    return store.getState().assistants.presets
  }

  // 根据ID获取助手预设
  getPresetById(id: string): AssistantPreset | undefined {
    return this.getPresets().find((preset) => preset.id === id)
  }

  // 创建新的助手预设
  async createPreset(preset: AssistantPreset): Promise<AssistantPreset> {
    // 转换为Assistant格式发送到后端
    const assistant: Assistant = {
      ...preset,
      model: preset.defaultModel
    }
    const response = await this.createAssistant(assistant)

    // 将返回的Assistant转换回AssistantPreset并更新store
    const newPreset = this.convertToAssistantPreset(response)
    store.dispatch(addAssistantPreset(newPreset))

    return newPreset
  }

  // 更新助手预设
  async updatePreset(preset: AssistantPreset): Promise<AssistantPreset> {
    // 转换为Assistant格式发送到后端
    const assistant: Assistant = {
      ...preset,
      model: preset.defaultModel
    }
    const response = await this.updateAssistant(assistant)

    // 将返回的Assistant转换回AssistantPreset并更新store
    const updatedPreset = this.convertToAssistantPreset(response)
    store.dispatch(updateAssistantPreset(updatedPreset))

    return updatedPreset
  }

  // 删除助手预设
  async deletePreset(id: string): Promise<void> {
    await this.deleteAssistant(id)
    store.dispatch(removeAssistantPreset({ id }))
  }
}

export default UserDataService.getInstance()
