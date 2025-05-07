import { ExaClient } from '@agentic/exa'
import { WebSearchState } from '@renderer/store/websearch'
import { WebSearchProvider, WebSearchProviderResponse } from '@renderer/types'

import BaseWebSearchProvider from './BaseWebSearchProvider'

export default class ExaProvider extends BaseWebSearchProvider {
  private exa: ExaClient

  constructor(provider: WebSearchProvider) {
    super(provider)
    if (!this.apiKey) {
      throw new Error('API key is required for Exa provider')
    }
    this.exa = new ExaClient({ apiKey: this.apiKey })
  }

  public async search(query: string, websearch: WebSearchState): Promise<WebSearchProviderResponse> {
    try {
      if (!query.trim()) {
        throw new Error('Search query cannot be empty')
      }

      const response = await this.exa.search({
        query,
        numResults: Math.max(1, websearch.maxResults),
        contents: {
          text: true
        }
      })

      return {
        query: response.autopromptString,
        results: response.results.slice(0, websearch.maxResults).map((result) => {
          let content = result.text || ''
          if (websearch.contentLimit && content.length > websearch.contentLimit) {
            content = content.slice(0, websearch.contentLimit) + '...'
          }

          return {
            title: result.title || 'No title',
            content: content,
            url: result.url || ''
          }
        })
      }
    } catch (error) {
      console.error('Exa search failed:', error)
      throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
