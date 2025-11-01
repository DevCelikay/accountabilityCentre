import { Plus, List } from 'lucide-react';
import { useState } from 'react';
import { useTasks } from '../../hooks/useTasks';
import { useClients } from '../../hooks/useClients';
import { Task } from '../../types';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';
import BulkTaskInput from './BulkTaskInput';

export default function TasksPage() {
  const { tasks, loading: tasksLoading, addTask, addManyTasks, updateTask, deleteTask, completeTask } = useTasks();
  const { clients, loading: clientsLoading } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [filterClient, setFilterClient] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const handleSubmit = async (data: Omit<Task, 'id' | 'createdAt'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await addTask(data);
    }
    setShowForm(false);
    setEditingTask(undefined);
  };

  const handleBulkSubmit = async (tasks: Omit<Task, 'id' | 'createdAt'>[]) => {
    await addManyTasks(tasks);
    setShowBulkInput(false);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setShowBulkInput(false);
    setEditingTask(undefined);
  };

  const handleToggleComplete = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      if (task.status === 'completed') {
        await updateTask(id, { status: 'todo', completedAt: undefined });
      } else {
        await completeTask(id);
      }
    }
  };

  const handleUpdateStatus = async (id: string, status: Task['status']) => {
    await updateTask(id, { status });
  };

  const getClientMap = () => {
    const map: Record<string, any> = {};
    clients.forEach(client => {
      map[client.id] = client;
    });
    return map;
  };

  const clientMap = getClientMap();

  const filteredTasks = tasks.filter(task => {
    if (filterClient !== 'all' && task.clientId !== filterClient) return false;
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    return true;
  });

  const groupedTasks = {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
    blocked: filteredTasks.filter(t => t.status === 'blocked'),
  };

  const loading = tasksLoading || clientsLoading;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBulkInput(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
          >
            <List size={20} />
            Bulk Add
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            New Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div>
          <select
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Clients</option>
            {clients.filter(c => !c.isArchived).map(client => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="text-sm text-gray-400 flex items-center ml-auto">
          {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : tasks.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-400 mb-4">No tasks yet. Create your first task!</p>
          <p className="text-sm text-gray-500 mb-4">
            Add tasks one by one or use bulk add to paste multiple tasks at once.
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Create First Task
            </button>
            <button
              onClick={() => setShowBulkInput(true)}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              Bulk Add Tasks
            </button>
          </div>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-400">No tasks match your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* To Do */}
          {groupedTasks.todo.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-gray-300 flex items-center gap-2">
                To Do
                <span className="text-sm bg-gray-700 px-2 py-0.5 rounded">
                  {groupedTasks.todo.length}
                </span>
              </h2>
              <div className="space-y-3">
                {groupedTasks.todo.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    client={clientMap[task.clientId]}
                    onEdit={handleEdit}
                    onDelete={deleteTask}
                    onToggleComplete={handleToggleComplete}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {/* In Progress */}
          {groupedTasks.in_progress.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-blue-400 flex items-center gap-2">
                In Progress
                <span className="text-sm bg-blue-900 bg-opacity-30 px-2 py-0.5 rounded">
                  {groupedTasks.in_progress.length}
                </span>
              </h2>
              <div className="space-y-3">
                {groupedTasks.in_progress.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    client={clientMap[task.clientId]}
                    onEdit={handleEdit}
                    onDelete={deleteTask}
                    onToggleComplete={handleToggleComplete}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Blocked */}
          {groupedTasks.blocked.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-red-400 flex items-center gap-2">
                Blocked
                <span className="text-sm bg-red-900 bg-opacity-30 px-2 py-0.5 rounded">
                  {groupedTasks.blocked.length}
                </span>
              </h2>
              <div className="space-y-3">
                {groupedTasks.blocked.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    client={clientMap[task.clientId]}
                    onEdit={handleEdit}
                    onDelete={deleteTask}
                    onToggleComplete={handleToggleComplete}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {groupedTasks.completed.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3 text-green-400 flex items-center gap-2">
                Completed
                <span className="text-sm bg-green-900 bg-opacity-30 px-2 py-0.5 rounded">
                  {groupedTasks.completed.length}
                </span>
              </h2>
              <div className="space-y-3">
                {groupedTasks.completed.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    client={clientMap[task.clientId]}
                    onEdit={handleEdit}
                    onDelete={deleteTask}
                    onToggleComplete={handleToggleComplete}
                    onUpdateStatus={handleUpdateStatus}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <TaskForm
          task={editingTask}
          clients={clients}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {showBulkInput && (
        <BulkTaskInput
          clients={clients}
          onSubmit={handleBulkSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
