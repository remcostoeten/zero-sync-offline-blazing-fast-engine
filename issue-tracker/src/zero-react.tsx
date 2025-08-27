import { ZeroProvider } from '@rocicorp/zero/react';
import type { PropsWithChildren } from 'react';
import { zero } from './zero';

export function ZeroAppProvider({ children }: PropsWithChildren) {
  return (
    <ZeroProvider zero={zero}>
      {children}
    </ZeroProvider>
  );
}

