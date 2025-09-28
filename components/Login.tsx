import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import { login as apiLogin } from '../services/api';
import { IconBook, IconLoader } from './icons/Icons';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await apiLogin(username, password);
      if (user) {
        auth?.login(user);
      } else {
        setError('Username atau password salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <IconBook className="mx-auto h-16 w-16 text-primary-500" />
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mt-4">CBT Application</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Silakan login untuk melanjutkan</p>
        </div>
        <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-8">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="username">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="cth: siswa1"
                className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-slate-700 dark:text-slate-300 text-sm font-bold mb-2" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="************"
                className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline w-full flex items-center justify-center disabled:bg-primary-400 dark:disabled:bg-primary-800 disabled:cursor-not-allowed"
              >
                {loading ? <IconLoader className="animate-spin h-5 w-5" /> : 'Login'}
              </button>
            </div>
          </form>
        </div>
        <div className="text-center mt-6 text-slate-500 dark:text-slate-500 text-sm">
            <p>Contoh Akun:</p>
            <p>Siswa: `siswa1` / `password`</p>
            <p>Guru: `guru1` / `password`</p>
            <p>Admin: `admin` / `password`</p>
        </div>
      </div>
    </div>
  );
};

export default Login;