import React from 'react'; // Keep React import for JSX.Element and React.MouseEvent
import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  House,
  List,
  Menu,
  Settings,
  SquareCheck,
  Users,
  UtensilsCrossed,
  X,
  LogOut,
} from 'lucide-react';
import { useAppContext } from './context';
import { AnimatePresence, motion } from 'framer-motion';
import './index.css';

// Import DevTools in development only
const DevTools = process.env.NODE_ENV === 'development' 
  ? React.lazy(() => import('./components/DevTools')) 
  : () => null;

// Pages
import Dashboard from './pages/Dashboard';
import FamilyMembers from './pages/FamilyMembers';
import Chores from './pages/Chores';
import AppSettings from './pages/Settings';
import CalendarPage from './pages/Calendar';
import ListsPage from './pages/ListsPage';
import AuthPage from './pages/AuthPage';

const MealsPage = () => <div className="p-8">Meals Page (Coming Soon)</div>;

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { user, authLoading } = useAppContext();
  const location = useLocation();

  // Bypass auth loading and user check in development
  if (process.env.NODE_ENV === 'development') {
    return children;
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen text-slate-600 dark:text-slate-300">
        Loading FamilyHub...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  const { settings, user, authLoading, signOut } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const link = document.createElement('link');
    link.href =
      'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); 

    return () => {
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setIsMobileMenuOpen(false);
    }
  }, [location.pathname, user]);

  const isDimmed = () => {
    if (!settings.sleepMode) return false;
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeValue = currentHour * 60 + currentMinute;
    const [sleepStartHour, sleepStartMinute] = settings.sleepStart.split(':').map(Number);
    const [sleepEndHour, sleepEndMinute] = settings.sleepEnd.split(':').map(Number);
    const sleepStartValue = sleepStartHour * 60 + sleepStartMinute;
    const sleepEndValue = sleepEndHour * 60 + sleepEndMinute;

    if (sleepStartValue > sleepEndValue) {
      return currentTimeValue >= sleepStartValue || currentTimeValue < sleepEndValue;
    } else {
      return currentTimeValue >= sleepStartValue && currentTimeValue < sleepEndValue;
    }
  };
  
  if (authLoading && !user && location.pathname !== "/auth") {
    return (
      <div className={`fixed inset-0 flex items-center justify-center ${settings.theme === 'dark' ? 'dark bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
        Loading FamilyHub...
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 ${settings.theme === 'dark' ? 'dark bg-slate-950 text-white' : 'bg-white text-slate-900'}`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div
        className={`flex h-full transition-opacity duration-500 ${isDimmed() && user ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
      >
        {user && (
          <nav className="hidden md:flex flex-col w-72 h-full dark:bg-slate-900 bg-white border-r border-gray-50 dark:border-slate-800 shadow-sm">
            <div className="p-6 flex items-center justify-center">
              <h1
                className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                FamilyHub
              </h1>
            </div>
            <div className="flex flex-col flex-1 p-4 space-y-2">
              <NavLink to="/" icon={<House size={20} />} label="Dashboard" />
              <NavLink to="/family" icon={<Users size={20} />} label="Family Members" />
              <NavLink to="/chores" icon={<SquareCheck size={20} />} label="Chores" />
              <NavLink to="/calendar" icon={<CalendarIcon size={20} />} label="Calendar" />
              <NavLink to="/lists" icon={<List size={20} />} label="Lists" />
              <NavLink to="/meals" icon={<UtensilsCrossed size={20} />} label="Meals" />
            </div>
            <div className="p-4 mt-auto border-t border-gray-100 dark:border-slate-800">
              <NavLink to="/settings" icon={<Settings size={20} />} label="Settings" />
              <button
                onClick={signOut}
                className="flex items-center space-x-3 px-4 py-2.5 rounded-xl w-full text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-all duration-200 mt-1"
              >
                <LogOut size={20} className="text-slate-500 dark:text-slate-400" />
                <span>Logout</span>
              </button>
            </div>
          </nav>
        )}

        {user && (
          <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-6 z-30 shadow-sm">
            <h1
              className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              FamilyHub
            </h1>
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition duration-200"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        )}

        {user && (
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-50 backdrop-blur-sm pt-16" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-xl" 
                  onClick={(e: React.MouseEvent) => e.stopPropagation()} // <-- FIXED: Added React.MouseEvent type for 'e'
                >
                  <NavLink to="/" icon={<House size={20} />} label="Dashboard" />
                  <NavLink to="/family" icon={<Users size={20} />} label="Family Members" />
                  <NavLink to="/chores" icon={<SquareCheck size={20} />} label="Chores" />
                  <NavLink to="/calendar" icon={<CalendarIcon size={20} />} label="Calendar" />
                  <NavLink to="/lists" icon={<List size={20} />} label="Lists" />
                  <NavLink to="/meals" icon={<UtensilsCrossed size={20} />} label="Meals" />
                  <div className="pt-4 mt-2 border-t border-gray-100 dark:border-slate-800">
                    <NavLink to="/settings" icon={<Settings size={20} />} label="Settings" />
                     <button
                        onClick={() => { signOut(); setIsMobileMenuOpen(false);}} 
                        className="flex items-center space-x-3 px-4 py-2.5 rounded-xl w-full text-left hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300 transition-all duration-200 mt-1"
                    >
                        <LogOut size={20} className="text-slate-500 dark:text-slate-400" />
                        <span>Logout</span>
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        
        <main className={`flex-1 overflow-y-auto ${user && 'md:pt-0 pt-16'} ${!user && 'pt-0'}`}>
            <AnimatePresence mode="wait">
                <motion.div
                key={location.pathname + (user ? user.id : 'no-user')} 
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full" 
                >
                <Routes>
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/family" element={<ProtectedRoute><FamilyMembers /></ProtectedRoute>} />
                    <Route path="/chores" element={<ProtectedRoute><Chores /></ProtectedRoute>} />
                    <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                    <Route path="/lists" element={<ProtectedRoute><ListsPage /></ProtectedRoute>} />
                    <Route path="/meals" element={<ProtectedRoute><MealsPage /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><AppSettings /></ProtectedRoute>} />
                    <Route path="*" element={user ? <Navigate to="/" replace /> : <Navigate to="/auth" replace />} />
                </Routes>
                </motion.div>
            </AnimatePresence>
        </main>
      </div>
      <React.Suspense fallback={null}>
        <DevTools />
      </React.Suspense>
    </div>
  );
};

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function NavLink({ to, icon, label }: NavLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

  return (
    <Link
      to={to}
      className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
        isActive
          ? 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 font-medium ring-1 ring-indigo-500/30'
          : 'hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-600 dark:text-slate-300'
      }`}
    >
      <span
        className={
          isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
        }
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}