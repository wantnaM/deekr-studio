import { loggerService } from '@logger'
import db from '@renderer/databases'
import type { Message, Topic } from '@renderer/types'
import type { MainTextMessageBlock } from '@renderer/types/newMessage'
import { uuid } from '@renderer/utils'

import type { ImportResult } from '../types'

const logger = loggerService.withContext('MergeUtils')

/**
 * Merge result interface
 */
export interface MergeResult {
  topicsToAdd: Topic[]
  messagesToAdd: Message[]
  blocksToAdd: MainTextMessageBlock[]
  duplicateCount: number
  conflictCount: number
}

/**
 * Check if two topics are similar (for duplicate detection)
 */
function areTopicsSimilar(topic1: Topic, topic2: Partial<Topic>): boolean {
  // Compare message count
  if (!topic2.messages || topic1.messages.length !== topic2.messages.length) return false

  // Compare first message timestamp
  if (topic1.messages.length > 0 && topic2.messages.length > 0) {
    const time1 = new Date(topic1.messages[0].createdAt).getTime()
    const time2 = new Date(topic2.messages[0].createdAt).getTime()
    if (Math.abs(time1 - time2) > 60000) return false
  }

  // Compare name
  if (topic1.name && topic2.name && topic1.name === topic2.name) {
    return true
  }

  return false
}

/**
 * Generate new IDs for imported data to avoid conflicts
 */
function regenerateIds(
  topics: Topic[],
  messages: Message[],
  blocks: MainTextMessageBlock[]
): { topics: Topic[]; messages: Message[]; blocks: MainTextMessageBlock[]; idMap: Map<string, string> } {
  const idMap = new Map<string, string>()

  // Generate new IDs for topics
  const newTopics = topics.map((topic): Topic => {
    const newTopicId = uuid()
    idMap.set(topic.id, newTopicId)

    return {
      ...topic,
      id: newTopicId
    }
  })

  // Generate new IDs for messages and update topicId references
  const newMessages = messages.map((message) => {
    const newMessageId = uuid()
    idMap.set(message.id, newMessageId)

    const newTopicId = idMap.get(message.topicId) || message.topicId

    return {
      ...message,
      id: newMessageId,
      topicId: newTopicId,
      // Update block references
      blocks: message.blocks?.map((blockId) => idMap.get(blockId) || blockId) || []
    }
  })

  // Generate new IDs for blocks and update messageId references
  const newBlocks = blocks.map((block) => {
    const newBlockId = idMap.get(block.id) || uuid()
    idMap.set(block.id, newBlockId)

    const newMessageId = idMap.get(block.messageId) || block.messageId

    return {
      ...block,
      id: newBlockId,
      messageId: newMessageId
    }
  })

  return {
    topics: newTopics,
    messages: newMessages,
    blocks: newBlocks,
    idMap
  }
}

/**
 * Merge imported data with existing data
 * Checks for duplicates and regenerates IDs to avoid conflicts
 */
export async function mergeWithExistingData(importResult: ImportResult): Promise<MergeResult> {
  logger.info('Starting merge with existing data...')

  const { topics: importedTopics, messages: importedMessages, blocks: importedBlocks } = importResult

  // Get existing data
  const existingTopics = await db.topics.toArray()
  const existingBlocks = await db.message_blocks.toArray()

  logger.info(`Existing: ${existingTopics.length} topics, Existing blocks: ${existingBlocks.length}`)
  logger.info(
    `Importing: ${importedTopics.length} topics, ${importedMessages.length} messages, ${importedBlocks.length} blocks`
  )

  // Regenerate all IDs to avoid conflicts
  const {
    topics: newTopics,
    messages: newMessages,
    blocks: newBlocks
  } = regenerateIds(importedTopics, importedMessages, importedBlocks)

  // Check for duplicates
  let duplicateCount = 0
  const topicsToAdd = [] as Topic[]

  for (const newTopic of newTopics) {
    const isDuplicate = existingTopics.some((existingTopic) => areTopicsSimilar(existingTopic as Topic, newTopic))

    if (isDuplicate) {
      duplicateCount++
      logger.verbose(`Skipping duplicate topic: ${newTopic.name}`)
    } else {
      topicsToAdd.push(newTopic as Topic)
    }
  }

  // Filter messages and blocks for non-duplicate topics
  const topicIdsToAdd = new Set(topicsToAdd.map((t) => t.id))
  const messagesToAdd = newMessages.filter((m) => topicIdsToAdd.has(m.topicId))
  const blocksToAdd = newBlocks.filter((b) => {
    const message = messagesToAdd.find((m) => m.id === b.messageId)
    return message !== undefined
  })

  logger.info(
    `Merge result: ${topicsToAdd.length} topics to add (${duplicateCount} duplicates skipped), ` +
      `${messagesToAdd.length} messages, ${blocksToAdd.length} blocks`
  )

  return {
    topicsToAdd,
    messagesToAdd,
    blocksToAdd,
    duplicateCount,
    conflictCount: 0
  }
}

/**
 * Save merged data to database
 */
export async function saveMergedData(mergeResult: MergeResult): Promise<void> {
  const { topicsToAdd, messagesToAdd, blocksToAdd } = mergeResult

  if (topicsToAdd.length === 0) {
    logger.info('No new data to save')
    return
  }

  logger.info(`Saving ${topicsToAdd.length} topics, ${messagesToAdd.length} messages, ${blocksToAdd.length} blocks`)

  await db.transaction('rw', db.topics, db.message_blocks, async () => {
    // Save blocks first (they are referenced by messages)
    if (blocksToAdd.length > 0) {
      await db.message_blocks.bulkAdd(blocksToAdd)
      logger.info(`Saved ${blocksToAdd.length} message blocks`)
    }

    // Save topics with messages
    for (const topic of topicsToAdd) {
      const topicMessages = messagesToAdd.filter((m) => m.topicId === topic.id)
      await db.topics.add({
        id: topic.id,
        messages: topicMessages
      })
    }

    logger.info(`Saved ${topicsToAdd.length} topics`)
  })
}

/**
 * Preview imported data without saving
 * Returns information about what would be imported
 */
export async function previewImport(importResult: ImportResult): Promise<{
  totalTopics: number
  totalMessages: number
  duplicateTopics: number
  newTopics: number
  preview: Array<{
    name: string
    messageCount: number
    createdAt: string
    isDuplicate: boolean
  }>
}> {
  const mergeResult = await mergeWithExistingData(importResult)

  const preview = importResult.topics.map((topic) => {
    const isDuplicate = !mergeResult.topicsToAdd.some((t) => t.name === topic.name)
    return {
      name: topic.name,
      messageCount: topic.messages.length,
      createdAt: topic.createdAt,
      isDuplicate
    }
  })

  return {
    totalTopics: importResult.topics.length,
    totalMessages: importResult.messages.length,
    duplicateTopics: mergeResult.duplicateCount,
    newTopics: mergeResult.topicsToAdd.length,
    preview
  }
}
