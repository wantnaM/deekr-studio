import { nanoid } from '@reduxjs/toolkit'
import CodeEditor from '@renderer/components/CodeEditor'
import { useAppDispatch } from '@renderer/store'
import { setMCPServerActive } from '@renderer/store/mcp'
import { MCPServer } from '@renderer/types'
import { Form, Modal } from 'antd'
import { FC, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface AddMcpServerModalProps {
  visible: boolean
  onClose: () => void
  onSuccess: (server: MCPServer) => void
  existingServers: MCPServer[]
}

interface ParsedServerData extends MCPServer {
  url?: string // JSON 可能包含此欄位，而不是 baseUrl
}

// 預設的 JSON 範例內容
const initialJsonExample = `// 示例 JSON (stdio):
// {
//   "mcpServers": {
//     "stdio-server-example": {
//       "command": "npx",
//       "args": ["-y", "mcp-server-example"]
//     }
//   }
// }

// 示例 JSON (sse):
// {
//   "mcpServers": {
//     "sse-server-example": {
//       "type": "sse",
//       "url": "http://localhost:3000"
//     }
//   }
// }

// 示例 JSON (streamableHttp):
// {
//   "mcpServers": {
//     "streamable-http-example": {
//       "type": "streamableHttp",
//       "url": "http://localhost:3001"
//     }
//   }
// }
`

const AddMcpServerModal: FC<AddMcpServerModalProps> = ({ visible, onClose, onSuccess, existingServers }) => {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const dispatch = useAppDispatch()

  const handleOk = async () => {
    try {
      const values = await form.validateFields()
      const inputValue = values.serverConfig.trim()
      setLoading(true)

      const { serverToAdd, error } = parseAndExtractServer(inputValue, t)

      if (error) {
        form.setFields([
          {
            name: 'serverConfig',
            errors: [error]
          }
        ])
        setLoading(false)
        return
      }

      // 檢查重複名稱
      if (existingServers && existingServers.some((server) => server.name === serverToAdd!.name)) {
        form.setFields([
          {
            name: 'serverConfig',
            errors: [t('settings.mcp.addServer.importFrom.nameExists', { name: serverToAdd!.name })]
          }
        ])
        setLoading(false)
        return
      }

      // 如果成功解析並通過所有檢查，立即加入伺服器（非啟用狀態）並關閉對話框
      const newServer: MCPServer = {
        id: nanoid(),
        name: serverToAdd!.name!,
        description: serverToAdd!.description ?? '',
        baseUrl: serverToAdd!.baseUrl ?? serverToAdd!.url ?? '',
        command: serverToAdd!.command ?? '',
        args: Array.isArray(serverToAdd!.args) ? serverToAdd!.args : [],
        env: serverToAdd!.env || {},
        isActive: false,
        type: serverToAdd!.type,
        logoUrl: serverToAdd!.logoUrl,
        provider: serverToAdd!.provider,
        providerUrl: serverToAdd!.providerUrl,
        tags: serverToAdd!.tags,
        configSample: serverToAdd!.configSample
      }

      onSuccess(newServer)
      form.resetFields()
      onClose()

      // 在背景非同步檢查伺服器可用性並更新狀態
      window.api.mcp
        .checkMcpConnectivity(newServer)
        .then((isConnected) => {
          console.log(`Connectivity check for ${newServer.name}: ${isConnected}`)
          dispatch(setMCPServerActive({ id: newServer.id, isActive: isConnected }))
        })
        .catch((connError: any) => {
          console.error(`Connectivity check failed for ${newServer.name}:`, connError)
          window.message.error({
            content: t(`${newServer.name} settings.mcp.addServer.importFrom.connectionFailed`),
            key: 'mcp-quick-add-failed'
          })
        })
    } finally {
      setLoading(false)
    }
  }

  // CodeEditor 內容變更時的回呼函式
  const handleEditorChange = useCallback(
    (newContent: string) => {
      form.setFieldsValue({ serverConfig: newContent })
      // 可選：如果希望即時驗證，可以取消註解下一行
      // form.validateFields(['serverConfig']);
    },
    [form]
  )

  const serverConfigValue = form.getFieldValue('serverConfig')

  return (
    <Modal
      title={t('settings.mcp.addServer.importFrom')}
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      destroyOnClose
      centered
      transitionName="animation-move-down"
      width={600}>
      <Form form={form} layout="vertical" name="add_mcp_server_form">
        <Form.Item
          name="serverConfig"
          label={t('settings.mcp.addServer.importFrom.tooltip')}
          rules={[{ required: true, message: t('settings.mcp.addServer.importFrom.placeholder') }]}>
          <CodeEditor
            // 如果表單值為空，顯示範例 JSON；否則顯示表單值
            value={serverConfigValue}
            placeholder={initialJsonExample}
            language="json"
            onChange={handleEditorChange}
            maxHeight="300px"
            options={{
              lint: true,
              collapsible: true,
              wrappable: true,
              lineNumbers: true,
              foldGutter: true,
              highlightActiveLine: true,
              keymap: true
            }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

// 解析 JSON 提取伺服器資料
const parseAndExtractServer = (
  inputValue: string,
  t: (key: string, options?: any) => string
): { serverToAdd: Partial<ParsedServerData> | null; error: string | null } => {
  const trimmedInput = inputValue.trim()

  let parsedJson
  try {
    parsedJson = JSON.parse(trimmedInput)
  } catch (e) {
    // JSON 解析失敗，返回錯誤
    return { serverToAdd: null, error: t('settings.mcp.addServer.importFrom.invalid') }
  }

  let serverToAdd: Partial<ParsedServerData> | null = null

  // 檢查是否包含多個伺服器配置 (適用於 JSON 格式)
  if (
    parsedJson.mcpServers &&
    typeof parsedJson.mcpServers === 'object' &&
    Object.keys(parsedJson.mcpServers).length > 1
  ) {
    return { serverToAdd: null, error: t('settings.mcp.addServer.importFrom.multipleServers') }
  } else if (Array.isArray(parsedJson) && parsedJson.length > 1) {
    return { serverToAdd: null, error: t('settings.mcp.addServer.importFrom.multipleServers') }
  }

  if (
    parsedJson.mcpServers &&
    typeof parsedJson.mcpServers === 'object' &&
    Object.keys(parsedJson.mcpServers).length > 0
  ) {
    // Case 1: {"mcpServers": {"serverName": {...}}}
    const firstServerKey = Object.keys(parsedJson.mcpServers)[0]
    const potentialServer = parsedJson.mcpServers[firstServerKey]
    if (typeof potentialServer === 'object' && potentialServer !== null) {
      serverToAdd = { ...potentialServer }
      serverToAdd!.name = potentialServer.name ?? firstServerKey
    } else {
      console.error('Invalid server data under mcpServers key:', potentialServer)
      return { serverToAdd: null, error: t('settings.mcp.addServer.importFrom.invalid') }
    }
  } else if (Array.isArray(parsedJson) && parsedJson.length > 0) {
    // Case 2: [{...}, ...] - 取第一個伺服器，確保它是物件
    if (typeof parsedJson[0] === 'object' && parsedJson[0] !== null) {
      serverToAdd = { ...parsedJson[0] }
      serverToAdd!.name = parsedJson[0].name ?? t('settings.mcp.newServer')
    } else {
      console.error('Invalid server data in array:', parsedJson[0])
      return { serverToAdd: null, error: t('settings.mcp.addServer.importFrom.invalid') }
    }
  } else if (
    typeof parsedJson === 'object' &&
    !Array.isArray(parsedJson) &&
    !parsedJson.mcpServers // 確保是直接的伺服器物件
  ) {
    // Case 3: {...} (單一伺服器物件)
    // 檢查物件是否為空
    if (Object.keys(parsedJson).length > 0) {
      serverToAdd = { ...parsedJson }
      serverToAdd!.name = parsedJson.name ?? t('settings.mcp.newServer')
    } else {
      // 空物件，視為無效
      serverToAdd = null
    }
  } else {
    // 無效結構或空的 mcpServers
    serverToAdd = null
  }

  // 確保 serverToAdd 存在且 name 存在
  if (!serverToAdd || !serverToAdd.name) {
    console.error('Invalid JSON structure for server config or missing name:', parsedJson)
    return { serverToAdd: null, error: t('settings.mcp.addServer.importFrom.invalid') }
  }

  return { serverToAdd, error: null }
}

export default AddMcpServerModal
