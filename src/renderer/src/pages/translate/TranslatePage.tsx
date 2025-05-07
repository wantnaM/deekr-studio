import { CheckOutlined, DeleteOutlined, HistoryOutlined, SendOutlined } from '@ant-design/icons'
import { Navbar, NavbarCenter } from '@renderer/components/app/Navbar'
import CopyIcon from '@renderer/components/Icons/CopyIcon'
import { isLocalAi } from '@renderer/config/env'
import { translateLanguageOptions } from '@renderer/config/translate'
import db from '@renderer/databases'
import { useDefaultModel } from '@renderer/hooks/useAssistant'
import { fetchTranslate } from '@renderer/services/ApiService'
import { getDefaultTranslateAssistant } from '@renderer/services/AssistantService'
import type { Assistant, TranslateHistory } from '@renderer/types'
import { runAsyncFunction, uuid } from '@renderer/utils'
import { Button, Dropdown, Empty, Flex, Popconfirm, Select, Space, Tooltip } from 'antd'
import TextArea, { TextAreaRef } from 'antd/es/input/TextArea'
import dayjs from 'dayjs'
import { useLiveQuery } from 'dexie-react-hooks'
import { isEmpty } from 'lodash'
import { Mouse, Settings2, TriangleAlert } from 'lucide-react'
import { FC, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

let _text = ''
let _result = ''
let _targetLanguage = 'english'

const TranslatePage: FC = () => {
  const { t } = useTranslation()
  const [targetLanguage, setTargetLanguage] = useState(_targetLanguage)
  const [text, setText] = useState(_text)
  const [result, setResult] = useState(_result)
  const { translateModel } = useDefaultModel()
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false)
  const [isScrollSyncEnabled, setIsScrollSyncEnabled] = useState(false)
  const contentContainerRef = useRef<HTMLDivElement>(null)
  const textAreaRef = useRef<TextAreaRef>(null)
  const outputTextRef = useRef<HTMLDivElement>(null)
  const isProgrammaticScroll = useRef(false)

  const translateHistory = useLiveQuery(() => db.translate_history.orderBy('createdAt').reverse().toArray(), [])

  _text = text
  _result = result
  _targetLanguage = targetLanguage

  const saveTranslateHistory = async (
    sourceText: string,
    targetText: string,
    sourceLanguage: string,
    targetLanguage: string
  ) => {
    const history: TranslateHistory = {
      id: uuid(),
      sourceText,
      targetText,
      sourceLanguage,
      targetLanguage,
      createdAt: new Date().toISOString()
    }
    await db.translate_history.add(history)
  }

  const deleteHistory = async (id: string) => {
    db.translate_history.delete(id)
  }

  const clearHistory = async () => {
    db.translate_history.clear()
  }

  const onTranslate = async () => {
    if (!text.trim()) {
      return
    }

    if (!translateModel) {
      window.message.error({
        content: t('translate.error.not_configured'),
        key: 'translate-message'
      })
      return
    }

    const assistant: Assistant = getDefaultTranslateAssistant(targetLanguage, text)

    setLoading(true)
    let translatedText = ''
    try {
      await fetchTranslate({
        content: text,
        assistant,
        onResponse: (text) => {
          translatedText = text.replace(/^\s*\n+/g, '')
          setResult(translatedText)
        }
      })
    } catch (error) {
      console.error('Translation error:', error)
      window.message.error({
        content: String(error),
        key: 'translate-message'
      })
      setLoading(false)
      return
    }

    await saveTranslateHistory(text, translatedText, 'any', targetLanguage)
    setLoading(false)
  }

  const onCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onHistoryItemClick = (history: TranslateHistory) => {
    setText(history.sourceText)
    setResult(history.targetText)
    setTargetLanguage(history.targetLanguage)
  }

  useEffect(() => {
    isEmpty(text) && setResult('')
  }, [text])

  useEffect(() => {
    runAsyncFunction(async () => {
      const targetLang = await db.settings.get({ id: 'translate:target:language' })
      targetLang && setTargetLanguage(targetLang.value)
    })
  }, [])

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const isEnterPressed = e.keyCode == 13
    if (isEnterPressed && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      onTranslate()
    }
  }

  const SettingButton = () => {
    if (isLocalAi) {
      return null
    }

    if (translateModel) {
      return (
        <Link to="/settings/model" style={{ color: 'var(--color-text-2)', display: 'flex' }}>
          <Settings2 size={18} />
        </Link>
      )
    }

    return (
      <Link to="/settings/model" style={{ marginLeft: -10, display: 'flex' }}>
        <Button
          type="link"
          style={{ color: 'var(--color-error)', textDecoration: 'underline' }}
          icon={<TriangleAlert size={16} />}>
          {t('translate.error.not_configured')}
        </Button>
      </Link>
    )
  }

  // Handle input area scroll event
  const handleInputScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (!isScrollSyncEnabled || !outputTextRef.current || isProgrammaticScroll.current) return

    isProgrammaticScroll.current = true

    const inputEl = e.currentTarget
    const outputEl = outputTextRef.current

    // Calculate scroll position by ratio
    const inputScrollRatio = inputEl.scrollTop / (inputEl.scrollHeight - inputEl.clientHeight || 1)
    outputEl.scrollTop = inputScrollRatio * (outputEl.scrollHeight - outputEl.clientHeight || 1)

    requestAnimationFrame(() => {
      isProgrammaticScroll.current = false
    })
  }

  // Handle output area scroll event
  const handleOutputScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const inputEl = textAreaRef.current?.resizableTextArea?.textArea
    if (!isScrollSyncEnabled || !inputEl || isProgrammaticScroll.current) return

    isProgrammaticScroll.current = true

    const outputEl = e.currentTarget

    // Calculate scroll position by ratio
    const outputScrollRatio = outputEl.scrollTop / (outputEl.scrollHeight - outputEl.clientHeight || 1)
    inputEl.scrollTop = outputScrollRatio * (inputEl.scrollHeight - inputEl.clientHeight || 1)

    requestAnimationFrame(() => {
      isProgrammaticScroll.current = false
    })
  }

  const toggleScrollSync = () => {
    setIsScrollSyncEnabled(!isScrollSyncEnabled)
  }

  return (
    <Container id="translate-page">
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none', gap: 10 }}>
          {t('translate.title')}
          <Button
            className="nodrag"
            color="default"
            variant={historyDrawerVisible ? 'filled' : 'text'}
            type="text"
            icon={<HistoryOutlined />}
            onClick={() => setHistoryDrawerVisible(!historyDrawerVisible)}
          />
        </NavbarCenter>
      </Navbar>
      <ContentContainer id="content-container" ref={contentContainerRef} $historyDrawerVisible={historyDrawerVisible}>
        <HistoryContainner $historyDrawerVisible={historyDrawerVisible}>
          <OperationBar>
            <span style={{ fontSize: 16 }}>{t('translate.history.title')}</span>
            {!isEmpty(translateHistory) && (
              <Popconfirm
                title={t('translate.history.clear')}
                description={t('translate.history.clear_description')}
                onConfirm={clearHistory}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />}>
                  {t('translate.history.clear')}
                </Button>
              </Popconfirm>
            )}
          </OperationBar>
          {translateHistory && translateHistory.length ? (
            <HistoryList>
              {translateHistory.map((item) => (
                <Dropdown
                  key={item.id}
                  trigger={['contextMenu']}
                  menu={{
                    items: [
                      {
                        key: 'delete',
                        label: t('translate.history.delete'),
                        icon: <DeleteOutlined />,
                        danger: true,
                        onClick: () => deleteHistory(item.id)
                      }
                    ]
                  }}>
                  <HistoryListItem onClick={() => onHistoryItemClick(item)}>
                    <Flex justify="space-between" vertical gap={4} style={{ width: '100%' }}>
                      <HistoryListItemTitle>{item.sourceText}</HistoryListItemTitle>
                      <HistoryListItemTitle>{item.targetText}</HistoryListItemTitle>
                      <HistoryListItemDate>{dayjs(item.createdAt).format('MM/DD HH:mm')}</HistoryListItemDate>
                    </Flex>
                  </HistoryListItem>
                </Dropdown>
              ))}
            </HistoryList>
          ) : (
            <Flex justify="center" align="center" style={{ flex: 1 }}>
              <Empty description={t('translate.history.empty')} />
            </Flex>
          )}
        </HistoryContainner>

        <InputContainer>
          <OperationBar>
            <Flex align="center" gap={20}>
              <Select
                showSearch
                value="any"
                style={{ width: 180 }}
                optionFilterProp="label"
                disabled
                options={[{ label: t('translate.any.language'), value: 'any' }]}
              />
              <SettingButton />
              <Tooltip
                mouseEnterDelay={0.5}
                title={isScrollSyncEnabled ? t('translate.scroll_sync.disable') : t('translate.scroll_sync.enable')}>
                <Mouse
                  size={16}
                  onClick={toggleScrollSync}
                  style={{ cursor: 'pointer' }}
                  color={isScrollSyncEnabled ? 'var(--color-primary)' : 'var(--color-icon)'}
                />
              </Tooltip>
            </Flex>

            <Tooltip
              mouseEnterDelay={0.5}
              styles={{ body: { fontSize: '12px' } }}
              title={
                <div style={{ textAlign: 'center' }}>
                  Enter: {t('translate.button.translate')}
                  <br />
                  Shift + Enter: {t('translate.tooltip.newline')}
                </div>
              }>
              <TranslateButton
                type="primary"
                loading={loading}
                onClick={onTranslate}
                disabled={!text.trim()}
                icon={<SendOutlined />}>
                {t('translate.button.translate')}
              </TranslateButton>
            </Tooltip>
          </OperationBar>

          <Textarea
            ref={textAreaRef}
            variant="borderless"
            placeholder={t('translate.input.placeholder')}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            onScroll={handleInputScroll}
            disabled={loading}
            spellCheck={false}
            allowClear
          />
        </InputContainer>

        <OutputContainer>
          <OperationBar>
            <Select
              showSearch
              value={targetLanguage}
              style={{ width: 180 }}
              optionFilterProp="label"
              options={translateLanguageOptions()}
              onChange={(value) => {
                setTargetLanguage(value)
                db.settings.put({ id: 'translate:target:language', value })
              }}
              optionRender={(option) => (
                <Space>
                  <span role="img" aria-label={option.data.label}>
                    {option.data.emoji}
                  </span>
                  {option.label}
                </Space>
              )}
            />
            <CopyButton
              onClick={onCopy}
              disabled={!result}
              icon={copied ? <CheckOutlined style={{ color: 'var(--color-primary)' }} /> : <CopyIcon />}
            />
          </OperationBar>

          <OutputText ref={outputTextRef} onScroll={handleOutputScroll} className="selectable">
            {result || t('translate.output.placeholder')}
          </OutputText>
        </OutputContainer>
      </ContentContainer>
    </Container>
  )
}

