import SvgSpinners180Ring from '@renderer/components/Icons/SvgSpinners180Ring'
import { fetchSuggestions } from '@renderer/services/ApiService'
import { getUserMessage } from '@renderer/services/MessagesService'
import { useAppDispatch } from '@renderer/store'
import { sendMessage } from '@renderer/store/thunk/messageThunk'
import { Assistant, Suggestion } from '@renderer/types'
import type { Message } from '@renderer/types/newMessage'
import { last } from 'lodash'
import { FC, memo, useEffect, useState } from 'react'
import styled from 'styled-components'

interface Props {
  assistant: Assistant
  messages: Message[]
}

const suggestionsMap = new Map<string, Suggestion[]>()

const Suggestions: FC<Props> = ({ assistant, messages }) => {
  const dispatch = useAppDispatch()

  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    suggestionsMap.get(messages[messages.length - 1]?.id) || []
  )
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  const handleSuggestionClick = async (content: string) => {
    const { message: userMessage, blocks } = getUserMessage({
      assistant,
      topic: assistant.topics[0],
      content
    })

    await dispatch(sendMessage(userMessage, blocks, assistant, assistant.topics[0].id))
  }

  const suggestionsHandle = async () => {
    if (loadingSuggestions) return
    try {
      setLoadingSuggestions(true)
      const _suggestions = await fetchSuggestions({
        assistant,
        messages
      })
      if (_suggestions.length) {
        setSuggestions(_suggestions)
        suggestionsMap.set(messages[messages.length - 1].id, _suggestions)
      }
    } finally {
      setLoadingSuggestions(false)
    }
  }

  useEffect(() => {
    suggestionsHandle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setSuggestions(suggestionsMap.get(messages[messages.length - 1]?.id) || [])
  }, [messages])

  if (last(messages)?.status !== 'success') {
    return null
  }
  if (loadingSuggestions) {
    return (
      <Container>
        <SvgSpinners180Ring color="var(--color-text-2)" />
      </Container>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <Container>
      <SuggestionsContainer>
        {suggestions.map((s, i) => (
          <SuggestionItem key={i} onClick={() => handleSuggestionClick(s.content)}>
            {s.content} →
          </SuggestionItem>
        ))}
      </SuggestionsContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 10px 20px 65px;
  display: flex;
  width: 100%;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 15px;
`

const SuggestionsContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
`

const SuggestionItem = styled.div`
  display: flex;
  align-items: center;
  width: fit-content;
  padding: 5px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: var(--color-text);
  background: var(--color-background-mute);
  cursor: pointer;
  &:hover {
    opacity: 0.9;
  }
`

export default memo(Suggestions)
