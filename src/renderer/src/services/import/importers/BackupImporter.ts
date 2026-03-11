import { loggerService } from '@logger'
import i18n from '@renderer/i18n'
import type { Topic } from '@renderer/types'
import {
  AssistantMessageStatus,
  type MainTextMessageBlock,
  type Message,
  MessageBlockStatus,
  MessageBlockType,
  UserMessageStatus
} from '@renderer/types/newMessage'
import { uuid } from '@renderer/utils'

import type { ConversationImporter, ImportResult } from '../types'

const logger = loggerService.withContext('BackupImporter')

/**
 * Backup Export Format Types
 */
interface BackupData {
  time: number
  version: number
  localStorage: Record<string, any>
  indexedDB: {
    topics?: BackupTopic[]
    message_blocks?: BackupMessageBlock[]
    files?: any[]
    settings?: any[]
    knowledge_notes?: any[]
    translate_history?: any[]
    quick_phrases?: any[]
    translate_languages?: any[]
  }
}

interface BackupTopic {
  id: string
  messages: BackupMessage[]
}

interface BackupMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content?: string
  assistantId?: string
  topicId?: string
  createdAt?: string
  updatedAt?: string
  status?: string
  blocks?: string[]
  model?: any
  [key: string]: any
}

interface BackupMessageBlock {
  id: string
  messageId: string
  type: string
  content?: string
  createdAt?: string
  updatedAt?: string
  status?: string
  [key: string]: any
}

/**
 * CherryStudio backup importer
 * Handles importing conversations from CherryStudio's backup ZIP files
 */
export class BackupImporter implements ConversationImporter {
  readonly name = 'CherryStudio Backup'
  readonly emoji = '💾'

  /**
   * Validate if the file content is a valid CherryStudio backup
   */
  validate(fileContent: string): boolean {
    try {
      const data = JSON.parse(fileContent) as BackupData

      // Check if it has the basic backup structure
      return (
        data &&
        typeof data === 'object' &&
        'version' in data &&
        'indexedDB' in data &&
        data.indexedDB &&
        typeof data.indexedDB === 'object' &&
        Array.isArray(data.indexedDB.topics)
      )
    } catch {
      return false
    }
  }

  /**
   * Parse backup data and convert to unified format
   */
  async parse(fileContent: string, assistantId: string): Promise<ImportResult> {
    logger.info('Starting backup import...')

    // Parse JSON
    const data = JSON.parse(fileContent) as BackupData

    const backupTopics = data.indexedDB.topics || []
    const backupBlocks = data.indexedDB.message_blocks || []

    if (backupTopics.length === 0) {
      throw new Error(i18n.t('import.backup.error.no_topics', { defaultValue: 'No conversations found in backup' }))
    }

    logger.info(`Found ${backupTopics.length} topics and ${backupBlocks.length} blocks in backup`)

    const topics: Topic[] = []
    const allMessages: Message[] = []
    const allBlocks: MainTextMessageBlock[] = []

    // Create a map of old block IDs to new block IDs for reference
    const blockIdMap = new Map<string, string>()

    // Convert each topic
    for (const backupTopic of backupTopics) {
      try {
        const { topic, messages, blocks } = this.convertTopic(backupTopic, backupBlocks, assistantId, blockIdMap)
        topics.push(topic)
        allMessages.push(...messages)
        allBlocks.push(...blocks)
      } catch (topicError) {
        logger.warn(`Failed to convert topic:`, topicError as Error)
        // Continue with other topics
      }
    }

    if (topics.length === 0) {
      throw new Error(i18n.t('import.backup.error.no_valid_topics', { defaultValue: 'No valid conversations found' }))
    }

    logger.info(`Import completed: ${topics.length} topics, ${allMessages.length} messages, ${allBlocks.length} blocks`)

    return {
      topics,
      messages: allMessages,
      blocks: allBlocks
    }
  }

  /**
   * Convert backup topic to Cherry Studio Topic
   */
  private convertTopic(
    backupTopic: BackupTopic,
    allBackupBlocks: BackupMessageBlock[],
    assistantId: string,
    blockIdMap: Map<string, string>
  ): { topic: Topic; messages: Message[]; blocks: MainTextMessageBlock[] } {
    const topicId = uuid()
    const messages: Message[] = []
    const blocks: MainTextMessageBlock[] = []

    // Convert each message in the topic
    for (const backupMessage of backupTopic.messages) {
      try {
        const { message, messageBlocks } = this.convertMessage(
          backupMessage,
          topicId,
          assistantId,
          allBackupBlocks,
          blockIdMap
        )
        messages.push(message)
        blocks.push(...messageBlocks)
      } catch (msgError) {
        logger.warn(`Failed to convert message:`, msgError as Error)
        // Continue with other messages
      }
    }

    // Get topic name from first user message if available
    let topicName = i18n.t('import.backup.untitled_topic', { defaultValue: 'Imported Topic' })
    const firstUserMessage = messages.find((m) => m.role === 'user')
    if (firstUserMessage) {
      const firstBlock = blocks.find((b) => b.messageId === firstUserMessage.id)
      if (firstBlock && firstBlock.content) {
        // Truncate long messages for topic name
        topicName = firstBlock.content.slice(0, 50) + (firstBlock.content.length > 50 ? '...' : '')
      }
    }

    // Get timestamps from messages
    const createdAt = (
      messages.length > 0 && messages[0].createdAt ? messages[0].createdAt : new Date().toISOString()
    ) as string
    const updatedAt = (
      messages.length > 0 && messages[messages.length - 1].updatedAt
        ? messages[messages.length - 1].updatedAt
        : createdAt
    ) as string

    // Create topic
    const topic = {
      id: topicId,
      assistantId,
      name: topicName,
      createdAt,
      updatedAt,
      messages,
      isNameManuallyEdited: false
    } as Topic

    return { topic, messages, blocks }
  }

