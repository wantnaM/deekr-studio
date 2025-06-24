import { nanoid } from '@reduxjs/toolkit'
import type { MCPServer } from '@renderer/types'
import i18next from 'i18next'

// Token storage constants and utilities
const TOKEN_STORAGE_KEY = 'tokenflux_token'
export const TOKENFLUX_HOST = 'https://tokenflux.ai'

export const saveTokenFluxToken = (token: string): void => {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export const getTokenFluxToken = (): string | null => {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export const clearTokenFluxToken = (): void => {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export const hasTokenFluxToken = (): boolean => {
  return !!getTokenFluxToken()
}

interface TokenFluxServerAuthSchemaApiKey {
  location: string
  name: string
  prefix: string
}

interface TokenFluxServer {
  name: string
  display_name?: string
  description?: string
  version: string
  categories?: string[]
  logo?: string
  security_schemes?: Record<string, unknown>
}

interface TokenFluxSyncResult {
  success: boolean
  message: string
  addedServers: MCPServer[]
  errorDetails?: string
}

// Function to fetch and process TokenFlux servers
export const syncTokenFluxServers = async (
  token: string,
  existingServers: MCPServer[]
): Promise<TokenFluxSyncResult> => {
  const t = i18next.t

  try {
    const response = await fetch(`${TOKENFLUX_HOST}/v1/mcps?enabled=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    })

    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      clearTokenFluxToken()
      return {
        success: false,
        message: t('settings.mcp.sync.unauthorized', 'Sync Unauthorized'),
        addedServers: []
      }
    }

    // Handle server errors
    if (response.status === 500 || !response.ok) {
      return {
        success: false,
        message: t('settings.mcp.sync.error'),
        addedServers: [],
        errorDetails: `Status: ${response.status}`
      }
    }

    // Process successful response
    const data = await response.json()
    const servers: TokenFluxServer[] = data.data || []

    if (servers.length === 0) {
      return {
        success: true,
        message: t('settings.mcp.sync.noServersAvailable', 'No MCP servers available'),
        addedServers: []
      }
    }

    // Transform TokenFlux servers to MCP servers format
    const addedServers: MCPServer[] = []

    for (const server of servers) {
      try {
        // Skip if server already exists
        if (existingServers.some((s) => s.id === `@tokenflux/${server.name}`)) continue

        const authHeaders = {}
        if (server.security_schemes && server.security_schemes.api_key) {
          const keyAuth = server.security_schemes.api_key as TokenFluxServerAuthSchemaApiKey
          if (keyAuth.location === 'header') {
            authHeaders[keyAuth.name] = `${keyAuth.prefix || ''} {set your key here}`.trim()
          }
        }

        const mcpServer: MCPServer = {
          id: `@tokenflux/${server.name}`,
          name: server.display_name || server.name || `TokenFlux Server ${nanoid()}`,
          description: server.description || '',
          type: 'streamableHttp',
          baseUrl: `${TOKENFLUX_HOST}/v1/mcps/${server.name}`,
          isActive: true,
          provider: 'TokenFlux',
          providerUrl: `${TOKENFLUX_HOST}/mcps/${server.name}`,
          logoUrl: server.logo || '',
          tags: server.categories || [],
          headers: authHeaders
        }

        addedServers.push(mcpServer)
      } catch (err) {
        console.error('Error processing TokenFlux server:', err)
      }
    }

    return {
      success: true,
      message: t('settings.mcp.sync.success', { count: addedServers.length }),
      addedServers
    }
  } catch (error) {
    console.error('TokenFlux sync error:', error)
    return {
      success: false,
      message: t('settings.mcp.sync.error'),
      addedServers: [],
      errorDetails: String(error)
    }
  }
}
