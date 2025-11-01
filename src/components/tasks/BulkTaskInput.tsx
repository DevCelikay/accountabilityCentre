import { useState } from 'react';
import { X, List, Sparkles } from 'lucide-react';
import { Client } from '../../types';
import { parseBulkTaskInput, createTasksFromParsed } from '../../services/taskParser';

interface BulkTaskInputProps {
  clients: Client[];
  defaultClientId?: string;
  onSubmit: (tasks: any[]) => Promise<void>;
  onCancel: () => void;
}

export default function BulkTaskInput({ clients, defaultClientId, onSubmit, onCancel }: BulkTaskInputProps) {
  const [clientId, setClientId] = useState(defaultClientId || clients[0]?.id || '');
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleParse = () => {
    if (!input.trim()) {
      setError('Please enter some tasks');
      return;
    }

    if (!clientId) {
      setError('Please select a client');
      return;
    }

    setError('');
    const parsed = parseBulkTaskInput(input);
    const tasks = createTasksFromParsed(parsed, clientId);
    setPreview(tasks);
    setShowPreview(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tasks');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-600',
      medium: 'bg-yellow-600',
      high: 'bg-orange-600',
      urgent: 'bg-red-600',
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <List size={24} />
              Bulk Add Tasks
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Paste a list of tasks and we'll break them down automatically
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!showPreview ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Client *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a client</option>
                {clients.filter(c => !c.isArchived).map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Tasks (one per line)
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                rows={15}
                placeholder={`- Design homepage mockup [high]
- Implement user authentication
- Write API documentation #backend
- Fix bug in payment flow !!!
- Update dependencies
- Create test cases #testing`}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                <Sparkles size={12} className="inline" /> Smart features: Add [high], [urgent], [low] for priority • Use !!! for urgent, !! for high • Add #tags for categories
              </p>
            </div>

            {error && (
              <div className="bg-red-900 bg-opacity-30 border border-red-700 text-red-300 px-3 py-2 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleParse}
                className="flex-1 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Parse & Preview
              </button>
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Preview: {preview.length} tasks</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {preview.map((task, idx) => (
                  <div key={idx} className="bg-gray-800 p-3 rounded border border-gray-600">
                    <div className="flex items-start gap-3">
                      <span
                        className={`${getPriorityColor(task.priority)} w-1 h-full rounded`}
                      />
                      <div className="flex-1">
                        <p className="text-gray-100">{task.title}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <span className="text-xs px-2 py-0.5 bg-gray-700 rounded text-gray-400">
                            {task.priority}
                          </span>
                          {task.tags.map((tag: string) => (
                            <span key={tag} className="text-xs px-2 py-0.5 bg-blue-900 bg-opacity-30 rounded text-blue-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-900 bg-opacity-30 border border-red-700 text-red-300 px-3 py-2 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {loading ? 'Creating...' : `Create ${preview.length} Tasks`}
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
