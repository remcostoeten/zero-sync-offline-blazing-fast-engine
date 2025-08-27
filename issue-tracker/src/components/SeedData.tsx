import { useEffect } from 'react';
import { useIssueMutations } from '../mutations';
import { useIssues } from '../hooks/useIssues';

export function SeedData() {
  const issues = useIssues({});
  const { createIssue } = useIssueMutations();

  useEffect(() => {
    if (issues.length === 0) {
      const mk = (i: number) =>
        createIssue({
          title: `Issue ${i}`,
          description: `Auto-seeded issue ${i}`,
          status: i % 4 === 0 ? 'backlog' : i % 4 === 1 ? 'in-progress' : i % 4 === 2 ? 'review' : 'done',
          priority: (['low', 'medium', 'high', 'urgent'] as const)[i % 4],
          labels: ['seed'],
        });
      void Promise.all(Array.from({ length: 20 }, (_, i) => mk(i + 1)));
    }
  }, [issues.length, createIssue]);

  return null;
}

