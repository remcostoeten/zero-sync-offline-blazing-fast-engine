'use client';

import { z } from 'zod';

export type TConflictType = 
  | 'remote_newer'      // Remote data is newer than local
  | 'local_newer'       // Local data is newer than remote  
  | 'both_modified'     // Both local and remote have been modified
  | 'remote_deleted'    // Record deleted on remote but modified locally
  | 'local_deleted'     // Record deleted locally but modified on remote
  | 'field_conflict';   // Specific field conflicts

export type TResolutionStrategy = 
  | 'local_wins'        // Always take local version
  | 'remote_wins'       // Always take remote version
  | 'newest_wins'       // Take the version with newest timestamp
  | 'merge_fields'      // Merge non-conflicting fields
  | 'ask_user'          // Prompt user to resolve
  | 'create_duplicate'; // Create duplicate record

export type TConflictRecord<T = any> = {
  id: string;
  entity: string;
  conflictType: TConflictType;
  localData: T | null;
  remoteData: T | null;
  fieldConflicts?: string[];
  timestamp: Date;
  resolved: boolean;
  resolution?: TResolutionStrategy;
  resolvedData?: T;
};

export type TConflictResolution<T = any> = {
  strategy: TResolutionStrategy;
  resolvedData: T;
  keepBoth?: boolean;
};

