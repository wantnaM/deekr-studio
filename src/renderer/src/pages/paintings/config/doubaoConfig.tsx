export const TEXT_TO_IMAGES_MODELS = [
  {
    id: 'doubao-seedream-3-0-t2i-250415',
    provider: 'doubao',
    name: '豆包-Doubao-Seedream-3.0-t2i',
    group: 'Doubao'
  }
]

export type DoubaoImagesParam = {
  model: string
  prompt: string
  response_format: 'url' | 'b64_json'
  size: string
  seed: number
  guidance_scale: number
  watermark: boolean
}
