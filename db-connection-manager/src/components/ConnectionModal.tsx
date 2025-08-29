import { createSignal, createEffect } from "solid-js";
import { createServerAction$ } from "solid-start/server";
import { db } from "~/db";
import { connections } from "~/db/schema";
import { createDatabaseConnection } from "~/db";

interface ConnectionModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function ConnectionModal(props: ConnectionModalProps) {
  const [name, setName] = createSignal("");
  const [color, setColor] = createSignal("#2196f3");
  const [connectionString, setConnectionString] = createSignal("");
  const [testResult, setTestResult] = createSignal<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = createSignal(false);

  const saveConnection = createServerAction$(async (formData: FormData) => {
    const name = formData.get("name") as string;
    const color = formData.get("color") as string;
    const connectionString = formData.get("connectionString") as string;

    if (!name || !color || !connectionString) {
      throw new Error("All fields are required");
    }

    try {
      await db.insert(connections).values({
        name,
        color,
        connectionString,
      });
      return { success: true };
    } catch (error) {
      throw new Error("Failed to save connection");
    }
  });

  const testConnection = async () => {
    if (!connectionString()) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      const result = await createDatabaseConnection(connectionString());
      setTestResult({
        success: result.success,
        message: result.success ? "Connection successful!" : result.error || "Connection failed"
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Connection failed"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    
    if (!name() || !color() || !connectionString()) {
      setTestResult({
        success: false,
        message: "All fields are required"
      });
      return;
    }

    const formData = new FormData();
    formData.append("name", name());
    formData.append("color", color());
    formData.append("connectionString", connectionString());

    try {
      await saveConnection(formData);
      props.onSaved();
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to save connection"
      });
    }
  };

  return (
    <div class="modal" onClick={props.onClose}>
      <div class="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style="margin-bottom: 20px;">Add Database Connection</h2>
        
        <form onSubmit={handleSubmit}>
          <div class="form-group">
            <label for="name">Connection Name</label>
            <input
              id="name"
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              placeholder="My Database"
              required
            />
          </div>

          <div class="form-group">
            <label for="color">Color</label>
            <input
              id="color"
              type="color"
              value={color()}
              onInput={(e) => setColor(e.currentTarget.value)}
              class="color-picker"
            />
          </div>

          <div class="form-group">
            <label for="connectionString">Connection String</label>
            <textarea
              id="connectionString"
              value={connectionString()}
              onInput={(e) => setConnectionString(e.currentTarget.value)}
              placeholder="postgresql://username:password@host:port/database"
              required
            />
          </div>

          <div style="margin-bottom: 16px;">
            <button
              type="button"
              class="btn btn-secondary"
              onClick={testConnection}
              disabled={isTesting() || !connectionString()}
              style="margin-right: 8px;"
            >
              {isTesting() ? "Testing..." : "Test Connection"}
            </button>
            
            <Show when={testResult()}>
              <span style={`color: ${testResult()?.success ? "green" : "red"}; font-size: 14px;`}>
                {testResult()?.message}
              </span>
            </Show>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <button
              type="button"
              class="btn btn-secondary"
              onClick={props.onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              disabled={saveConnection.pending}
            >
              {saveConnection.pending ? "Saving..." : "Save Connection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
