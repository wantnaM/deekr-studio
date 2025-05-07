import FileManager from '@renderer/services/FileManager'
import { FileType, FileTypes } from '@renderer/types'
import { formatFileSize } from '@renderer/utils'
import { Col, Image, Row, Spin } from 'antd'
import { t } from 'i18next'
import VirtualList from 'rc-virtual-list'
import React, { memo } from 'react'
import styled from 'styled-components'

import FileItem from './FileItem'
import GeminiFiles from './GeminiFiles'

interface FileItemProps {
  id: FileTypes | 'all' | string
  list: {
    key: FileTypes | 'all' | string
    file: React.ReactNode
    files?: FileType[]
    count?: number
    size: string
    ext: string
    created_at: string
    actions: React.ReactNode
  }[]
  files?: FileType[]
}

const FileList: React.FC<FileItemProps> = ({ id, list, files }) => {
  if (id === FileTypes.IMAGE && files?.length && files?.length > 0) {
    return (
      <div style={{ padding: 16, overflowY: 'auto' }}>
        <Image.PreviewGroup>
          <Row gutter={[16, 16]}>
            {files?.map((file) => (
              <Col key={file.id} xs={24} sm={12} md={8} lg={4} xl={3}>
                <ImageWrapper>
                  <LoadingWrapper>
                    <Spin />
                  </LoadingWrapper>
                  <Image
                    src={FileManager.getFileUrl(file)}
                    style={{ height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                    preview={{ mask: false }}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement
                      img.parentElement?.classList.add('loaded')
                    }}
                  />
                  <ImageInfo>
                    <div>{formatFileSize(file.size)}</div>
                  </ImageInfo>
                </ImageWrapper>
              </Col>
            ))}
          </Row>
        </Image.PreviewGroup>
      </div>
    )
  }

  if (id.startsWith('gemini_')) {
    return <GeminiFiles id={id.replace('gemini_', '') as string} />
  }

  return (
    <VirtualList
      data={list}
      height={window.innerHeight - 100}
      itemHeight={75}
      itemKey="key"
      style={{ padding: '0 16px 16px 16px' }}
      styles={{
        verticalScrollBar: {
          width: 6
        },
        verticalScrollBarThumb: {
          background: 'var(--color-scrollbar-thumb)'
        }
      }}>
      {(item) => (
        <div
          style={{
            height: '75px',
            paddingTop: '12px'
          }}>
          <FileItem
            key={item.key}
            fileInfo={{
              name: item.file,
              ext: item.ext,
              extra: `${item.created_at} · ${item.count}${t('files.count')} · ${item.size}`,
              actions: item.actions
            }}
          />
        </div>
      )}
    </VirtualList>
  )
}

const ImageWrapper = styled.div`
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 8px;
  background-color: var(--color-background-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0.5px solid var(--color-border);

  .ant-image {
    height: 100%;
    width: 100%;
    opacity: 0;
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;

    &.loaded {
      opacity: 1;
    }
  }

  &:hover {
    .ant-image.loaded {
      transform: scale(1.05);
    }

    div:last-child {
      opacity: 1;
    }
  }
`

const LoadingWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-background-soft);
`

const ImageInfo = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 5px 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
  font-size: 12px;

  > div:first-child {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`

export default memo(FileList)
