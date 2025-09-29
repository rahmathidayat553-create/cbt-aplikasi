import React, { useState, useEffect, useCallback } from 'react';
import { User, Hasil } from '../types';
import { getAllResults, resetExamForUser, FullResultDetails } from '../services/api';
import { IconArrowLeft, IconLoader, IconRotateCcw, IconUsers } from './icons/Icons';

const ResetExamParticipant: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [results, setResults] = useState<FullResultDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmReset, setConfirmReset] = useState<FullResultDetails | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    const allResults = await getAllResults();
    setResults(allResults);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const handleReset = async () => {
    if (!confirmReset) return;
    setLoading(true);
    await resetExamForUser(confirmReset.id_user, confirmReset.exam.id_ujian);
    setConfirmReset(null);
    await fetchResults(); // Refreshes the list
  };

  return (
    <div>
      {confirmReset && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Reset Ujian Peserta?</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              Yakin ingin mereset ujian <strong>{confirmReset.exam.nama_paket}</strong> untuk peserta <strong>{confirmReset.user.nama_lengkap}</strong>?
              Hasil ujian mereka akan dihapus dan mereka dapat mengerjakan ulang.
            </p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setConfirmReset(null)} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Batal</button>
              <button onClick={handleReset} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">Ya, Reset</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
          <IconArrowLeft className="h-5 w-5" />
          <span>Kembali ke Dashboard</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Reset Peserta Ujian</h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold flex items-center mb-4"><IconUsers className="h-6 w-6 mr-2" /> Daftar Peserta yang Telah Selesai Ujian</h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <IconLoader className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : results.length === 0 ? (
          <p className="text-center text-slate-500 dark:text-slate-400 py-8">Belum ada peserta yang menyelesaikan ujian.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Nama Peserta</th>
                  <th scope="col" className="px-6 py-3">Nama Ujian</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result.id_hasil} className="border-b bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{result.user.nama_lengkap}</td>
                    <td className="px-6 py-4">{result.exam.nama_paket}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full dark:bg-green-900 dark:text-green-300">Selesai</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setConfirmReset(result)}
                        className="flex items-center space-x-2 ml-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs"
                        aria-label={`Reset ujian untuk ${result.user.nama_lengkap}`}
                      >
                        <IconRotateCcw className="h-4 w-4" />
                        <span>Reset</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetExamParticipant;