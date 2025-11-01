import { useState } from 'react';
import { X } from 'lucide-react';
import { Behavior } from '../../types';

interface BehaviorFormProps {
  behavior?: Behavior;
  onSubmit: (data: Omit<Behavior, 'id' | 'createdAt' | 'currentStreak' | 'bestStreak' | 'totalSlipUps'>) => Promise<void>;
  onCancel: () => void;
}

export default function BehaviorForm({ behavior, onSubmit, onCancel }: BehaviorFormProps) {
  const [name, setName] = useState(behavior?.name || '');
  const [type, setType] = useState<'habit' | 'vice'>(behavior?.type || 'habit');
  const [description, setDescription] = useState(behavior?.description || '');
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'custom'>(behavior?.goal.frequency || 'daily');
  const [target, setTarget] = useState(behavior?.goal.target?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        goal: {
          frequency,
          target: target ? parseInt(target) : undefined,
        },
        isActive: true,
        reminderTimes: behavior?.reminderTimes,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save behavior');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {behavior ? 'Edit Behavior' : 'New Behavior'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Type *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('habit')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  type === 'habit'
                    ? 'border-green-500 bg-green-900 bg-opacity-20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-lg mb-1">✅</div>
                <div className="font-medium">Good Habit</div>
                <div className="text-xs text-gray-400">Things to do</div>
              </button>
              <button
                type="button"
                onClick={() => setType('vice')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  type === 'vice'
                    ? 'border-red-500 bg-red-900 bg-opacity-20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <div className="text-lg mb-1">🚫</div>
                <div className="font-medium">Vice</div>
                <div className="text-xs text-gray-400">Things to avoid</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={type === 'habit' ? 'Exercise, Reading, Meditation...' : 'Smoking, Junk food, Procrastination...'}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Why is this important to you?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Goal Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as any)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {frequency === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Times per week
              </label>
              <input
                type="number"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="3"
                min="1"
                max="7"
              />
            </div>
          )}

          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-700 text-red-300 px-3 py-2 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Saving...' : behavior ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
