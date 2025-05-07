import { Collapse } from 'antd'
import { merge } from 'lodash'
import { FC, memo } from 'react'

interface CustomCollapseProps {
  label: React.ReactNode
  extra: React.ReactNode
  children: React.ReactNode
  destroyInactivePanel?: boolean
  defaultActiveKey?: string[]
  activeKey?: string[]
  collapsible?: 'header' | 'icon' | 'disabled'
  style?: React.CSSProperties
  styles?: {
    header?: React.CSSProperties
    body?: React.CSSProperties
  }
}

const CustomCollapse: FC<CustomCollapseProps> = ({
  label,
  extra,
  children,
  destroyInactivePanel = false,
  defaultActiveKey = ['1'],
  activeKey,
  collapsible = undefined,
  style,
  styles
}) => {
  const defaultCollapseStyle = {
    width: '100%',
    background: 'transparent',
    border: '0.5px solid var(--color-border)'
  }

  const defaultCollapseItemStyles = {
    header: {
      padding: '8px 16px',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--color-background-soft)',
      borderTopLeftRadius: '8px',
      borderTopRightRadius: '8px'
    },
    body: {
      borderTop: 'none'
    }
  }

  const collapseStyle = merge({}, defaultCollapseStyle, style)
  const collapseItemStyles = merge({}, defaultCollapseItemStyles, styles)

  return (
    <Collapse
      bordered={false}
      style={collapseStyle}
      defaultActiveKey={defaultActiveKey}
      activeKey={activeKey}
      destroyInactivePanel={destroyInactivePanel}
      collapsible={collapsible}
      items={[
        {
          styles: collapseItemStyles,
          key: '1',
          label,
          extra,
          children
        }
      ]}
    />
  )
}

export default memo(CustomCollapse)
