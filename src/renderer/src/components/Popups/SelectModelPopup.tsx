import { PushpinOutlined } from '@ant-design/icons'
import { TopView } from '@renderer/components/TopView'
import { getModelLogo, isEmbeddingModel, isRerankModel } from '@renderer/config/models'
import db from '@renderer/databases'
import { useProviders } from '@renderer/hooks/useProvider'
import { getModelUniqId } from '@renderer/services/ModelService'
import { Model } from '@renderer/types'
import { Avatar, Divider, Empty, Input, InputRef, Menu, MenuProps, Modal } from 'antd'
import { first, sortBy } from 'lodash'
import { Search } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { HStack } from '../Layout'
import ModelTagsWithLabel from '../ModelTagsWithLabel'
import Scrollbar from '../Scrollbar'

type MenuItem = Required<MenuProps>['items'][number]

interface Props {
  model?: Model
}

interface PopupContainerProps extends Props {
  resolve: (value: Model | undefined) => void
}

const PopupContainer: React.FC<PopupContainerProps> = ({ model, resolve }) => {
  const [open, setOpen] = useState(true)
  const { t } = useTranslation()
  const [searchText, setSearchText] = useState('')
  const inputRef = useRef<InputRef>(null)
  const { providers } = useProviders()
  const [pinnedModels, setPinnedModels] = useState<string[]>([])
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [keyboardSelectedId, setKeyboardSelectedId] = useState<string>('')
  const menuItemRefs = useRef<Record<string, HTMLElement | null>>({})

  const setMenuItemRef = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) {
        menuItemRefs.current[key] = el
      }
    },
    []
  )

  useEffect(() => {
    const loadPinnedModels = async () => {
      const setting = await db.settings.get('pinned:models')
      const savedPinnedModels = setting?.value || []

      // Filter out invalid pinned models
      const allModelIds = providers.flatMap((p) => p.models || []).map((m) => getModelUniqId(m))
      const validPinnedModels = savedPinnedModels.filter((id) => allModelIds.includes(id))

      // Update storage if there were invalid models
      if (validPinnedModels.length !== savedPinnedModels.length) {
        await db.settings.put({ id: 'pinned:models', value: validPinnedModels })
      }

      setPinnedModels(sortBy(validPinnedModels, ['group', 'name']))
    }
    loadPinnedModels()
  }, [providers])

  const togglePin = async (modelId: string) => {
    const newPinnedModels = pinnedModels.includes(modelId)
      ? pinnedModels.filter((id) => id !== modelId)
      : [...pinnedModels, modelId]

    await db.settings.put({ id: 'pinned:models', value: newPinnedModels })
    setPinnedModels(sortBy(newPinnedModels, ['group', 'name']))
  }

  // 根据输入的文本筛选模型
  const getFilteredModels = useCallback(
    (provider) => {
      let models = provider.models.filter((m) => !isEmbeddingModel(m) && !isRerankModel(m))

      if (searchText.trim()) {
        const keywords = searchText.toLowerCase().split(/\s+/).filter(Boolean)
        models = models.filter((m) => {
          const fullName = provider.isSystem
            ? `${m.name} ${provider.name} ${t('provider.' + provider.id)}`
            : `${m.name} ${provider.name}`

          const lowerFullName = fullName.toLowerCase()
          return keywords.every((keyword) => lowerFullName.includes(keyword))
        })
      } else {
        // 如果不是搜索状态，过滤掉已固定的模型
        models = models.filter((m) => !pinnedModels.includes(getModelUniqId(m)))
      }

      return sortBy(models, ['group', 'name'])
    },
    [searchText, t, pinnedModels]
  )

  // 递归处理菜单项，为每个项添加ref
  const processMenuItems = useCallback(
    (items: MenuItem[]) => {
      // 内部定义 renderMenuItem 函数
      const renderMenuItem = (item: any) => {
        return {
          ...item,
          label: <div ref={setMenuItemRef(item.key)}>{item.label}</div>
        }
      }

      return items.map((item) => {
        if (item && 'children' in item && item.children) {
          return {
            ...item,
            children: (item.children as MenuItem[]).map(renderMenuItem)
          }
        }
        return item
      })
    },
    [setMenuItemRef]
  )

  const filteredItems: MenuItem[] = providers
    .filter((p) => p.models && p.models.length > 0)
    .map((p) => {
      const filteredModels = getFilteredModels(p).map((m) => ({
        key: getModelUniqId(m),
        label: (
          <ModelItem>
            <ModelNameRow>
              <span>{m?.name}</span> <ModelTagsWithLabel model={m} size={11} showLabel={false} />
            </ModelNameRow>
            <PinIcon
              onClick={(e) => {
                e.stopPropagation()
                togglePin(getModelUniqId(m))
              }}
              isPinned={pinnedModels.includes(getModelUniqId(m))}>
              <PushpinOutlined />
            </PinIcon>
          </ModelItem>
        ),
        icon: (
          <Avatar src={getModelLogo(m?.id || '')} size={24}>
            {first(m?.name)}
          </Avatar>
        ),
        onClick: () => {
          resolve(m)
          setOpen(false)
        }
      }))

      // Only return the group if it has filtered models
      return filteredModels.length > 0
        ? {
            key: p.id,
            label: p.isSystem ? t(`provider.${p.id}`) : p.name,
            type: 'group',
            children: filteredModels
          }
        : null
    })
    .filter(Boolean) as MenuItem[] // Filter out null items

  if (pinnedModels.length > 0 && searchText.length === 0) {
    const pinnedItems = providers
      .flatMap((p) =>
        p.models
          .filter((m) => pinnedModels.includes(getModelUniqId(m)))
          .map((m) => ({
            key: getModelUniqId(m),
            model: m,
            provider: p
          }))
      )
      .map((m) => ({
        key: getModelUniqId(m.model) + '_pinned',
        label: (
          <ModelItem>
            <ModelNameRow>
              <span>
                {m.model?.name} | {m.provider.isSystem ? t(`provider.${m.provider.id}`) : m.provider.name}
              </span>{' '}
              <ModelTagsWithLabel model={m.model} size={11} showLabel={false} />
            </ModelNameRow>
            <PinIcon
              onClick={(e) => {
                e.stopPropagation()
                togglePin(getModelUniqId(m.model))
              }}
              isPinned={true}>
              <PushpinOutlined />
            </PinIcon>
          </ModelItem>
        ),
        icon: (
          <Avatar src={getModelLogo(m.model?.id || '')} size={24}>
            {first(m.model?.name)}
          </Avatar>
        ),
        onClick: () => {
          resolve(m.model)
          setOpen(false)
        }
      }))

    if (pinnedItems.length > 0) {
      filteredItems.unshift({
        key: 'pinned',
        label: t('models.pinned'),
        type: 'group',
        children: pinnedItems
      } as MenuItem)
    }
  }

  // 处理菜单项，添加ref
  const processedItems = processMenuItems(filteredItems)

  const onCancel = () => {
    setKeyboardSelectedId('')
    setOpen(false)
  }

  const onClose = async () => {
    setKeyboardSelectedId('')
    resolve(undefined)
    SelectModelPopup.hide()
  }

  useEffect(() => {
    open && setTimeout(() => inputRef.current?.focus(), 0)
  }, [open])

  useEffect(() => {
    if (open && model) {
      setTimeout(() => {
        const modelId = getModelUniqId(model)
        if (menuItemRefs.current[modelId]) {
          menuItemRefs.current[modelId]?.scrollIntoView({ block: 'center', behavior: 'auto' })
        }
      }, 100) // Small delay to ensure menu is rendered
    }
  }, [open, model])

  // 获取所有可见的模型项
  const getVisibleModelItems = useCallback(() => {
    const items: { key: string; model: Model }[] = []

    // 如果有置顶模型且没有搜索文本，添加置顶模型
    if (pinnedModels.length > 0 && searchText.length === 0) {
      providers
        .flatMap((p) => p.models || [])
        .filter((m) => pinnedModels.includes(getModelUniqId(m)))
        .forEach((m) => items.push({ key: getModelUniqId(m) + '_pinned', model: m }))
    }

    // 添加其他过滤后的模型
    providers.forEach((p) => {
      if (p.models) {
        getFilteredModels(p).forEach((m) => {
          const modelId = getModelUniqId(m)
          const isPinned = pinnedModels.includes(modelId)

          // 搜索状态下，所有匹配的模型都应该可以被选中，包括固定的模型
          // 非搜索状态下，只添加非固定模型（固定模型已在上面添加）
          if (searchText.length > 0 || !isPinned) {
            items.push({
              key: modelId,
              model: m
            })
          }
        })
      }
    })

    return items
  }, [pinnedModels, searchText, providers, getFilteredModels])

  // 添加一个useLayoutEffect来处理滚动
  useLayoutEffect(() => {
    if (open && keyboardSelectedId && menuItemRefs.current[keyboardSelectedId]) {
      // 获取当前选中元素和容器
      const selectedElement = menuItemRefs.current[keyboardSelectedId]
      const scrollContainer = scrollContainerRef.current

      if (!scrollContainer) return

      const selectedRect = selectedElement.getBoundingClientRect()
      const containerRect = scrollContainer.getBoundingClientRect()

      // 计算元素相对于容器的位置
      const currentScrollTop = scrollContainer.scrollTop
      const elementTop = selectedRect.top - containerRect.top + currentScrollTop
      const groupTitleHeight = 30

      // 确定滚动位置
      if (selectedRect.top < containerRect.top + groupTitleHeight) {
        // 元素被组标题遮挡，向上滚动
        scrollContainer.scrollTo({
          top: elementTop - groupTitleHeight,
          behavior: 'smooth'
        })
      } else if (selectedRect.bottom > containerRect.bottom) {
        // 元素在视口下方，向下滚动
        scrollContainer.scrollTo({
          top: elementTop - containerRect.height + selectedRect.height,
          behavior: 'smooth'
        })
      }
    }
  }, [open, keyboardSelectedId])

  // 处理键盘导航
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const items = getVisibleModelItems()
      if (items.length === 0) return

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const currentIndex = items.findIndex((item) => item.key === keyboardSelectedId)
        let nextIndex

        if (currentIndex === -1) {
          nextIndex = e.key === 'ArrowDown' ? 0 : items.length - 1
        } else {
          nextIndex =
            e.key === 'ArrowDown' ? (currentIndex + 1) % items.length : (currentIndex - 1 + items.length) % items.length
        }

        const nextItem = items[nextIndex]
        setKeyboardSelectedId(nextItem.key)
      } else if (e.key === 'Enter') {
        e.preventDefault() // 阻止回车的默认行为
        if (keyboardSelectedId) {
          const selectedItem = items.find((item) => item.key === keyboardSelectedId)
          if (selectedItem) {
            resolve(selectedItem.model)
            setOpen(false)
          }
        }
      }
    },
    [keyboardSelectedId, getVisibleModelItems, resolve, setOpen]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // 搜索文本改变时重置键盘选中状态
  useEffect(() => {
    setKeyboardSelectedId('')
  }, [searchText])

  const selectedKeys = keyboardSelectedId ? [keyboardSelectedId] : model ? [getModelUniqId(model)] : []

  return (
    <Modal
      centered
      open={open}
      onCancel={onCancel}
      afterClose={onClose}
      width={600}
      transitionName="animation-move-down"
      styles={{
        content: {
          borderRadius: 20,
          padding: 0,
          overflow: 'hidden',
          paddingBottom: 20,
          border: '1px solid var(--color-border)'
        }
      }}
      closeIcon={null}
      footer={null}>
      <HStack style={{ padding: '0 12px', marginTop: 5 }}>
        <Input
          prefix={
            <SearchIcon>
              <Search size={15} />
            </SearchIcon>
          }
          ref={inputRef}
          placeholder={t('models.search')}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          autoFocus
          style={{ paddingLeft: 0 }}
          variant="borderless"
          size="middle"
          onKeyDown={(e) => {
            // 防止上下键移动光标
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              e.preventDefault()
            }
          }}
        />
      </HStack>
      <Divider style={{ margin: 0, marginTop: 4, borderBlockStartWidth: 0.5 }} />
      <Scrollbar style={{ height: '50vh' }} ref={scrollContainerRef}>
        <Container>
          {processedItems.length > 0 ? (
            <StyledMenu
              items={processedItems}
              selectedKeys={selectedKeys}
              mode="inline"
              inlineIndent={6}
              onSelect={({ key }) => {
                setKeyboardSelectedId(key as string)
              }}
            />
          ) : (
            <EmptyState>
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
            </EmptyState>
          )}
        </Container>
      </Scrollbar>
    </Modal>
  )
}

