import {
  findTokenLimit,
  getOpenAIWebSearchParams,
  isHunyuanSearchModel,
  isOpenAILLMModel,
  isOpenAIReasoningModel,
  isOpenAIWebSearch,
  isReasoningModel,
  isSupportedModel,
  isSupportedReasoningEffortGrokModel,
  isSupportedReasoningEffortModel,
  isSupportedReasoningEffortOpenAIModel,
  isSupportedThinkingTokenClaudeModel,
  isSupportedThinkingTokenModel,
  isSupportedThinkingTokenQwenModel,
  isVisionModel,
  isZhipuModel
} from '@renderer/config/models'
import { getStoreSetting } from '@renderer/hooks/useSettings'
import i18n from '@renderer/i18n'
import { getAssistantSettings, getDefaultModel, getTopNamingModel } from '@renderer/services/AssistantService'
import { EVENT_NAMES } from '@renderer/services/EventService'
import {
  filterContextMessages,
  filterEmptyMessages,
  filterUserRoleStartMessages
} from '@renderer/services/MessagesService'
import { processReqMessages } from '@renderer/services/ModelMessageService'
import store from '@renderer/store'
import {
  Assistant,
  EFFORT_RATIO,
  FileTypes,
  MCPToolResponse,
  Model,
  Provider,
  Suggestion,
  Usage,
  WebSearchSource
} from '@renderer/types'
import { ChunkType, LLMWebSearchCompleteChunk } from '@renderer/types/chunk'
import { Message } from '@renderer/types/newMessage'
import { removeSpecialCharactersForTopicName } from '@renderer/utils'
import { addImageFileToContents } from '@renderer/utils/formats'
import {
  convertLinks,
  convertLinksToHunyuan,
  convertLinksToOpenRouter,
  convertLinksToZhipu
} from '@renderer/utils/linkConverter'
import { mcpToolCallResponseToOpenAICompatibleMessage, parseAndCallTools } from '@renderer/utils/mcp-tools'
import { findFileBlocks, findImageBlocks, getMainTextContent } from '@renderer/utils/messageUtils/find'
import { buildSystemPrompt } from '@renderer/utils/prompt'
import { isEmpty, takeRight } from 'lodash'
import OpenAI, { AzureOpenAI } from 'openai'
import {
  ChatCompletionContentPart,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionMessageParam
} from 'openai/resources'

import { CompletionsParams } from '.'
import OpenAIProvider from './OpenAIProvider'

export default class OpenAICompatibleProvider extends OpenAIProvider {
  constructor(provider: Provider) {
    super(provider)

    if (provider.id === 'azure-openai' || provider.type === 'azure-openai') {
      this.sdk = new AzureOpenAI({
        dangerouslyAllowBrowser: true,
        apiKey: this.apiKey,
        apiVersion: provider.apiVersion,
        endpoint: provider.apiHost
      })
      return
    }

    this.sdk = new OpenAI({
      dangerouslyAllowBrowser: true,
      apiKey: this.apiKey,
      baseURL: this.getBaseURL(),
      defaultHeaders: {
        ...this.defaultHeaders(),
        ...(this.provider.id === 'copilot' ? { 'editor-version': 'vscode/1.97.2' } : {}),
        ...(this.provider.id === 'copilot' ? { 'copilot-vision-request': 'true' } : {})
      }
    })
  }

  /**
   * Check if the provider does not support files
   * @returns True if the provider does not support files, false otherwise
   */
  private get isNotSupportFiles() {
    if (this.provider?.isNotSupportArrayContent) {
      return true
    }

    const providers = ['deepseek', 'baichuan', 'minimax', 'xirang']

    return providers.includes(this.provider.id)
  }

