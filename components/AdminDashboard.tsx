import React, { useState } from 'react';
import { IconUserPlus, IconUsers, IconChartBar, IconDatabase, IconPanelRightOpen, IconPanelRightClose } from './icons/Icons';
import UserManagement from './UserManagement';

const AdminDashboard: React.FC = () => {
  const [view, setView] = useState<'main' | 'user_management'>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const stats = [
    { name: 'Total Siswa', value: '150', icon: IconUsers },
    { name: 'Total Guru', value: '15', icon: IconUsers },
    { name: 'Ujian Aktif', value: '3', icon: IconChartBar },
  ];

  if (view === 'user_management') {
    return <UserManagement onBack={() => setView('main')} />;
  }

  const sidebarContent = (
    <>
      <h3 className="text-xl font-bold mb-4">Aksi Cepat</h3>
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => setView('user_management')}
          className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors aspect-square">
          <IconUserPlus className="h-8 w-8 mb-2" />
          <span className="text-center text-sm">Tambah User</span>
        </button>
        <button 
          onClick={() => setView('user_management')}
          className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors aspect-square">
          <IconUsers className="h-8 w-8 mb-2" />
          <span className="text-center text-sm">Manajemen User</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors aspect-square">
          <IconChartBar className="h-8 w-8 mb-2" />
          <span className="text-center text-sm">Lihat Laporan</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors aspect-square">
          <IconDatabase className="h-8 w-8 mb-2" />
          <span className="text-center text-sm">Backup Data</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex gap-8">
      <main className="flex-1">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Admin</h2>
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors md:hidden"
                aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
            >
                {isSidebarOpen ? <IconPanelRightClose className="h-6 w-6" /> : <IconPanelRightOpen className="h-6 w-6" />}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat) => (
            <div key={stat.name} className="bg-white dark:bg-slate-800 rounded-xl p-6 flex items-center space-x-4 shadow-lg">
                <div className="bg-primary-500/20 p-3 rounded-full">
                    <stat.icon className="h-6 w-6 text-primary-500 dark:text-primary-400" />
                </div>
                <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{stat.name}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                </div>
            </div>
            ))}
        </div>
      </main>
      
      <aside className={`transition-all duration-300 w-72 ${isSidebarOpen ? 'ml-0' : '-mr-72 ml-4'}`}>
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 shadow-lg h-full">
          {sidebarContent}
        </div>
      </aside>
    </div>
  );
};

export default AdminDashboard;
