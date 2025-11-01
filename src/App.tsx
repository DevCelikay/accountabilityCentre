import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Target, Users, Menu } from 'lucide-react';
import { useState } from 'react';
import Dashboard from './components/dashboard/Dashboard';
import TasksPage from './components/tasks/TasksPage';
import HabitsPage from './components/habits/HabitsPage';
import ClientsPage from './components/clients/ClientsPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex h-screen bg-gray-900 text-gray-100">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-gray-800 border-r border-gray-700 transition-all duration-300 flex flex-col`}
        >
          <div className="p-4 flex items-center justify-between border-b border-gray-700">
            {sidebarOpen && (
              <h1 className="text-xl font-bold text-blue-400">Accountability</h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            <NavLink
              to="/"
              icon={<LayoutDashboard size={20} />}
              label="Dashboard"
              collapsed={!sidebarOpen}
            />
            <NavLink
              to="/tasks"
              icon={<CheckSquare size={20} />}
              label="Tasks"
              collapsed={!sidebarOpen}
            />
            <NavLink
              to="/habits"
              icon={<Target size={20} />}
              label="Habits & Vices"
              collapsed={!sidebarOpen}
            />
            <NavLink
              to="/clients"
              icon={<Users size={20} />}
              label="Clients"
              collapsed={!sidebarOpen}
            />
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/clients" element={<ClientsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  collapsed: boolean;
}

function NavLink({ to, icon, label, collapsed }: NavLinkProps) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-700 transition-colors group"
    >
      <span className="text-gray-400 group-hover:text-blue-400">{icon}</span>
      {!collapsed && (
        <span className="text-gray-300 group-hover:text-gray-100">{label}</span>
      )}
    </Link>
  );
}

export default App;