  /**
   * Get the message parameter
   * @param message - The message
   * @param model - The model
   * @returns The message parameter
   */
  override async getMessageParam(
    message: Message,
    model: Model
  ): Promise<OpenAI.Chat.Completions.ChatCompletionMessageParam> {
    const isVision = isVisionModel(model)
    const content = await this.getMessageContent(message)
    const fileBlocks = findFileBlocks(message)
    const imageBlocks = findImageBlocks(message)

    if (fileBlocks.length === 0 && imageBlocks.length === 0) {
      return {
        role: message.role === 'system' ? 'user' : message.role,
        content
      }
    }

    // If the model does not support files, extract the file content
    if (this.isNotSupportFiles) {
      const fileContent = await this.extractFileContent(message)

      return {
        role: message.role === 'system' ? 'user' : message.role,
        content: content + '\n\n---\n\n' + fileContent
      }
    }

    // If the model supports files, add the file content to the message
    const parts: ChatCompletionContentPart[] = []

    if (content) {
      parts.push({ type: 'text', text: content })
    }

    for (const imageBlock of imageBlocks) {
      if (isVision) {
        if (imageBlock.file) {
          const image = await window.api.file.base64Image(imageBlock.file.id + imageBlock.file.ext)
          parts.push({ type: 'image_url', image_url: { url: image.data } })
        } else if (imageBlock.url && imageBlock.url.startsWith('data:')) {
          parts.push({ type: 'image_url', image_url: { url: imageBlock.url } })
        }
      }
    }

    for (const fileBlock of fileBlocks) {
      const file = fileBlock.file
      if (!file) {
        continue
      }

      if ([FileTypes.TEXT, FileTypes.DOCUMENT].includes(file.type)) {
        const fileContent = await (await window.api.file.read(file.id + file.ext)).trim()
        parts.push({
          type: 'text',
          text: file.origin_name + '\n' + fileContent
        })
      }
    }

    return {
      role: message.role === 'system' ? 'user' : message.role,
      content: parts
    } as ChatCompletionMessageParam
  }

  /**
   * Get the temperature for the assistant
   * @param assistant - The assistant
   * @param model - The model
   * @returns The temperature
   */
  override getTemperature(assistant: Assistant, model: Model) {
    return isReasoningModel(model) || isOpenAIWebSearch(model) ? undefined : assistant?.settings?.temperature
  }

  /**
   * Get the provider specific parameters for the assistant
   * @param assistant - The assistant
   * @param model - The model
   * @returns The provider specific parameters
   */
  private getProviderSpecificParameters(assistant: Assistant, model: Model) {
    const { maxTokens } = getAssistantSettings(assistant)

    if (this.provider.id === 'openrouter') {
      if (model.id.includes('deepseek-r1')) {
        return {
          include_reasoning: true
        }
      }
    }

    if (isOpenAIReasoningModel(model)) {
      return {
        max_tokens: undefined,
        max_completion_tokens: maxTokens
      }
    }

    return {}
  }

  /**
   * Get the top P for the assistant
   * @param assistant - The assistant
   * @param model - The model
   * @returns The top P
   */
  override getTopP(assistant: Assistant, model: Model) {
    if (isReasoningModel(model) || isOpenAIWebSearch(model)) {
      return undefined
    }

    return assistant?.settings?.topP
  }

  /**
   * Get the reasoning effort for the assistant
   * @param assistant - The assistant
   * @param model - The model
   * @returns The reasoning effort
   */
  private getReasoningEffort(assistant: Assistant, model: Model) {
    if (this.provider.id === 'groq') {
      return {}
    }

    if (!isReasoningModel(model)) {
      return {}
    }
    const reasoningEffort = assistant?.settings?.reasoning_effort
    if (!reasoningEffort) {
      if (isSupportedThinkingTokenQwenModel(model)) {
        return { enable_thinking: false }
      }

      if (isSupportedThinkingTokenClaudeModel(model)) {
        return { thinking: { type: 'disabled' } }
      }

      return {}
    }
    const effortRatio = EFFORT_RATIO[reasoningEffort]
    const budgetTokens = Math.floor((findTokenLimit(model.id)?.max || 0) * effortRatio)
    // OpenRouter models
    if (model.provider === 'openrouter') {
      if (isSupportedReasoningEffortModel(model)) {
        return {
          reasoning: {
            effort: assistant?.settings?.reasoning_effort
          }
        }
      }

      if (isSupportedThinkingTokenModel(model)) {
        return {
          reasoning: {
            max_tokens: budgetTokens
          }
        }
      }
    }

    // Qwen models
    if (isSupportedThinkingTokenQwenModel(model)) {
      return {
        enable_thinking: true,
        thinking_budget: budgetTokens
      }
    }

    // Grok models
    if (isSupportedReasoningEffortGrokModel(model)) {
      return {
        reasoning_effort: assistant?.settings?.reasoning_effort
      }
    }

    // OpenAI models
    if (isSupportedReasoningEffortOpenAIModel(model)) {
      return {
        reasoning_effort: assistant?.settings?.reasoning_effort
      }
    }

    // Claude models
    if (isSupportedThinkingTokenClaudeModel(model)) {
      return {
        thinking: {
          type: 'enabled',
          budget_tokens: budgetTokens
        }
      }
    }

    // Default case: no special thinking settings
    return {}
  }