const Container = styled.div`
  margin-top: 10px;
`

const StyledMenu = styled(Menu)`
  background-color: transparent;
  padding: 5px;
  margin-top: -10px;
  max-height: calc(60vh - 50px);

  .ant-menu-item-group-title {
    position: sticky;
    top: 0;
    z-index: 1;
    margin: 0 -5px;
    padding: 5px 10px;
    padding-left: 18px;
    font-size: 12px;
    font-weight: 500;

    /* Scroll-driven animation for sticky header */
    animation: background-change linear both;
    animation-timeline: scroll();
    animation-range: entry 0% entry 1%;
  }

  /* Simple animation that changes background color when sticky */
  @keyframes background-change {
    to {
      background-color: var(--color-background);
    }
  }

  .ant-menu-item {
    height: 36px;
    line-height: 36px;

    &.ant-menu-item-selected {
      background-color: var(--color-background-mute) !important;
      color: var(--color-text-primary) !important;
    }

    &:not([data-menu-id^='pinned-']) {
      .pin-icon {
        opacity: 0;
      }

      &:hover {
        .pin-icon {
          opacity: 0.3;
        }
      }
    }

    .anticon {
      min-width: auto;
    }
  }
`

const ModelItem = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  position: relative;
  width: 100%;
`

const ModelNameRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
`

const EmptyState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
`

const SearchIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  background-color: var(--color-background-soft);
  margin-right: 2px;
`

const PinIcon = styled.span.attrs({ className: 'pin-icon' })<{ isPinned: boolean }>`
  margin-left: auto;
  padding: 0 8px;
  opacity: ${(props) => (props.isPinned ? 1 : 'inherit')};
  transition: opacity 0.2s;
  position: absolute;
  right: 0;
  color: ${(props) => (props.isPinned ? 'var(--color-primary)' : 'inherit')};
  transform: ${(props) => (props.isPinned ? 'rotate(-45deg)' : 'none')};

  &:hover {
    opacity: 1 !important;
    color: ${(props) => (props.isPinned ? 'var(--color-primary)' : 'inherit')};
  }
`

export default class SelectModelPopup {
  static hide() {
    TopView.hide('SelectModelPopup')
  }
  static show(params: Props) {
    return new Promise<Model | undefined>((resolve) => {
      TopView.show(<PopupContainer {...params} resolve={resolve} />, 'SelectModelPopup')
    })
  }
}
