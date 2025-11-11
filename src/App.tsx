import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Target, Users, Calendar, Menu } from 'lucide-react';
import { useState } from 'react';
import Dashboard from './components/dashboard/Dashboard';
import TasksPage from './components/tasks/TasksPage';
import HabitsPage from './components/habits/HabitsPage';
import ClientsPage from './components/clients/ClientsPage';
import { CalendarPage } from './components/calendar/CalendarPage';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <div className="flex h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-gray-100">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-slate-900/40 backdrop-blur-xl border-r border-white/10 transition-all duration-300 flex flex-col shadow-2xl`}
        >
          <div className="p-4 flex items-center justify-between border-b border-white/10">
            {sidebarOpen && (
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
                Accountability
              </h1>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-all duration-200 hover:scale-110"
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
              to="/calendar"
              icon={<Calendar size={20} />}
              label="AI Calendar"
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
            <Route path="/calendar" element={<CalendarPage />} />
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
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-all duration-200 group hover:translate-x-1"
    >
      <span className="text-gray-400 group-hover:text-blue-400 transition-colors">{icon}</span>
      {!collapsed && (
        <span className="text-gray-300 group-hover:text-white transition-colors font-medium">{label}</span>
      )}
    </Link>
  );
}

export default App;