  /**
   * Generate completions for the assistant
   * @param messages - The messages
   * @param assistant - The assistant
   * @param mcpTools - The MCP tools
   * @param onChunk - The onChunk callback
   * @param onFilterMessages - The onFilterMessages callback
   * @returns The completions
   */
  async completions({ messages, assistant, mcpTools, onChunk, onFilterMessages }: CompletionsParams): Promise<void> {
    if (assistant.enableGenerateImage) {
      await this.generateImageByChat({ messages, assistant, onChunk } as CompletionsParams)
      return
    }
    const defaultModel = getDefaultModel()
    const model = assistant.model || defaultModel

    if (assistant.model?.provider === 'aihubmix' && isOpenAILLMModel(model)) {
      await super.completions({ messages, assistant, mcpTools, onChunk, onFilterMessages })
      return
    }
    const { contextCount, maxTokens, streamOutput } = getAssistantSettings(assistant)
    const isEnabledWebSearch = assistant.enableWebSearch || !!assistant.webSearchProviderId
    messages = addImageFileToContents(messages)
    let systemMessage = { role: 'system', content: assistant.prompt || '' }
    if (isSupportedReasoningEffortOpenAIModel(model)) {
      systemMessage = {
        role: 'developer',
        content: `Formatting re-enabled${systemMessage ? '\n' + systemMessage.content : ''}`
      }
    }
    if (mcpTools && mcpTools.length > 0) {
      systemMessage.content = buildSystemPrompt(systemMessage.content || '', mcpTools)
    }

    const userMessages: ChatCompletionMessageParam[] = []
    const _messages = filterUserRoleStartMessages(
      filterEmptyMessages(filterContextMessages(takeRight(messages, contextCount + 1)))
    )

    onFilterMessages(_messages)

    for (const message of _messages) {
      userMessages.push(await this.getMessageParam(message, model))
    }

    const isSupportStreamOutput = () => {
      return streamOutput
    }

    let hasReasoningContent = false
    let lastChunk = ''
    const isReasoningJustDone = (
      delta: OpenAI.Chat.Completions.ChatCompletionChunk.Choice.Delta & {
        reasoning_content?: string
        reasoning?: string
        thinking?: string
      }
    ) => {
      if (!delta?.content) {
        return false
      }

      // 检查当前chunk和上一个chunk的组合是否形成###Response标记
      const combinedChunks = lastChunk + delta.content
      lastChunk = delta.content

      // 检测思考结束
      if (combinedChunks.includes('###Response') || delta.content === '</think>') {
        return true
      }

      // 如果有reasoning_content或reasoning，说明是在思考中
      if (delta?.reasoning_content || delta?.reasoning || delta?.thinking) {
        hasReasoningContent = true
      }

      // 如果之前有reasoning_content或reasoning，现在有普通content，说明思考结束
      return !!(hasReasoningContent && delta.content)
    }

    let time_first_token_millsec = 0
    let time_first_token_millsec_delta = 0
    let time_first_content_millsec = 0
    const start_time_millsec = new Date().getTime()
    console.log(
      `completions start_time_millsec ${new Date(start_time_millsec).toLocaleString(undefined, {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        fractionalSecondDigits: 3
      })}`
    )
    const lastUserMessage = _messages.findLast((m) => m.role === 'user')
    const { abortController, cleanup, signalPromise } = this.createAbortController(lastUserMessage?.id, true)
    const { signal } = abortController
    await this.checkIsCopilot()

    //当 systemMessage 内容为空时不发送 systemMessage
    let reqMessages: ChatCompletionMessageParam[]
    if (!systemMessage.content) {
      reqMessages = [...userMessages]
    } else {
      reqMessages = [systemMessage, ...userMessages].filter(Boolean) as ChatCompletionMessageParam[]
    }

    const toolResponses: MCPToolResponse[] = []

    const processToolUses = async (content: string, idx: number) => {
      const toolResults = await parseAndCallTools(
        content,
        toolResponses,
        onChunk,
        idx,
        mcpToolCallResponseToOpenAICompatibleMessage,
        mcpTools,
        isVisionModel(model)
      )

      if (toolResults.length > 0) {
        reqMessages.push({
          role: 'assistant',
          content: content
        } as ChatCompletionMessageParam)
        toolResults.forEach((ts) => reqMessages.push(ts as ChatCompletionMessageParam))

        console.debug('[tool] reqMessages before processing', model.id, reqMessages)
        reqMessages = processReqMessages(model, reqMessages)
        console.debug('[tool] reqMessages', model.id, reqMessages)
        const newStream = await this.sdk.chat.completions
          // @ts-ignore key is not typed
          .create(
            {
              model: model.id,
              messages: reqMessages,
              temperature: this.getTemperature(assistant, model),
              top_p: this.getTopP(assistant, model),
              max_tokens: maxTokens,
              keep_alive: this.keepAliveTime,
              stream: isSupportStreamOutput(),
              // tools: tools,
              service_tier: this.getServiceTier(model),
              ...getOpenAIWebSearchParams(assistant, model),
              ...this.getReasoningEffort(assistant, model),
              ...this.getProviderSpecificParameters(assistant, model),
              ...this.getCustomParameters(assistant)
            },
            {
              signal,
              timeout: this.getTimeout(model)
            }
          )
        await processStream(newStream, idx + 1)
      }
    }

    const processStream = async (stream: any, idx: number) => {
      // Handle non-streaming case (already returns early, no change needed here)
      if (!isSupportStreamOutput()) {
        const time_completion_millsec = new Date().getTime() - start_time_millsec
        // Calculate final metrics once
        const finalMetrics = {
          completion_tokens: stream.usage?.completion_tokens,
          time_completion_millsec,
          time_first_token_millsec: 0 // Non-streaming, first token time is not relevant
        }

        // Create a synthetic usage object if stream.usage is undefined
        const finalUsage = stream.usage
        // Separate onChunk calls for text and usage/metrics
        if (stream.choices[0].message?.content) {
          onChunk({ type: ChunkType.TEXT_COMPLETE, text: stream.choices[0].message.content })
        }

        // Always send usage and metrics data
        onChunk({ type: ChunkType.BLOCK_COMPLETE, response: { usage: finalUsage, metrics: finalMetrics } })
        return
      }

      let content = '' // Accumulate content for tool processing if needed
      let thinkingContent = ''
      // 记录最终的完成时间差
      let final_time_completion_millsec_delta = 0
      let final_time_thinking_millsec_delta = 0
      // Variable to store the last received usage object
      let lastUsage: Usage | undefined = undefined
      // let isThinkingInContent: ThoughtProcessor | undefined = undefined
      // const processThinkingChunk = this.handleThinkingTags()
      let isFirstChunk = true
      let isFirstThinkingChunk = true
      for await (const chunk of stream) {
        if (window.keyv.get(EVENT_NAMES.CHAT_COMPLETION_PAUSED)) {
          break
        }

        const delta = chunk.choices[0]?.delta
        const finishReason = chunk.choices[0]?.finish_reason

        // --- Incremental onChunk calls ---

        // 1. Reasoning Content
        const reasoningContent = delta?.reasoning_content || delta?.reasoning
        const currentTime = new Date().getTime() // Get current time for each chunk

        if (time_first_token_millsec === 0 && isFirstThinkingChunk && reasoningContent) {
          // 记录第一个token的时间
          time_first_token_millsec = currentTime
          // 记录第一个token的时间差
          time_first_token_millsec_delta = currentTime - start_time_millsec
          console.log(
            `completions time_first_token_millsec ${new Date(currentTime).toLocaleString(undefined, {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
              fractionalSecondDigits: 3
            })}`
          )
          isFirstThinkingChunk = false
        }
        if (reasoningContent) {
          thinkingContent += reasoningContent
          hasReasoningContent = true // Keep track if reasoning occurred

          // Calculate thinking time as time elapsed since start until this chunk
          const thinking_time = currentTime - time_first_token_millsec
          onChunk({ type: ChunkType.THINKING_DELTA, text: reasoningContent, thinking_millsec: thinking_time })
        }
        if (isReasoningJustDone(delta) && time_first_content_millsec === 0) {
          time_first_content_millsec = currentTime
          final_time_thinking_millsec_delta = time_first_content_millsec - time_first_token_millsec
          onChunk({
            type: ChunkType.THINKING_COMPLETE,
            text: thinkingContent,
            thinking_millsec: final_time_thinking_millsec_delta
          })

          thinkingContent = ''
          isFirstThinkingChunk = true
          hasReasoningContent = false
        }

        // 2. Text Content
        if (delta?.content) {
          if (isEnabledWebSearch) {
            if (delta?.annotations) {
              delta.content = convertLinks(delta.content || '', isFirstChunk)
            } else if (assistant.model?.provider === 'openrouter') {
              delta.content = convertLinksToOpenRouter(delta.content || '', isFirstChunk)
            } else if (isZhipuModel(assistant.model)) {
              delta.content = convertLinksToZhipu(delta.content || '', isFirstChunk)
            } else if (isHunyuanSearchModel(assistant.model)) {
              delta.content = convertLinksToHunyuan(
                delta.content || '',
                chunk.search_info.search_results || [],
                isFirstChunk
              )
            }
          }
          // 说明前面没有思考内容
          if (isFirstChunk && time_first_token_millsec === 0 && time_first_token_millsec_delta === 0) {
            isFirstChunk = false
            time_first_token_millsec = currentTime
            time_first_token_millsec_delta = time_first_token_millsec - start_time_millsec
          }
          content += delta.content // Still accumulate for processToolUses

          // isThinkingInContent = this.findThinkingProcessor(content, model)
          // if (isThinkingInContent) {
          //   processThinkingChunk(content, isThinkingInContent, onChunk)
          onChunk({ type: ChunkType.TEXT_DELTA, text: delta.content })
          // } else {
          // }
        }
        // console.log('delta?.finish_reason', delta?.finish_reason)
        if (!isEmpty(finishReason) || delta?.annotations) {
          onChunk({ type: ChunkType.TEXT_COMPLETE, text: content })
          final_time_completion_millsec_delta = currentTime - start_time_millsec
          console.log(
            `completions final_time_completion_millsec ${new Date(currentTime).toLocaleString(undefined, {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              second: 'numeric',
              fractionalSecondDigits: 3
            })}`
          )
          // 6. Usage (If provided per chunk) - Capture the last known usage
          if (chunk.usage) {
            // console.log('chunk.usage', chunk.usage)
            lastUsage = chunk.usage // Update with the latest usage info
            // Send incremental usage update if needed by UI (optional, keep if useful)
            // onChunk({ type: 'block_in_progress', response: { usage: chunk.usage } })
          }

          // 3. Web Search
          if (delta?.annotations) {
            onChunk({
              type: ChunkType.LLM_WEB_SEARCH_COMPLETE,
              llm_web_search: {
                results: delta.annotations,
                source: WebSearchSource.OPENAI_COMPATIBLE
              }
            } as LLMWebSearchCompleteChunk)
          }

          if (assistant.model?.provider === 'perplexity') {
            const citations = chunk.citations
            if (citations) {
              onChunk({
                type: ChunkType.LLM_WEB_SEARCH_COMPLETE,
                llm_web_search: {
                  results: citations,
                  source: WebSearchSource.PERPLEXITY
                }
              } as LLMWebSearchCompleteChunk)
            }
          }
          if (isEnabledWebSearch && isZhipuModel(model) && finishReason === 'stop' && chunk?.web_search) {
            onChunk({
              type: ChunkType.LLM_WEB_SEARCH_COMPLETE,
              llm_web_search: {
                results: chunk.web_search,
                source: WebSearchSource.ZHIPU
              }
            } as LLMWebSearchCompleteChunk)
          }
          if (isEnabledWebSearch && isHunyuanSearchModel(model) && chunk?.search_info?.search_results) {
            onChunk({
              type: ChunkType.LLM_WEB_SEARCH_COMPLETE,
              llm_web_search: {
                results: chunk.search_info.search_results,
                source: WebSearchSource.HUNYUAN
              }
            } as LLMWebSearchCompleteChunk)
          }
        }

        // --- End of Incremental onChunk calls ---
      } // End of for await loop

      // Call processToolUses AFTER the loop finishes processing the main stream content
      // Note: parseAndCallTools inside processToolUses should handle its own onChunk for tool responses
      await processToolUses(content, idx)

      // Send the final block_complete chunk with accumulated data
      onChunk({
        type: ChunkType.BLOCK_COMPLETE,
        response: {
          // Use the enhanced usage object
          usage: lastUsage,
          metrics: {
            // Get completion tokens from the last usage object if available
            completion_tokens: lastUsage?.completion_tokens,
            time_completion_millsec: final_time_completion_millsec_delta,
            time_first_token_millsec: time_first_token_millsec_delta,
            time_thinking_millsec: final_time_thinking_millsec_delta
          }
        }
      })

      // FIXME: 临时方案，重置时间戳和思考内容
      time_first_token_millsec = 0
      time_first_content_millsec = 0

      // OpenAI stream typically doesn't provide a final summary chunk easily.
      // We are sending per-chunk usage if available.
    }

    console.debug('[completions] reqMessages before processing', model.id, reqMessages)
    reqMessages = processReqMessages(model, reqMessages)
    console.debug('[completions] reqMessages', model.id, reqMessages)
    // 等待接口返回流
    onChunk({ type: ChunkType.LLM_RESPONSE_CREATED })
    const stream = await this.sdk.chat.completions
      // @ts-ignore key is not typed
      .create(
        {
          model: model.id,
          messages: reqMessages,
          temperature: this.getTemperature(assistant, model),
          top_p: this.getTopP(assistant, model),
          max_tokens: maxTokens,
          keep_alive: this.keepAliveTime,
          stream: isSupportStreamOutput(),
          // tools: tools,
          service_tier: this.getServiceTier(model),
          ...getOpenAIWebSearchParams(assistant, model),
          ...this.getReasoningEffort(assistant, model),
          ...this.getProviderSpecificParameters(assistant, model),
          ...this.getCustomParameters(assistant)
        },
        {
          signal,
          timeout: this.getTimeout(model)
        }
      )

    await processStream(stream, 0).finally(cleanup)

    // 捕获signal的错误
    await signalPromise?.promise?.catch((error) => {
      throw error
    })
  }

