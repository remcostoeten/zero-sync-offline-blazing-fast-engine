import { useState } from 'react'
import { useIssueMutations } from '../mutations'
import type { IssuePriority, IssueStatus } from '../zero-schema'

export function IssueCreateForm() {
  const { createIssue } = useIssueMutations()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>('backlog')
  const [priority, setPriority] = useState<IssuePriority>('medium')

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault()
        if (!title.trim()) return
        await createIssue({ title, description, status, priority, labels: [] })
        setTitle('')
        setDescription('')
      }}
      style={{ display: 'grid', gap: 8 }}
    >
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div style={{ display: 'flex', gap: 8 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value as IssueStatus)}>
          <option value="backlog">Backlog</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as IssuePriority)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <button type="submit">Create</button>
    </form>
  )
}

