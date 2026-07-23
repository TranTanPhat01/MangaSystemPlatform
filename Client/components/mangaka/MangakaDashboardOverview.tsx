import { TaskItem } from './TaskTable';

interface Props {
  triggerModal: (title: string, content: string) => void;
  handleTaskAction: (taskId: string, action: string) => void;
  filteredTasks: TaskItem[];
}

export default function MangakaDashboardOverview({
  triggerModal,
  handleTaskAction,
  filteredTasks,
}: Props) {
  return (
    <section>
      <h1>Manga Creation Workflow</h1>
      <button onClick={() => triggerModal('New Series', 'Use the Series workspace.')}>
        New Series
      </button>
      {filteredTasks.length === 0 ? (
        <p>No task data is available.</p>
      ) : (
        <ul>
          {filteredTasks.map((task) => (
            <li key={task.id}>
              <span>Task {task.id}</span>
              <button onClick={() => handleTaskAction(task.id, 'open')}>Open</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
