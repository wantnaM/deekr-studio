import { InboxOutlined } from '@ant-design/icons'
import { loggerService } from '@logger'
import { DEFAULT_ASSISTANT_SETTINGS, getDefaultTopic } from '@renderer/services/AssistantService'
import { BackupImporter } from '@renderer/services/import/importers'
import { mergeWithExistingData, saveMergedData } from '@renderer/services/import/utils/mergeUtils'
import store from '@renderer/store'
import { addAssistant } from '@renderer/store/assistants'
import type { Assistant } from '@renderer/types'
import { uuid } from '@renderer/utils'
import { Alert, Button, Modal, Progress, Space, Spin, Table, Typography } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { TopView } from '../TopView'

const { Dragger } = Upload
const { Text } = Typography
import { Upload } from 'antd'

const logger = loggerService.withContext('BackupUploadPopup')

interface PopupResult {
  success?: boolean
  importedCount?: number
}

interface Props {
  resolve: (data: PopupResult) => void
}

interface PreviewItem {
  key: string
  name: string
  messageCount: number
  createdAt: string
  isDuplicate: boolean
}

const PopupContainer: React.FC<Props> = ({ resolve }) => {
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [importing, setImporting] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewItem[]>([])
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [backupContent, setBackupContent] = useState<string | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [importStatus, setImportStatus] = useState('')
  const { t } = useTranslation()

  const importer = new BackupImporter()

  const handleUpload = async (file: File): Promise<boolean> => {
    logger.info(`Uploading file: ${file.name}`)

    // Check if it's a zip file
    if (!file.name.endsWith('.zip')) {
      window.toast.error(t('import.backup.error.not_zip', { defaultValue: 'Please upload a ZIP backup file' }))
      return false
    }

    setLoading(true)
    setParsing(true)

    try {
      // Use the file path from the file object
      // Note: In Electron, File objects from input have a path property
      const filePath = (file as any).path

      if (!filePath) {
        // If no path (e.g., drag & drop), we need to read the file content
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)

        // Create a temporary file
        const tempFileName = `temp-backup-${Date.now()}.zip`
        const tempPath = await window.api.file.createTempFile(tempFileName)
        await window.api.file.write(tempPath, uint8Array)

        await processBackupFile(tempPath)
      } else {
        await processBackupFile(filePath)
      }
    } catch (error) {
      logger.error('Failed to process backup file:', error as Error)
      window.toast.error(t('import.backup.error.parse_failed', { defaultValue: 'Failed to parse backup file' }))
    } finally {
      setLoading(false)
      setParsing(false)
    }

    return false // Prevent default upload behavior
  }

  const processBackupFile = async (filePath: string) => {
    // Parse backup file using main process
    const parsed = await window.api.backup.parseForImport(filePath)

    // Create backup content string for the importer
    const backupData = {
      time: parsed.timestamp,
      version: parsed.version,
      localStorage: {},
      indexedDB: {
        topics: parsed.topics,
        message_blocks: parsed.messageBlocks
      }
    }
    const content = JSON.stringify(backupData)
    setBackupContent(content)

    // Validate backup format
    if (!importer.validate(content)) {
      window.toast.error(t('import.backup.error.invalid_format', { defaultValue: 'Invalid backup format' }))
      return
    }

    // Parse for preview
    const assistantId = uuid()
    const importResult = await importer.parse(content, assistantId)

    // Check for duplicates with existing data
    const db = (await import('@renderer/databases')).default
    const existingTopics = await db.topics.toArray()

    const preview: PreviewItem[] = importResult.topics.map((topic) => {
      const isDuplicate = existingTopics.some(
        (existing) =>
          existing.messages.length === topic.messages.length &&
          Math.abs(
            new Date(existing.messages[0]?.createdAt || 0).getTime() -
              new Date(topic.messages[0]?.createdAt || 0).getTime()
          ) < 60000
      )

      return {
        key: topic.id,
        name: topic.name,
        messageCount: topic.messages.length,
        createdAt: topic.createdAt,
        isDuplicate
      }
    })

    setPreviewData(preview)
    setSelectedKeys(preview.filter((p) => !p.isDuplicate).map((p) => p.key))

    logger.info(`Parsed ${preview.length} topics from backup`)
  }

  const handleImport = async () => {
    if (!backupContent || selectedKeys.length === 0) return

    setImporting(true)
    setImportProgress(0)
    setImportStatus(t('import.backup.status.parsing', { defaultValue: 'Parsing backup data...' }))

    try {
      // Parse backup
      const assistantId = uuid()
      const importResult = await importer.parse(backupContent, assistantId)

      // Filter selected topics
      const selectedTopicIds = new Set(selectedKeys as string[])
      const filteredResult = {
        topics: importResult.topics.filter((t) => selectedTopicIds.has(t.id)),
        messages: importResult.messages.filter((m) => {
          const topic = importResult.topics.find((t) => t.id === (m as any).topicId)
          return topic && selectedTopicIds.has(topic.id)
        }),
        blocks: importResult.blocks.filter((b) => {
          const message = importResult.messages.find((m) => m.id === (b as any).messageId)
          if (!message) return false
          const topic = importResult.topics.find((t) => t.id === (message as any).topicId)
          return topic && selectedTopicIds.has(topic.id)
        })
      }

      setImportProgress(30)
      setImportStatus(t('import.backup.status.merging', { defaultValue: 'Merging with existing data...' }))

      // Merge with existing data
      const mergeResult = await mergeWithExistingData(filteredResult)

      setImportProgress(60)
      setImportStatus(t('import.backup.status.saving', { defaultValue: 'Saving to database...' }))

      // Save merged data
      await saveMergedData(mergeResult)

      // Create assistant for imported data
      // Ensure at least one topic exists to prevent UI errors
      const assistantTopics =
        mergeResult.topicsToAdd.length > 0 ? mergeResult.topicsToAdd : [getDefaultTopic(assistantId)]

      const assistant: Assistant = {
        id: assistantId,
        name: t('import.backup.assistant_name', { defaultValue: 'Imported from Backup' }),
        emoji: '💾',
        prompt: '',
        topics: assistantTopics,
        messages: [],
        type: 'assistant',
        settings: DEFAULT_ASSISTANT_SETTINGS
      }

      store.dispatch(addAssistant(assistant))

      setImportProgress(100)
      setImportStatus(t('import.backup.status.completed', { defaultValue: 'Import completed!' }))

      // Only show as success if we actually imported some topics
      const importedCount = mergeResult.topicsToAdd.length
      if (importedCount > 0) {
        window.toast.success(
          t('import.backup.success', {
            defaultValue: `Successfully imported {{count}} conversations`,
            count: importedCount
          })
        )
      } else {
        window.toast.info(
          t('import.backup.no_new_topics', {
            defaultValue: 'No new conversations to import (all were duplicates). Created an empty assistant.'
          })
        )
      }

      setOpen(false)
      resolve({ success: true, importedCount })
    } catch (error) {
      logger.error('Import failed:', error as Error)
      window.toast.error(t('import.backup.error.import_failed', { defaultValue: 'Import failed' }))
      setImporting(false)
    }
  }

  const onCancel = () => {
    setOpen(false)
  }

  const onClose = () => {
    resolve({})
  }

  BackupUploadPopup.hide = onCancel

  const columns = [
    {
      title: t('import.backup.table.name', { defaultValue: 'Name' }),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: PreviewItem) => (
        <Space direction="vertical" size={0}>
          <Text>{text}</Text>
          {record.isDuplicate && (
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {t('import.backup.duplicate', { defaultValue: 'Possible duplicate' })}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: t('import.backup.table.messages', { defaultValue: 'Messages' }),
      dataIndex: 'messageCount',
      key: 'messageCount',
      width: 100
    },
    {
      title: t('import.backup.table.date', { defaultValue: 'Created' }),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString()
    }
  ]

  const rowSelection = {
    selectedRowKeys: selectedKeys,
    onChange: (newSelectedKeys: React.Key[]) => {
      setSelectedKeys(newSelectedKeys)
    },
    getCheckboxProps: (_record: PreviewItem) => ({
      disabled: importing
    })
  }

  return (
    <Modal
      title={t('import.backup.title', { defaultValue: 'Import from Backup' })}
      open={open}
      onOk={handleImport}
      onCancel={onCancel}
      afterClose={onClose}
      width={800}
      maskClosable={false}
      okButtonProps={{
        disabled: selectedKeys.length === 0 || !backupContent || importing,
        loading: importing
      }}
      cancelButtonProps={{ disabled: importing }}
      okText={
        importing
          ? t('import.backup.importing', { defaultValue: 'Importing...' })
          : t('import.backup.import', { defaultValue: 'Import' })
      }
      transitionName="animation-move-down"
      centered>
      <Container>
        {!backupContent && !loading && (
          <>
            <Dragger accept=".zip" beforeUpload={handleUpload} showUploadList={false} disabled={loading || parsing}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                {t('import.backup.upload_text', { defaultValue: 'Click or drag backup ZIP file to this area' })}
              </p>
              <p className="ant-upload-hint">
                {t('import.backup.upload_hint', { defaultValue: 'Supports CherryStudio backup files (.zip)' })}
              </p>
            </Dragger>

            <Alert
              message={t('import.backup.help.title', { defaultValue: 'How to get backup file' })}
              description={
                <div>
                  <p>
                    {t('import.backup.help.step1', {
                      defaultValue: '1. On computer A, go to Settings → Data → Backup'
                    })}
                  </p>
                  <p>
                    {t('import.backup.help.step2', {
                      defaultValue: '2. Click "Backup" button to create a backup file'
                    })}
                  </p>
                  <p>{t('import.backup.help.step3', { defaultValue: '3. Transfer the backup file to computer B' })}</p>
                  <p>
                    {t('import.backup.help.step4', { defaultValue: '4. On computer B, upload the backup file here' })}
                  </p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </>
        )}

        {(loading || parsing) && (
          <LoadingContainer>
            <Spin size="large" />
            <LoadingText>
              {parsing
                ? t('import.backup.parsing', { defaultValue: 'Parsing backup file...' })
                : t('import.backup.loading', { defaultValue: 'Loading...' })}
            </LoadingText>
          </LoadingContainer>
        )}

        {backupContent && !loading && !importing && (
          <>
            <Alert
              message={t('import.backup.select_title', { defaultValue: 'Select conversations to import' })}
              description={t('import.backup.select_desc', {
                defaultValue: 'Found {{total}} conversations ({{duplicates}} possible duplicates)',
                total: previewData.length,
                duplicates: previewData.filter((p) => p.isDuplicate).length
              })}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={previewData}
              pagination={false}
              scroll={{ y: 300 }}
              size="small"
            />

            <Button
              style={{ marginTop: 16 }}
              onClick={() => {
                setBackupContent(null)
                setPreviewData([])
                setSelectedKeys([])
              }}>
              {t('import.backup.choose_other', { defaultValue: 'Choose another file' })}
            </Button>
          </>
        )}

        {importing && (
          <LoadingContainer>
            <Progress percent={importProgress} status="active" strokeColor="var(--color-primary)" />
            <LoadingText>{importStatus}</LoadingText>
          </LoadingContainer>
        )}
      </Container>
    </Modal>
  )
}

const Container = styled.div`
  padding: 8px 0;
`

const LoadingContainer = styled.div`
  text-align: center;
  padding: 40px 0;
`

const LoadingText = styled.div`
  margin-top: 16px;
  color: var(--color-text-2);
`

const TopViewKey = 'BackupUploadPopup'

export default class BackupUploadPopup {
  static topviewId = 0
  static hide() {
    TopView.hide(TopViewKey)
  }
  static show() {
    return new Promise<PopupResult>((resolve) => {
      TopView.show(
        <PopupContainer
          resolve={(v) => {
            resolve(v)
            TopView.hide(TopViewKey)
          }}
        />,
        TopViewKey
      )
    })
  }
}
