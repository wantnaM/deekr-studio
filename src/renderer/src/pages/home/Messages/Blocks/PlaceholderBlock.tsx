import SvgSpinners180Ring from '@renderer/components/Icons/SvgSpinners180Ring'
import { MessageBlockStatus, MessageBlockType, type PlaceholderMessageBlock } from '@renderer/types/newMessage'
import React from 'react'
import styled from 'styled-components'

interface PlaceholderBlockProps {
  block: PlaceholderMessageBlock
}
const PlaceholderBlock: React.FC<PlaceholderBlockProps> = ({ block }) => {
  if (block.status === MessageBlockStatus.PROCESSING && block.type === MessageBlockType.UNKNOWN) {
    return (
      <MessageContentLoading>
        <SvgSpinners180Ring />
      </MessageContentLoading>
    )
  }
  return null
}
const MessageContentLoading = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 32px;
  margin-top: -5px;
  margin-bottom: 5px;
`
export default React.memo(PlaceholderBlock)
