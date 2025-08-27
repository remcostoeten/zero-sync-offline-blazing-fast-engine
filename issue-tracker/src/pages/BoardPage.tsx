import { KanbanBoard } from '../components/KanbanBoard'
import { SeedData } from '../components/SeedData'
import { ZeroAppProvider } from '../zero-react'

export function BoardPage() {
  return (
    <ZeroAppProvider>
      <SeedData />
      <div style={{ padding: 16 }}>
        <h2>Kanban Board</h2>
        <KanbanBoard />
      </div>
    </ZeroAppProvider>
  )
}

