import { useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import type { ListChildComponentProps } from 'react-window';
import { useIssues } from '../hooks/useIssues';
import type { IssueFilters } from '../zero-schema';

type Issue = ReturnType<typeof useIssues>[number];

function IssueRow({ index, style, data }: ListChildComponentProps<Issue[]>) {
  const issue = data[index];
  return (
    <div style={style} className="issue-row">
      <div className="title">{issue.title}</div>
      <div className="meta">
        <span className="status">{issue.status}</span>
        <span className="priority">{issue.priority}</span>
      </div>
    </div>
  );
}

export function IssueList() {
  const [filters, setFilters] = useState<IssueFilters>({});
  const issues = useIssues(filters);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input
        aria-label="Search issues"
        placeholder="Search issues..."
        onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
      />
      <List
        height={600}
        itemCount={issues.length}
        itemSize={80}
        itemData={issues}
        width={'100%'}
      >
        {IssueRow}
      </List>
    </div>
  );
}

