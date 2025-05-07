import { CheckOutlined } from '@ant-design/icons'
import { HStack } from '@renderer/components/Layout'
import Scrollbar from '@renderer/components/Scrollbar'
import {
  DEFAULT_CONTEXTCOUNT,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  isMac,
  isWindows
} from '@renderer/config/constant'
import { codeThemes } from '@renderer/context/SyntaxHighlighterProvider'
import { useAssistant } from '@renderer/hooks/useAssistant'
import { useSettings } from '@renderer/hooks/useSettings'
import { SettingDivider, SettingRow, SettingRowTitle, SettingSubtitle } from '@renderer/pages/settings'
import AssistantSettingsPopup from '@renderer/pages/settings/AssistantSettings'
import { useAppDispatch } from '@renderer/store'
import {
  SendMessageShortcut,
  setAutoTranslateWithSpace,
  setCodeCacheable,
  setCodeCacheMaxSize,
  setCodeCacheThreshold,
  setCodeCacheTTL,
  setCodeCollapsible,
  setCodeShowLineNumbers,
  setCodeStyle,
  setCodeWrappable,
  setEnableBackspaceDeleteModel,
  setEnableQuickPanelTriggers,
  setFontSize,
  setMathEngine,
  setMessageFont,
  setMessageNavigation,
  setMessageStyle,
  setMultiModelMessageStyle,
  setPasteLongTextAsFile,
  setPasteLongTextThreshold,
  setRenderInputMessageAsMarkdown,
  setShowInputEstimatedTokens,
  setShowMessageDivider,
  setShowTranslateConfirm,
  setThoughtAutoCollapse
} from '@renderer/store/settings'
import {
  Assistant,
  AssistantSettings,
  CodeStyleVarious,
  MathEngine,
  ThemeMode,
  TranslateLanguageVarious
} from '@renderer/types'
import { modalConfirm } from '@renderer/utils'
import { Button, Col, InputNumber, Row, Select, Slider, Switch, Tooltip } from 'antd'
import { CircleHelp, RotateCcw, Settings2 } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface Props {
  assistant: Assistant
}

