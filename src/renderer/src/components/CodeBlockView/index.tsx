import { LoadingOutlined } from '@ant-design/icons'
import CodeEditor from '@renderer/components/CodeEditor'
import { CodeTool, CodeToolbar, TOOL_SPECS, useCodeTool } from '@renderer/components/CodeToolbar'
import { useSettings } from '@renderer/hooks/useSettings'
import { pyodideService } from '@renderer/services/PyodideService'
import { extractTitle } from '@renderer/utils/formats'
import { getExtensionByLanguage, isValidPlantUML } from '@renderer/utils/markdown'
import dayjs from 'dayjs'
import { CirclePlay, CodeXml, Copy, Download, Eye, Square, SquarePen, SquareSplitHorizontal } from 'lucide-react'
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import CodePreview from './CodePreview'
import HtmlArtifacts from './HtmlArtifacts'
import MermaidPreview from './MermaidPreview'
import PlantUmlPreview from './PlantUmlPreview'
import StatusBar from './StatusBar'
import SvgPreview from './SvgPreview'

type ViewMode = 'source' | 'special' | 'split'

interface Props {
  children: string
  language: string
  onSave?: (newContent: string) => void
}

/**
 * 代码块视图
 *
 * 视图类型：
 * - preview: 预览视图，其中非源代码的是特殊视图
 * - edit: 编辑视图
 *
 * 视图模式：
 * - source: 源代码视图模式
 * - special: 特殊视图模式（Mermaid、PlantUML、SVG）
 * - split: 分屏模式（源代码和特殊视图并排显示）
 *
 * 顶部 sticky 工具栏：
 * - quick 工具
 * - core 工具
 */
