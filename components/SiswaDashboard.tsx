import React, { useState, useEffect, useContext } from 'react';
import { getAvailableExams, verifyToken } from '../services/api';
import { Ujian } from '../types';
import { AuthContext } from '../App';
import { IconKey, IconLoader, IconArrowRight, IconClock, IconBookOpen } from './icons/Icons';

interface SiswaDashboardProps {
  onStartExam: (ujian: Ujian) => void;
}

const SiswaDashboard: React.FC<SiswaDashboardProps> = ({ onStartExam }) => {
  const [exams, setExams] = useState<Ujian[]>([]);
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useContext(AuthContext);

  useEffect(() => {
    const fetchExams = async () => {
      const availableExams = await getAvailableExams();
      setExams(availableExams);
    };
    fetchExams();
  }, []);

  const handleJoinExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const exam = await verifyToken(token);
      if (exam) {
        onStartExam(exam);
      } else {
        setError('Token tidak valid atau ujian tidak ditemukan.');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 md:p-8 shadow-lg mb-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Selamat Datang, {auth?.user?.nama_lengkap}!</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Silakan masukkan token untuk memulai ujian yang aktif.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center"><IconKey className="h-6 w-6 mr-2 text-primary-500 dark:text-primary-400"/> Masukkan Token Ujian</h3>
            <form onSubmit={handleJoinExam}>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase())}
                placeholder="TOKENUJIAN"
                className="text-center tracking-widest font-mono shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
              />
              {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline flex items-center justify-center disabled:bg-primary-400 dark:disabled:bg-primary-800 disabled:cursor-not-allowed"
              >
                {loading ? <IconLoader className="animate-spin h-5 w-5" /> : <>Mulai Ujian <IconArrowRight className="h-5 w-5 ml-2"/></>}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-bold mb-4">Daftar Ujian Aktif</h3>
                {exams.length > 0 ? (
                    <div className="space-y-4">
                    {exams.map((exam) => (
                        <div key={exam.id_ujian} className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div>
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white">{exam.nama_ujian}</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">{exam.mata_pelajaran}</p>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 sm:mt-0 text-sm">
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
                    ))}
                    </div>
                ) : (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">Tidak ada ujian yang tersedia saat ini.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default SiswaDashboard;