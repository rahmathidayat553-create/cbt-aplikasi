import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Role } from '../types';
import { getUsers, addUser } from '../services/api';
import { IconArrowLeft, IconPlus, IconUsers, IconDownload, IconUpload, IconLoader, IconUserCheck, IconFileSpreadsheet, IconCopy, IconCheckCircle } from './icons/Icons';

type NewUserWithPassword = Omit<User, 'id_user' | 'role'> & { password?: string };

const generatePassword = (length = 6): string => {
  return Math.random().toString(36).substring(2, 2 + length).toUpperCase();
};

const ParticipantFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: NewUserWithPassword) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ nama_lengkap: '', username: '', kelas: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({ nama_lengkap: '', username: '', kelas: '' });
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_lengkap || !formData.username || !formData.kelas) {
      setError('Harap isi semua field.');
      return;
    }
    const password = generatePassword();
    onSubmit({ ...formData, password });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Tambah Peserta Baru</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Nama Lengkap" className="input-field" required />
          <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="input-field" required />
          <input name="kelas" value={formData.kelas} onChange={handleChange} placeholder="Kelas (cth: XII IPA 1)" className="input-field" required />
          {error && <p className="text-red-500 text-xs italic mt-4">{error}</p>}
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Batal</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition">Simpan & Generate Password</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ImportSuccessModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  importedUsers: NewUserWithPassword[];
}> = ({ isOpen, onClose, importedUsers }) => {
  if (!isOpen) return null;

  const handleExport = () => {
    const ws = window.XLSX.utils.json_to_sheet(importedUsers);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Data Peserta Baru");
    window.XLSX.writeFile(wb, `data_peserta_baru.xlsx`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-2xl w-full flex flex-col" style={{ height: '90vh' }}>
        <div className="text-center">
          <IconUserCheck className="h-12 w-12 mx-auto text-green-500" />
          <h2 className="text-2xl font-bold mt-4">Impor Berhasil!</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">{importedUsers.length} peserta baru telah ditambahkan. Password telah dibuat secara otomatis.</p>
        </div>
        <div className="overflow-y-auto my-6 flex-grow border-y border-slate-200 dark:border-slate-700 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 dark:text-slate-400">
                <th className="px-4 py-2">Nama Lengkap</th>
                <th className="px-4 py-2">Username</th>
                <th className="px-4 py-2">Kelas</th>
                <th className="px-4 py-2">Password</th>
              </tr>
            </thead>
            <tbody className="text-slate-700 dark:text-slate-300">
              {importedUsers.map((user, index) => (
                <tr key={index} className="border-b border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-2 font-medium">{user.nama_lengkap}</td>
                  <td className="px-4 py-2">{user.username}</td>
                  <td className="px-4 py-2">{user.kelas}</td>
                  <td className="px-4 py-2 font-mono text-primary-600 dark:text-primary-400">{user.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between items-center">
           <button onClick={handleExport} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            <IconDownload className="h-5 w-5" />
            <span>Download Data Ini</span>
          </button>
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Tutup</button>
        </div>
      </div>
    </div>
  );
};


const ParticipantManagement: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [newlyImported, setNewlyImported] = useState<NewUserWithPassword[]>([]);
  const [copiedUserId, setCopiedUserId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const userList = await getUsers();
    setStudents(userList.filter(u => u.role === Role.SISWA));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddSubmit = async (userData: NewUserWithPassword) => {
    await addUser({ ...userData, role: Role.SISWA });
    setIsModalOpen(false);
    alert(`Peserta ${userData.nama_lengkap} berhasil ditambahkan.\nPassword: ${userData.password}`);
    fetchStudents();
  };
  
  const handleCopyPassword = (password: string, userId: number) => {
    if (!password) return;
    navigator.clipboard.writeText(password).then(() => {
        setCopiedUserId(userId);
        setTimeout(() => setCopiedUserId(null), 2000);
    });
  };

  const handleDownloadTemplate = () => {
    const ws_data = [{ "Nama Lengkap": "", "Username": "", "Kelas": "" }];
    const ws = window.XLSX.utils.json_to_sheet(ws_data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Template Peserta");
    window.XLSX.writeFile(wb, "template_peserta_ujian.xlsx");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = window.XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) {
            alert("File Excel kosong atau tidak ada data yang bisa dibaca.");
            setLoading(false);
            return;
        }

        const requiredColumns = ['Nama Lengkap', 'Username', 'Kelas'];
        const actualColumns = Object.keys(json[0]);
        const missingColumns = requiredColumns.filter(col => !actualColumns.includes(col));

        if (missingColumns.length > 0) {
            alert(`File Excel tidak valid. Kolom yang hilang: ${missingColumns.join(', ')}. Pastikan file Anda memiliki kolom 'Nama Lengkap', 'Username', dan 'Kelas'.`);
            setLoading(false);
            return;
        }

        const usersToImport: NewUserWithPassword[] = json.map(row => ({
          nama_lengkap: row['Nama Lengkap']?.toString().trim() || '',
          username: row['Username']?.toString().trim() || '',
          kelas: row['Kelas']?.toString().trim() || '',
          password: generatePassword(),
        })).filter(u => u.nama_lengkap && u.username && u.kelas);

        if (usersToImport.length === 0) {
            alert("Tidak ada data peserta yang valid untuk diimpor. Pastikan semua baris memiliki 'Nama Lengkap', 'Username', dan 'Kelas' yang terisi.");
            setLoading(false);
            return;
        }

        // Simulate adding users in batch
        await Promise.all(usersToImport.map(user => addUser({ ...user, role: Role.SISWA })));

        setNewlyImported(usersToImport);
        setIsSuccessModalOpen(true);
        fetchStudents(); // This will run in the background
      } catch (error) {
        console.error("Error importing file:", error);
        alert("Gagal memproses file. Pastikan formatnya benar.");
        setLoading(false);
      } finally {
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <ParticipantFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddSubmit}
      />
      <ImportSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        importedUsers={newlyImported}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
          <IconArrowLeft className="h-5 w-5" />
          <span>Kembali ke Dashboard</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Data Peserta Ujian</h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
          <h3 className="text-xl font-bold flex items-center mb-4 md:mb-0"><IconUsers className="h-6 w-6 mr-2" /> Daftar Peserta</h3>
          <div className="flex items-center space-x-2">
            <button onClick={handleDownloadTemplate} className="flex items-center space-x-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 font-bold py-2 px-4 rounded-lg transition-colors">
              <IconDownload className="h-5 w-5" />
              <span>Template</span>
            </button>
            <button onClick={handleImportClick} className="flex items-center space-x-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              <IconUpload className="h-5 w-5" />
              <span>Import Peserta</span>
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              <IconPlus className="h-5 w-5" />
              <span>Tambah Peserta</span>
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <IconLoader className="h-8 w-8 animate-spin text-primary-500" />
            <p className="ml-4">Memuat data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
              <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Nama Lengkap</th>
                  <th scope="col" className="px-6 py-3">Username</th>
                  <th scope="col" className="px-6 py-3">Kelas</th>
                  <th scope="col" className="px-6 py-3">Password</th>
                </tr>
              </thead>
              <tbody>
                {students.map(user => (
                  <tr key={user.id_user} className="border-b bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{user.nama_lengkap}</td>
                    <td className="px-6 py-4">{user.username}</td>
                    <td className="px-6 py-4">{user.kelas || '-'}</td>
                    <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                            <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-sm">{user.password}</span>
                            <button 
                                onClick={() => handleCopyPassword(user.password || '', user.id_user)}
                                className="p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-md transition-colors"
                                aria-label="Salin password"
                                title="Salin password"
                            >
                                {copiedUserId === user.id_user ? 
                                    <IconCheckCircle className="h-4 w-4 text-green-500" /> : 
                                    <IconCopy className="h-4 w-4" />
                                }
                            </button>
                        </div>
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

export default ParticipantManagement;