const CodeBlockView: React.FC<Props> = ({ children, language, onSave }) => {
  const { t } = useTranslation()
  const { codeEditor, codeExecution } = useSettings()
  const [viewMode, setViewMode] = useState<ViewMode>('special')
  const [isRunning, setIsRunning] = useState(false)
  const [output, setOutput] = useState('')

  const [tools, setTools] = useState<CodeTool[]>([])
  const { registerTool, removeTool } = useCodeTool(setTools)

  const isExecutable = useMemo(() => {
    return codeExecution.enabled && language === 'python'
  }, [codeExecution.enabled, language])

  const hasSpecialView = useMemo(() => ['mermaid', 'plantuml', 'svg'].includes(language), [language])

  const isInSpecialView = useMemo(() => {
    return hasSpecialView && viewMode === 'special'
  }, [hasSpecialView, viewMode])

  const handleCopySource = useCallback(() => {
    navigator.clipboard.writeText(children)
    window.message.success({ content: t('code_block.copy.success'), key: 'copy-code' })
  }, [children, t])

  const handleDownloadSource = useCallback(async () => {
    let fileName = ''

    // 尝试提取 HTML 标题
    if (language === 'html' && children.includes('</html>')) {
      fileName = extractTitle(children) || ''
    }

    // 默认使用日期格式命名
    if (!fileName) {
      fileName = `${dayjs().format('YYYYMMDDHHmm')}`
    }

    const ext = await getExtensionByLanguage(language)
    window.api.file.save(`${fileName}${ext}`, children)
  }, [children, language])

  const handleRunScript = useCallback(() => {
    setIsRunning(true)
    setOutput('')

    pyodideService
      .runScript(children, {}, codeExecution.timeoutMinutes * 60000)
      .then((formattedOutput) => {
        setOutput(formattedOutput)
      })
      .catch((error) => {
        console.error('Unexpected error:', error)
        setOutput(`Unexpected error: ${error.message || 'Unknown error'}`)
      })
      .finally(() => {
        setIsRunning(false)
      })
  }, [children, codeExecution.timeoutMinutes])

  useEffect(() => {
    // 复制按钮
    registerTool({
      ...TOOL_SPECS.copy,
      icon: <Copy className="icon" />,
      tooltip: t('code_block.copy.source'),
      onClick: handleCopySource
    })

    // 下载按钮
    registerTool({
      ...TOOL_SPECS.download,
      icon: <Download className="icon" />,
      tooltip: t('code_block.download.source'),
      onClick: handleDownloadSource
    })
    return () => {
      removeTool(TOOL_SPECS.copy.id)
      removeTool(TOOL_SPECS.download.id)
    }
  }, [handleCopySource, handleDownloadSource, registerTool, removeTool, t])

  // 特殊视图的编辑按钮，在分屏模式下不可用
  useEffect(() => {
    if (!hasSpecialView || viewMode === 'split') return

    const viewSourceToolSpec = codeEditor.enabled ? TOOL_SPECS.edit : TOOL_SPECS['view-source']

    if (codeEditor.enabled) {
      registerTool({
        ...viewSourceToolSpec,
        icon: viewMode === 'source' ? <Eye className="icon" /> : <SquarePen className="icon" />,
        tooltip: viewMode === 'source' ? t('code_block.preview') : t('code_block.edit'),
        onClick: () => setViewMode(viewMode === 'source' ? 'special' : 'source')
      })
    } else {
      registerTool({
        ...viewSourceToolSpec,
        icon: viewMode === 'source' ? <Eye className="icon" /> : <CodeXml className="icon" />,
        tooltip: viewMode === 'source' ? t('code_block.preview') : t('code_block.preview.source'),
        onClick: () => setViewMode(viewMode === 'source' ? 'special' : 'source')
      })
    }

    return () => removeTool(viewSourceToolSpec.id)
  }, [codeEditor.enabled, hasSpecialView, viewMode, registerTool, removeTool, t])

  // 特殊视图的分屏按钮
  useEffect(() => {
    if (!hasSpecialView) return

    registerTool({
      ...TOOL_SPECS['split-view'],
      icon: viewMode === 'split' ? <Square className="icon" /> : <SquareSplitHorizontal className="icon" />,
      tooltip: viewMode === 'split' ? t('code_block.split.restore') : t('code_block.split'),
      onClick: () => setViewMode(viewMode === 'split' ? 'special' : 'split')
    })

    return () => removeTool(TOOL_SPECS['split-view'].id)
  }, [hasSpecialView, viewMode, registerTool, removeTool, t])

  // 运行按钮
  useEffect(() => {
    if (!isExecutable) return

    registerTool({
      ...TOOL_SPECS.run,
      icon: isRunning ? <LoadingOutlined /> : <CirclePlay className="icon" />,
      tooltip: t('code_block.run'),
      onClick: () => !isRunning && handleRunScript()
    })

    return () => isExecutable && removeTool(TOOL_SPECS.run.id)
  }, [isExecutable, isRunning, handleRunScript, registerTool, removeTool, t])

  // 源代码视图组件
  const sourceView = useMemo(() => {
    if (codeEditor.enabled) {
      return (
        <CodeEditor
          value={children}
          language={language}
          onSave={onSave}
          options={{ stream: true }}
          setTools={setTools}
        />
      )
    } else {
      return (
        <CodePreview language={language} setTools={setTools}>
          {children}
        </CodePreview>
      )
    }
  }, [children, codeEditor.enabled, language, onSave, setTools])

  // 特殊视图组件映射
  const specialView = useMemo(() => {
    if (language === 'mermaid') {
      return <MermaidPreview setTools={setTools}>{children}</MermaidPreview>
    } else if (language === 'plantuml' && isValidPlantUML(children)) {
      return <PlantUmlPreview setTools={setTools}>{children}</PlantUmlPreview>
    } else if (language === 'svg') {
      return <SvgPreview setTools={setTools}>{children}</SvgPreview>
    }
    return null
  }, [children, language])

  const renderHeader = useMemo(() => {
    const langTag = '<' + language.toUpperCase() + '>'
    return <CodeHeader $isInSpecialView={isInSpecialView}>{isInSpecialView ? '' : langTag}</CodeHeader>
  }, [isInSpecialView, language])

  // 根据视图模式和语言选择组件，优先展示特殊视图，fallback是源代码视图
  const renderContent = useMemo(() => {
    const showSpecialView = specialView && ['special', 'split'].includes(viewMode)
    const showSourceView = !specialView || viewMode !== 'special'

    return (
      <SplitViewWrapper className="split-view-wrapper">
        {showSpecialView && specialView}
        {showSourceView && sourceView}
      </SplitViewWrapper>
    )
  }, [specialView, sourceView, viewMode])

  const renderArtifacts = useMemo(() => {
    if (language === 'html') {
      return <HtmlArtifacts html={children} />
    }
    return null
  }, [children, language])

  return (
    <CodeBlockWrapper className="code-block" $isInSpecialView={isInSpecialView}>
      {renderHeader}
      <CodeToolbar tools={tools} />
      {renderContent}
      {renderArtifacts}
      {isExecutable && output && <StatusBar>{output}</StatusBar>}
    </CodeBlockWrapper>
  )
}

const CodeBlockWrapper = styled.div<{ $isInSpecialView: boolean }>`
  position: relative;
  width: 100%;

  .code-toolbar {
    background-color: ${(props) => (props.$isInSpecialView ? 'transparent' : 'var(--color-background-mute)')};
    border-radius: ${(props) => (props.$isInSpecialView ? '0' : '4px')};
    opacity: 0;
    transition: opacity 0.2s ease;
    transform: translateZ(0);
    will-change: opacity;
    &.show {
      opacity: 1;
    }
  }
  &:hover {
    .code-toolbar {
      opacity: 1;
    }
  }
`

const CodeHeader = styled.div<{ $isInSpecialView: boolean }>`
  display: flex;
  align-items: center;
  color: var(--color-text);
  font-size: 14px;
  font-weight: bold;
  padding: 0 10px;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  margin-top: ${(props) => (props.$isInSpecialView ? '6px' : '0')};
  height: ${(props) => (props.$isInSpecialView ? '16px' : '34px')};
`

const SplitViewWrapper = styled.div`
  display: flex;

  > * {
    flex: 1 1 auto;
    width: 100%;
  }
`

export default memo(CodeBlockView)
