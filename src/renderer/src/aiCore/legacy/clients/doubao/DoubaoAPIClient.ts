import type OpenAI from '@cherrystudio/openai'
import { loggerService } from '@logger'
import type { Provider } from '@renderer/types'
import type { GenerateImageParams } from '@renderer/types'

import { OpenAIAPIClient } from '../openai/OpenAIApiClient'

const logger = loggerService.withContext('DoubaoAPIClient')

export class DoubaoAPIClient extends OpenAIAPIClient {
  constructor(provider: Provider) {
    super(provider)
  }

  override getClientCompatibilityType(): string[] {
    return ['DoubaoAPIClient']
  }

  override async generateImage({
    model,
    prompt,
    imageSize,
    batchSize,
    seed,
    numInferenceSteps,
    guidanceScale,
    signal
  }: GenerateImageParams): Promise<string[]> {
    const sdk = await this.getSdkInstance()

    // 豆包使用不同的参数格式
    const body: any = {
      model,
      prompt,
      batchSize,
      seed,
      numInferenceSteps,
      guidanceScale,
      signal,
      size: imageSize // 豆包使用 size 而不是 image_size
    }

    try {
      logger.debug('Calling Doubao image generation API with params:', body)

      const response = await sdk.images.generate(body, { signal })

      if (response.data && response.data.length > 0) {
        return response.data.map((image: any) => image.url).filter(Boolean)
      }

      return []
    } catch (error) {
      logger.error('Doubao image generation failed:', error as Error)
      throw error
    }
  }

  public async listModels(): Promise<OpenAI.Models.Model[]> {
    const models = ['doubao-seedream-3-0-t2i-250415']

    const created = Date.now()
    return models.map((id) => ({
      id,
      owned_by: 'doubao',
      object: 'model' as const,
      created
    }))
  }
}
