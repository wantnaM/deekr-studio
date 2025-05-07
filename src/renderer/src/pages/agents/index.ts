import { useAgents } from '@renderer/hooks/useAgents'
import { useRuntime } from '@renderer/hooks/useRuntime'
import { useSettings } from '@renderer/hooks/useSettings'
import { Agent } from '@renderer/types'
import { useEffect, useState } from 'react'
let _agents: Agent[] = []

// index.ts
export const getAgentsFromSystemAgents = (systemAgents: any, groupBySubject: boolean = false) => {
  const agents: Agent[] = []
  for (let i = 0; i < systemAgents.length; i++) {
    if (groupBySubject) {
      // 按学科分组
      const subject = systemAgents[i].subject || '通用'
      const agent = {
        ...systemAgents[i],
        group: [subject], // 使用"通用"作为分组
        topics: [],
        type: 'agent'
      } as Agent
      agents.push(agent)
    } else {
      // 按主题分组（默认）
      const theme = systemAgents[i].theme || '其他'
      const agent = {
        ...systemAgents[i],
        group: [theme],
        topics: [],
        type: 'agent'
      } as Agent
      agents.push(agent)
    }
  }
  return agents
}

export function useSystemAgents() {
  const { defaultAgent } = useSettings()
  const [agents, setAgents] = useState<Agent[]>([])
  const { resourcesPath } = useRuntime()

  useEffect(() => {
    const loadAgents = async () => {
      try {
        // 始终加载本地 agents
        if ((resourcesPath && _agents.length === 0) || resourcesPath == '') {
          const localAgentsData = await window.api.fs.read(resourcesPath + '/data/agents.json')
          _agents = JSON.parse(localAgentsData) as Agent[]
        }

        // 如果没有远程配置或获取失败，使用本地 agents
        setAgents(_agents)
      } catch (error) {
        console.error('Failed to load agents:', error)
        // 发生错误时使用本地 agents
        setAgents(_agents)
      }
    }

    loadAgents()
  }, [defaultAgent, resourcesPath])

  return agents
}

export function groupByCategories(data: Agent[]) {
  const groupedMap = new Map<string, Agent[]>()
  data.forEach((item) => {
    item.group?.forEach((category) => {
      if (!groupedMap.has(category)) {
        groupedMap.set(category, [])
      }
      groupedMap.get(category)?.push(item)
    })
  })
  const result: Record<string, Agent[]> = {}
  Array.from(groupedMap.entries()).forEach(([category, items]) => {
    result[category] = items
  })
  return result
}

export function useAllAgents() {
  const { agents } = useAgents()
  const [allAgents, setAllAgents] = useState<Agent[]>([..._agents, ...agents])

  useSystemAgents()

  useEffect(() => {
    setAllAgents([..._agents, ...agents])
  }, [agents])
  return allAgents
}
