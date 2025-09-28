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

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'dashboard' | 'exam' | 'results'>('login');
  const [activeExam, setActiveExam] = useState<Ujian | null>(null);
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

  const handleStartExam = (ujian: Ujian) => {
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