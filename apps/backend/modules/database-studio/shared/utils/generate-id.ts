import { randomUUID } from 'crypto';

export function generateId(): string {
  return randomUUID();
}

export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}


