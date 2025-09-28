import React, { useState, useEffect, useCallback } from 'react';
import { Ujian, PaketSoal } from '../types';
import { getExams, getPaketSoal, addExam, updateExam, deleteExam } from '../services/api';
import { IconArrowLeft, IconEdit, IconLoader, IconPlus, IconTrash, IconClipboardCheck, IconCopy } from './icons/Icons';

type FormattedExam = Ujian & { nama_paket: string; mata_pelajaran: string; jumlah_soal: number };

const ExamFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (exam: any) => void;
  initialData?: FormattedExam | null;
  paketSoalList: (PaketSoal & { mata_pelajaran: string, jumlah_soal: number })[];
}> = ({ isOpen, onClose, onSubmit, initialData, paketSoalList }) => {
  const [formData, setFormData] = useState({
    id_paket: '',
    durasi: '60',
    waktu_mulai: new Date(),
    acak_soal: false,
    acak_opsi: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        id_paket: initialData.id_paket.toString(),
        durasi: initialData.durasi.toString(),
        waktu_mulai: new Date(initialData.waktu_mulai),
        acak_soal: initialData.acak_soal || false,
        acak_opsi: initialData.acak_opsi || false,
      });
    } else {
      setFormData({
        id_paket: paketSoalList.length > 0 ? paketSoalList[0].id_paket.toString() : '',
        durasi: '60',
        waktu_mulai: new Date(),
        acak_soal: false,
        acak_opsi: false,
      });
    }
  }, [initialData, isOpen, paketSoalList]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const { checked } = e.target as HTMLInputElement;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({...prev, waktu_mulai: new Date(e.target.value)}));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      id_paket: parseInt(formData.id_paket),
      durasi: parseInt(formData.durasi),
    };
    if (initialData) {
      onSubmit({ id_ujian: initialData.id_ujian, ...dataToSubmit });
    } else {
      onSubmit(dataToSubmit);
    }
  };

  if (!isOpen) return null;
  
  const toLocalISOString = (date: Date) => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzoffset).toISOString().slice(0, 16);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit' : 'Set'} Ujian</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select name="id_paket" value={formData.id_paket} onChange={handleChange} className="input-field w-full" disabled={!!initialData}>
              <option value="" disabled>-- Pilih Paket Soal --</option>
              {paketSoalList.map(p => <option key={p.id_paket} value={p.id_paket}>{p.nama_paket} ({p.mata_pelajaran})</option>)}
          </select>
          <input name="durasi" type="number" value={formData.durasi} onChange={handleChange} placeholder="Durasi (menit)" className="input-field w-full" required />
          <input name="waktu_mulai" type="datetime-local" value={toLocalISOString(formData.waktu_mulai)} onChange={handleDateChange} className="input-field w-full" required />
          <div className="flex items-start space-x-6 pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="acak_soal" checked={formData.acak_soal} onChange={handleChange} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" />
                <span>Acak Soal</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" name="acak_opsi" checked={formData.acak_opsi} onChange={handleChange} className="h-4 w-4 rounded text-primary-600 focus:ring-primary-500" />
                <span>Acak Opsi</span>
              </label>
          </div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600">Batal</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-primary-600 text-white">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ExamManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [exams, setExams] = useState<FormattedExam[]>([]);
  const [paketSoal, setPaketSoal] = useState<(PaketSoal & { mata_pelajaran: string, jumlah_soal: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<FormattedExam | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [examList, paketList] = await Promise.all([getExams(), getPaketSoal()]);
    setExams(examList);
    setPaketSoal(paketList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (examData: any) => {
    if (examData.id_ujian) {
      await updateExam(examData.id_ujian, examData);
    } else {
      await addExam(examData);
    }
    fetchData();
    setIsModalOpen(false);
  };
  
  const handleToggleActive = async (exam: FormattedExam) => {
    await updateExam(exam.id_ujian, { is_active: !exam.is_active });
    fetchData();
  };
  
  return (
    <div>
      <ExamFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingExam}
        paketSoalList={paketSoal}
      />
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          <IconArrowLeft className="h-5 w-5" />
          <span>Kembali ke Dashboard</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Manajemen Ujian</h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center"><IconClipboardCheck className="h-6 w-6 mr-2" /> Ujian Terjadwal</h3>
            <button onClick={() => {setEditingExam(null); setIsModalOpen(true);}} className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
                <IconPlus className="h-5 w-5" />
                <span>Set Ujian Baru</span>
            </button>
        </div>
        
        {loading ? <div className="text-center py-4"><IconLoader className="h-6 w-6 animate-spin mx-auto" /></div> :
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Paket Soal</th>
                <th className="px-6 py-3">Token</th>
                <th className="px-6 py-3">Jadwal</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {exams.map(exam => (
                <tr key={exam.id_ujian} className="border-b bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <td className="px-6 py-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={exam.is_active} onChange={() => handleToggleActive(exam)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-primary-600"></div>
                      <span className="ml-3 text-sm font-medium">{exam.is_active ? 'Aktif' : 'Nonaktif'}</span>
                    </label>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                    {exam.nama_paket}
                    <p className="font-normal text-xs text-slate-500">{exam.mata_pelajaran}</p>
                  </td>
                  <td className="px-6 py-4 font-mono">{exam.is_active ? exam.token : '-'}</td>
                  <td className="px-6 py-4">{new Date(exam.waktu_mulai).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => {setEditingExam(exam); setIsModalOpen(true);}} className="p-2 text-yellow-500"><IconEdit className="h-5 w-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        }
      </div>
    </div>
  );
};

export default ExamManagement;