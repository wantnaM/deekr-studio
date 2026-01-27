import { PlusOutlined, RedoOutlined } from '@ant-design/icons'
import AiProvider from '@renderer/aiCore'
import ImageSize1_1 from '@renderer/assets/images/paintings/image-size-1-1.svg'
import ImageSize1_2 from '@renderer/assets/images/paintings/image-size-1-2.svg'
import ImageSize3_2 from '@renderer/assets/images/paintings/image-size-3-2.svg'
import ImageSize3_4 from '@renderer/assets/images/paintings/image-size-3-4.svg'
import ImageSize9_16 from '@renderer/assets/images/paintings/image-size-9-16.svg'
import ImageSize16_9 from '@renderer/assets/images/paintings/image-size-16-9.svg'
import { Navbar, NavbarCenter, NavbarRight } from '@renderer/components/app/Navbar'
import { VStack } from '@renderer/components/Layout'
import Scrollbar from '@renderer/components/Scrollbar'
import { isMac } from '@renderer/config/constant'
import { useTheme } from '@renderer/context/ThemeProvider'
import { usePaintings } from '@renderer/hooks/usePaintings'
import { useAllProviders } from '@renderer/hooks/useProvider'
import { useRuntime } from '@renderer/hooks/useRuntime'
import FileManager from '@renderer/services/FileManager'
import { useAppDispatch } from '@renderer/store'
import { setGenerating } from '@renderer/store/runtime'
import type { FileType, Painting } from '@renderer/types'
import { getErrorMessage, uuid } from '@renderer/utils'
import { Button, Input, InputNumber, Radio, Select, Slider, Tooltip } from 'antd'
import TextArea from 'antd/es/input/TextArea'
import { Info } from 'lucide-react'
import type { FC } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import SendMessageButton from '../home/Inputbar/SendMessageButton'
import { SettingTitle } from '../settings'
import Artboard from './components/Artboard'
import PaintingsList from './components/PaintingsList'
import ProviderSelect from './components/ProviderSelect'
import { RECOMMENDED_PROMPTS, TEXT_TO_IMAGES_MODELS } from './config/doubaoConfig'

const IMAGE_SIZES = [
  {
    label: '1:1',
    value: '1024x1024',
    icon: ImageSize1_1
  },
  {
    label: '1:2',
    value: '512x1024',
    icon: ImageSize1_2
  },
  {
    label: '3:2',
    value: '768x512',
    icon: ImageSize3_2
  },
  {
    label: '3:4',
    value: '768x1024',
    icon: ImageSize3_4
  },
  {
    label: '16:9',
    value: '1024x576',
    icon: ImageSize16_9
  },
  {
    label: '9:16',
    value: '576x1024',
    icon: ImageSize9_16
  }
]
const generateRandomSeed = () => Math.floor(Math.random() * 1000000).toString()

const DEFAULT_PAINTING: Painting = {
  id: uuid(),
  urls: [],
  files: [],
  prompt: '',
  imageSize: '1024x1024',
  seed: '',
  guidanceScale: 2.5,
  model: TEXT_TO_IMAGES_MODELS[0].id
}

