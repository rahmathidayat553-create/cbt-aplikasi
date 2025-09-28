import React, { useState, useEffect, useCallback } from 'react';
import { Ujian } from '../types';
import { getExams, addExam, updateExam, deleteExam } from '../services/api';
import { IconArrowLeft, IconEdit, IconLoader, IconPlus, IconTrash, IconClipboardCheck, IconListDetails, IconCopy } from './icons/Icons';

interface ExamManagementProps {
  onBack: () => void;
  onSelectExam: (exam: Ujian) => void;
}

const ExamFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exam: Omit<Ujian, 'id_ujian' | 'token' | 'jumlah_soal'> | (Partial<Ujian> & { id_ujian: number })) => void;
  initialData?: Ujian | null;
}> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nama_ujian: '',
    mata_pelajaran: '',
    durasi: 60,
    waktu_mulai: new Date(),
  });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        nama_ujian: initialData.nama_ujian,
        mata_pelajaran: initialData.mata_pelajaran,
        durasi: initialData.durasi,
        waktu_mulai: new Date(initialData.waktu_mulai),
      });
    } else {
      setFormData({
        nama_ujian: '',
        mata_pelajaran: '',
        durasi: 60,
        waktu_mulai: new Date(),
      });
    }
  }, [initialData, isOpen]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
        ...prev, 
        [name]: type === 'number' ? parseInt(value, 10) : value 
    }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({...prev, waktu_mulai: new Date(e.target.value)}));
  }
  
  const handleCopyToClipboard = (text: string) => {
    if (!navigator.clipboard) {
        alert('Gagal menyalin. Silakan salin secara manual.');
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset icon after 2 seconds
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit: any = { ...formData };
    if (initialData) {
        dataToSubmit.id_ujian = initialData.id_ujian;
    }
    onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;
  
  // Helper function to format a Date object into a `YYYY-MM-DDTHH:mm` string
  // suitable for a datetime-local input, correctly handling timezone offsets.
  const toLocalISOString = (date: Date) => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
    return localISOTime;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Ujian' : 'Tambah Ujian Baru'}</h2>
        <form onSubmit={handleSubmit}>
          {initialData && initialData.token && (
            <div className="mb-6 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2">
                    Token Ujian (Bagikan ke siswa)
                </label>
                <div className="flex items-center justify-between">
                    <p className="text-2xl font-mono tracking-widest text-primary-500 dark:text-primary-400">{initialData.token}</p>
                    <button 
                        type="button" 
                        onClick={() => handleCopyToClipboard(initialData.token!)}
                        className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        aria-label="Salin Token"
                    >
                        {copied ? <IconClipboardCheck className="h-5 w-5 text-green-500" /> : <IconCopy className="h-5 w-5" />}
                    </button>
                </div>
            </div>
          )}
          <div className="space-y-4">
            <input name="nama_ujian" value={formData.nama_ujian} onChange={handleChange} placeholder="Nama Ujian" className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            <input name="mata_pelajaran" value={formData.mata_pelajaran} onChange={handleChange} placeholder="Mata Pelajaran" className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            <input name="durasi" type="number" value={formData.durasi} onChange={handleChange} placeholder="Durasi (dalam menit)" className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            <input name="waktu_mulai" type="datetime-local" value={toLocalISOString(formData.waktu_mulai)} onChange={handleDateChange} className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div className="flex justify-end space-x-4 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Batal</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ExamManagement: React.FC<ExamManagementProps> = ({ onBack, onSelectExam }) => {
  const [exams, setExams] = useState<Ujian[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Ujian | null>(null);
  const [deletingExam, setDeletingExam] = useState<Ujian | null>(null);

  const fetchExams = useCallback(async () => {
    setLoading(true);
    const examList = await getExams();
    setExams(examList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleOpenModal = (exam: Ujian | null = null) => {
    setEditingExam(exam);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleSubmit = async (examData: any) => {
    if (examData.id_ujian) {
      await updateExam(examData.id_ujian, examData);
    } else {
      await addExam(examData);
    }
    fetchExams();
    handleCloseModal();
  };
  
  const handleDelete = async (exam: Ujian) => {
    await deleteExam(exam.id_ujian);
    fetchExams();
    setDeletingExam(null);
  };

  return (
    <div>
      <ExamFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingExam}
      />
      {deletingExam && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full text-center">
                <h2 className="text-2xl font-bold mb-4">Hapus Ujian?</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Apakah Anda yakin ingin menghapus ujian <strong>{deletingExam.nama_ujian}</strong>? Semua soal yang terkait juga akan terhapus.</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={() => setDeletingExam(null)} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Batal</button>
                    <button onClick={() => handleDelete(deletingExam)} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">Ya, Hapus</button>
                </div>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <IconArrowLeft className="h-5 w-5" />
            <span>Kembali ke Dashboard</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Manajemen Ujian</h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center"><IconClipboardCheck className="h-6 w-6 mr-2" /> Daftar Ujian</h3>
            <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <IconPlus className="h-5 w-5" />
                <span>Tambah Ujian</span>
            </button>
        </div>
        
        {loading ? (
            <div className="flex justify-center items-center py-10">
                <IconLoader className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th scope="col" className="px-6 py-3">Nama Ujian</th>
                <th scope="col" className="px-6 py-3">Mapel</th>
                <th scope="col" className="px-6 py-3">Token</th>
                <th scope="col" className="px-6 py-3">Jumlah Soal</th>
                <th scope="col" className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => (
                <tr key={exam.id_ujian} className="border-b bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{exam.nama_ujian}</td>
                  <td className="px-6 py-4">{exam.mata_pelajaran}</td>
                  <td className="px-6 py-4 font-mono text-primary-500 dark:text-primary-400">{exam.token}</td>
                  <td className="px-6 py-4">{exam.jumlah_soal}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => onSelectExam(exam)} className="p-2 text-sky-500 dark:text-sky-400 hover:text-sky-600 dark:hover:text-sky-300" aria-label="Manage Questions"><IconListDetails className="h-5 w-5"/></button>
                    <button onClick={() => handleOpenModal(exam)} className="p-2 text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300" aria-label="Edit"><IconEdit className="h-5 w-5"/></button>
                    <button onClick={() => setDeletingExam(exam)} className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400" aria-label="Delete"><IconTrash className="h-5 w-5"/></button>
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

export default ExamManagement;