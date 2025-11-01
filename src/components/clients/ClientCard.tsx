import { Pencil, Trash2, Archive, MoreVertical } from 'lucide-react';
import { Client } from '../../types';
import { useState } from 'react';

interface ClientCardProps {
  client: Client;
  onEdit: (client: Client) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
  taskCount?: number;
}

export default function ClientCard({ client, onEdit, onDelete, onArchive, taskCount = 0 }: ClientCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = () => {
    if (taskCount > 0) {
      alert(`Cannot delete client with ${taskCount} existing task${taskCount !== 1 ? 's' : ''}`);
      return;
    }
    if (confirm(`Are you sure you want to delete "${client.name}"?`)) {
      onDelete(client.id);
    }
  };

  const handleArchive = () => {
    if (confirm(`Archive "${client.name}"?`)) {
      onArchive(client.id);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors relative">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: client.color }}
          />
          <h3 className="font-semibold text-lg">{client.name}</h3>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg z-20 py-1 min-w-[150px]">
                <button
                  onClick={() => {
                    onEdit(client);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleArchive();
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-600 transition-colors flex items-center gap-2"
                >
                  <Archive size={16} />
                  Archive
                </button>
                <button
                  onClick={() => {
                    handleDelete();
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
      </div>

      {client.description && (
        <p className="text-gray-400 text-sm mb-3">{client.description}</p>
      )}

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {taskCount} task{taskCount !== 1 ? 's' : ''}
        </span>
        <span className="text-gray-500 text-xs">
          {client.isArchived && '(Archived)'}
        </span>
      </div>
    </div>
  );
}
