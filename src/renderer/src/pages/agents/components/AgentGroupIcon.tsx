import { groupTranslations } from '@renderer/pages/agents/agentGroupTranslations'
import { DynamicIcon, IconName } from 'lucide-react/dynamic'
import { FC } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  groupName: string
  size?: number
  strokeWidth?: number
}

export const AgentGroupIcon: FC<Props> = ({ groupName, size = 20, strokeWidth = 1.2 }) => {
  const { i18n } = useTranslation()
  const currentLanguage = i18n.language as keyof (typeof groupTranslations)[string]

  const findOriginalKey = (name: string): string => {
    if (groupTranslations[name]) {
      return name
    }

    for (const key in groupTranslations) {
      if (groupTranslations[key][currentLanguage] === name) {
        return key
      }
    }

    return name
  }

  const originalKey = findOriginalKey(groupName)

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

  return <DynamicIcon name={iconMap[originalKey] || 'bot-message-square'} size={size} strokeWidth={strokeWidth} />
}