function createConflictResolver() {
  const conflicts = new Map<string, TConflictRecord>();
  const resolutionStrategies = new Map<string, TResolutionStrategy>();

  const defaultStrategies: Record<string, TResolutionStrategy> = {
    categories: 'newest_wins',
    transactions: 'merge_fields', 
    budgets: 'ask_user',
    savings_goals: 'newest_wins'
  };

  function detectConflict<T extends Record<string, any>>(
    entity: string,
    localData: T | null,
    remoteData: T | null,
    id: string
  ): TConflictRecord<T> | null {
    if (!localData || !remoteData) {
      return null;
    }

    const localTimestamp = new Date(localData.updatedAt || localData.createdAt);
    const remoteTimestamp = new Date(remoteData.updatedAt || remoteData.createdAt);
    
    const timeDiff = localTimestamp.getTime() - remoteTimestamp.getTime();
    const fieldConflicts: string[] = [];

    const excludeFields = ['id', 'createdAt', 'updatedAt', 'synced'];
    
    for (const key in localData) {
      if (excludeFields.includes(key)) continue;
      
      if (localData[key] !== remoteData[key]) {
        fieldConflicts.push(key);
      }
    }

    let conflictType: TConflictType;
    
    if (fieldConflicts.length === 0) {
      return null;
    }
    
    if (Math.abs(timeDiff) < 1000) {
      conflictType = 'both_modified';
    } else if (timeDiff > 0) {
      conflictType = 'local_newer';
    } else {
      conflictType = 'remote_newer';
    }

    const conflict: TConflictRecord<T> = {
      id: `${entity}_${id}_${Date.now()}`,
      entity,
      conflictType,
      localData,
      remoteData,
      fieldConflicts: fieldConflicts.length > 0 ? fieldConflicts : undefined,
      timestamp: new Date(),
      resolved: false
    };

    conflicts.set(conflict.id, conflict);
    return conflict;
  }

  async function resolveConflict<T extends Record<string, any>>(
    conflictId: string,
    strategy?: TResolutionStrategy
  ): Promise<TConflictResolution<T> | null> {
    const conflict = conflicts.get(conflictId) as TConflictRecord<T>;
    
    if (!conflict || conflict.resolved) {
      return null;
    }

    const resolveStrategy = strategy || 
      resolutionStrategies.get(conflict.entity) ||
      defaultStrategies[conflict.entity] ||
      'newest_wins';

    let resolvedData: T;
    let keepBoth = false;

    switch (resolveStrategy) {
      case 'local_wins':
        resolvedData = conflict.localData!;
        break;

      case 'remote_wins':
        resolvedData = conflict.remoteData!;
        break;

      case 'newest_wins':
        const localTime = new Date(conflict.localData?.updatedAt || 0).getTime();
        const remoteTime = new Date(conflict.remoteData?.updatedAt || 0).getTime();
        resolvedData = localTime > remoteTime ? conflict.localData! : conflict.remoteData!;
        break;

      case 'merge_fields':
        resolvedData = mergeFields(conflict.localData!, conflict.remoteData!);
        break;

      case 'create_duplicate':
        resolvedData = conflict.localData!;
        keepBoth = true;
        break;

      case 'ask_user':
        const localTimestamp = new Date(conflict.localData?.updatedAt || 0).getTime();
        const remoteTimestamp = new Date(conflict.remoteData?.updatedAt || 0).getTime();
        resolvedData = localTimestamp > remoteTimestamp ? conflict.localData! : conflict.remoteData!;
        break;

      default:
        resolvedData = conflict.remoteData!;
    }

    conflict.resolved = true;
    conflict.resolution = resolveStrategy;
    conflict.resolvedData = resolvedData;

    return {
      strategy: resolveStrategy,
      resolvedData,
      keepBoth
    };
  }

  function mergeFields<T extends Record<string, any>>(local: T, remote: T): T {
    const merged = { ...remote };

    const userFields = ['name', 'description', 'amount', 'color', 'icon'];
    const localTimestamp = new Date(local.updatedAt || 0).getTime();
    const remoteTimestamp = new Date(remote.updatedAt || 0).getTime();

    for (const field of userFields) {
      if (field in local && local[field] !== remote[field]) {
        if (localTimestamp > remoteTimestamp) {
          merged[field] = local[field];
        }
      }
    }

    merged.updatedAt = localTimestamp > remoteTimestamp ? local.updatedAt : remote.updatedAt;

    return merged;
  }

  async function resolveAllConflicts(
    defaultStrategy: TResolutionStrategy = 'newest_wins'
  ): Promise<TConflictResolution[]> {
    const resolutions: TConflictResolution[] = [];

    for (const conflict of conflicts.values()) {
      if (!conflict.resolved) {
        const resolution = await resolveConflict(conflict.id, defaultStrategy);
        if (resolution) {
          resolutions.push(resolution);
        }
      }
    }

    return resolutions;
  }

  function getUnresolvedConflicts(): TConflictRecord[] {
    return Array.from(conflicts.values()).filter(c => !c.resolved);
  }

  function getConflictsByEntity(entity: string): TConflictRecord[] {
    return Array.from(conflicts.values()).filter(c => c.entity === entity);
  }

  function setResolutionStrategy(entity: string, strategy: TResolutionStrategy): void {
    resolutionStrategies.set(entity, strategy);
  }

  function clearResolvedConflicts(): void {
    for (const [id, conflict] of conflicts.entries()) {
      if (conflict.resolved) {
        conflicts.delete(id);
      }
    }
  }

  function getConflictStats(): {
    total: number;
    resolved: number;
    unresolved: number;
    byType: Record<TConflictType, number>;
    byEntity: Record<string, number>;
  } {
    const allConflicts = Array.from(conflicts.values());
    
    const stats = {
      total: allConflicts.length,
      resolved: allConflicts.filter(c => c.resolved).length,
      unresolved: allConflicts.filter(c => !c.resolved).length,
      byType: {} as Record<TConflictType, number>,
      byEntity: {} as Record<string, number>
    };

    for (const conflict of allConflicts) {
      stats.byType[conflict.conflictType] = (stats.byType[conflict.conflictType] || 0) + 1;
      stats.byEntity[conflict.entity] = (stats.byEntity[conflict.entity] || 0) + 1;
    }

    return stats;
  }

  async function autoResolveSimpleConflicts(): Promise<number> {
    let resolved = 0;
    
    for (const conflict of conflicts.values()) {
      if (conflict.resolved) continue;

      if (!conflict.fieldConflicts || conflict.fieldConflicts.length === 0) {
        await resolveConflict(conflict.id, 'newest_wins');
        resolved++;
      }
      
      if (conflict.conflictType === 'remote_newer' || conflict.conflictType === 'local_newer') {
        const hasRealConflicts = conflict.fieldConflicts && 
          conflict.fieldConflicts.some(field => !['updatedAt', 'createdAt'].includes(field));
        
        if (!hasRealConflicts) {
          await resolveConflict(conflict.id, 'newest_wins');
          resolved++;
        }
      }
    }

    return resolved;
  }

  return {
    detectConflict,
    resolveConflict,
    resolveAllConflicts,
    getUnresolvedConflicts,
    getConflictsByEntity,
    setResolutionStrategy,
    clearResolvedConflicts,
    getConflictStats,
    autoResolveSimpleConflicts,
  };
}

let conflictResolverInstance: ReturnType<typeof createConflictResolver> | null = null;

export function getConflictResolver() {
  if (!conflictResolverInstance) {
    conflictResolverInstance = createConflictResolver();
  }
  return conflictResolverInstance;
}
