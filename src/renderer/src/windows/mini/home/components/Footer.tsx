import { ArrowLeftOutlined } from '@ant-design/icons'
import { Tag as AntdTag, Tooltip } from 'antd'
import { CircleArrowLeft, Copy, Pin } from 'lucide-react'
import { FC, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

interface FooterProps {
  route: string
  canUseBackspace?: boolean
  clearClipboard?: () => void
  onExit: () => void
}

const Footer: FC<FooterProps> = ({ route, canUseBackspace, clearClipboard, onExit }) => {
  const { t } = useTranslation()
  const [isPinned, setIsPinned] = useState(false)

  const onClickPin = () => {
    window.api.miniWindow.setPin(!isPinned).then(() => {
      setIsPinned(!isPinned)
    })
  }

  return (
    <WindowFooter className="drag">
      <FooterText>
        <Tag
          bordered={false}
          icon={<CircleArrowLeft size={14} color="var(--color-text)" />}
          className="nodrag"
          onClick={() => onExit()}>
          {t('miniwindow.footer.esc', {
            action: route === 'home' ? t('miniwindow.footer.esc_close') : t('miniwindow.footer.esc_back')
          })}
        </Tag>
        {route === 'home' && !canUseBackspace && (
          <Tag
            bordered={false}
            icon={<ArrowLeftOutlined />}
            style={{ cursor: 'pointer' }}
            className="nodrag"
            onClick={() => clearClipboard!()}>
            {t('miniwindow.footer.backspace_clear')}
          </Tag>
        )}
        {route !== 'home' && (
          <Tag
            bordered={false}
            icon={<Copy size={14} color="var(--color-text)" />}
            style={{ cursor: 'pointer' }}
            className="nodrag">
            {t('miniwindow.footer.copy_last_message')}
          </Tag>
        )}
      </FooterText>
      <PinButtonArea onClick={() => onClickPin()} className="nodrag">
        <Tooltip title={t('miniwindow.tooltip.pin')} mouseEnterDelay={0.8} placement="left">
          <Pin size={14} stroke={isPinned ? 'var(--color-primary)' : 'var(--color-text)'} />
        </Tooltip>
      </PinButtonArea>
    </WindowFooter>
  )
}

const WindowFooter = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 5px 0;
  color: var(--color-text-secondary);
  font-size: 12px;
`

const FooterText = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-secondary);
  font-size: 12px;
`

const PinButtonArea = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
`

const Tag = styled(AntdTag)`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
`

export default Footer
