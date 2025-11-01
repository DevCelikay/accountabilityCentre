export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">Today's Tasks</h2>
          <p className="text-3xl font-bold text-blue-400">0</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">Active Streaks</h2>
          <p className="text-3xl font-bold text-green-400">0</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h2 className="text-lg font-semibold text-gray-300 mb-2">Habits Checked</h2>
          <p className="text-3xl font-bold text-purple-400">0/0</p>
        </div>
      </div>
    </div>
  );
}
