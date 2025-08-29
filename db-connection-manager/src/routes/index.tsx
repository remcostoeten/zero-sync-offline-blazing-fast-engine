import { createSignal, createEffect, Show, For } from "solid-js";
import { createServerData$ } from "solid-start/server";
import { db } from "~/db";
import { connections } from "~/db/schema";
import { eq } from "drizzle-orm";
import ConnectionModal from "~/components/ConnectionModal";
import DatabaseViewer from "~/components/DatabaseViewer";

export default function Home() {
  const [showModal, setShowModal] = createSignal(false);
  const [selectedConnection, setSelectedConnection] = createSignal<any>(null);
  const [isConnected, setIsConnected] = createSignal(false);

  const connectionsData = createServerData$(async () => {
    try {
      const result = await db.select().from(connections).orderBy(connections.createdAt);
      return result;
    } catch (error) {
      console.error("Error fetching connections:", error);
      return [];
    }
  });

  const handleConnectionSelect = async (connection: any) => {
    setSelectedConnection(connection);
    setIsConnected(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
  };

  const handleConnectionSaved = () => {
    setShowModal(false);
    connectionsData.refetch();
  };

  return (
    <div class="container">
      <div class="sidebar">
        <div style="padding: 16px; border-bottom: 1px solid #e0e0e0;">
          <h2 style="margin-bottom: 16px;">Database Connections</h2>
          <button 
            class="btn btn-primary" 
            onClick={() => setShowModal(true)}
            style="width: 100%;"
          >
            + Add Connection
          </button>
        </div>
        
        <div>
          <For each={connectionsData()}>
            {(connection) => (
              <div 
                class="connection-item"
                classList={{ active: selectedConnection()?.id === connection.id }}
                onDblClick={() => handleConnectionSelect(connection)}
              >
                <div style="display: flex; align-items: center; gap: 8px;">
                  <div 
                    style={`width: 12px; height: 12px; border-radius: 50%; background-color: ${connection.color};`}
                  />
                  <span>{connection.name}</span>
                </div>
              </div>
            )}
          </For>
        </div>
      </div>

      <div class="main-content">
        <Show 
          when={isConnected() && selectedConnection()} 
          fallback={
            <div style="text-align: center; padding: 40px; color: #666;">
              <h3>Select a database connection</h3>
              <p>Double-click on a connection in the sidebar to connect and view the database.</p>
            </div>
          }
        >
          <DatabaseViewer connection={selectedConnection()} />
        </Show>
      </div>

      <Show when={showModal()}>
        <ConnectionModal 
          onClose={handleModalClose}
          onSaved={handleConnectionSaved}
        />
      </Show>
    </div>
  );
}
