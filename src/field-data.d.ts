declare function setupFieldDataDB(): Promise<void>;
declare function recordFieldData(location: string, reading: number, notes?: string): Promise<void>;
declare function getFieldData(): Promise<import("@libsql/client").Row[]>;
declare function getUnsyncedData(): Promise<import("@libsql/client").Row[]>;
declare function forceSync(): Promise<void>;
declare function displayFieldData(): Promise<void>;
export { setupFieldDataDB, recordFieldData, getFieldData, getUnsyncedData, forceSync, displayFieldData };
//# sourceMappingURL=field-data.d.ts.map