  /**
   * Translate a message
   * @param content
   * @param assistant - The assistant
   * @param onResponse - The onResponse callback
   * @returns The translated message
   */
  async translate(content: string, assistant: Assistant, onResponse?: (text: string, isComplete: boolean) => void) {
    const defaultModel = getDefaultModel()
    const model = assistant.model || defaultModel
    if (assistant.model?.provider === 'aihubmix' && isOpenAILLMModel(model)) {
      return await super.translate(content, assistant, onResponse)
    }
    const messagesForApi = content
      ? [
          { role: 'system', content: assistant.prompt },
          { role: 'user', content }
        ]
      : [{ role: 'user', content: assistant.prompt }]

    const isSupportedStreamOutput = () => {
      if (!onResponse) {
        return false
      }
      return true
    }

    const stream = isSupportedStreamOutput()

    await this.checkIsCopilot()

    // console.debug('[translate] reqMessages', model.id, message)
    // @ts-ignore key is not typed
    const response = await this.sdk.chat.completions.create({
      model: model.id,
      messages: messagesForApi as ChatCompletionMessageParam[],
      stream,
      keep_alive: this.keepAliveTime,
      temperature: this.getTemperature(assistant, model),
      top_p: this.getTopP(assistant, model),
      ...this.getReasoningEffort(assistant, model)
    })

    if (!stream) {
      return response.choices[0].message?.content || ''
    }

    let text = ''
    let isThinking = false
    const isReasoning = isReasoningModel(model)

    for await (const chunk of response) {
      const deltaContent = chunk.choices[0]?.delta?.content || ''

      if (isReasoning) {
        if (deltaContent.includes('<think>')) {
          isThinking = true
        }

        if (!isThinking) {
          text += deltaContent
          onResponse?.(text, false)
        }

        if (deltaContent.includes('</think>')) {
          isThinking = false
        }
      } else {
        text += deltaContent
        onResponse?.(text, false)
      }
    }

    onResponse?.(text, true)

    return text
  }

