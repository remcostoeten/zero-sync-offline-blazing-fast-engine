import { useQuery, useZero } from '@rocicorp/zero/react';

export function useIssueDetail(issueId: string) {
  const z = useZero();
  const [issue] = useQuery(z.query.issues.where('id', issueId).one());
  const [comments] = useQuery(
    z.query.comments.where('issueId', issueId).orderBy('createdAt', 'asc')
  );
  return { issue, comments };
}

