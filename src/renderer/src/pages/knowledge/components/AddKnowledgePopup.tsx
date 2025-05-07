import { TopView } from '@renderer/components/TopView'
import { DEFAULT_KNOWLEDGE_DOCUMENT_COUNT } from '@renderer/config/constant'
import { isEmbeddingModel, isRerankModel } from '@renderer/config/models'
import { SUPPORTED_REANK_PROVIDERS } from '@renderer/config/providers'
import { useKnowledgeBases } from '@renderer/hooks/useKnowledge'
import { useProviders } from '@renderer/hooks/useProvider'
import { SettingHelpText } from '@renderer/pages/settings'
import AiProvider from '@renderer/providers/AiProvider'
import { getKnowledgeBaseParams } from '@renderer/services/KnowledgeService'
import { getModelUniqId } from '@renderer/services/ModelService'
import { Model } from '@renderer/types'
import { getErrorMessage } from '@renderer/utils/error'
import { Form, Input, Modal, Select, Slider } from 'antd'
import { find, sortBy } from 'lodash'
import { nanoid } from 'nanoid'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface ShowParams {
  title: string
}

interface FormData {
  name: string
  model: string
  rerankModel: string | undefined
  documentCount: number | undefined
}

interface Props extends ShowParams {
  resolve: (data: any) => void
}

const PopupContainer: React.FC<Props> = ({ title, resolve }) => {
  const [open, setOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm<FormData>()
  const { t } = useTranslation()
  const { providers } = useProviders()
  const { addKnowledgeBase } = useKnowledgeBases()

  const allModels = providers
    .map((p) => p.models)
    .flat()
    .filter((model) => isEmbeddingModel(model) && !isRerankModel(model))

  const rerankModels = providers
    .map((p) => p.models)
    .flat()
    .filter((model) => isRerankModel(model))

  const nameInputRef = useRef<any>(null)

  const selectOptions = providers
    .filter((p) => p.models.length > 0)
    .map((p) => ({
      label: p.isSystem ? t(`provider.${p.id}`) : p.name,
      title: p.name,
      options: sortBy(p.models, 'name')
        .filter((model) => isEmbeddingModel(model) && !isRerankModel(model))
        .map((m) => ({
          label: m.name,
          value: getModelUniqId(m)
        }))
    }))
    .filter((group) => group.options.length > 0)

  const rerankSelectOptions = providers
    .filter((p) => p.models.length > 0)
    .filter((p) => SUPPORTED_REANK_PROVIDERS.includes(p.id))
    .map((p) => ({
      label: p.isSystem ? t(`provider.${p.id}`) : p.name,
      title: p.name,
      options: sortBy(p.models, 'name')
        .filter((model) => isRerankModel(model))
        .map((m) => ({
          label: m.name,
          value: getModelUniqId(m)
        }))
    }))
    .filter((group) => group.options.length > 0)

  const onOk = async () => {
    try {
      const values = await form.validateFields()
      const selectedModel = find(allModels, JSON.parse(values.model)) as Model

      const selectedRerankModel = values.rerankModel
        ? (find(rerankModels, JSON.parse(values.rerankModel)) as Model)
        : undefined

      if (selectedModel) {
        setLoading(true)
        const provider = providers.find((p) => p.id === selectedModel.provider)

        if (!provider) {
          return
        }

        const aiProvider = new AiProvider(provider)
        let dimensions = 0

        try {
          dimensions = await aiProvider.getEmbeddingDimensions(selectedModel)
        } catch (error) {
          console.error('Error getting embedding dimensions:', error)
          window.message.error(t('message.error.get_embedding_dimensions') + '\n' + getErrorMessage(error))
          setLoading(false)
          return
        }

        const newBase = {
          id: nanoid(),
          name: values.name,
          model: selectedModel,
          rerankModel: selectedRerankModel,
          dimensions,
          documentCount: values.documentCount || DEFAULT_KNOWLEDGE_DOCUMENT_COUNT,
          items: [],
          created_at: Date.now(),
          updated_at: Date.now(),
          version: 1
        }

        await window.api.knowledgeBase.create(getKnowledgeBaseParams(newBase))

        addKnowledgeBase(newBase as any)
        setOpen(false)
        resolve(newBase)
      }
    } catch (error) {
      console.error('Validation failed:', error)
    }
  }

  const onCancel = () => {
    setOpen(false)
  }

  const onClose = () => {
    resolve(null)
  }

  return (
    <Modal
      title={title}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      afterClose={onClose}
      afterOpenChange={(visible) => visible && nameInputRef.current?.focus()}
      destroyOnClose
      centered
      okButtonProps={{ loading }}>
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t('common.name')}
          rules={[{ required: true, message: t('message.error.enter.name') }]}>
          <Input placeholder={t('common.name')} ref={nameInputRef} />
        </Form.Item>

        <Form.Item
          name="model"
          label={t('models.embedding_model')}
          tooltip={{ title: t('models.embedding_model_tooltip'), placement: 'right' }}
          rules={[{ required: true, message: t('message.error.enter.model') }]}>
          <Select style={{ width: '100%' }} options={selectOptions} placeholder={t('settings.models.empty')} />
        </Form.Item>

        <Form.Item
          name="rerankModel"
          label={t('models.rerank_model')}
          tooltip={{ title: t('models.rerank_model_tooltip'), placement: 'right' }}
          rules={[{ required: false, message: t('message.error.enter.model') }]}>
          <Select style={{ width: '100%' }} options={rerankSelectOptions} placeholder={t('settings.models.empty')} />
        </Form.Item>
        <SettingHelpText style={{ marginTop: -15, marginBottom: 20 }}>
          {t('models.rerank_model_support_provider', {
            provider: SUPPORTED_REANK_PROVIDERS.map((id) => t(`provider.${id}`))
          })}
        </SettingHelpText>
        <Form.Item
          name="documentCount"
          label={t('knowledge.document_count')}
          initialValue={DEFAULT_KNOWLEDGE_DOCUMENT_COUNT} // 设置初始值
          tooltip={{ title: t('knowledge.document_count_help') }}>
          <Slider
            style={{ width: '100%' }}
            min={1}
            max={30}
            step={1}
            marks={{ 1: '1', 6: t('knowledge.document_count_default'), 30: '30' }}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default class AddKnowledgePopup {
  static hide() {
    TopView.hide('AddKnowledgePopup')
  }

  static show(props: ShowParams) {
    return new Promise<any>((resolve) => {
      TopView.show(
        <PopupContainer
          {...props}
          resolve={(v) => {
            resolve(v)
            this.hide()
          }}
        />,
        'AddKnowledgePopup'
      )
    })
  }
}
