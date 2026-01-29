import store from '@renderer/store'
import { setAssistantPresets } from '@renderer/store/assistants'
import { setDefaultModel, setQuickModel, setTranslateModel, sortProviders, updateProvider } from '@renderer/store/llm'
import {
  setWebdavAutoSync,
  setWebdavHost,
  setWebdavMaxBackups,
  setWebdavPass,
  setWebdavPath,
  setWebdavSyncInterval,
  setWebdavUser
} from '@renderer/store/settings'
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
  webdav?: any
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
      quickModel: configData.llm?.quickModel || null,
      translateModel: configData.llm?.translateModel || null
    }

    this.currentUserId = userId

    await this.loadUserDataConfig()
    await this.loadAssistantsConfig(userId)
    await this.loadWebDAV()
  }

  async loadUserDataConfig(): Promise<void> {
    if (!this.currentConfig) {
      return
    }

    // LLM 配置
    for (let index = 0; index < this.currentConfig.providers.length; index++) {
      const p = this.currentConfig.providers[index]
      store.dispatch(updateProvider(p))
    }

    // 提取 sort 属性构建排序列表
    const sortOrder = this.currentConfig.providers
      .filter((p: any) => typeof p.sort === 'number' && !isNaN(p.sort))
      .sort((a: any, b: any) => a.sort - b.sort)
      .map((p) => p.id)

    // 应用排序
    if (sortOrder.length > 0) {
      store.dispatch(sortProviders(sortOrder))
    }

    store.dispatch(setDefaultModel({ model: this.currentConfig.defaultModel }))
    store.dispatch(setQuickModel({ model: this.currentConfig.quickModel }))
    store.dispatch(setTranslateModel({ model: this.currentConfig.translateModel }))
  }

  async loadWebDAV(): Promise<void> {
    try {
      const info = await this.getWebDavUser()
      if (info) {
        if (this.currentConfig) {
          this.currentConfig.webdav = info
        }
        store.dispatch(setWebdavHost(info.webDAVHost))
        store.dispatch(setWebdavMaxBackups(1))
        store.dispatch(setWebdavPass(info.password))
        store.dispatch(setWebdavPath(info.webDAVPath))
        store.dispatch(setWebdavUser(info.username))
        store.dispatch(setWebdavSyncInterval(5))
        store.dispatch(setWebdavAutoSync(true))
      }
    } catch (error) {}
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
    store.dispatch(setWebdavHost(''))
    store.dispatch(setWebdavPass(''))
    store.dispatch(setWebdavPath(''))
    store.dispatch(setWebdavUser(''))
    store.dispatch(setWebdavSyncInterval(0))
    store.dispatch(setWebdavAutoSync(false))
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

  async getWebDavUser(): Promise<any> {
    return await request.get({ url: `/ds/user-webdav/get` })
  }
}

export default UserDataService.getInstance()
