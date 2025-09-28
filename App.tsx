import React, { useState, useMemo, useEffect } from 'react';
import { User, Ujian, Hasil } from './types';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ExamView from './components/ExamView';
import ResultsView from './components/ResultsView';

export const AuthContext = React.createContext<{
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
} | null>(null);

export const ThemeContext = React.createContext<{
  theme: 'light' | 'dark';
  toggleTheme: () => void;
} | null>(null);

// FIX: Define a more specific type for an exam that includes details from its question package.
type FormattedUjian = Ujian & { nama_paket: string; mata_pelajaran: string; jumlah_soal: number };

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'exam' | 'results'>('login');
  // FIX: Use the more specific FormattedUjian type for the active exam state.
  const [activeExam, setActiveExam] = useState<FormattedUjian | null>(null);
  const [examResult, setExamResult] = useState<Hasil | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

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
      setUser(null);
      setCurrentView('login');
      setActiveExam(null);
      setExamResult(null);
    },
  }), [user]);

  // FIX: Update the type of the `ujian` parameter to match the data passed from SiswaDashboard.
  const handleStartExam = (ujian: FormattedUjian) => {
    setActiveExam(ujian);
    setCurrentView('exam');
  };

  const handleFinishExam = (result: Hasil) => {
    setExamResult(result);
    setCurrentView('results');
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
        return <Dashboard onStartExam={handleStartExam} />;
      case 'exam':
        if (activeExam && user) {
          // This previously had an error because activeExam was of type Ujian, but now it's FormattedUjian.
          return <ExamView ujian={activeExam} user={user} onFinishExam={handleFinishExam} />;
        }
        return <Dashboard onStartExam={handleStartExam} />; // Fallback
      case 'results':
        if (examResult && activeExam) {
          return <ResultsView result={examResult} exam={activeExam} onBackToDashboard={handleBackToDashboard} />;
        }
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