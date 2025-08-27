import { useParams } from 'react-router-dom'
import { useIssueDetail } from '../hooks/useIssueDetail'
import { ZeroAppProvider } from '../zero-react'
import { useZero } from '@rocicorp/zero/react'
import { useState } from 'react'

function Comments({ issueId }: { issueId: string }) {
  const z = useZero()
  const [content, setContent] = useState('')
  const { comments } = useIssueDetail(issueId)

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <h4>Comments</h4>
      <ul>
        {comments.map((c) => (
          <li key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>{c.content}</div>
            <button onClick={() => z.mutate.comments.delete({ id: c.id })}>Delete</button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          if (!content.trim()) return
          await z.mutate.comments.insert({
            id: crypto.randomUUID(),
            issueId,
            authorId: 'demo-user',
            content,
            createdAt: Date.now(),
          })
          setContent('')
        }}
        style={{ display: 'flex', gap: 8 }}
      >
        <input placeholder="Add a comment" value={content} onChange={(e) => setContent(e.target.value)} />
        <button type="submit">Add</button>
      </form>
    </div>
  )
}

export function IssueDetailPage() {
  const params = useParams()
  const id = params.id!
  return (
    <ZeroAppProvider>
      <div style={{ padding: 16, display: 'grid', gap: 16 }}>
        <IssueDetail id={id} />
      </div>
    </ZeroAppProvider>
  )
}

function IssueDetail({ id }: { id: string }) {
  const { issue } = useIssueDetail(id)
  const z = useZero()
  if (!issue) return <div>Not found</div>
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <h2>{issue.title}</h2>
      <div>Status: {issue.status}</div>
      <div>Priority: {issue.priority}</div>
      <div>{issue.description}</div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => z.mutate.issues.update({ id, status: 'in-progress', updatedAt: Date.now() })}>Start</button>
        <button onClick={() => z.mutate.issues.update({ id, status: 'review', updatedAt: Date.now() })}>Send to Review</button>
        <button onClick={() => z.mutate.issues.update({ id, status: 'done', updatedAt: Date.now() })}>Complete</button>
      </div>
      <Comments issueId={id} />
    </div>
  )
}