  /**
   * Summarize a message
   * @param messages - The messages
   * @param assistant - The assistant
   * @returns The summary
   */
  public async summaries(messages: Message[], assistant: Assistant): Promise<string> {
    const model = getTopNamingModel() || assistant.model || getDefaultModel()

    if (assistant.model?.provider === 'aihubmix' && isOpenAILLMModel(model)) {
      return await super.summaries(messages, assistant)
    }

    const userMessages = takeRight(messages, 5)
      .filter((message) => !message.isPreset)
      .map((message) => ({
        role: message.role,
        content: getMainTextContent(message)
      }))

    const userMessageContent = userMessages.reduce((prev, curr) => {
      const content = curr.role === 'user' ? `User: ${curr.content}` : `Assistant: ${curr.content}`
      return prev + (prev ? '\n' : '') + content
    }, '')

    const systemMessage = {
      role: 'system',
      content: getStoreSetting('topicNamingPrompt') || i18n.t('prompts.title')
    }

    const userMessage = {
      role: 'user',
      content: userMessageContent
    }

    await this.checkIsCopilot()

    console.debug('[summaries] reqMessages', model.id, [systemMessage, userMessage])
    // @ts-ignore key is not typed
    const response = await this.sdk.chat.completions.create({
      model: model.id,
      messages: [systemMessage, userMessage] as ChatCompletionMessageParam[],
      stream: false,
      keep_alive: this.keepAliveTime,
      max_tokens: 1000
    })

    // 针对思考类模型的返回，总结仅截取</think>之后的内容
    let content = response.choices[0].message?.content || ''
    content = content.replace(/^<think>(.*?)<\/think>/s, '')

    return removeSpecialCharactersForTopicName(content.substring(0, 50))
  }

