import { DynamicIcon, IconName } from 'lucide-react/dynamic'
import { FC } from 'react'

interface Props {
  groupName: string
  size?: number
  strokeWidth?: number
}

export const AgentGroupIcon: FC<Props> = ({ groupName, size = 20, strokeWidth = 1.2 }) => {
  const iconMap: { [key: string]: IconName } = {
    我的: 'user-check',
    精选: 'star',
    教学设计: 'book-open',
    行政管理: 'users',
    考试分析: 'bar-chart-2',
    课题研究: 'microscope',
    学科助手: 'puzzle',
    作业批改: 'check-circle',
    作业设计: 'notebook-pen',
    搜索: 'search'
  } as const

  return <DynamicIcon name={iconMap[groupName] || 'bot-message-square'} size={size} strokeWidth={strokeWidth} />
}
