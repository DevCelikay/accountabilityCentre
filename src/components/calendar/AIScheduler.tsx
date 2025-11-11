import { useState } from 'react';
import { X, Bot, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { api, TaskToSchedule } from '../../services/api';
import { Task } from '../../types';
import { format } from 'date-fns';

interface AISchedulerProps {
  tasks: Task[];
  onClose: () => void;
  onScheduled: () => void;
}

export function AIScheduler({ tasks, onClose, onScheduled }: AISchedulerProps) {
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [scheduling, setScheduling] = useState(false);
  const [results, setResults] = useState<{
    scheduled: Array<{ task: Task; time: string; reasoning: string }>;
    failed: Array<{ task: Task; reason: string }>;
  } | null>(null);
  const [optimizeFor, setOptimizeFor] = useState<'priority' | 'deadline' | 'balance'>('priority');
  const [timeWindow, setTimeWindow] = useState<'today' | 'week' | 'month'>('week');

  const toggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedTasks(newSelected);
  };

  const selectAll = () => {
    setSelectedTasks(new Set(tasks.map(t => t.id)));
  };

  const clearAll = () => {
    setSelectedTasks(new Set());
  };

  const handleSchedule = async () => {
    try {
      setScheduling(true);

      const tasksToSchedule: TaskToSchedule[] = tasks
        .filter(t => selectedTasks.has(t.id))
        .map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          estimated_time: t.estimatedTime || 30,
          due_date: t.dueDate?.toISOString(),
          tags: t.tags,
          client_name: undefined, // Would need to fetch client name
        }));

      const response = await api.bulkScheduleTasks(
        tasksToSchedule,
        optimizeFor,
        timeWindow
      );

      // Parse results
      const scheduled = response.scheduled_tasks.map(result => {
        const task = tasks.find(t => t.id === result.task_id)!;
        return {
          task,
          time: format(new Date(result.scheduled_start), 'EEE, MMM d @ h:mm a'),
          reasoning: result.reasoning,
        };
      });

      const failed = response.unscheduled_tasks.map(result => {
        const task = tasks.find(t => t.id === result.task_id)!;
        return {
          task,
          reason: result.reason,
        };
      });

      setResults({ scheduled, failed });

      // Show summary
      if (scheduled.length > 0) {
        setTimeout(() => {
          onScheduled();
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to schedule tasks:', error);
      alert('Failed to schedule tasks. Please try again.');
    } finally {
      setScheduling(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Scheduler</h2>
              <p className="text-sm text-gray-400">
                Let AI schedule {tasks.length} unscheduled task{tasks.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Results View */}
        {results ? (
          <div className="p-6 overflow-y-auto flex-1">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-semibold text-white">
                  Successfully Scheduled ({results.scheduled.length})
                </h3>
              </div>
              <div className="space-y-2">
                {results.scheduled.map(({ task, time, reasoning }) => (
                  <div
                    key={task.id}
                    className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg"
                  >
                    <div className="font-semibold text-white">{task.title}</div>
                    <div className="text-sm text-green-400 mt-1">{time}</div>
                    <div className="text-xs text-gray-400 mt-2">{reasoning}</div>
                  </div>
                ))}
              </div>
            </div>

            {results.failed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-white">
                    Could Not Schedule ({results.failed.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {results.failed.map(({ task, reason }) => (
                    <div
                      key={task.id}
                      className="p-4 bg-orange-900/20 border border-orange-500/30 rounded-lg"
                    >
                      <div className="font-semibold text-white">{task.title}</div>
                      <div className="text-sm text-orange-400 mt-1">{reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Configuration */}
            <div className="p-6 border-b border-white/10 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Optimize For</label>
                  <select
                    value={optimizeFor}
                    onChange={(e) => setOptimizeFor(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-white/10"
                  >
                    <option value="priority">Priority</option>
                    <option value="deadline">Deadline</option>
                    <option value="balance">Balance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Time Window</label>
                  <select
                    value={timeWindow}
                    onChange={(e) => setTimeWindow(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-white/10"
                  >
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {selectedTasks.size} of {tasks.length} selected
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAll}
                    className="px-3 py-1 text-sm text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={clearAll}
                    className="px-3 py-1 text-sm text-gray-400 hover:bg-slate-800 rounded transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>

            {/* Task List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-2">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedTasks.has(task.id)
                        ? 'bg-blue-900/20 border-blue-500/50'
                        : 'bg-slate-800/50 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedTasks.has(task.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-600'
                      }`}>
                        {selectedTasks.has(task.id) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{task.title}</div>
                        {task.description && (
                          <div className="text-sm text-gray-400 mt-1">
                            {task.description}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className={getPriorityColor(task.priority)}>
                            {task.priority}
                          </span>
                          {task.estimatedTime && (
                            <span className="text-gray-500">
                              {task.estimatedTime}min
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="text-gray-500">
                              Due: {format(task.dueDate, 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                disabled={selectedTasks.size === 0 || scheduling}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {scheduling ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    Schedule {selectedTasks.size} Task{selectedTasks.size !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
