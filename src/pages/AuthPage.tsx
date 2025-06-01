import { useEffect } from 'react'; // MODIFIED: Removed React default import
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
// REMOVED: import { LogIn } from 'lucide-react'; 

// You can replace this with a proper Google SVG icon if you have one
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    <path d="M1 1h22v22H1z" fill="none" />
  </svg>
);

export default function AuthPage() {
  const { signInWithGoogle, user, authLoading, settings } = useAppContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/'); 
    }
  }, [user, authLoading, navigate]);

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-600 dark:text-slate-300">Loading...</div>
      </div>
    );
  }

  if (user) { 
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen p-4 ${settings.theme === 'dark' ? 'dark bg-slate-950 text-white' : 'bg-slate-100 text-slate-900'}`}>
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <h1 
            className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            FamilyHub
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Sign in to continue to your family dashboard.
          </p>
        </div>

        <button
          onClick={handleSignIn}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 text-md font-medium rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition-all"
        >
          <GoogleIcon />
          Sign in with Google
        </button>
        
        <p className="text-xs text-center text-slate-500 dark:text-slate-400">
          Only authorized family members will be able to access the dashboard content after signing in.
        </p>
      </div>
       <footer className="absolute bottom-4 text-xs text-slate-500 dark:text-slate-400">
        FamilyHub &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}