import React, { useState, useEffect, useContext, useMemo } from 'react';
import { getAvailableExams, verifyToken } from '../services/api';
import { Ujian } from '../types';
import { AuthContext } from '../App';
import { IconKey, IconLoader, IconArrowRight, IconClock, IconBookOpen, IconFilter } from './icons/Icons';

type FormattedUjian = Ujian & { nama_paket: string; mata_pelajaran: string; jumlah_soal: number };

interface SiswaDashboardProps {
  onStartExam: (ujian: FormattedUjian) => void;
}

type ExamStatus = 'all' | 'upcoming' | 'ongoing' | 'finished';

const SiswaDashboard: React.FC<SiswaDashboardProps> = ({ onStartExam }) => {
  const [exams, setExams] = useState<FormattedUjian[]>([]);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);
  const auth = useContext(AuthContext);

  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<ExamStatus>('all');

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      const availableExams = await getAvailableExams();
      setExams(availableExams);
      setLoading(false);
    };
    fetchExams();
  }, []);
  
  const subjects = useMemo(() => {
    const uniqueSubjects = new Set(exams.map(exam => exam.mata_pelajaran));
    return ['all', ...Array.from(uniqueSubjects)];
  }, [exams]);

  const getExamStatus = (exam: FormattedUjian): 'upcoming' | 'ongoing' | 'finished' => {
      const now = new Date().getTime();
      const startTime = new Date(exam.waktu_mulai).getTime();
      const endTime = startTime + exam.durasi * 60 * 1000;

      if (now < startTime) return 'upcoming';
      if (now >= startTime && now <= endTime) return 'ongoing';
      return 'finished';
  };

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
        const subjectMatch = subjectFilter === 'all' || exam.mata_pelajaran === subjectFilter;
        if (!subjectMatch) return false;

        if (statusFilter === 'all') return true;
        
        return getExamStatus(exam) === statusFilter;
    });
  }, [exams, subjectFilter, statusFilter]);

  const handleJoinExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setJoinLoading(true);
    try {
      const exam = await verifyToken(token);
      if (exam) {
        onStartExam(exam as FormattedUjian);
      } else {
        setError('Token tidak valid atau ujian tidak aktif.');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setJoinLoading(false);
    }
  };

  const statusBadges: Record<'upcoming' | 'ongoing' | 'finished', {text: string, className: string}> = {
      upcoming: { text: 'Akan Datang', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' },
      ongoing: { text: 'Sedang Berlangsung', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 animate-pulse' },
      finished: { text: 'Selesai', className: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300' }
  };

  return (
    <div>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 md:p-8 shadow-lg mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Selamat Datang, {auth?.user?.nama_lengkap}!</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Masukkan token untuk memulai ujian atau lihat daftar ujian di bawah.</p>
      </div>

      <div className="lg:col-span-1 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg max-w-md mx-auto">
          <h3 className="text-xl font-bold mb-4 flex items-center justify-center"><IconKey className="h-6 w-6 mr-2 text-primary-500"/> Masukkan Token Ujian</h3>
          <form onSubmit={handleJoinExam}>
            <input
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value.toUpperCase())}
              placeholder="TOKENUJIAN"
              className="text-center tracking-widest font-mono input-field mb-4"
            />
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={joinLoading || !token}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center disabled:opacity-50"
            >
              {joinLoading ? <IconLoader className="animate-spin h-5 w-5" /> : <>Mulai Ujian <IconArrowRight className="h-5 w-5 ml-2"/></>}
            </button>
          </form>
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold mb-4">Daftar Ujian Anda</h3>

          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex-1">
                  <label htmlFor="subject-filter" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center mb-1"><IconFilter className="h-4 w-4 mr-1"/> Mata Pelajaran</label>
                  <select id="subject-filter" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} className="input-field w-full">
                      {subjects.map(sub => <option key={sub} value={sub}>{sub === 'all' ? 'Semua Mata Pelajaran' : sub}</option>)}
                  </select>
              </div>
              <div className="flex-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-2">Status Ujian</label>
                  <div className="flex space-x-2">
                    {(['all', 'upcoming', 'ongoing', 'finished'] as ExamStatus[]).map(status => (
                      <button key={status} onClick={() => setStatusFilter(status)} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${statusFilter === status ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500'}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
              </div>
          </div>

          {loading ? (
             <div className="text-center py-10"><IconLoader className="h-8 w-8 animate-spin text-primary-500 mx-auto" /></div>
          ) : filteredExams.length > 0 ? (
              <div className="space-y-4">
              {filteredExams.map((exam) => {
                  const status = getExamStatus(exam);
                  const badge = statusBadges[status];
                  return (
                    <div key={exam.id_ujian} className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">{exam.nama_paket}</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{exam.mata_pelajaran}</p>
                        </div>
                        <span className={`text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full mt-2 sm:mt-0 ${badge.className}`}>{badge.text}</span>
                      </div>
                      <div className="border-t border-slate-200 dark:border-slate-600 mt-3 pt-3 flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-300">
                              <IconBookOpen className="h-4 w-4"/>
                              <span>{exam.jumlah_soal} Soal</span>
                          </div>
                          <div className="flex items-center space-x-1 text-slate-600 dark:text-slate-300">
                              <IconClock className="h-4 w-4"/>
                              <span>{exam.durasi} Menit</span>
                          </div>
                      </div>
                    </div>
                  )
              })}
              </div>
          ) : (
              <p className="text-slate-500 dark:text-slate-400 text-center py-8">Tidak ada ujian yang cocok dengan filter Anda.</p>
          )}
      </div>
    </div>
  );
};

export default SiswaDashboard;