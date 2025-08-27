import { createSchema } from '@rocicorp/zero';
import { table, string, number, json } from '@rocicorp/zero';
import { definePermissions, ANYONE_CAN_DO_ANYTHING } from '@rocicorp/zero';

const schema = createSchema({
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

const permissions = definePermissions(({ allow }) => {
  allow(ANYONE_CAN_DO_ANYTHING);
});

export default { schema, permissions };

