import { nanoid } from '@reduxjs/toolkit'
import { IpcChannel } from '@shared/IpcChannel'
import { MCPServer } from '@types'
import Logger from 'electron-log'

import { windowService } from '../WindowService'

function installMCPServer(server: MCPServer) {
  const mainWindow = windowService.getMainWindow()

  if (!server.id) {
    server.id = nanoid()
  }

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IpcChannel.Mcp_AddServer, server)
  }
}

function installMCPServers(servers: Record<string, MCPServer>) {
  for (const name in servers) {
    const server = servers[name]
    if (!server.name) {
      server.name = name
    }
    installMCPServer(server)
  }
}

export function handleMcpProtocolUrl(url: URL) {
  const params = new URLSearchParams(url.search)
  switch (url.pathname) {
    case '/install': {
      // jsonConfig example:
      // {
      //   "mcpServers": {
      //     "everything": {
      //       "command": "npx",
      //       "args": [
      //         "-y",
      //         "@modelcontextprotocol/server-everything"
      //       ]
      //     }
      //   }
      // }
      // cherrystudio://mcp/install?servers={base64Encode(JSON.stringify(jsonConfig))}
      const data = params.get('servers')
      if (data) {
        const stringify = Buffer.from(data, 'base64').toString('utf8')
        Logger.info('install MCP servers from urlschema: ', stringify)
        const jsonConfig = JSON.parse(stringify)
        Logger.info('install MCP servers from urlschema: ', jsonConfig)

        // support both {mcpServers: [servers]}, [servers] and {server}
        if (jsonConfig.mcpServers) {
          installMCPServers(jsonConfig.mcpServers)
        } else if (Array.isArray(jsonConfig)) {
          for (const server of jsonConfig) {
            installMCPServer(server)
          }
        } else {
          installMCPServer(jsonConfig)
        }
      }

      const mainWindow = windowService.getMainWindow()
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.executeJavaScript("window.navigate('/settings/mcp')")
      }
      break
    }
    default:
      console.error(`Unknown MCP protocol URL: ${url}`)
      break
  }
}