const Container = styled.div`
  flex: 1;
`

const ContentContainer = styled.div<{ $historyDrawerVisible: boolean }>`
  height: calc(100vh - var(--navbar-height));
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  flex: 1;
  padding: 20px 15px;
  position: relative;
`

const InputContainer = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  padding-bottom: 5px;
  padding-right: 2px;
  margin-right: 15px;
`

const OperationBar = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 10px 8px 10px 10px;
`

const Textarea = styled(TextArea)`
  display: flex;
  flex: 1;
  font-size: 16px;
  border-radius: 0;
  .ant-input {
    resize: none;
    padding: 5px 16px;
  }
  .ant-input-clear-icon {
    font-size: 16px;
  }
`

const OutputContainer = styled.div`
  min-height: 0;
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-soft);
  border-radius: 10px;
  padding-bottom: 5px;
  padding-right: 2px;
`

const OutputText = styled.div`
  min-height: 0;
  flex: 1;
  padding: 5px 16px;
  overflow-y: auto;
  white-space: pre-wrap;
`

const TranslateButton = styled(Button)``

const CopyButton = styled(Button)``

const HistoryContainner = styled.div<{ $historyDrawerVisible: boolean }>`
  width: ${({ $historyDrawerVisible }) => ($historyDrawerVisible ? '300px' : '0')};
  height: calc(100vh - var(--navbar-height) - 40px);
  transition:
    width 0.2s,
    opacity 0.2s;
  border: 1px solid var(--color-border-soft);
  border-radius: 10px;
  margin-right: 15px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-right: 2px;
  padding-bottom: 5px;

  ${({ $historyDrawerVisible }) =>
    !$historyDrawerVisible &&
    `
    border: none;
    margin-right: 0;
    opacity: 0;
  `}
`

const HistoryList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  padding: 0 5px;
`

const HistoryListItem = styled.div`
  width: 100%;
  padding: 5px 10px;
  border-radius: var(--list-item-border-radius);
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;

  button {
    opacity: 0;
    transition: opacity 0.2s;
  }

  &:hover {
    background-color: var(--color-background-mute);
    button {
      opacity: 1;
    }
  }

  &:not(:last-child)::after {
    content: '';
    display: block;
    width: 100%;
    height: 1px;
    border-bottom: 1px dashed var(--color-border-soft);
    position: absolute;
    bottom: -8px;
    left: 0;
  }
`

const HistoryListItemTitle = styled.div`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
`

const HistoryListItemDate = styled.div`
  font-size: 12px;
  color: var(--color-text-3);
`

export default TranslatePage