  /**
   * Summarize a message for search
   * @param messages - The messages
   * @param assistant - The assistant
   * @returns The summary
   */
  public async summaryForSearch(messages: Message[], assistant: Assistant): Promise<string | null> {
    const model = assistant.model || getDefaultModel()

    if (assistant.model?.provider === 'aihubmix' && isOpenAILLMModel(model)) {
      return await super.summaryForSearch(messages, assistant)
    }

    const systemMessage = {
      role: 'system',
      content: assistant.prompt
    }

    const messageContents = messages.map((m) => getMainTextContent(m))
    const userMessageContent = messageContents.join('\n')

    const userMessage = {
      role: 'user',
      content: userMessageContent
    }
    console.debug('[summaryForSearch] reqMessages', model.id, [systemMessage, userMessage])

    const lastUserMessage = messages[messages.length - 1]
    console.log('lastUserMessage?.id', lastUserMessage?.id)
    const { abortController, cleanup } = this.createAbortController(lastUserMessage?.id)
    const { signal } = abortController

    const response = await this.sdk.chat.completions
      // @ts-ignore key is not typed
      .create(
        {
          model: model.id,
          messages: [systemMessage, userMessage] as ChatCompletionMessageParam[],
          stream: false,
          keep_alive: this.keepAliveTime,
          max_tokens: 1000
        },
        {
          timeout: 20 * 1000,
          signal: signal
        }
      )
      .finally(cleanup)

    // 针对思考类模型的返回，总结仅截取</think>之后的内容
    let content = response.choices[0].message?.content || ''
    content = content.replace(/^<think>(.*?)<\/think>/s, '')

    return content
  }

