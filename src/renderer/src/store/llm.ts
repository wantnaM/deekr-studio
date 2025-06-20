import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { isLocalAi } from '@renderer/config/env'
import { SYSTEM_MODELS } from '@renderer/config/models'
import { Model, Provider } from '@renderer/types'
import { uniqBy } from 'lodash'

type LlmSettings = {
  ollama: {
    keepAliveTime: number
  }
  lmstudio: {
    keepAliveTime: number
  }
  gpustack: {
    keepAliveTime: number
  }
}

export interface LlmState {
  providers: Provider[]
  defaultModel: Model
  topicNamingModel: Model
  translateModel: Model
  settings: LlmSettings
}

export const INITIAL_PROVIDERS: Provider[] = [
  {
    id: 'silicon',
    name: 'Silicon',
    type: 'openai-compatible',
    apiKey: '',
    apiHost: 'https://api.siliconflow.cn',
    models: SYSTEM_MODELS.silicon,
    isSystem: true,
    enabled: true
  },
  {
    id: 'aihubmix',
    name: 'AiHubMix',
    type: 'openai',
    apiKey: '',
    apiHost: 'https://aihubmix.com',
    models: SYSTEM_MODELS.aihubmix,
    isSystem: true,
    enabled: false
  },
  {
    id: 'deepseek',
    name: 'deepseek',
    type: 'openai-compatible',
    apiKey: '',
    apiHost: 'https://api.deepseek.com',
    models: SYSTEM_MODELS.deepseek,
    isSystem: true,
    enabled: false
  },
  {
    id: 'openai',
    name: 'OpenAI',
    type: 'openai',
    apiKey: '',
    apiHost: 'https://api.openai.com',
    models: SYSTEM_MODELS.openai,
    isSystem: true,
    enabled: false
  },
  {
    id: 'zhipu',
    name: 'ZhiPu',
    type: 'openai-compatible',
    apiKey: '',
    apiHost: 'https://open.bigmodel.cn/api/paas/v4/',
    models: SYSTEM_MODELS.zhipu,
    isSystem: true,
    enabled: false
  },
  {
    id: 'moonshot',
    name: 'Moonshot AI',
    type: 'openai-compatible',
    apiKey: '',
    apiHost: 'https://api.moonshot.cn',
    models: SYSTEM_MODELS.moonshot,
    isSystem: true,
    enabled: false
  },
  {
    id: 'doubao',
    name: '豆包',
    type: 'openai-compatible',
    apiKey: '',
    apiHost: 'https://ark.cn-beijing.volces.com/api/v3/',
    models: SYSTEM_MODELS.doubao,
    isSystem: true,
    enabled: false
  }
]

export const initialState: LlmState = {
  defaultModel: SYSTEM_MODELS.silicon[0],
  topicNamingModel: SYSTEM_MODELS.silicon[0],
  translateModel: SYSTEM_MODELS.silicon[0],
  providers: INITIAL_PROVIDERS,
  settings: {
    ollama: {
      keepAliveTime: 0
    },
    lmstudio: {
      keepAliveTime: 0
    },
    gpustack: {
      keepAliveTime: 0
    }
  }
}

const getIntegratedInitialState = () => {
  const model = JSON.parse(import.meta.env.VITE_RENDERER_INTEGRATED_MODEL)

  return {
    defaultModel: model,
    topicNamingModel: model,
    translateModel: model,
    providers: [
      {
        id: 'ollama',
        name: 'Ollama',
        apiKey: 'ollama',
        apiHost: 'http://localhost:15537/v1/',
        models: [model],
        isSystem: true,
        enabled: true
      }
    ],
    settings: {
      ollama: {
        keepAliveTime: 3600
      },
      lmstudio: {
        keepAliveTime: 3600
      },
      gpustack: {
        keepAliveTime: 3600
      }
    }
  } as LlmState
}

export const moveProvider = (providers: Provider[], id: string, position: number) => {
  const index = providers.findIndex((p) => p.id === id)
  if (index === -1) return providers

  const provider = providers[index]
  const newProviders = [...providers]
  newProviders.splice(index, 1)
  newProviders.splice(position - 1, 0, provider)
  return newProviders
}

const llmSlice = createSlice({
  name: 'llm',
  initialState: isLocalAi ? getIntegratedInitialState() : initialState,
  reducers: {
    updateProvider: (state, action: PayloadAction<Provider>) => {
      state.providers = state.providers.map((p) => (p.id === action.payload.id ? { ...p, ...action.payload } : p))
    },
    updateProviders: (state, action: PayloadAction<Provider[]>) => {
      state.providers = action.payload
    },
    addProvider: (state, action: PayloadAction<Provider>) => {
      state.providers.unshift(action.payload)
    },
    removeProvider: (state, action: PayloadAction<Provider>) => {
      const providerIndex = state.providers.findIndex((p) => p.id === action.payload.id)
      if (providerIndex !== -1) {
        state.providers.splice(providerIndex, 1)
      }
    },
    addModel: (state, action: PayloadAction<{ providerId: string; model: Model }>) => {
      state.providers = state.providers.map((p) =>
        p.id === action.payload.providerId
          ? {
              ...p,
              models: uniqBy(p.models.concat(action.payload.model), 'id'),
              enabled: true
            }
          : p
      )
    },
    removeModel: (state, action: PayloadAction<{ providerId: string; model: Model }>) => {
      state.providers = state.providers.map((p) =>
        p.id === action.payload.providerId
          ? {
              ...p,
              models: p.models.filter((m) => m.id !== action.payload.model.id)
            }
          : p
      )
    },
    setDefaultModel: (state, action: PayloadAction<{ model: Model }>) => {
      state.defaultModel = action.payload.model
    },
    setTopicNamingModel: (state, action: PayloadAction<{ model: Model }>) => {
      state.topicNamingModel = action.payload.model
    },
    setTranslateModel: (state, action: PayloadAction<{ model: Model }>) => {
      state.translateModel = action.payload.model
    },
    setOllamaKeepAliveTime: (state, action: PayloadAction<number>) => {
      state.settings.ollama.keepAliveTime = action.payload
    },
    setLMStudioKeepAliveTime: (state, action: PayloadAction<number>) => {
      state.settings.lmstudio.keepAliveTime = action.payload
    },
    setGPUStackKeepAliveTime: (state, action: PayloadAction<number>) => {
      state.settings.gpustack.keepAliveTime = action.payload
    },
    updateModel: (
      state,
      action: PayloadAction<{
        providerId: string
        model: Model
      }>
    ) => {
      const provider = state.providers.find((p) => p.id === action.payload.providerId)
      if (provider) {
        const modelIndex = provider.models.findIndex((m) => m.id === action.payload.model.id)
        if (modelIndex !== -1) {
          provider.models[modelIndex] = action.payload.model
        }
      }
    }
  }
})

export const {
  updateProvider,
  updateProviders,
  addProvider,
  removeProvider,
  addModel,
  removeModel,
  setDefaultModel,
  setTopicNamingModel,
  setTranslateModel,
  setOllamaKeepAliveTime,
  setLMStudioKeepAliveTime,
  setGPUStackKeepAliveTime,
  updateModel
} = llmSlice.actions

export default llmSlice.reducer
