import type { GroundingMetadata } from '@google/genai'
import { createEntityAdapter, createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { Citation } from '@renderer/pages/home/Messages/CitationsList'
import { WebSearchProviderResponse, WebSearchSource } from '@renderer/types'
import type { CitationMessageBlock, MessageBlock } from '@renderer/types/newMessage'
import { MessageBlockType } from '@renderer/types/newMessage'
import type OpenAI from 'openai'

import type { RootState } from './index' // 确认 RootState 从 store/index.ts 导出

// 1. 创建实体适配器 (Entity Adapter)
// 我们使用块的 `id` 作为唯一标识符。
const messageBlocksAdapter = createEntityAdapter<MessageBlock>()

// 2. 使用适配器定义初始状态 (Initial State)
// 如果需要，可以在规范化实体的旁边添加其他状态属性。
const initialState = messageBlocksAdapter.getInitialState({
  loadingState: 'idle' as 'idle' | 'loading' | 'succeeded' | 'failed',
  error: null as string | null
})

// 3. 创建 Slice
const messageBlocksSlice = createSlice({
  name: 'messageBlocks',
  initialState,
  reducers: {
    // 使用适配器的 reducer 助手进行 CRUD 操作。
    // 这些 reducer 会自动处理规范化的状态结构。

    /** 添加或更新单个块 (Upsert)。 */
    upsertOneBlock: messageBlocksAdapter.upsertOne, // 期望 MessageBlock 作为 payload

    /** 添加或更新多个块。用于加载消息。 */
    upsertManyBlocks: messageBlocksAdapter.upsertMany, // 期望 MessageBlock[] 作为 payload

    /** 根据 ID 移除单个块。 */
    removeOneBlock: messageBlocksAdapter.removeOne, // 期望 EntityId (string) 作为 payload

    /** 根据 ID 列表移除多个块。用于清理话题。 */
    removeManyBlocks: messageBlocksAdapter.removeMany, // 期望 EntityId[] (string[]) 作为 payload

    /** 移除所有块。用于完全重置。 */
    removeAllBlocks: messageBlocksAdapter.removeAll,

    // 你可以为其他状态属性（如加载/错误）添加自定义 reducer
    setMessageBlocksLoading: (state, action: PayloadAction<'idle' | 'loading'>) => {
      state.loadingState = action.payload
      state.error = null
    },
    setMessageBlocksError: (state, action: PayloadAction<string>) => {
      state.loadingState = 'failed'
      state.error = action.payload
    },
    // 注意：如果只想更新现有块，也可以使用 `updateOne`
    updateOneBlock: messageBlocksAdapter.updateOne // 期望 { id: EntityId, changes: Partial<MessageBlock> }
  }
  // 如果需要处理其他 slice 的 action，可以在这里添加 extraReducers。
})

// 4. 导出 Actions 和 Reducer
export const {
  upsertOneBlock,
  upsertManyBlocks,
  removeOneBlock,
  removeManyBlocks,
  removeAllBlocks,
  setMessageBlocksLoading,
  setMessageBlocksError,
  updateOneBlock
} = messageBlocksSlice.actions

export const messageBlocksSelectors = messageBlocksAdapter.getSelectors<RootState>(
  (state) => state.messageBlocks // Ensure this matches the key in the root reducer
)

// --- Selector Integration --- START

// Selector to get the raw block entity by ID
const selectBlockEntityById = (state: RootState, blockId: string | undefined) =>
  blockId ? messageBlocksSelectors.selectById(state, blockId) : undefined // Use adapter selector

// --- Centralized Citation Formatting Logic ---
const formatCitationsFromBlock = (block: CitationMessageBlock | undefined): Citation[] => {
  if (!block) return []

  let formattedCitations: Citation[] = []
  // 1. Handle Web Search Responses (Non-Gemini)
  if (block.response) {
    switch (block.response.source) {
      case WebSearchSource.GEMINI:
        formattedCitations =
          (block.response?.results as GroundingMetadata)?.groundingChunks?.map((chunk, index) => ({
            number: index + 1,
            url: chunk?.web?.uri || '',
            title: chunk?.web?.title,
            showFavicon: false,
            type: 'websearch'
          })) || []
        break
      case WebSearchSource.OPENAI:
        formattedCitations =
          (block.response.results as OpenAI.Responses.ResponseOutputText.URLCitation[])?.map((result, index) => {
            let hostname: string | undefined
            try {
              hostname = result.title ? undefined : new URL(result.url).hostname
            } catch {
              hostname = result.url
            }
            return {
              number: index + 1,
              url: result.url,
              title: result.title,
              hostname: hostname,
              showFavicon: true,
              type: 'websearch'
            }
          }) || []
        break
      case WebSearchSource.OPENAI_COMPATIBLE:
        formattedCitations =
          (block.response.results as OpenAI.Chat.Completions.ChatCompletionMessage.Annotation[])?.map((url, index) => {
            const urlCitation = url.url_citation
            let hostname: string | undefined
            try {
              hostname = urlCitation.title ? undefined : new URL(urlCitation.url).hostname
            } catch {
              hostname = urlCitation.url
            }
            return {
              number: index + 1,
              url: urlCitation.url,
              title: urlCitation.title,
              hostname: hostname,
              showFavicon: true,
              type: 'websearch'
            }
          }) || []
        break
      case WebSearchSource.OPENROUTER:
      case WebSearchSource.PERPLEXITY:
        formattedCitations =
          (block.response.results as any[])?.map((url, index) => {
            try {
              const hostname = new URL(url).hostname
              return {
                number: index + 1,
                url,
                hostname,
                showFavicon: true,
                type: 'websearch'
              }
            } catch {
              return {
                number: index + 1,
                url,
                hostname: url,
                showFavicon: true,
                type: 'websearch'
              }
            }
          }) || []
        break
      case WebSearchSource.ZHIPU:
      case WebSearchSource.HUNYUAN:
        formattedCitations =
          (block.response.results as any[])?.map((result, index) => ({
            number: index + 1,
            url: result.link || result.url,
            title: result.title,
            showFavicon: true,
            type: 'websearch'
          })) || []
        break
      case WebSearchSource.WEBSEARCH:
        formattedCitations =
          (block.response.results as WebSearchProviderResponse)?.results?.map((result, index) => ({
            number: index + 1,
            url: result.url,
            title: result.title,
            content: result.content,
            showFavicon: true,
            type: 'websearch'
          })) || []
        break
    }
  }
  // 3. Handle Knowledge Base References
  if (block.knowledge && block.knowledge.length > 0) {
    formattedCitations.push(
      ...block.knowledge.map((result, index) => ({
        number: index + 1,
        url: result.sourceUrl,
        title: result.sourceUrl,
        content: result.content,
        showFavicon: true,
        type: 'knowledge'
      }))
    )
  }
  // 4. Deduplicate by URL and Renumber Sequentially
  const urlSet = new Set<string>()
  return formattedCitations
    .filter((citation) => {
      if (!citation.url || urlSet.has(citation.url)) return false
      urlSet.add(citation.url)
      return true
    })
    .map((citation, index) => ({
      ...citation,
      number: index + 1
    }))
}
// --- End of Centralized Logic ---

// Memoized selector that takes a block ID and returns formatted citations
export const selectFormattedCitationsByBlockId = createSelector([selectBlockEntityById], (blockEntity): Citation[] => {
  if (blockEntity?.type === MessageBlockType.CITATION) {
    return formatCitationsFromBlock(blockEntity as CitationMessageBlock)
  }
  return []
})

// --- Selector Integration --- END

export default messageBlocksSlice.reducer
