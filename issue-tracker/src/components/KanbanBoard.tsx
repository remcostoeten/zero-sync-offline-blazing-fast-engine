import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useIssues } from '../hooks/useIssues';
import { useIssueMutations } from '../mutations';
import type { IssueStatus } from '../zero-schema';

const STATUSES: IssueStatus[] = ['backlog', 'in-progress', 'review', 'done'];

export function KanbanBoard() {
  const issues = useIssues({});
  const { updateIssueStatus } = useIssueMutations();

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as IssueStatus;
    await updateIssueStatus(result.draggableId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {STATUSES.map((status) => (
          <Droppable key={status} droppableId={status}>
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{ background: '#f5f5f5', padding: 8, minHeight: 400 }}
              >
                <h3 style={{ textTransform: 'capitalize' }}>{status.replace('-', ' ')}</h3>
                {issues
                  .filter((i) => i.status === status)
                  .map((issue, index) => (
                    <Draggable key={issue.id} draggableId={issue.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            background: 'white',
                            borderRadius: 8,
                            padding: 8,
                            marginBottom: 8,
                            ...provided.draggableProps.style,
                          }}
                        >
                          <div style={{ fontWeight: 600 }}>{issue.title}</div>
                          <div style={{ fontSize: 12, opacity: 0.7 }}>{issue.priority}</div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
}

