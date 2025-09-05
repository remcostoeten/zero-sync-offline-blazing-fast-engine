import 'server-only';
import { getCurrentUser } from './get-current-user';

type TUser = {
  id: number;
  email: string;
  role: string;
  permissions: string[];
};

export async function authorize(operation: string): Promise<TUser> {
  const user = await getCurrentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (!user.permissions.includes(operation)) {
    throw new Error(`Permission denied: ${operation}`);
  }
  
  return user;
}

export async function authorizeCategoryCreate(): Promise<TUser> {
  return authorize('categories:create');
}

export async function authorizeCategoryRead(): Promise<TUser> {
  return authorize('categories:read');
}

export async function authorizeCategoryUpdate(): Promise<TUser> {
  return authorize('categories:update');
}

export async function authorizeCategoryDelete(): Promise<TUser> {
  return authorize('categories:delete');
}
