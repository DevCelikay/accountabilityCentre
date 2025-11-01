import { useState } from 'react';
import { X, CheckCircle, XCircle } from 'lucide-react';
import { Behavior } from '../../types';

interface LogEntryModalProps {
  behavior: Behavior;
  onSubmit: (type: 'success' | 'slip_up', notes?: string) => Promise<void>;
  onCancel: () => void;
}

export default function LogEntryModal({ behavior, onSubmit, onCancel }: LogEntryModalProps) {
  const [type, setType] = useState<'success' | 'slip_up'>(behavior.type === 'habit' ? 'success' : 'slip_up');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(type, notes.trim() || undefined);
    } catch (error) {
      console.error('Failed to log entry:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Log Entry</h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-700 rounded-lg p-3">
            <p className="text-sm text-gray-400 mb-1">Tracking</p>
            <p className="font-medium">{behavior.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              What happened? *
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType('success')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  type === 'success'
                    ? 'border-green-500 bg-green-900 bg-opacity-20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <CheckCircle size={24} className="mx-auto mb-2 text-green-500" />
                <div className="font-medium">
                  {behavior.type === 'habit' ? 'Did it!' : "Didn't do it!"}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {behavior.type === 'habit' ? '+1 to streak' : 'Keep it up!'}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setType('slip_up')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  type === 'slip_up'
                    ? 'border-red-500 bg-red-900 bg-opacity-20'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
              >
                <XCircle size={24} className="mx-auto mb-2 text-red-500" />
                <div className="font-medium">
                  {behavior.type === 'habit' ? 'Missed it' : 'Slip-up'}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Streak resets
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder={
                type === 'slip_up'
                  ? 'What triggered it? How were you feeling?'
                  : 'How do you feel? Any insights?'
              }
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 ${
                type === 'success'
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-800'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-800'
              } disabled:cursor-not-allowed px-4 py-2 rounded-lg font-medium transition-colors`}
            >
              {loading ? 'Saving...' : 'Log Entry'}
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
