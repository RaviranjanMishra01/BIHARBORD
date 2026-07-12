import { useState } from 'react';
import { Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import {
  LayoutDashboard,
  GraduationCap,
  Trophy,
  LineChart,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Flame
} from 'lucide-react';

const StudentLayout = () => {
  const location = useLocation();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect admins who accidentally try to access student routes
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Tests', path: '/student/tests', icon: GraduationCap },
    { name: 'Leaderboard', path: '/student/leaderboard', icon: Trophy },
    { name: 'Progress Analytics', path: '/student/progress', icon: LineChart },
    { name: 'Profile Settings', path: '/student/profile', icon: User }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex transition-colors duration-200">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex md:w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="p-6 flex items-center justify-between">
          <Link to="/student/dashboard" className="flex items-center gap-2">
            <span className="bg-primary-600 text-white p-1.5 rounded-lg">
              <GraduationCap className="w-5 h-5" />
            </span>
            <span className="font-bold text-lg tracking-tight">Student Portal</span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
          {/* User profile brief */}
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300">
              {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h4 className="text-xs font-semibold truncate">{user.fullName}</h4>
              <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/20 transition-all duration-150"
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar (Drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)}></div>
          
          <aside className="relative flex w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <Link to="/student/dashboard" className="flex items-center gap-2">
                <span className="bg-primary-600 text-white p-1.5 rounded-lg">
                  <GraduationCap className="w-5 h-5" />
                </span>
                <span className="font-bold text-lg">Student Portal</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-2">
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/20 transition-all duration-150"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md bg-white/95 dark:bg-gray-900/95">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-150 dark:hover:bg-gray-850"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* School display on desktop */}
            <span className="hidden sm:inline-block text-xs font-semibold bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full text-gray-600 dark:text-gray-300">
              🏫 {user.schoolName || 'BSEB Class 10 Candidate'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak Counter */}
            <div className="flex items-center gap-1.5 text-warning-600 bg-warning-50 dark:bg-warning-700/20 px-3 py-1.5 rounded-full text-xs font-bold border border-warning-200 dark:border-warning-900/50">
              <Flame className="w-4 h-4 fill-warning-600" />
              <span>{user.streak || 0} Day Streak</span>
            </div>

            {/* Dark Mode Switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-850 transition-colors"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-slate-700" />}
            </button>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default StudentLayout;
