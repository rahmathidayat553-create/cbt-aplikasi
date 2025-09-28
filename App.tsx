import React, { useState, useMemo, useEffect } from 'react';
import { User, Ujian, Hasil, ActivityType } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ExamView from './components/ExamView';
import ResultsView from './components/ResultsView';
import { logActivity } from './services/api';

export const AuthContext = React.createContext<{
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
} | null>(null);

export const ThemeContext = React.createContext<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
} | null>(null);

// Define a more specific type for an exam that includes details from its question package.
type FormattedUjian = Ujian & { nama_paket: string; mata_pelajaran: string; jumlah_soal: number };

const APP_STATE_KEY = 'cbt-app-session';

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');
    
    // Initialize state from sessionStorage to persist across refreshes
    const [user, setUser] = useState<User | null>(() => {
        try {
            const savedState = sessionStorage.getItem(APP_STATE_KEY);
            return savedState ? JSON.parse(savedState).user : null;
        } catch {
            return null;
        }
    });

    const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'exam' | 'results'>(() => {
        try {
            const savedState = sessionStorage.getItem(APP_STATE_KEY);
            return savedState ? JSON.parse(savedState).currentView : 'login';
        } catch {
            return 'login';
        }
    });

    const [activeExam, setActiveExam] = useState<FormattedUjian | null>(() => {
        try {
            const savedState = sessionStorage.getItem(APP_STATE_KEY);
            const parsed = savedState ? JSON.parse(savedState) : null;
            if (parsed && parsed.activeExam) {
                // Re-hydrate Date objects that are stringified in JSON
                parsed.activeExam.waktu_mulai = new Date(parsed.activeExam.waktu_mulai);
                return parsed.activeExam;
            }
            return null;
        } catch {
            return null;
        }
    });

    const [examResult, setExamResult] = useState<Hasil | null>(() => {
        try {
            const savedState = sessionStorage.getItem(APP_STATE_KEY);
            const parsed = savedState ? JSON.parse(savedState) : null;
            if (parsed && parsed.examResult) {
                 // Re-hydrate Date objects
                parsed.examResult.tanggal = new Date(parsed.examResult.tanggal);
                return parsed.examResult;
            }
            return null;
        } catch {
            return null;
        }
    });

    // Effect to save state to sessionStorage on change
    useEffect(() => {
        if (user && currentView !== 'login') {
            const stateToSave = { user, currentView, activeExam, examResult };
            sessionStorage.setItem(APP_STATE_KEY, JSON.stringify(stateToSave));
        } else {
            // Clear storage if logged out or on login page
            sessionStorage.removeItem(APP_STATE_KEY);
        }
    }, [user, currentView, activeExam, examResult]);


  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const authContextValue = useMemo(() => ({
    user,
    login: (loggedInUser: User) => {
      setUser(loggedInUser);
      setCurrentView('dashboard');
    },
    logout: () => {
      // Log logout activity if it happens during an exam
      if (user && activeExam) {
          logActivity(user.id_user, activeExam.id_ujian, ActivityType.LOGOUT);
      }
      setUser(null);
      setCurrentView('login');
      setActiveExam(null);
      setExamResult(null);
      sessionStorage.removeItem(APP_STATE_KEY); // Clear session on logout
    },
  }), [user, activeExam]);

  const handleStartExam = (ujian: Ujian) => {
    // The object from SiswaDashboard is actually a FormattedUjian.
    // We change the signature here to `Ujian` to fix a props type mismatch in the intermediary Dashboard component,
    // and then cast it back, as we control the input source.
    setActiveExam(ujian as FormattedUjian);
    setCurrentView('exam');
  };

  const handleFinishExam = (result: Hasil) => {
    setExamResult(result);
    setCurrentView('results');
    setActiveExam(null); // Clear active exam after finishing
  };

  const handleBackToDashboard = () => {
    setActiveExam(null);
    setExamResult(null);
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'login':
        return <Login />;
      case 'dashboard':
         if (!user) return <Login />;
        return <Dashboard onStartExam={handleStartExam} />;
      case 'exam':
        if (activeExam && user) {
          return <ExamView ujian={activeExam} user={user} onFinishExam={handleFinishExam} />;
        }
         if (!user) return <Login />;
        return <Dashboard onStartExam={handleStartExam} />; // Fallback
      case 'results':
        if (examResult && user) { // activeExam might be cleared, so we find it from result
          return <ResultsView result={examResult} exam={activeExam as FormattedUjian} onBackToDashboard={handleBackToDashboard} />;
        }
        if (!user) return <Login />;
        return <Dashboard onStartExam={handleStartExam} />; // Fallback
      default:
        return <Login />;
    }
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <ThemeContext.Provider value={{ theme, toggleTheme }}>
        <div className="min-h-screen">
          {renderContent()}
        </div>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
};

export default App;