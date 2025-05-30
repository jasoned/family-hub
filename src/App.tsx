import { supabase } from './supabaseClient';
import { useEffect, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useAppContext } from './context/AppContext';
import { AnimatePresence, motion } from 'framer-motion';
import './index.css';

// Pages
import Dashboard from './pages/Dashboard';
import FamilyMembers from './pages/FamilyMembers';
import Chores from './pages/Chores';
import AppSettings from './pages/Settings';

// Import Calendar page
import CalendarPage from './pages/Calendar';
const ListsPage = () => <div className="p-8">Lists Page (Coming Soon)</div>;
const MealsPage = () => <div className="p-8">Meals Page (Coming Soon)</div>;

export default function App() {
  useEffect(() => {
    async function fetchFamily() {
      const { data, error } = await supabase.from('family_members').select('*');
      if (error) {
        console.error('Supabase error:', error.message);
      } else {
        console.log('Family data:', data);
      }
    }
    fetchFamily();
  }, []);

  const { settings } = useAppContext();
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
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Determine if we should dim the screen (sleep mode)
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

    // Handle overnight sleep periods
    if (sleepStartValue > sleepEndValue) {
      return currentTimeValue >= sleepStartValue || currentTimeValue < sleepEndValue;
    } else {
      return currentTimeValue >= sleepStartValue && currentTimeValue < sleepEndValue;
    }
  };

  return (
    <div
      className={`fixed inset-0 ${settings.theme === 'dark' ? 'dark bg-slate-950 text-white' : 'bg-white text-slate-900'}`}
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div
        className={`flex h-full transition-opacity ${isDimmed() ? 'opacity-30' : 'opacity-100'}`}
      >
        {/* Sidebar - Desktop */}
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

          <div className="p-4 border-t border-gray-100 dark:border-slate-800">
            <NavLink to="/settings" icon={<Settings size={20} />} label="Settings" />
          </div>
        </nav>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 inset-x-0 h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-6 z-30 shadow-sm">
          <h1
            className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent"
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

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute right-0 top-16 bottom-0 w-72 bg-white dark:bg-slate-900 p-4 space-y-2"
                onClick={(e) => e.stopPropagation()}
              >
                <NavLink to="/" icon={<House size={20} />} label="Dashboard" />
                <NavLink to="/family" icon={<Users size={20} />} label="Family Members" />
                <NavLink to="/chores" icon={<SquareCheck size={20} />} label="Chores" />
                <NavLink to="/calendar" icon={<CalendarIcon size={20} />} label="Calendar" />
                <NavLink to="/lists" icon={<List size={20} />} label="Lists" />
                <NavLink to="/meals" icon={<UtensilsCrossed size={20} />} label="Meals" />
                <div className="pt-4 mt-2 border-t border-gray-100 dark:border-slate-800">
                  <NavLink to="/settings" icon={<Settings size={20} />} label="Settings" />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-auto md:pt-0 pt-16 bg-white dark:bg-slate-950 bg-gradient-mesh">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              <Routes location={location}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/family" element={<FamilyMembers />} />
                <Route path="/chores" element={<Chores />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/lists" element={<ListsPage />} />
                <Route path="/meals" element={<MealsPage />} />
                <Route path="/settings" element={<AppSettings />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

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
          ? 'bg-gradient-to-r from-indigo-500/5 to-purple-500/5 text-indigo-600 dark:text-indigo-400 font-medium'
          : 'hover:bg-gray-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300'
      }`}
    >
      <span
        className={
          isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
        }
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}
