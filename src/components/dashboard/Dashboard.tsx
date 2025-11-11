import { useTasks } from '../../hooks/useTasks';
import { useBehaviors } from '../../hooks/useBehaviors';
import { CheckSquare, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { tasks } = useTasks();
  const { behaviors } = useBehaviors();

  // Get today's tasks (due today or overdue)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaysTasks = tasks.filter(t => {
    if (t.status === 'completed') return false;
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate <= today;
  });

  // Get high priority tasks (urgent and high priority, not completed)
  const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
  const highPriorityTasks = tasks
    .filter(t => t.status !== 'completed' && (t.priority === 'urgent' || t.priority === 'high'))
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    .slice(0, 5);

  // Active streaks
  const activeStreaks = behaviors.filter(b => b.isActive && b.currentStreak > 0);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 border-red-400/30 bg-red-500/10';
      case 'high': return 'text-orange-400 border-orange-400/30 bg-orange-500/10';
      case 'medium': return 'text-yellow-400 border-yellow-400/30 bg-yellow-500/10';
      case 'low': return 'text-green-400 border-green-400/30 bg-green-500/10';
      default: return 'text-gray-400 border-gray-400/30 bg-gray-500/10';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-gray-400">Track your progress and stay accountable</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="group bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-blue-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Today's Tasks</h2>
          <p className="text-5xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent">{todaysTasks.length}</p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500">Start your day strong!</p>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-green-500/10 to-emerald-600/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-green-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:-translate-y-1">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Active Streaks</h2>
          <p className="text-5xl font-bold bg-gradient-to-br from-green-400 to-emerald-600 bg-clip-text text-transparent">{activeStreaks.length}</p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500">Keep the momentum going!</p>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-violet-500/10 to-purple-600/5 backdrop-blur-sm p-6 rounded-xl border border-white/10 hover:border-violet-400/50 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 hover:-translate-y-1">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Habits Checked</h2>
          <p className="text-5xl font-bold bg-gradient-to-br from-violet-400 to-purple-600 bg-clip-text text-transparent">0/{behaviors.filter(b => b.isActive).length}</p>
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500">Build your routine!</p>
          </div>
        </div>
      </div>

      {/* High Priority Tasks Section */}
      <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="text-red-400" size={24} />
          <h2 className="text-2xl font-bold text-gray-100">High Priority Tasks</h2>
        </div>

        {highPriorityTasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No high priority tasks. You're all caught up!</p>
        ) : (
          <div className="space-y-3">
            {highPriorityTasks.map(task => (
              <div
                key={task.id}
                className="bg-slate-800/50 rounded-lg p-4 border border-white/5 hover:border-white/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-start gap-3">
                  <CheckSquare className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-gray-100 font-medium mb-1">{task.title}</h3>
                    {task.description && (
                      <p className="text-gray-400 text-sm mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded border ${getPriorityColor(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      <span className="text-xs px-2 py-1 rounded border border-gray-600/30 bg-gray-700/20 text-gray-400">
                        {task.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
