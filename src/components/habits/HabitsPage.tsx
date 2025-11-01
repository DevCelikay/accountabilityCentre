import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useBehaviors } from '../../hooks/useBehaviors';
import { Behavior } from '../../types';
import BehaviorForm from './BehaviorForm';
import BehaviorCard from './BehaviorCard';
import LogEntryModal from './LogEntryModal';

export default function HabitsPage() {
  const { behaviors, loading, addBehavior, updateBehavior, deleteBehavior, logEntry, getTodayStatus } = useBehaviors();
  const [showForm, setShowForm] = useState(false);
  const [editingBehavior, setEditingBehavior] = useState<Behavior | undefined>();
  const [loggingBehavior, setLoggingBehavior] = useState<Behavior | undefined>();
  const [todayStatuses, setTodayStatuses] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadTodayStatuses();
  }, [behaviors]);

  const loadTodayStatuses = async () => {
    const statuses: Record<string, boolean> = {};
    for (const behavior of behaviors) {
      statuses[behavior.id] = await getTodayStatus(behavior.id);
    }
    setTodayStatuses(statuses);
  };

  const handleSubmit = async (data: Omit<Behavior, 'id' | 'createdAt' | 'currentStreak' | 'bestStreak' | 'totalSlipUps'>) => {
    if (editingBehavior) {
      await updateBehavior(editingBehavior.id, data);
    } else {
      await addBehavior(data);
    }
    setShowForm(false);
    setEditingBehavior(undefined);
  };

  const handleLogSubmit = async (type: 'success' | 'slip_up', notes?: string) => {
    if (loggingBehavior) {
      await logEntry(loggingBehavior.id, type, notes);
      setLoggingBehavior(undefined);
      await loadTodayStatuses();
    }
  };

  const handleEdit = (behavior: Behavior) => {
    setEditingBehavior(behavior);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setLoggingBehavior(undefined);
    setEditingBehavior(undefined);
  };

  const habits = behaviors.filter(b => b.type === 'habit' && b.isActive);
  const vices = behaviors.filter(b => b.type === 'vice' && b.isActive);
  const inactive = behaviors.filter(b => !b.isActive);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Habits & Vices</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          New Behavior
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : behaviors.length === 0 ? (
        <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
          <p className="text-gray-400 mb-4">No behaviors tracked yet</p>
          <p className="text-sm text-gray-500 mb-4">
            Start tracking good habits you want to build or vices you want to avoid.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Track Your First Behavior
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Good Habits */}
          {habits.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-green-400 flex items-center gap-2">
                Good Habits
                <span className="text-sm bg-green-900 bg-opacity-30 px-2 py-0.5 rounded">
                  {habits.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {habits.map(behavior => (
                  <BehaviorCard
                    key={behavior.id}
                    behavior={behavior}
                    checkedToday={todayStatuses[behavior.id] || false}
                    onEdit={handleEdit}
                    onDelete={deleteBehavior}
                    onLog={setLoggingBehavior}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Vices to Avoid */}
          {vices.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-red-400 flex items-center gap-2">
                Vices to Avoid
                <span className="text-sm bg-red-900 bg-opacity-30 px-2 py-0.5 rounded">
                  {vices.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vices.map(behavior => (
                  <BehaviorCard
                    key={behavior.id}
                    behavior={behavior}
                    checkedToday={todayStatuses[behavior.id] || false}
                    onEdit={handleEdit}
                    onDelete={deleteBehavior}
                    onLog={setLoggingBehavior}
                  />
                ))}
              </div>
            </div>
          )}

          {habits.length === 0 && vices.length === 0 && inactive.length > 0 && (
            <div className="text-center py-8 text-gray-500">
              All behaviors are inactive. Create a new one to get started!
            </div>
          )}
        </div>
      )}

      {showForm && (
        <BehaviorForm
          behavior={editingBehavior}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      {loggingBehavior && (
        <LogEntryModal
          behavior={loggingBehavior}
          onSubmit={handleLogSubmit}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
