declare const client: import("@libsql/client").Client;
declare function saveNote(content: string): Promise<void>;
declare function getNotes(): Promise<import("@libsql/client").Row[]>;
declare function displayNotes(): Promise<void>;
export { saveNote, getNotes, displayNotes, client };
//# sourceMappingURL=index.d.ts.map