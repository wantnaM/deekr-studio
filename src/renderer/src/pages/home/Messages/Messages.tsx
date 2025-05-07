import SvgSpinners180Ring from '@renderer/components/Icons/SvgSpinners180Ring'
import Scrollbar from '@renderer/components/Scrollbar'
import { LOAD_MORE_COUNT } from '@renderer/config/constant'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { useMessageOperations, useTopicMessages } from '@renderer/hooks/useMessageOperations'
import { useSettings } from '@renderer/hooks/useSettings'
import { useShortcut } from '@renderer/hooks/useShortcuts'
import { autoRenameTopic, getTopic } from '@renderer/hooks/useTopic'
import { getDefaultTopic } from '@renderer/services/AssistantService'
import { EVENT_NAMES, EventEmitter } from '@renderer/services/EventService'
import { getContextCount, getGroupedMessages, getUserMessage } from '@renderer/services/MessagesService'
import { estimateHistoryTokens } from '@renderer/services/TokenService'
import { useAppDispatch } from '@renderer/store'
import { newMessagesActions } from '@renderer/store/newMessage'
import { saveMessageAndBlocksToDB } from '@renderer/store/thunk/messageThunk'
import type { Assistant, Topic } from '@renderer/types'
import type { Message } from '@renderer/types/newMessage'
import {
  captureScrollableDivAsBlob,
  captureScrollableDivAsDataURL,
  removeSpecialCharactersForFileName,
  runAsyncFunction
} from '@renderer/utils'
import { getMainTextContent } from '@renderer/utils/messageUtils/find'
import { last } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import InfiniteScroll from 'react-infinite-scroll-component'
import styled from 'styled-components'

import ChatNavigation from './ChatNavigation'
import MessageAnchorLine from './MessageAnchorLine'
import MessageGroup from './MessageGroup'
import NarrowLayout from './NarrowLayout'
import Prompt from './Prompt'

interface MessagesProps {
  assistant: Assistant
  topic: Topic
  setActiveTopic: (topic: Topic) => void
}

