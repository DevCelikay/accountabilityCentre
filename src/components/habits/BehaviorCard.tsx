import { Flame, Award, AlertCircle, Pencil, Trash2, Plus, MoreVertical } from 'lucide-react';
import { Behavior } from '../../types';
import { useState } from 'react';

interface BehaviorCardProps {
  behavior: Behavior;
  checkedToday: boolean;
  onEdit: (behavior: Behavior) => void;
  onDelete: (id: string) => void;
  onLog: (behavior: Behavior) => void;
}

export default function BehaviorCard({ behavior, checkedToday, onEdit, onDelete, onLog }: BehaviorCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getStreakColor = () => {
    if (behavior.currentStreak === 0) return 'text-gray-500';
    if (behavior.currentStreak < 7) return 'text-yellow-500';
    if (behavior.currentStreak < 30) return 'text-orange-500';
    return 'text-green-500';
  };

  const getTypeColor = () => {
    return behavior.type === 'habit'
      ? 'border-green-600 bg-green-900 bg-opacity-10'
      : 'border-red-600 bg-red-900 bg-opacity-10';
  };

  const getTypeIcon = () => {
    return behavior.type === 'habit' ? '✅' : '🚫';
  };

  return (
    <div className={`bg-gray-800 border-l-4 ${getTypeColor()} rounded-lg p-4 hover:bg-gray-750 transition-colors relative`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon()}</span>
          <div>
            <h3 className="font-semibold text-lg">{behavior.name}</h3>
            {behavior.description && (
              <p className="text-sm text-gray-400">{behavior.description}</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 hover:bg-gray-700 rounded transition-colors flex-shrink-0"
        >
          <MoreVertical size={18} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Flame size={16} />
            <span className="text-xs">Current</span>
          </div>
          <p className={`text-2xl font-bold ${getStreakColor()}`}>
            {behavior.currentStreak}
          </p>
          <p className="text-xs text-gray-500">days</p>
        </div>

        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <Award size={16} />
            <span className="text-xs">Best</span>
          </div>
          <p className="text-2xl font-bold text-blue-400">
            {behavior.bestStreak}
          </p>
          <p className="text-xs text-gray-500">days</p>
        </div>

        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center gap-2 text-gray-400 mb-1">
            <AlertCircle size={16} />
            <span className="text-xs">Slip-ups</span>
          </div>
          <p className="text-2xl font-bold text-red-400">
            {behavior.totalSlipUps}
          </p>
          <p className="text-xs text-gray-500">total</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500 capitalize">
          {behavior.goal.frequency}
          {behavior.goal.target && ` (${behavior.goal.target}x/week)`}
        </span>

        <button
          onClick={() => onLog(behavior)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            checkedToday
              ? 'bg-gray-700 text-gray-400 cursor-default'
              : behavior.type === 'habit'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          <Plus size={16} />
          {checkedToday ? 'Logged today' : 'Log'}
        </button>
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
                onEdit(behavior);
                setShowMenu(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <Pencil size={16} />
              Edit
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${behavior.name}"? This will also delete all recorded entries.`)) {
                  onDelete(behavior.id);
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
