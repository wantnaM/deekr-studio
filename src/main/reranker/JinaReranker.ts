import { ExtractChunkData } from '@cherrystudio/embedjs-interfaces'
import AxiosProxy from '@main/services/AxiosProxy'
import { KnowledgeBaseParams } from '@types'

import BaseReranker from './BaseReranker'

export default class JinaReranker extends BaseReranker {
  constructor(base: KnowledgeBaseParams) {
    super(base)
  }

  public rerank = async (query: string, searchResults: ExtractChunkData[]): Promise<ExtractChunkData[]> => {
    const url = this.getRerankUrl()

    const requestBody = {
      model: this.base.rerankModel,
      query,
      documents: searchResults.map((doc) => doc.pageContent),
      top_n: this.base.topN
    }

    try {
      const { data } = await AxiosProxy.axios.post(url, requestBody, { headers: this.defaultHeaders() })

      const rerankResults = data.results
      return this.getRerankResult(searchResults, rerankResults)
    } catch (error: any) {
      const errorDetails = this.formatErrorMessage(url, error, requestBody)
      console.error('Jina Reranker API Error:', errorDetails)
      throw new Error(`重排序请求失败: ${error.message}\n请求详情: ${errorDetails}`)
    }
  }
}
