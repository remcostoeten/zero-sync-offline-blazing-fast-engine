import './App.css'
import { ZeroAppProvider } from './zero-react'
import { IssueList } from './components/IssueList'
import { KanbanBoard } from './components/KanbanBoard'
import { SeedData } from './components/SeedData'

function App() {
  return (
    <ZeroAppProvider>
      <SeedData />
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 16, padding: 16 }}>
        <div>
          <h2>Issues</h2>
          <IssueList />
        </div>
        <div>
          <h2>Kanban</h2>
          <KanbanBoard />
        </div>
      </div>
    </ZeroAppProvider>
  )
}

export default App
