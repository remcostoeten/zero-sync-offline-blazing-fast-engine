import { createSignal, createEffect, Show, For } from "solid-js";
import { createServerAction$ } from "solid-start/server";
import { createDatabaseConnection, getDatabaseSchema, executeQuery } from "~/db";

interface DatabaseViewerProps {
  connection: any;
}

export default function DatabaseViewer(props: DatabaseViewerProps) {
  const [schema, setSchema] = createSignal<any[]>([]);
  const [query, setQuery] = createSignal("SELECT * FROM information_schema.tables WHERE table_schema = 'public'");
  const [queryResult, setQueryResult] = createSignal<any>(null);
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [selectedTable, setSelectedTable] = createSignal<string | null>(null);

  const executeQueryAction = createServerAction$(async (formData: FormData) => {
    const connectionString = formData.get("connectionString") as string;
    const query = formData.get("query") as string;

    if (!connectionString || !query) {
      throw new Error("Connection string and query are required");
    }

    try {
      const connection = await createDatabaseConnection(connectionString);
      if (!connection.success) {
        throw new Error(connection.error);
      }

      const result = await executeQuery(connection.db, query);
      if (!result.success) {
        throw new Error(result.error);
      }

      return result.result;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Query execution failed");
    }
  });

  const loadSchema = async () => {
    if (!props.connection) return;

    setIsLoading(true);
    setError(null);

    try {
      const connection = await createDatabaseConnection(props.connection.connectionString);
      if (!connection.success) {
        setError(connection.error);
        return;
      }

      const schemaResult = await getDatabaseSchema(connection.db);
      if (!schemaResult.success) {
        setError(schemaResult.error);
        return;
      }

      setSchema(schemaResult.tables);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to load schema");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuerySubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!query()) return;

    const formData = new FormData();
    formData.append("connectionString", props.connection.connectionString);
    formData.append("query", query());

    try {
      const result = await executeQueryAction(formData);
      setQueryResult(result);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Query execution failed");
      setQueryResult(null);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setQuery(`SELECT * FROM "${tableName}" LIMIT 100`);
  };

  createEffect(() => {
    if (props.connection) {
      loadSchema();
    }
  });

  const groupedTables = () => {
    const groups: Record<string, any[]> = {};
    schema().forEach(column => {
      if (!groups[column.table_name]) {
        groups[column.table_name] = [];
      }
      groups[column.table_name].push(column);
    });
    return groups;
  };

  return (
    <div class="database-viewer">
      <div class="viewer-header">
        <div>
          <h2>{props.connection?.name}</h2>
          <p style="color: #666; margin-top: 4px;">Connected to database</p>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <div 
            style={`width: 12px; height: 12px; border-radius: 50%; background-color: ${props.connection?.color};`}
          />
          <span>{props.connection?.name}</span>
        </div>
      </div>

      <div class="viewer-content">
        <div style="display: flex; gap: 20px; height: 100%;">
          {/* Schema Tree */}
          <div style="width: 250px; border-right: 1px solid #e0e0e0; padding-right: 20px;">
            <h3 style="margin-bottom: 16px;">Schema</h3>
            <div class="schema-tree">
              <Show when={!isLoading()} fallback={<div>Loading schema...</div>}>
                <Show when={!error()} fallback={<div style="color: red;">{error()}</div>}>
                  <For each={Object.entries(groupedTables())}>
                    {([tableName, columns]) => (
                      <div class="schema-item">
                        <div 
                          onClick={() => handleTableSelect(tableName)}
                          style="font-weight: 500; margin-bottom: 8px;"
                        >
                          {tableName}
                        </div>
                        <div class="schema-children">
                          <For each={columns}>
                            {(column) => (
                              <div style="font-size: 12px; color: #666; padding: 2px 0;">
                                {column.column_name} ({column.data_type})
                              </div>
                            )}
                          </For>
                        </div>
                      </div>
                    )}
                  </For>
                </Show>
              </Show>
            </div>
          </div>

          {/* Query Editor and Results */}
          <div style="flex: 1; display: flex; flex-direction: column;">
            <div class="query-editor">
              <form onSubmit={handleQuerySubmit}>
                <textarea
                  class="query-input"
                  value={query()}
                  onInput={(e) => setQuery(e.currentTarget.value)}
                  placeholder="Enter your SQL query here..."
                />
                <div style="margin-top: 8px;">
                  <button
                    type="submit"
                    class="btn btn-primary"
                    disabled={executeQueryAction.pending}
                  >
                    {executeQueryAction.pending ? "Executing..." : "Execute Query"}
                  </button>
                </div>
              </form>
            </div>

            <div class="results-table">
              <Show when={error()}>
                <div style="color: red; padding: 16px; background: #ffebee; border-radius: 4px; margin-bottom: 16px;">
                  {error()}
                </div>
              </Show>

              <Show when={queryResult()}>
                <div class="table-container">
                  <table>
                    <thead>
                      <tr>
                        <For each={Object.keys(queryResult()[0] || {})}>
                          {(column) => <th>{column}</th>}
                        </For>
                      </tr>
                    </thead>
                    <tbody>
                      <For each={queryResult()}>
                        {(row) => (
                          <tr>
                            <For each={Object.values(row)}>
                              {(value) => <td>{String(value)}</td>}
                            </For>
                          </tr>
                        )}
                      </For>
                    </tbody>
                  </table>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
