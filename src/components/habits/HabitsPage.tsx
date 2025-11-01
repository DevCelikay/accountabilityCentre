import { Plus } from 'lucide-react';

export default function HabitsPage() {
  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Habits & Vices</h1>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors">
          <Plus size={20} />
          New Behavior
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-green-400">Good Habits</h2>
          <p className="text-gray-400 text-center py-8">No habits tracked yet</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Vices to Avoid</h2>
          <p className="text-gray-400 text-center py-8">No vices tracked yet</p>
        </div>
      </div>
    </div>
  );
}
