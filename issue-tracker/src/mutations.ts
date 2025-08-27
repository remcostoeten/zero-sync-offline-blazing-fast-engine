import { useZero } from '@rocicorp/zero/react';
import type { CreateIssueInput } from './zero-schema';
import type { IssueStatus } from './zero-schema';

export function useIssueMutations() {
  const z = useZero();

  const createIssue = async (issue: CreateIssueInput) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    await z.mutate.issues.insert({
      id,
      ...issue,
      labels: issue.labels ?? [],
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateIssueStatus = async (issueId: string, status: IssueStatus) => {
    await z.mutate.issues.update({ id: issueId, status, updatedAt: Date.now() });
  };

  const updateIssue = async (
    issueId: string,
    fields: Partial<Omit<CreateIssueInput, 'title' | 'description'>> &
      Partial<{ title: string; description: string }>
  ) => {
    await z.mutate.issues.update({ id: issueId, ...fields, updatedAt: Date.now() });
  };

  const deleteIssue = async (issueId: string) => {
    await z.mutate.issues.delete({ id: issueId });
  };

  return { createIssue, updateIssueStatus, updateIssue, deleteIssue };
}

