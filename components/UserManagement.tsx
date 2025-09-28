import React, { useState, useEffect, useCallback } from 'react';
import { User, Role } from '../types';
import { getUsers, addUser, updateUser, deleteUser } from '../services/api';
import { IconArrowLeft, IconEdit, IconLoader, IconPlus, IconTrash, IconUser, IconUsers } from './icons/Icons';

interface UserManagementProps {
  onBack: () => void;
}

const UserFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (user: Omit<User, 'id_user'> | (Partial<User> & { id_user: number })) => void;
  initialData?: User | null;
}> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    username: '',
    password: '',
    role: Role.SISWA,
    kelas: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        nama_lengkap: initialData.nama_lengkap,
        username: initialData.username,
        password: '', // Password should be re-entered for security, or leave blank to not change
        role: initialData.role,
        kelas: initialData.kelas || '',
      });
    } else {
      setFormData({
        nama_lengkap: '',
        username: '',
        password: '',
        role: Role.SISWA,
        kelas: '',
      });
    }
    setError('');
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_lengkap || !formData.username || (!initialData && !formData.password)) {
      setError('Harap isi semua field yang wajib diisi.');
      return;
    }
    const dataToSubmit: any = { ...formData };
    if (initialData) {
        dataToSubmit.id_user = initialData.id_user;
        if (!dataToSubmit.password) {
            delete dataToSubmit.password;
        }
    }
    if(dataToSubmit.role !== Role.SISWA){
        dataToSubmit.kelas = undefined;
    }

    onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit User' : 'Tambah User Baru'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <input name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} placeholder="Nama Lengkap" className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            <input name="username" value={formData.username} onChange={handleChange} placeholder="Username" className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder={initialData ? 'Password (biarkan kosong jika tidak diubah)' : 'Password'} className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <select name="role" value={formData.role} onChange={handleChange} className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value={Role.SISWA}>Siswa</option>
              <option value={Role.GURU}>Guru</option>
              <option value={Role.ADMIN}>Admin</option>
            </select>
            {formData.role === Role.SISWA && (
              <input name="kelas" value={formData.kelas} onChange={handleChange} placeholder="Kelas (cth: XII IPA 1)" className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" />
            )}
          </div>
          {error && <p className="text-red-500 text-xs italic mt-4">{error}</p>}
          <div className="flex justify-end space-x-4 mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Batal</button>
            <button type="submit" className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition">Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagement: React.FC<UserManagementProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const userList = await getUsers();
    setUsers(userList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user: User | null = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (userData: Omit<User, 'id_user'> | (Partial<User> & { id_user: number })) => {
    if ('id_user' in userData && userData.id_user) {
      await updateUser(userData.id_user, userData);
    } else {
      await addUser(userData as Omit<User, 'id_user'>);
    }
    fetchUsers();
    handleCloseModal();
  };
  
  const handleDelete = async (user: User) => {
    if (user.id_user === 1) {
        alert("Admin utama tidak dapat dihapus.");
        setDeletingUser(null);
        return;
    }
    await deleteUser(user.id_user);
    fetchUsers();
    setDeletingUser(null);
  };

  return (
    <div>
      <UserFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingUser}
      />
      {deletingUser && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full text-center">
                <h2 className="text-2xl font-bold mb-4">Hapus User?</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Apakah Anda yakin ingin menghapus user <strong>{deletingUser.nama_lengkap}</strong>? Aksi ini tidak dapat dibatalkan.</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={() => setDeletingUser(null)} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Batal</button>
                    <button onClick={() => handleDelete(deletingUser)} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">Ya, Hapus</button>
                </div>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <IconArrowLeft className="h-5 w-5" />
            <span>Kembali ke Dashboard</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Manajemen User</h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center"><IconUsers className="h-6 w-6 mr-2" /> Daftar Pengguna</h3>
            <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <IconPlus className="h-5 w-5" />
                <span>Tambah User</span>
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
                <th scope="col" className="px-6 py-3">Nama Lengkap</th>
                <th scope="col" className="px-6 py-3">Username</th>
                <th scope="col" className="px-6 py-3">Role</th>
                <th scope="col" className="px-6 py-3">Kelas</th>
                <th scope="col" className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id_user} className="border-b bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">{user.nama_lengkap}</td>
                  <td className="px-6 py-4">{user.username}</td>
                  <td className="px-6 py-4 capitalize">{user.role}</td>
                  <td className="px-6 py-4">{user.kelas || '-'}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => handleOpenModal(user)} className="p-2 text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300" aria-label="Edit"><IconEdit className="h-5 w-5"/></button>
                    <button onClick={() => setDeletingUser(user)} disabled={user.id_user === 1} className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400 disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed" aria-label="Delete"><IconTrash className="h-5 w-5"/></button>
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

export default UserManagement;