import { createFileRoute } from '@tanstack/react-router'
import AgentsTeamPage from '@/features/my-nooble/agents/team'

export const Route = createFileRoute('/(authenticated)/my-nooble/agents/team/')({
  component: AgentsTeamPage,
})
