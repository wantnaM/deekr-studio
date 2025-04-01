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
      const subjects = systemAgents[i].subject || []
      if (subjects.length === 0) {
        // 没有设置 subject 的分到"通用"分组
        const agent = {
          ...systemAgents[i],
          group: '通用', // 使用"通用"作为分组
          subject: [],
          topics: [],
          type: 'agent'
        } as Agent
        agents.push(agent)
      } else {
        // 有 subject 的按学科分组
        for (let j = 0; j < subjects.length; j++) {
          const agent = {
            ...systemAgents[i],
            group: subjects[j], // 使用学科作为分组
            subject: subjects,
            topics: [],
            type: 'agent'
          } as Agent
          agents.push(agent)
        }
      }
    } else {
      // 按主题分组（默认）
      for (let j = 0; j < systemAgents[i].group.length; j++) {
        const agent = {
          ...systemAgents[i],
          group: systemAgents[i].group[j],
          subject: systemAgents[i].subject || [],
          topics: [],
          type: 'agent'
        } as Agent
        agents.push(agent)
      }
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