  /**
   * Generate text
   * @param prompt - The prompt
   * @param content - The content
   * @returns The generated text
   */
  public async generateText({ prompt, content }: { prompt: string; content: string }): Promise<string> {
    const model = getDefaultModel()

    await this.checkIsCopilot()

    const response = await this.sdk.chat.completions.create({
      model: model.id,
      stream: false,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content }
      ]
    })

    return response.choices[0].message?.content || ''
  }

  /**
   * Generate suggestions
   * @param messages - The messages
   * @param assistant - The assistant
   * @returns The suggestions
   */
  async suggestions(messages: Message[], assistant: Assistant): Promise<Suggestion[]> {
    const { model } = assistant

    if (!model) {
      return []
    }

    await this.checkIsCopilot()

    const userMessagesForApi = messages
      .filter((m) => m.role === 'user')
      .map((m) => ({
        role: m.role,
        content: getMainTextContent(m)
      }))

    const response: any = await this.sdk.request({
      method: 'post',
      path: '/advice_questions',
      body: {
        messages: userMessagesForApi,
        model: model.id,
        max_tokens: 0,
        temperature: 0,
        n: 0
      }
    })

    return response?.questions?.filter(Boolean)?.map((q: any) => ({ content: q })) || []
  }

  /**
   * Check if the model is valid
   * @param model - The model
   * @param stream - Whether to use streaming interface
   * @returns The validity of the model
   */
  public async check(model: Model, stream: boolean = false): Promise<{ valid: boolean; error: Error | null }> {
    if (!model) {
      return { valid: false, error: new Error('No model found') }
    }
    if (model.provider === 'aihubmix' && isOpenAILLMModel(model)) {
      return await super.check(model, stream)
    }
    const body = {
      model: model.id,
      messages: [{ role: 'user', content: 'hi' }],
      stream
    }

    try {
      await this.checkIsCopilot()
      console.debug('[checkModel] body', model.id, body)
      if (!stream) {
        const response = await this.sdk.chat.completions.create(body as ChatCompletionCreateParamsNonStreaming)
        if (!response?.choices[0].message) {
          throw new Error('Empty response')
        }
        return { valid: true, error: null }
      } else {
        const response: any = await this.sdk.chat.completions.create(body as any)
        // 等待整个流式响应结束
        let hasContent = false
        for await (const chunk of response) {
          if (chunk.choices?.[0]?.delta?.content) {
            hasContent = true
          }
        }
        if (hasContent) {
          return { valid: true, error: null }
        }
        throw new Error('Empty streaming response')
      }
    } catch (error: any) {
      return {
        valid: false,
        error
      }
    }
  }

  /**
   * Get the models
   * @returns The models
   */
  public async models(): Promise<OpenAI.Models.Model[]> {
    try {
      await this.checkIsCopilot()

      const response = await this.sdk.models.list()

      if (this.provider.id === 'github') {
        // @ts-ignore key is not typed
        return response.body
          .map((model) => ({
            id: model.name,
            description: model.summary,
            object: 'model',
            owned_by: model.publisher
          }))
          .filter(isSupportedModel)
      }

      if (this.provider.id === 'together') {
        // @ts-ignore key is not typed
        return response?.body
          .map((model: any) => ({
            id: model.id,
            description: model.display_name,
            object: 'model',
            owned_by: model.organization
          }))
          .filter(isSupportedModel)
      }

      const models = response.data || []
      models.forEach((model) => {
        model.id = model.id.trim()
      })

      return models.filter(isSupportedModel)
    } catch (error) {
      return []
    }
  }

  /**
   * Get the embedding dimensions
   * @param model - The model
   * @returns The embedding dimensions
   */
  public async getEmbeddingDimensions(model: Model): Promise<number> {
    await this.checkIsCopilot()

    const data = await this.sdk.embeddings.create({
      model: model.id,
      input: model?.provider === 'baidu-cloud' ? ['hi'] : 'hi'
    })
    return data.data[0].embedding.length
  }

  public async checkIsCopilot() {
    if (this.provider.id !== 'copilot') {
      return
    }
    const defaultHeaders = store.getState().copilot.defaultHeaders
    // copilot每次请求前需要重新获取token，因为token中附带时间戳
    const { token } = await window.api.copilot.getToken(defaultHeaders)
    this.sdk.apiKey = token
  }
}