  /**
   * Convert backup message to Cherry Studio Message
   */
  private convertMessage(
    backupMessage: BackupMessage,
    topicId: string,
    assistantId: string,
    allBackupBlocks: BackupMessageBlock[],
    blockIdMap: Map<string, string>
  ): { message: Message; messageBlocks: MainTextMessageBlock[] } {
    const messageId = uuid()
    const role = backupMessage.role || 'user'

    // Map status
    const status = role === 'user' ? UserMessageStatus.SUCCESS : AssistantMessageStatus.SUCCESS

    const createdAt = backupMessage.createdAt || new Date().toISOString()
    const updatedAt = backupMessage.updatedAt || createdAt

    const messageBlocks: MainTextMessageBlock[] = []
    const newBlockIds: string[] = []

    // Get blocks for this message
    const backupBlockIds = backupMessage.blocks || []

    if (backupBlockIds.length > 0) {
      // Convert blocks referenced by this message
      for (const backupBlockId of backupBlockIds) {
        // Check if we already converted this block
        if (blockIdMap.has(backupBlockId)) {
          newBlockIds.push(blockIdMap.get(backupBlockId)!)
          continue
        }

        // Find the backup block
        const backupBlock = allBackupBlocks.find((b) => b.id === backupBlockId)
        if (backupBlock) {
          const newBlockId = uuid()
          blockIdMap.set(backupBlockId, newBlockId)

          const block = {
            id: newBlockId,
            messageId,
            type: this.mapBlockType(backupBlock.type),
            content: backupBlock.content || '',
            createdAt: (backupBlock.createdAt || createdAt) as string,
            updatedAt: (backupBlock.updatedAt || updatedAt) as string,
            status: this.mapBlockStatus(backupBlock.status)
          } as MainTextMessageBlock

          messageBlocks.push(block)
          newBlockIds.push(newBlockId)
        }
      }
    } else if (backupMessage.content) {
      // Legacy format: message has content directly, create a block for it
      const blockId = uuid()
      const block: MainTextMessageBlock = {
        id: blockId,
        messageId,
        type: MessageBlockType.MAIN_TEXT,
        content: backupMessage.content,
        createdAt,
        updatedAt,
        status: MessageBlockStatus.SUCCESS
      }
      messageBlocks.push(block)
      newBlockIds.push(blockId)
    }

    // Create message
    const message: Message = {
      id: messageId,
      role,
      assistantId,
      topicId,
      createdAt,
      updatedAt,
      status,
      blocks: newBlockIds,
      ...(backupMessage.model && { model: backupMessage.model })
    }

    return { message, messageBlocks }
  }

  /**
   * Map backup block type to Cherry Studio block type
   */
  private mapBlockType(backupType: string): MessageBlockType {
    switch (backupType) {
      case 'main_text':
        return MessageBlockType.MAIN_TEXT
      case 'thinking':
        return MessageBlockType.THINKING
      case 'translation':
        return MessageBlockType.TRANSLATION
      case 'image':
        return MessageBlockType.IMAGE
      case 'code':
        return MessageBlockType.CODE
      case 'tool':
        return MessageBlockType.TOOL
      case 'file':
        return MessageBlockType.FILE
      case 'error':
        return MessageBlockType.ERROR
      case 'citation':
        return MessageBlockType.CITATION
      case 'video':
        return MessageBlockType.VIDEO
      case 'compact':
        return MessageBlockType.COMPACT
      default:
        return MessageBlockType.MAIN_TEXT
    }
  }

  /**
   * Map backup block status to Cherry Studio block status
   */
  private mapBlockStatus(backupStatus?: string): MessageBlockStatus {
    switch (backupStatus) {
      case 'pending':
        return MessageBlockStatus.PENDING
      case 'processing':
        return MessageBlockStatus.PROCESSING
      case 'streaming':
        return MessageBlockStatus.STREAMING
      case 'success':
        return MessageBlockStatus.SUCCESS
      case 'error':
        return MessageBlockStatus.ERROR
      case 'paused':
        return MessageBlockStatus.PAUSED
      default:
        return MessageBlockStatus.SUCCESS
    }
  }
}
