import { useAgents } from '@renderer/hooks/useAgents'
import { useRuntime } from '@renderer/hooks/useRuntime'
import { Agent } from '@renderer/types'
import { runAsyncFunction } from '@renderer/utils'
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
  const [agents, setAgents] = useState<Agent[]>(_agents)
  const { resourcesPath } = useRuntime()

  useEffect(() => {
    runAsyncFunction(async () => {
      if (_agents.length > 0 || resourcesPath == '') return
      const agents = await window.api.fs.read(resourcesPath + '/data/agents.json')
      _agents = JSON.parse(agents) as Agent[]
      setAgents(_agents)
    })
  }, [resourcesPath])

  return agents
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
