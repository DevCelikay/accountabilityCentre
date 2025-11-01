import { Plus } from 'lucide-react';

export default function TasksPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Tasks</h1>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
          <Plus size={20} />
          New Task
        </button>
      </div>
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <p className="text-gray-400 text-center py-8">No tasks yet. Create your first task!</p>
      </div>
    </div>
  );
}
