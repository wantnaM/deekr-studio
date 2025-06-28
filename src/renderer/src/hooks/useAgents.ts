import { createAgent, deleteAgent, updateAgent as updateAgentServive } from '@renderer/services/AdminService/Agent'
import { useAppDispatch, useAppSelector } from '@renderer/store'
import { addAgent, removeAgent, updateAgent, updateAgents, updateAgentSettings } from '@renderer/store/agents'
import { Agent, AssistantSettings } from '@renderer/types'

export function useAgents() {
  const agents = useAppSelector((state) => state.agents.agents)
  const dispatch = useAppDispatch()

  return {
    agents,
    updateAgents: async (agents: Agent[]) => {
      for (let index = 0; index < agents.length; index++) {
        await updateAgentServive(agents[index])
      }
      dispatch(updateAgents(agents))
    },
    addAgent: async (agent: Agent) => {
      await createAgent(agent)
      dispatch(addAgent(agent))
    },
    removeAgent: async (id: string) => {
      await deleteAgent(id)
      dispatch(removeAgent({ id }))
    }
  }
}

export function useAgent(id: string) {
  const agent = useAppSelector((state) => state.agents.agents.find((a) => a.id === id) as Agent)
  const dispatch = useAppDispatch()

  return {
    agent,
    updateAgent: (agent: Agent) => dispatch(updateAgent(agent)),
    updateAgentSettings: (settings: Partial<AssistantSettings>) => {
      dispatch(updateAgentSettings({ assistantId: agent.id, settings }))
    }
  }
}
