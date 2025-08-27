import { IssueList } from '../components/IssueList'
import { ZeroAppProvider } from '../zero-react'
import { IssueCreateForm } from '../sections/IssueCreateForm'

export function IssuesPage() {
  return (
    <ZeroAppProvider>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 16, padding: 16 }}>
        <div>
          <h2>Issues</h2>
          <IssueList />
        </div>
        <div>
          <h3>Create Issue</h3>
          <IssueCreateForm />
        </div>
      </div>
    </ZeroAppProvider>
  )
}

