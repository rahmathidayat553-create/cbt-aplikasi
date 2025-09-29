import React, { useState, useEffect, useCallback } from 'react';
import { Ujian, ActivityLog, ActivityType } from '../types';
import { getExams, getActivityLogsForExam } from '../services/api';
import { IconArrowLeft, IconLoader, IconActivity } from './icons/Icons';

interface ActivityMonitorProps {
  onBack: () => void;
}

type FormattedUjian = Ujian & { nama_paket: string; mata_pelajaran: string; };

const ActivityMonitor: React.FC<ActivityMonitorProps> = ({ onBack }) => {
  const [view, setView] = useState<'list' | 'details'>('list');
  const [exams, setExams] = useState<FormattedUjian[]>([]);
  const [selectedExam, setSelectedExam] = useState<FormattedUjian | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      const examList = await getExams();
      setExams(examList as FormattedUjian[]);
      setLoading(false);
    };
    fetchExams();
  }, []);

  const handleSelectExam = useCallback(async (exam: FormattedUjian) => {
    setLoading(true);
    setSelectedExam(exam);
    const activityLogs = await getActivityLogsForExam(exam.id_ujian);
    setLogs(activityLogs);
    setView('details');
    setLoading(false);
  }, []);
  
  const handleBackToList = () => {
    setView('list');
    setSelectedExam(null);
    setLogs([]);
  };

  const getActivityLabel = (type: ActivityType) => {
    switch (type) {
      case ActivityType.VISIBILITY_HIDDEN:
        return { text: 'Beralih Tab/Jendela', color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' };
      case ActivityType.FULLSCREEN_EXIT:
        return { text: 'Keluar Layar Penuh', color: 'bg-red-500/20 text-red-600 dark:text-red-400' };
      case ActivityType.BROWSER_UNLOAD:
        return { text: 'Browser Ditutup/Refresh', color: 'bg-orange-500/20 text-orange-600 dark:text-orange-400' };
      case ActivityType.LOGOUT:
        return { text: 'Logout', color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400' };
      default:
        return { text: 'Tidak Dikenal', color: 'bg-slate-500/20 text-slate-600 dark:text-slate-400' };
    }
  };

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center py-10"><IconLoader className="h-8 w-8 animate-spin text-primary-500" /></div>;
    }

    if (view === 'list') {
      return (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Pilih Ujian untuk Dipantau</h3>
          {exams.length > 0 ? exams.map(exam => (
            <button key={exam.id_ujian} onClick={() => handleSelectExam(exam)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              <h4 className="font-bold text-lg text-slate-900 dark:text-white">{exam.nama_paket}</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">{exam.mata_pelajaran}</p>
            </button>
          )) : <p className="text-center text-slate-500 dark:text-slate-400">Tidak ada ujian yang ditemukan.</p>}
        </div>
      );
    }
    
    if (view === 'details' && selectedExam) {
      return (
        <div>
          <button onClick={handleBackToList} className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-4">
            <IconArrowLeft className="h-4 w-4" />
            <span>Kembali ke Daftar Ujian</span>
          </button>
          <h3 className="text-2xl font-bold mb-4">Log Aktivitas: {selectedExam.nama_paket}</h3>
          
          {logs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">Tidak ada aktivitas mencurigakan yang tercatat untuk ujian ini.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Nama Siswa</th>
                    <th className="px-4 py-3">Aktivitas</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300">
                  {logs.map((log) => {
                    const activity = getActivityLabel(log.activity_type);
                    return (
                        <tr key={log.id_log} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                            <td className="px-4 py-3 font-mono text-xs">{log.timestamp.toLocaleString()}</td>
                            <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{log.user?.nama_lengkap || 'Siswa tidak dikenal'}</td>
                            <td className="px-4 py-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${activity.color}`}>
                                    {activity.text}
                                </span>
                            </td>
                        </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }
    return null;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <IconArrowLeft className="h-5 w-5" />
            <span>Kembali ke Dashboard</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center">
            <IconActivity className="h-8 w-8 mr-3"/>
            Aktivitas Peserta Ujian
        </h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default ActivityMonitor;