const DoubaoPage: FC<{ Options: string[] }> = ({ Options }) => {
  const { t } = useTranslation()
  const { doubao_paintings, addPainting, removePainting, updatePainting } = usePaintings()
  const [painting, setPainting] = useState<any>(doubao_paintings?.[0] || DEFAULT_PAINTING)
  const { theme } = useTheme()
  const providers = useAllProviders()

  // 获取豆包供应商
  const doubaoProvider = providers.find((p) => p.id === 'doubao')!
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const [isLoading, setIsLoading] = useState(false)
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const dispatch = useAppDispatch()
  const { generating } = useRuntime()
  const navigate = useNavigate()
  const location = useLocation()

  // const [watermark, setWatermark] = useState(true)

  const getNewPainting = () => {
    return {
      ...DEFAULT_PAINTING,
      id: uuid(),
      seed: generateRandomSeed()
    }
  }

  const textareaRef = useRef<any>(null)

  const handleRecommendedPromptClick = (prompt: string) => {
    updatePaintingState({ prompt })
    // 聚焦到文本输入框
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  const updatePaintingState = (updates: Partial<Painting>) => {
    const updatedPainting = { ...painting, ...updates }
    setPainting(updatedPainting)
    updatePainting('doubao_paintings', updatedPainting)
  }

  const onSelectModel = (modelId: string) => {
    const model = TEXT_TO_IMAGES_MODELS.find((m) => m.id === modelId)
    if (model) {
      updatePaintingState({ model: modelId })
    }
  }

  const onGenerate = async () => {
    if (isLoading) return

    if (!painting.prompt.trim()) {
      window.modal.error({
        content: t('paintings.prompt_required'),
        centered: true
      })
      return
    }

    if (painting.files.length > 0) {
      const confirmed = await window.modal.confirm({
        content: t('paintings.regenerate.confirm'),
        centered: true
      })

      if (!confirmed) {
        return
      }

      await FileManager.deleteFiles(painting.files)
    }

    const prompt = textareaRef.current?.resizableTextArea?.textArea?.value || ''

    updatePaintingState({ prompt })

    const controller = new AbortController()
    setAbortController(controller)
    setIsLoading(true)
    dispatch(setGenerating(true))

    // 使用豆包供应商
    const aiProvider = new AiProvider(doubaoProvider)

    if (!painting.model) {
      return
    }

    try {
      const urls = await aiProvider.generateImage({
        model: painting.model,
        prompt,
        imageSize: painting.imageSize || '1024x1024',
        batchSize: 1,
        seed: painting.seed || undefined,
        numInferenceSteps: 25,
        guidanceScale: painting.guidanceScale || 4.5,
        signal: controller.signal
      })

      if (urls.length > 0) {
        const downloadedFiles = await Promise.all(
          urls.map(async (url) => {
            try {
              if (!url || url.trim() === '') {
                window.toast.warning(t('message.empty_url'))
                return null
              }
              return await window.api.file.download(url)
            } catch (error) {
              if (
                error instanceof Error &&
                (error.message.includes('Failed to parse URL') || error.message.includes('Invalid URL'))
              ) {
                window.toast.warning(t('message.empty_url'))
              }
              return null
            }
          })
        )

        const validFiles = downloadedFiles.filter((file): file is FileType => file !== null)

        await FileManager.addFiles(validFiles)

        updatePaintingState({ files: validFiles, urls })
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        window.modal.error({
          content: getErrorMessage(error),
          centered: true
        })
      }
    } finally {
      setIsLoading(false)
      dispatch(setGenerating(false))
      setAbortController(null)
    }
  }

  const onCancel = () => {
    abortController?.abort()
  }

  const onSelectImageSize = (v: string) => {
    const size = IMAGE_SIZES.find((i) => i.value === v)
    size && updatePaintingState({ imageSize: size.value })
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % painting.files.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + painting.files.length) % painting.files.length)
  }

  const onDeletePainting = (paintingToDelete: Painting) => {
    if (paintingToDelete.id === painting.id) {
      if (isLoading) return

      const currentIndex = doubao_paintings.findIndex((p) => p.id === paintingToDelete.id)

      if (currentIndex > 0) {
        setPainting(doubao_paintings[currentIndex - 1])
      } else if (doubao_paintings.length > 1) {
        setPainting(doubao_paintings[1])
      }
    }

    removePainting('doubao_paintings', paintingToDelete)

    if (!doubao_paintings || doubao_paintings.length === 1) {
      const newPainting = getNewPainting()
      const addedPainting = addPainting('doubao_paintings', newPainting)
      setPainting(addedPainting)
    }
  }

  const onSelectPainting = (newPainting: Painting) => {
    if (generating) return
    setPainting(newPainting)
    setCurrentImageIndex(0)
  }

  const spaceClickTimer = useRef<NodeJS.Timeout>(null)

  const handleProviderChange = (providerId: string) => {
    const routeName = location.pathname.split('/').pop()
    if (providerId !== routeName) {
      updatePaintingState({ model: '' })
      navigate('../' + providerId, { replace: true })
    }
  }

  useEffect(() => {
    if (!doubao_paintings || doubao_paintings.length === 0) {
      const newPainting = getNewPainting()
      addPainting('doubao_paintings', newPainting)
    }

    return () => {
      if (spaceClickTimer.current) {
        clearTimeout(spaceClickTimer.current)
      }
    }
  }, [doubao_paintings, addPainting])

  return (
    <Container>
      <Navbar>
        <NavbarCenter style={{ borderRight: 'none' }}>{t('paintings.title')}</NavbarCenter>
        {isMac && (
          <NavbarRight style={{ justifyContent: 'flex-end' }}>
            <Button
              size="small"
              className="nodrag"
              icon={<PlusOutlined />}
              onClick={() => {
                if (generating) return
                const newPainting = getNewPainting()
                const addedPainting = addPainting('doubao_paintings', newPainting)
                setPainting(addedPainting)
              }}>
              {t('paintings.button.new.image')}
            </Button>
          </NavbarRight>
        )}
      </Navbar>
      <ContentContainer id="content-container">
        <LeftContainer>
          <ProviderTitleContainer>
            <SettingTitle style={{ marginBottom: 5 }}>{t('common.provider')}</SettingTitle>
          </ProviderTitleContainer>
          <ProviderSelect
            provider={doubaoProvider}
            options={Options}
            onChange={handleProviderChange}
            className="mb-4"
          />
          <SettingTitle style={{ marginBottom: 5, marginTop: 15 }}>{t('common.model')}</SettingTitle>
          <Select
            value={painting.model}
            onChange={onSelectModel}
            options={TEXT_TO_IMAGES_MODELS.map((model) => ({
              label: model.name,
              value: model.id
            }))}
          />
          <SettingTitle style={{ marginBottom: 5, marginTop: 15 }}>{t('paintings.image.size')}</SettingTitle>
          <Radio.Group
            value={painting.imageSize}
            onChange={(e) => onSelectImageSize(e.target.value)}
            style={{ display: 'flex' }}>
            {IMAGE_SIZES.map((size) => (
              <RadioButton value={size.value} key={size.value}>
                <VStack alignItems="center">
                  <ImageSizeImage src={size.icon} theme={theme} />
                  <span>{size.label}</span>
                </VStack>
              </RadioButton>
            ))}
          </Radio.Group>

          <SettingTitle style={{ marginBottom: 5, marginTop: 15 }}>
            {t('paintings.seed')}
            <Tooltip title={t('paintings.seed_tip')}>
              <InfoIcon />
            </Tooltip>
          </SettingTitle>
          <Input
            value={painting.seed}
            onChange={(e) => updatePaintingState({ seed: e.target.value })}
            suffix={
              <RedoOutlined
                onClick={() => updatePaintingState({ seed: Math.floor(Math.random() * 1000000).toString() })}
                style={{ cursor: 'pointer', color: 'var(--color-text-2)' }}
              />
            }
          />

          <SettingTitle style={{ marginBottom: 5, marginTop: 15 }}>
            {t('paintings.guidance_scale')}
            <Tooltip title={t('paintings.guidance_scale_tip')}>
              <InfoIcon />
            </Tooltip>
          </SettingTitle>
          <SliderContainer>
            <Slider
              min={1}
              max={20}
              step={0.1}
              value={painting.guidanceScale}
              onChange={(v) => updatePaintingState({ guidanceScale: v })}
            />
            <StyledInputNumber
              min={1}
              max={20}
              step={0.1}
              value={painting.guidanceScale}
              onChange={(v) => updatePaintingState({ guidanceScale: (v as number) || 4.5 })}
            />
          </SliderContainer>

          <SettingTitle style={{ marginBottom: 5, marginTop: 15 }}>示例</SettingTitle>
          <RecommendedPromptsContainer>
            {RECOMMENDED_PROMPTS.map((item) => (
              <Tooltip title={item.tooltip} key={item.id}>
                <RecommendedPromptIcon
                  src={item.icon}
                  theme={theme}
                  onClick={() => handleRecommendedPromptClick(item.prompt)}
                />
              </Tooltip>
            ))}
          </RecommendedPromptsContainer>

          {/* <SettingTitle style={{ marginBottom: 5, marginTop: 15 }}>
            添加水印
            <Tooltip title="是否在图片右下角添加“AI生成”字样的水印标识">
              <InfoIcon />
            </Tooltip>
          </SettingTitle>
          <HStack>
            <Switch checked={watermark} onChange={(checked) => setWatermark(checked)} />
          </HStack> */}
        </LeftContainer>
        <MainContainer>
          <Artboard
            painting={painting}
            isLoading={isLoading}
            currentImageIndex={currentImageIndex}
            onPrevImage={prevImage}
            onNextImage={nextImage}
            onCancel={onCancel}
          />
          <InputContainer>
            <Textarea
              ref={textareaRef}
              variant="borderless"
              disabled={isLoading}
              value={painting.prompt}
              spellCheck={false}
              onChange={(e) => updatePaintingState({ prompt: e.target.value })}
              placeholder={t('paintings.prompt_placeholder')}
            />
            <Toolbar>
              <ToolbarMenu>
                <SendMessageButton sendMessage={onGenerate} disabled={isLoading} />
              </ToolbarMenu>
            </Toolbar>
          </InputContainer>
        </MainContainer>
        <PaintingsList
          namespace="doubao_paintings"
          paintings={doubao_paintings}
          selectedPainting={painting}
          onSelectPainting={onSelectPainting}
          onDeletePainting={onDeletePainting}
          onNewPainting={() => {
            if (generating) return
            const newPainting = getNewPainting()
            const addedPainting = addPainting('doubao_paintings', newPainting)
            setPainting(addedPainting)
          }}
        />
      </ContentContainer>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
`

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: row;
  height: 100%;
  background-color: var(--color-background);
  overflow: hidden;
`

const LeftContainer = styled(Scrollbar)`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  padding: 20px;
  background-color: var(--color-background);
  max-width: var(--assistants-width);
  border-right: 0.5px solid var(--color-border);
`

const MainContainer = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-background);
`

const InputContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 95px;
  max-height: 95px;
  position: relative;
  border: 1px solid var(--color-border-soft);
  transition: all 0.3s ease;
  margin: 0 20px 15px 20px;
  border-radius: 10px;
`