const SettingsTab: FC<Props> = (props) => {
  const { assistant, updateAssistantSettings, updateAssistant } = useAssistant(props.assistant.id)
  const { messageStyle, codeStyle, fontSize, language } = useSettings()

  const [temperature, setTemperature] = useState(assistant?.settings?.temperature ?? DEFAULT_TEMPERATURE)
  const [contextCount, setContextCount] = useState(assistant?.settings?.contextCount ?? DEFAULT_CONTEXTCOUNT)
  const [enableMaxTokens, setEnableMaxTokens] = useState(assistant?.settings?.enableMaxTokens ?? false)
  const [maxTokens, setMaxTokens] = useState(assistant?.settings?.maxTokens ?? 0)
  const [fontSizeValue, setFontSizeValue] = useState(fontSize)
  const [streamOutput, setStreamOutput] = useState(assistant?.settings?.streamOutput ?? true)
  const { t } = useTranslation()

  const dispatch = useAppDispatch()

  const {
    showMessageDivider,
    messageFont,
    showInputEstimatedTokens,
    sendMessageShortcut,
    setSendMessageShortcut,
    targetLanguage,
    setTargetLanguage,
    pasteLongTextAsFile,
    renderInputMessageAsMarkdown,
    codeShowLineNumbers,
    codeCollapsible,
    codeWrappable,
    codeCacheable,
    codeCacheMaxSize,
    codeCacheTTL,
    codeCacheThreshold,
    mathEngine,
    autoTranslateWithSpace,
    pasteLongTextThreshold,
    multiModelMessageStyle,
    thoughtAutoCollapse,
    messageNavigation,
    enableQuickPanelTriggers,
    enableBackspaceDeleteModel,
    showTranslateConfirm
  } = useSettings()

  const onUpdateAssistantSettings = (settings: Partial<AssistantSettings>) => {
    updateAssistantSettings(settings)
  }

  const onTemperatureChange = (value) => {
    if (!isNaN(value as number)) {
      onUpdateAssistantSettings({ temperature: value })
    }
  }

  const onContextCountChange = (value) => {
    if (!isNaN(value as number)) {
      onUpdateAssistantSettings({ contextCount: value })
    }
  }

  const onMaxTokensChange = (value) => {
    if (!isNaN(value as number)) {
      onUpdateAssistantSettings({ maxTokens: value })
    }
  }

  const onReset = () => {
    setTemperature(DEFAULT_TEMPERATURE)
    setContextCount(DEFAULT_CONTEXTCOUNT)
    updateAssistant({
      ...assistant,
      settings: {
        ...assistant.settings,
        temperature: DEFAULT_TEMPERATURE,
        contextCount: DEFAULT_CONTEXTCOUNT,
        enableMaxTokens: false,
        maxTokens: DEFAULT_MAX_TOKENS,
        streamOutput: true,
        hideMessages: false,
        customParameters: []
      }
    })
  }

  useEffect(() => {
    setTemperature(assistant?.settings?.temperature ?? DEFAULT_TEMPERATURE)
    setContextCount(assistant?.settings?.contextCount ?? DEFAULT_CONTEXTCOUNT)
    setEnableMaxTokens(assistant?.settings?.enableMaxTokens ?? false)
    setMaxTokens(assistant?.settings?.maxTokens ?? DEFAULT_MAX_TOKENS)
    setStreamOutput(assistant?.settings?.streamOutput ?? true)
  }, [assistant])

  const formatSliderTooltip = (value?: number) => {
    if (value === undefined) return ''
    return value === 20 ? '∞' : value.toString()
  }

  return (
    <Container className="settings-tab">
      <SettingGroup style={{ marginTop: 10 }}>
        <SettingSubtitle style={{ marginTop: 0, display: 'flex', justifyContent: 'space-between' }}>
          <HStack alignItems="center">
            {t('assistants.settings.title')}{' '}
            <Tooltip title={t('chat.settings.reset')}>
              <RotateCcw size={20} onClick={onReset} style={{ cursor: 'pointer', padding: '0 3px' }} />
            </Tooltip>
          </HStack>
          <Button
            type="text"
            size="small"
            icon={<Settings2 size={16} />}
            onClick={() => AssistantSettingsPopup.show({ assistant, tab: 'model' })}
          />
        </SettingSubtitle>
        <SettingDivider />
        <Row align="middle">
          <Label>{t('chat.settings.temperature')}</Label>
          <Tooltip title={t('chat.settings.temperature.tip')}>
            <CircleHelp size={14} color="var(--color-text-2)" />
          </Tooltip>
        </Row>
        <Row align="middle" gutter={10}>
          <Col span={24}>
            <Slider
              min={0}
              max={2}
              onChange={setTemperature}
              onChangeComplete={onTemperatureChange}
              value={typeof temperature === 'number' ? temperature : 0}
              step={0.1}
            />
          </Col>
        </Row>
        <Row align="middle">
          <Label>{t('chat.settings.context_count')}</Label>
          <Tooltip title={t('chat.settings.context_count.tip')}>
            <CircleHelp size={14} color="var(--color-text-2)" />
          </Tooltip>
        </Row>
        <Row align="middle" gutter={10}>
          <Col span={24}>
            <Slider
              min={0}
              max={10}
              onChange={setContextCount}
              onChangeComplete={onContextCountChange}
              value={typeof contextCount === 'number' ? contextCount : 0}
              step={1}
              tooltip={{ formatter: formatSliderTooltip }}
            />
          </Col>
        </Row>
        <SettingRow>
          <SettingRowTitleSmall>{t('models.stream_output')}</SettingRowTitleSmall>
          <Switch
            size="small"
            checked={streamOutput}
            onChange={(checked) => {
              setStreamOutput(checked)
              onUpdateAssistantSettings({ streamOutput: checked })
            }}
          />
        </SettingRow>
        <SettingDivider />
        <Row align="middle" justify="space-between" style={{ marginBottom: 10 }}>
          <HStack alignItems="center">
            <Label>{t('chat.settings.max_tokens')}</Label>
            <Tooltip title={t('chat.settings.max_tokens.tip')}>
              <CircleHelp size={14} color="var(--color-text-2)" />
            </Tooltip>
          </HStack>
          <Switch
            size="small"
            checked={enableMaxTokens}
            onChange={async (enabled) => {
              if (enabled) {
                const confirmed = await modalConfirm({
                  title: t('chat.settings.max_tokens.confirm'),
                  content: t('chat.settings.max_tokens.confirm_content'),
                  okButtonProps: {
                    danger: true
                  }
                })
                if (!confirmed) return
              }
              setEnableMaxTokens(enabled)
              onUpdateAssistantSettings({ enableMaxTokens: enabled })
            }}
          />
        </Row>
        {enableMaxTokens && (
          <Row align="middle" gutter={10}>
            <Col span={24}>
              <InputNumber
                disabled={!enableMaxTokens}
                min={0}
                max={10000000}
                step={100}
                value={typeof maxTokens === 'number' ? maxTokens : 0}
                changeOnBlur
                onChange={(value) => value && setMaxTokens(value)}
                onBlur={() => onMaxTokensChange(maxTokens)}
                style={{ width: '100%' }}
              />
            </Col>
          </Row>
        )}
      </SettingGroup>
      <SettingGroup>
        <SettingSubtitle style={{ marginTop: 0 }}>{t('settings.messages.title')}</SettingSubtitle>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.messages.divider')}</SettingRowTitleSmall>
          <Switch
            size="small"
            checked={showMessageDivider}
            onChange={(checked) => dispatch(setShowMessageDivider(checked))}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.messages.use_serif_font')}</SettingRowTitleSmall>
          <Switch
            size="small"
            checked={messageFont === 'serif'}
            onChange={(checked) => dispatch(setMessageFont(checked ? 'serif' : 'system'))}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('chat.settings.show_line_numbers')}</SettingRowTitleSmall>
          <Switch
            size="small"
            checked={codeShowLineNumbers}
            onChange={(checked) => dispatch(setCodeShowLineNumbers(checked))}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('chat.settings.code_collapsible')}</SettingRowTitleSmall>
          <Switch
            size="small"
            checked={codeCollapsible}
            onChange={(checked) => dispatch(setCodeCollapsible(checked))}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('chat.settings.code_wrappable')}</SettingRowTitleSmall>
          <Switch size="small" checked={codeWrappable} onChange={(checked) => dispatch(setCodeWrappable(checked))} />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>
            {t('chat.settings.code_cacheable')}{' '}
            <Tooltip title={t('chat.settings.code_cacheable.tip')}>
              <CircleHelp size={14} style={{ marginLeft: 4 }} color="var(--color-text-2)" />
            </Tooltip>
          </SettingRowTitleSmall>
          <Switch size="small" checked={codeCacheable} onChange={(checked) => dispatch(setCodeCacheable(checked))} />
        </SettingRow>
        {codeCacheable && (
          <>
            <SettingDivider />
            <SettingRow>
              <SettingRowTitleSmall>
                {t('chat.settings.code_cache_max_size')}
                <Tooltip title={t('chat.settings.code_cache_max_size.tip')}>
                  <CircleHelp size={14} style={{ marginLeft: 4 }} color="var(--color-text-2)" />
                </Tooltip>
              </SettingRowTitleSmall>
              <InputNumber
                size="small"
                min={1000}
                max={10000}
                step={1000}
                value={codeCacheMaxSize}
                onChange={(value) => dispatch(setCodeCacheMaxSize(value ?? 1000))}
                style={{ width: 80 }}
              />
            </SettingRow>
            <SettingDivider />
            <SettingRow>
              <SettingRowTitleSmall>
                {t('chat.settings.code_cache_ttl')}
                <Tooltip title={t('chat.settings.code_cache_ttl.tip')}>
                  <CircleHelp size={14} style={{ marginLeft: 4 }} color="var(--color-text-2)" />
                </Tooltip>
              </SettingRowTitleSmall>
              <InputNumber
                size="small"
                min={15}
                max={720}
                step={15}
                value={codeCacheTTL}
                onChange={(value) => dispatch(setCodeCacheTTL(value ?? 15))}
                style={{ width: 80 }}
              />
            </SettingRow>
            <SettingDivider />
            <SettingRow>
              <SettingRowTitleSmall>
                {t('chat.settings.code_cache_threshold')}
                <Tooltip title={t('chat.settings.code_cache_threshold.tip')}>
                  <CircleHelp size={14} style={{ marginLeft: 4 }} color="var(--color-text-2)" />
                </Tooltip>
              </SettingRowTitleSmall>
              <InputNumber
                size="small"
                min={0}
                max={50}
                step={1}
                value={codeCacheThreshold}
                onChange={(value) => dispatch(setCodeCacheThreshold(value ?? 2))}
                style={{ width: 80 }}
              />
            </SettingRow>
          </>
        )}
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>
            {t('chat.settings.thought_auto_collapse')}
            <Tooltip title={t('chat.settings.thought_auto_collapse.tip')}>
              <CircleHelp size={14} style={{ marginLeft: 4 }} color="var(--color-text-2)" />
            </Tooltip>
          </SettingRowTitleSmall>
          <Switch
            size="small"
            checked={thoughtAutoCollapse}
            onChange={(checked) => dispatch(setThoughtAutoCollapse(checked))}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('message.message.style')}</SettingRowTitleSmall>
          <StyledSelect
            value={messageStyle}
            onChange={(value) => dispatch(setMessageStyle(value as 'plain' | 'bubble'))}
            style={{ width: 135 }}
            size="small">
            <Select.Option value="plain">{t('message.message.style.plain')}</Select.Option>
            <Select.Option value="bubble">{t('message.message.style.bubble')}</Select.Option>
          </StyledSelect>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('message.message.multi_model_style')}</SettingRowTitleSmall>
          <StyledSelect
            size="small"
            value={multiModelMessageStyle}
            onChange={(value) =>
              dispatch(setMultiModelMessageStyle(value as 'fold' | 'vertical' | 'horizontal' | 'grid'))
            }
            style={{ width: 135 }}>
            <Select.Option value="fold">{t('message.message.multi_model_style.fold')}</Select.Option>
            <Select.Option value="vertical">{t('message.message.multi_model_style.vertical')}</Select.Option>
            <Select.Option value="horizontal">{t('message.message.multi_model_style.horizontal')}</Select.Option>
            <Select.Option value="grid">{t('message.message.multi_model_style.grid')}</Select.Option>
          </StyledSelect>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.messages.navigation')}</SettingRowTitleSmall>
          <StyledSelect
            size="small"
            value={messageNavigation}
            onChange={(value) => dispatch(setMessageNavigation(value as 'none' | 'buttons' | 'anchor'))}
            style={{ width: 135 }}>
            <Select.Option value="none">{t('settings.messages.navigation.none')}</Select.Option>
            <Select.Option value="buttons">{t('settings.messages.navigation.buttons')}</Select.Option>
            <Select.Option value="anchor">{t('settings.messages.navigation.anchor')}</Select.Option>
          </StyledSelect>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('message.message.code_style')}</SettingRowTitleSmall>
          <StyledSelect
            value={codeStyle}
            onChange={(value) => dispatch(setCodeStyle(value as CodeStyleVarious))}
            style={{ width: 135 }}
            size="small">
            {codeThemes.map((theme) => (
              <Select.Option key={theme} value={theme}>
                {theme}
              </Select.Option>
            ))}
          </StyledSelect>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.messages.math_engine')}</SettingRowTitleSmall>
          <StyledSelect
            value={mathEngine}
            onChange={(value) => dispatch(setMathEngine(value as MathEngine))}
            style={{ width: 135 }}
            size="small">
            <Select.Option value="KaTeX">KaTeX</Select.Option>
            <Select.Option value="MathJax">MathJax</Select.Option>
            <Select.Option value="none">{t('settings.messages.math_engine.none')}</Select.Option>
          </StyledSelect>
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.font_size.title')}</SettingRowTitleSmall>
        </SettingRow>
        <Row align="middle" gutter={10}>
          <Col span={24}>
            <Slider
              value={fontSizeValue}
              onChange={(value) => setFontSizeValue(value)}
              onChangeComplete={(value) => dispatch(setFontSize(value))}
              min={12}
              max={22}
              step={1}
              marks={{
                12: <span style={{ fontSize: '12px' }}>A</span>,
                14: <span style={{ fontSize: '14px' }}>{t('common.default')}</span>,
                22: <span style={{ fontSize: '18px' }}>A</span>
              }}
            />
          </Col>
        </Row>
      </SettingGroup>
      <SettingGroup>
        <SettingSubtitle style={{ marginTop: 0 }}>{t('settings.messages.input.title')}</SettingSubtitle>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.messages.input.show_estimated_tokens')}</SettingRowTitleSmall>
          <Switch
            size="small"
            checked={showInputEstimatedTokens}
            onChange={(checked) => dispatch(setShowInputEstimatedTokens(checked))}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.messages.input.paste_long_text_as_file')}</SettingRowTitleSmall>
          <Switch
            size="small"
            checked={pasteLongTextAsFile}
            onChange={(checked) => dispatch(setPasteLongTextAsFile(checked))}
          />
        </SettingRow>
        {pasteLongTextAsFile && (
          <>
            <SettingDivider />
            <SettingRow>
              <SettingRowTitleSmall>{t('settings.messages.input.paste_long_text_threshold')}</SettingRowTitleSmall>
              <InputNumber
                size="small"
                min={500}
                max={10000}
                step={100}
                value={pasteLongTextThreshold}
                onChange={(value) => dispatch(setPasteLongTextThreshold(value ?? 500))}
                style={{ width: 80 }}
              />
            </SettingRow>
          </>
        )}
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.messages.markdown_rendering_input_message')}</SettingRowTitleSmall>
          <Switch
            size="small"
            checked={renderInputMessageAsMarkdown}
            onChange={(checked) => dispatch(setRenderInputMessageAsMarkdown(checked))}
          />
        </SettingRow>
        <SettingDivider />
        {!language.startsWith('en') && (
          <>
            <SettingRow>
              <SettingRowTitleSmall>{t('settings.input.auto_translate_with_space')}</SettingRowTitleSmall>
              <Switch
                size="small"
                checked={autoTranslateWithSpace}
                onChange={(checked) => dispatch(setAutoTranslateWithSpace(checked))}
              />
            </SettingRow>
            <SettingDivider />
          </>
        )}
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.input.show_translate_confirm')}</SettingRowTitleSmall>
          <Switch
            size="small"
            checked={showTranslateConfirm}
            onChange={(checked) => dispatch(setShowTranslateConfirm(checked))}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.messages.input.enable_quick_triggers')}</SettingRowTitleSmall>
          <Switch
            size="small"
            checked={enableQuickPanelTriggers}
            onChange={(checked) => dispatch(setEnableQuickPanelTriggers(checked))}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.messages.input.enable_delete_model')}</SettingRowTitleSmall>
          <Switch
            size="small"
            checked={enableBackspaceDeleteModel}
            onChange={(checked) => dispatch(setEnableBackspaceDeleteModel(checked))}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.input.target_language')}</SettingRowTitleSmall>
          <StyledSelect
            defaultValue={'english' as TranslateLanguageVarious}
            size="small"
            value={targetLanguage}
            menuItemSelectedIcon={<CheckOutlined />}
            options={[
              { value: 'chinese', label: t('settings.input.target_language.chinese') },
              { value: 'chinese-traditional', label: t('settings.input.target_language.chinese-traditional') },
              { value: 'english', label: t('settings.input.target_language.english') },
              { value: 'japanese', label: t('settings.input.target_language.japanese') },
              { value: 'russian', label: t('settings.input.target_language.russian') }
            ]}
            onChange={(value) => setTargetLanguage(value as TranslateLanguageVarious)}
            style={{ width: 135 }}
          />
        </SettingRow>
        <SettingDivider />
        <SettingRow>
          <SettingRowTitleSmall>{t('settings.messages.input.send_shortcuts')}</SettingRowTitleSmall>
          <StyledSelect
            size="small"
            value={sendMessageShortcut}
            menuItemSelectedIcon={<CheckOutlined />}
            options={[
              { value: 'Enter', label: 'Enter' },
              { value: 'Shift+Enter', label: 'Shift + Enter' },
              { value: 'Ctrl+Enter', label: 'Ctrl + Enter' },
              { value: 'Command+Enter', label: `${isMac ? '⌘' : isWindows ? 'Win' : 'Super'} + Enter` }
            ]}
            onChange={(value) => setSendMessageShortcut(value as SendMessageShortcut)}
            style={{ width: 135 }}
          />
        </SettingRow>
      </SettingGroup>
    </Container>
  )
}

const Container = styled(Scrollbar)`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: 0 8px;
  padding-right: 0;
  padding-top: 2px;
  padding-bottom: 10px;
`

const Label = styled.p`
  margin: 0;
  font-size: 12px;
  margin-right: 5px;
`

const SettingRowTitleSmall = styled(SettingRowTitle)`
  font-size: 13px;
`

export const SettingGroup = styled.div<{ theme?: ThemeMode }>`
  padding: 0 5px;
  width: 100%;
  margin-top: 0;
  border-radius: 8px;
  margin-bottom: 10px;
`

const StyledSelect = styled(Select)`
  .ant-select-selector {
    border-radius: 15px !important;
    padding: 4px 10px !important;
    height: 26px !important;
  }
`

export default SettingsTab
