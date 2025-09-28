import React, { useState, useEffect, useCallback } from 'react';
import { MataPelajaran } from '../types';
import { getMataPelajaran, addMataPelajaran, updateMataPelajaran, deleteMataPelajaran } from '../services/api';
import { IconArrowLeft, IconEdit, IconLoader, IconPlus, IconTrash, IconBook } from './icons/Icons';

interface SubjectManagementProps {
  onBack: () => void;
}

const SubjectFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (subject: Omit<MataPelajaran, 'id_mapel'> | (Partial<MataPelajaran> & { id_mapel: number })) => void;
  initialData?: MataPelajaran | null;
}> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [namaMapel, setNamaMapel] = useState('');

  useEffect(() => {
    if (initialData) {
      setNamaMapel(initialData.nama_mapel);
    } else {
      setNamaMapel('');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaMapel.trim()) return;
    const dataToSubmit: any = { nama_mapel: namaMapel };
    if (initialData) {
        dataToSubmit.id_mapel = initialData.id_mapel;
    }
    onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            value={namaMapel}
            onChange={(e) => setNamaMapel(e.target.value)}
            placeholder="Nama Mata Pelajaran"
            className="input-field w-full"
            required
          />
          <div className="flex justify-end space-x-4 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Batal</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SubjectManagement: React.FC<SubjectManagementProps> = ({ onBack }) => {
  const [subjects, setSubjects] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<MataPelajaran | null>(null);
  const [deletingSubject, setDeletingSubject] = useState<MataPelajaran | null>(null);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    const subjectList = await getMataPelajaran();
    setSubjects(subjectList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const handleOpenModal = (subject: MataPelajaran | null = null) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleSubmit = async (subjectData: any) => {
    if (subjectData.id_mapel) {
      await updateMataPelajaran(subjectData.id_mapel, subjectData);
    } else {
      await addMataPelajaran(subjectData);
    }
    fetchSubjects();
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  const handleDelete = async (subject: MataPelajaran) => {
    await deleteMataPelajaran(subject.id_mapel);
    fetchSubjects();
    setDeletingSubject(null);
  };

  return (
    <div>
      <SubjectFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSubject(null); }}
        onSubmit={handleSubmit}
        initialData={editingSubject}
      />
      {deletingSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold mb-4">Hapus Mata Pelajaran?</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Yakin ingin menghapus <strong>{deletingSubject.nama_mapel}</strong>? (Aksi ini tidak akan menghapus paket soal/ujian yang terkait).</p>
            <div className="flex justify-center space-x-4">
              <button onClick={() => setDeletingSubject(null)} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600">Batal</button>
              <button onClick={() => handleDelete(deletingSubject)} className="px-6 py-2 rounded-lg bg-red-600 text-white">Ya, Hapus</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
          <IconArrowLeft className="h-5 w-5" />
          <span>Kembali ke Dashboard</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Manajemen Mata Pelajaran</h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center"><IconBook className="h-6 w-6 mr-2" /> Daftar Mapel</h3>
          <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
            <IconPlus className="h-5 w-5" />
            <span>Tambah Mapel</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10"><IconLoader className="h-8 w-8 animate-spin text-primary-500" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3">Nama Mata Pelajaran</th>
                  <th className="px-6 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(subject => (
                  <tr key={subject.id_mapel} className="border-b bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{subject.nama_mapel}</td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button onClick={() => handleOpenModal(subject)} className="p-2 text-yellow-500"><IconEdit className="h-5 w-5" /></button>
                      <button onClick={() => setDeletingSubject(subject)} className="p-2 text-red-500"><IconTrash className="h-5 w-5" /></button>
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

export default SubjectManagement;