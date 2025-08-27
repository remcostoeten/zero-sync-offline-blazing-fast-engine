import { Zero } from '@rocicorp/zero';
import { schema } from './zero-schema';

export type AppSchema = typeof schema;

export const zero = new Zero<AppSchema>({
  schema,
  server: import.meta.env.VITE_ZERO_SERVER ?? 'http://localhost:4848',
  userID: 'demo-user',
  storageKey: 'issue-tracker',
});