const Textarea = styled(TextArea)`
  padding: 10px;
  border-radius: 0;
  display: flex;
  flex: 1;
  resize: none !important;
  overflow: auto;
  width: auto;
`

const Toolbar = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  justify-content: flex-end;
  padding: 0 8px;
  padding-bottom: 0;
  height: 40px;
`

const ToolbarMenu = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
`

const ImageSizeImage = styled.img<{ theme: string }>`
  filter: ${({ theme }) => (theme === 'dark' ? 'invert(100%)' : 'none')};
  margin-top: 8px;
`

const RadioButton = styled(Radio.Button)`
  width: 30px;
  height: 55px;
  display: flex;
  flex-direction: column;
  flex: 1;
  justify-content: center;
  align-items: center;
`

const InfoIcon = styled(Info)`
  margin-left: 5px;
  cursor: help;
  color: var(--color-text-2);
  opacity: 0.6;
  width: 16px;
  height: 16px;

  &:hover {
    opacity: 1;
  }
`

const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;

  .ant-slider {
    flex: 1;
  }
`

const StyledInputNumber = styled(InputNumber)`
  width: 70px;
`

const RecommendedPromptsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
`

const RecommendedPromptIcon = styled.img<{ theme: string }>`
  width: 48px;
  height: 48px;
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid var(--color-border);
  padding: 0px;
  object-fit: contain;
  filter: ${({ theme }) => (theme === 'dark' ? 'invert(100%)' : 'none')};

  &:hover {
    border-color: var(--color-primary);
    transform: scale(1.1);
    transition: transform 0.2s ease;
  }
`

const ProviderTitleContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`

export default DoubaoPage
