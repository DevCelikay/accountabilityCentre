import { CheckCircle2, Circle, Clock, Calendar, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Task, Client } from '../../types';
import { useState } from 'react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: Task;
  client?: Client;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
  onUpdateStatus: (id: string, status: Task['status']) => void;
}

export default function TaskCard({ task, client, onEdit, onDelete, onToggleComplete, onUpdateStatus }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getPriorityColor = () => {
    const colors = {
      low: 'border-green-600 bg-green-900 bg-opacity-10',
      medium: 'border-yellow-600 bg-yellow-900 bg-opacity-10',
      high: 'border-orange-600 bg-orange-900 bg-opacity-10',
      urgent: 'border-red-600 bg-red-900 bg-opacity-10',
    };
    return colors[task.priority];
  };

  const getStatusColor = () => {
    const colors = {
      todo: 'text-gray-400',
      in_progress: 'text-blue-400',
      completed: 'text-green-400',
      blocked: 'text-red-400',
    };
    return colors[task.status];
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className={`bg-gray-800 border-l-4 ${getPriorityColor()} rounded-lg p-4 hover:bg-gray-750 transition-colors relative`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onToggleComplete(task.id)}
          className="mt-0.5 flex-shrink-0"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 size={20} className="text-green-500" />
          ) : (
            <Circle size={20} className="text-gray-500 hover:text-gray-400" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`}>
              {task.title}
            </h3>

            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
            >
              <MoreVertical size={16} />
            </button>
          </div>

          {task.description && (
            <p className="text-sm text-gray-400 mb-2">{task.description}</p>
          )}

          <div className="flex flex-wrap gap-2 items-center text-xs">
            {client && (
              <span
                className="px-2 py-0.5 rounded"
                style={{ backgroundColor: client.color + '30', color: client.color }}
              >
                {client.name}
              </span>
            )}

            <span className={`px-2 py-0.5 bg-gray-700 rounded ${getStatusColor()}`}>
              {task.status.replace('_', ' ')}
            </span>

            <span className="px-2 py-0.5 bg-gray-700 rounded text-gray-400">
              {task.priority}
            </span>

            {task.dueDate && (
              <span className={`px-2 py-0.5 rounded flex items-center gap-1 ${isOverdue ? 'bg-red-900 bg-opacity-30 text-red-400' : 'bg-gray-700 text-gray-400'}`}>
                <Calendar size={12} />
                {format(new Date(task.dueDate), 'MMM d')}
              </span>
            )}

            {task.estimatedTime && (
              <span className="px-2 py-0.5 bg-gray-700 rounded text-gray-400 flex items-center gap-1">
                <Clock size={12} />
                {task.estimatedTime}m
              </span>
            )}

            {task.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 bg-blue-900 bg-opacity-30 rounded text-blue-400">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-4 top-12 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-20 py-1 min-w-[150px]">
            <button
              onClick={() => {
                onEdit(task);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Pencil size={16} />
              Edit
            </button>

            <div className="border-t border-gray-600 my-1" />

            {(['todo', 'in_progress', 'blocked'] as const).map(status => (
              <button
                key={status}
                onClick={() => {
                  onUpdateStatus(task.id, status);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-600 transition-colors text-sm"
              >
                Mark as {status.replace('_', ' ')}
              </button>
            ))}

            <div className="border-t border-gray-600 my-1" />

            <button
              onClick={() => {
                if (confirm('Delete this task?')) {
                  onDelete(task.id);
                }
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-600 transition-colors flex items-center gap-2 text-red-400"
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
