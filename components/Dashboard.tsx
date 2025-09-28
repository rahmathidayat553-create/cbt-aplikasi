import React, { useContext } from 'react';
import { AuthContext, ThemeContext } from '../App';
import { Ujian } from '../types';
import AdminDashboard from './AdminDashboard';
import GuruDashboard from './GuruDashboard';
import SiswaDashboard from './SiswaDashboard';
import { IconLogout, IconUserCircle, IconSun, IconMoon } from './icons/Icons';
import { Logo } from './Logo';

interface DashboardProps {
  onStartExam: (ujian: Ujian) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onStartExam }) => {
  const auth = useContext(AuthContext);
  const themeContext = useContext(ThemeContext);

  if (!auth || !auth.user || !themeContext) {
    return <div>Loading...</div>;
  }

  const { user, logout } = auth;
  const { theme, toggleTheme } = themeContext;

  const renderRoleDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'guru':
        return <GuruDashboard />;
      case 'siswa':
        return <SiswaDashboard onStartExam={onStartExam} />;
      default:
        return <p>Role tidak dikenali.</p>;
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm shadow-lg sticky top-0 z-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Logo className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">CBT-SIAMAK</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">SMKN 9 Bulukumba</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-right">
                <div className='hidden sm:block'>
                  <p className="font-semibold text-slate-900 dark:text-white">{user.nama_lengkap}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{user.role}{user.kelas ? ` - ${user.kelas}` : ''}</p>
                </div>
                <IconUserCircle className="h-10 w-10 text-slate-400 dark:text-slate-500" />
              </div>
               <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700">
                {theme === 'light' ? <IconMoon className="h-5 w-5" /> : <IconSun className="h-5 w-5" />}
              </button>
              <button
                onClick={logout}
                className="flex items-center space-x-2 bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 text-slate-800 dark:text-white font-bold py-2 px-4 rounded-lg transition-colors"
                aria-label="Logout"
              >
                <IconLogout className="h-5 w-5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderRoleDashboard()}
      </main>
    </div>
  );
};

export default Dashboard;