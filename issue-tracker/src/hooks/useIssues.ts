import { useQuery, useZero } from '@rocicorp/zero/react';
import type { IssueFilters } from '../zero-schema';

export function useIssues(filters: IssueFilters) {
  const z = useZero();
  let q = z.query.issues.orderBy('createdAt', 'desc');
  if (filters.status) q = q.where('status', filters.status);
  if (filters.assigneeId) q = q.where('assigneeId', filters.assigneeId);
  if (filters.search && filters.search.length > 0) {
    q = q.where('title', 'ILIKE', `%${filters.search}%`);
  }
  const [rows] = useQuery(q);
  return rows;
}

