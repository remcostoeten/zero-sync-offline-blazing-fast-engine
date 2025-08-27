import { createSchema } from '@rocicorp/zero';
import { table, string, number, json } from '@rocicorp/zero';

export const schema = createSchema({
  tables: [
    table('issues')
      .columns({
        id: string(),
        title: string(),
        description: string(),
        status: string<'backlog' | 'in-progress' | 'review' | 'done'>(),
        priority: string<'low' | 'medium' | 'high' | 'urgent'>(),
        assigneeId: string().optional(),
        labels: json(),
        createdAt: number(),
        updatedAt: number(),
      })
      .primaryKey('id'),

    table('comments')
      .columns({
        id: string(),
        issueId: string(),
        authorId: string(),
        content: string(),
        createdAt: number(),
      })
      .primaryKey('id'),

    table('users')
      .columns({
        id: string(),
        name: string(),
        email: string(),
        avatar: string().optional(),
      })
      .primaryKey('id'),
  ],
});

export type IssueStatus = 'backlog' | 'in-progress' | 'review' | 'done';
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent';

export type IssueFilters = {
  status?: IssueStatus;
  assigneeId?: string;
  search?: string;
};

export type CreateIssueInput = {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assigneeId?: string;
  labels?: unknown;
};