const Messages: React.FC<MessagesProps> = ({ assistant, topic, setActiveTopic }) => {
  const { t } = useTranslation()
  const { showTopics, topicPosition, showAssistants, messageNavigation } = useSettings()
  const { updateTopic, addTopic } = useAssistant(assistant.id)
  const dispatch = useAppDispatch()
  const containerRef = useRef<HTMLDivElement>(null)
  const [displayMessages, setDisplayMessages] = useState<Message[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isProcessingContext, setIsProcessingContext] = useState(false)
  const messages = useTopicMessages(topic.id)
  const { displayCount, clearTopicMessages, deleteMessage, createTopicBranch } = useMessageOperations(topic)
  const messagesRef = useRef<Message[]>(messages)

  useEffect(() => {
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    const newDisplayMessages = computeDisplayMessages(messages, 0, displayCount)
    setDisplayMessages(newDisplayMessages)
    setHasMore(messages.length > displayCount)
  }, [messages, displayCount])

  const maxWidth = useMemo(() => {
    const showRightTopics = showTopics && topicPosition === 'right'
    const minusAssistantsWidth = showAssistants ? '- var(--assistants-width)' : ''
    const minusRightTopicsWidth = showRightTopics ? '- var(--assistants-width)' : ''
    return `calc(100vw - var(--sidebar-width) ${minusAssistantsWidth} ${minusRightTopicsWidth} - 5px)`
  }, [showAssistants, showTopics, topicPosition])

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          containerRef.current.scrollTo({
            top: containerRef.current.scrollHeight
          })
        }
      })
    }
  }, [])

  const clearTopic = useCallback(
    async (data: Topic) => {
      const defaultTopic = getDefaultTopic(assistant.id)

      if (data && data.id !== topic.id) {
        await clearTopicMessages(data.id)
        updateTopic({ ...data, name: defaultTopic.name } as Topic)
        return
      }

      await clearTopicMessages()

      setDisplayMessages([])

      const _topic = getTopic(assistant, topic.id)
      _topic && updateTopic({ ..._topic, name: defaultTopic.name } as Topic)
    },
    [assistant, clearTopicMessages, topic.id, updateTopic]
  )

  useEffect(() => {
    const unsubscribes = [
      EventEmitter.on(EVENT_NAMES.SEND_MESSAGE, scrollToBottom),
      EventEmitter.on(EVENT_NAMES.CLEAR_MESSAGES, async (data: Topic) => {
        window.modal.confirm({
          title: t('chat.input.clear.title'),
          content: t('chat.input.clear.content'),
          centered: true,
          onOk: () => clearTopic(data)
        })
      }),
      EventEmitter.on(EVENT_NAMES.COPY_TOPIC_IMAGE, async () => {
        await captureScrollableDivAsBlob(containerRef, async (blob) => {
          if (blob) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
          }
        })
      }),
      EventEmitter.on(EVENT_NAMES.EXPORT_TOPIC_IMAGE, async () => {
        const imageData = await captureScrollableDivAsDataURL(containerRef)
        if (imageData) {
          window.api.file.saveImage(removeSpecialCharactersForFileName(topic.name), imageData)
        }
      }),
      EventEmitter.on(EVENT_NAMES.NEW_CONTEXT, async () => {
        if (isProcessingContext) return
        setIsProcessingContext(true)

        try {
          const messages = messagesRef.current

          if (messages.length === 0) {
            return
          }

          const lastMessage = last(messages)

          if (lastMessage?.type === 'clear') {
            await deleteMessage(lastMessage.id)
            scrollToBottom()
            return
          }

          const { message: clearMessage } = getUserMessage({ assistant, topic, type: 'clear' })
          dispatch(newMessagesActions.addMessage({ topicId: topic.id, message: clearMessage }))
          await saveMessageAndBlocksToDB(clearMessage, [])

          scrollToBottom()
        } finally {
          setIsProcessingContext(false)
        }
      }),
      EventEmitter.on(EVENT_NAMES.NEW_BRANCH, async (index: number) => {
        const newTopic = getDefaultTopic(assistant.id)
        newTopic.name = topic.name
        const currentMessages = messagesRef.current

        if (index < 0 || index > currentMessages.length) {
          console.error(`[NEW_BRANCH] Invalid branch index: ${index}`)
          return
        }

        // 1. Add the new topic to Redux store FIRST
        addTopic(newTopic)

        // 2. Call the thunk to clone messages and update DB
        const success = await createTopicBranch(topic.id, currentMessages.length - index, newTopic)

        if (success) {
          // 3. Set the new topic as active
          setActiveTopic(newTopic)
          // 4. Trigger auto-rename for the new topic
          autoRenameTopic(assistant, newTopic.id)
        } else {
          // Optional: Handle cloning failure (e.g., show an error message)
          // You might want to remove the added topic if cloning fails
          // removeTopic(newTopic.id); // Assuming you have a removeTopic function
          console.error(`[NEW_BRANCH] Failed to create topic branch for topic ${newTopic.id}`)
          window.message.error(t('message.branch.error')) // Example error message
        }
      })
    ]

    return () => unsubscribes.forEach((unsub) => unsub())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistant, dispatch, scrollToBottom, topic, isProcessingContext])

  useEffect(() => {
    runAsyncFunction(async () => {
      EventEmitter.emit(EVENT_NAMES.ESTIMATED_TOKEN_COUNT, {
        tokensCount: await estimateHistoryTokens(assistant, messages),
        contextCount: getContextCount(assistant, messages)
      })
    })
  }, [assistant, messages])

  const loadMoreMessages = useCallback(() => {
    if (!hasMore || isLoadingMore) return

    setIsLoadingMore(true)
    setTimeout(() => {
      const currentLength = displayMessages.length
      const newMessages = computeDisplayMessages(messages, currentLength, LOAD_MORE_COUNT)

      setDisplayMessages((prev) => [...prev, ...newMessages])
      setHasMore(currentLength + LOAD_MORE_COUNT < messages.length)
      setIsLoadingMore(false)
    }, 300)
  }, [displayMessages.length, hasMore, isLoadingMore, messages])

  useShortcut('copy_last_message', () => {
    const lastMessage = last(messages)
    if (lastMessage) {
      navigator.clipboard.writeText(getMainTextContent(lastMessage))
      window.message.success(t('message.copy.success'))
    }
  })

  const groupedMessages = useMemo(() => Object.entries(getGroupedMessages(displayMessages)), [displayMessages])
  return (
    <Container
      id="messages"
      style={{ maxWidth }}
      key={assistant.id}
      ref={containerRef}
      $right={topicPosition === 'left'}>
      <NarrowLayout style={{ display: 'flex', flexDirection: 'column-reverse' }}>
        <InfiniteScroll
          dataLength={displayMessages.length}
          next={loadMoreMessages}
          hasMore={hasMore}
          loader={null}
          scrollableTarget="messages"
          inverse
          style={{ overflow: 'visible' }}>
          <ScrollContainer>
            {groupedMessages.map(([key, groupMessages]) => (
              <MessageGroup
                key={key}
                messages={groupMessages}
                topic={topic}
                hidePresetMessages={assistant.settings?.hideMessages}
              />
            ))}
            {isLoadingMore && (
              <LoaderContainer>
                <SvgSpinners180Ring color="var(--color-text-2)" />
              </LoaderContainer>
            )}
          </ScrollContainer>
        </InfiniteScroll>
        <Prompt assistant={assistant} key={assistant.prompt} topic={topic} />
      </NarrowLayout>
      {messageNavigation === 'anchor' && <MessageAnchorLine messages={displayMessages} />}
      {messageNavigation === 'buttons' && <ChatNavigation containerId="messages" />}
    </Container>
  )
}

const computeDisplayMessages = (messages: Message[], startIndex: number, displayCount: number) => {
  const reversedMessages = [...messages].reverse()

  // 如果剩余消息数量小于 displayCount，直接返回所有剩余消息
  if (reversedMessages.length - startIndex <= displayCount) {
    return reversedMessages.slice(startIndex)
  }

  const userIdSet = new Set() // 用户消息 id 集合
  const assistantIdSet = new Set() // 助手消息 askId 集合
  const displayMessages: Message[] = []

  // 处理单条消息的函数
  const processMessage = (message: Message) => {
    if (!message) return

    const idSet = message.role === 'user' ? userIdSet : assistantIdSet
    const messageId = message.role === 'user' ? message.id : message.askId

    if (!idSet.has(messageId)) {
      idSet.add(messageId)
      displayMessages.push(message)
      return
    }
    // 如果是相同 askId 的助手消息，也要显示
    displayMessages.push(message)
  }

  // 遍历消息直到满足显示数量要求
  for (let i = startIndex; i < reversedMessages.length && userIdSet.size + assistantIdSet.size < displayCount; i++) {
    processMessage(reversedMessages[i])
  }

  return displayMessages
}

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  padding: 10px;
  width: 100%;
  background: var(--color-background);
  pointer-events: none;
`

const ScrollContainer = styled.div`
  display: flex;
  flex-direction: column-reverse;
`

interface ContainerProps {
  $right?: boolean
}

const Container = styled(Scrollbar)<ContainerProps>`
  display: flex;
  flex-direction: column-reverse;
  padding: 10px 0 10px;
  overflow-x: hidden;
  background-color: var(--color-background);
  z-index: 1;
`

export default Messages
