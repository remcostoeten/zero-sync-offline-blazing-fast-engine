import { Zero } from '@rocicorp/zero';
import { schema } from './zero-schema';

export type AppSchema = typeof schema;

export const zero = new Zero<AppSchema>({
  schema,
  // In dev we can run without a server; set to null for local-only demo.
  server: null,
  userID: 'demo-user',
  storageKey: 'issue-tracker',
});

