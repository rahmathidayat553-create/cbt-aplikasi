import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { USERS } from '../constants'; // Import mock data directly to get passwords
import { IconArrowLeft, IconLoader, IconPrinter, IconUserSquare } from './icons/Icons';

const ExamCard: React.FC<{ user: User }> = ({ user }) => (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-md w-full break-inside-avoid">
        <div className="text-center border-b pb-2 mb-2 border-slate-200 dark:border-slate-700">
             <h3 className="font-bold text-base text-slate-900 dark:text-white">KARTU PESERTA UJIAN</h3>
             <p className="text-xs text-slate-500 dark:text-slate-400">CBT Application</p>
        </div>
        <div className="flex items-center space-x-4 mt-4">
            <div className="w-20 h-24 border-2 border-dashed flex items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                <IconUserSquare className="h-10 w-10"/>
            </div>
            <div className="text-sm space-y-1 text-slate-800 dark:text-slate-200">
                <p><strong>Nama:</strong> {user.nama_lengkap}</p>
                <p><strong>Kelas:</strong> {user.kelas}</p>
                <p><strong>Username:</strong> <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">{user.username}</span></p>
                <p><strong>Password:</strong> <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">{user.password}</span></p>
            </div>
        </div>
        <p className="text-xs text-center mt-4 text-slate-500 dark:text-slate-400">Harap simpan kartu ini dengan baik.</p>
    </div>
);


const ExamCardPrintView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [students, setStudents] = useState<User[]>([]);
    const [selectedStudents, setSelectedStudents] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            // In a real app, an authenticated endpoint would provide this data.
            // Here we use the mock constant directly to access passwords for printing.
            const studentUsers = USERS.filter(u => u.role === Role.SISWA);
            setStudents(studentUsers);
            // Select all by default
            setSelectedStudents(new Set(studentUsers.map(s => s.id_user)));
            setLoading(false);
        };
        fetchStudents();
    }, []);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudents(new Set(students.map(s => s.id_user)));
        } else {
            setSelectedStudents(new Set());
        }
    };
    
    const handleSelectOne = (userId: number, isSelected: boolean) => {
        const newSet = new Set(selectedStudents);
        if (isSelected) {
            newSet.add(userId);
        } else {
            newSet.delete(userId);
        }
        setSelectedStudents(newSet);
    };
    
    const handlePrint = () => {
        window.print();
    };
    
    const studentsToPrint = students.filter(s => selectedStudents.has(s.id_user));

    return (
        <div>
            <style>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                        visibility: visible;
                    }
                    .printable-area {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 0;
                        margin: 0;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4;
                        margin: 1cm;
                    }
                    .dark .bg-white { background-color: #fff !important; }
                    .dark .bg-slate-800 { background-color: #fff !important; }
                    .dark .bg-slate-700\\/50 { background-color: #f1f5f9 !important; }
                    .dark .text-slate-900, .dark .text-slate-800, .dark .text-slate-200, .dark .font-bold, .dark .text-base, .dark .text-sm, .dark .text-xs {
                        color: #000 !important;
                    }
                    .dark .border-slate-700 { border-color: #e2e8f0 !important; }
                }
            `}</style>

            <div className="no-print">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
                        <IconArrowLeft className="h-5 w-5" />
                        <span>Kembali ke Dashboard</span>
                    </button>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Cetak Kartu Ujian</h2>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b pb-4 border-slate-200 dark:border-slate-700">
                    <div className="mb-4 md:mb-0">
                        <h3 className="text-xl font-bold">Pilih Peserta</h3>
                        <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                             <input type="checkbox" id="selectAll" onChange={handleSelectAll} checked={students.length > 0 && selectedStudents.size === students.length} className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
                             <label htmlFor="selectAll" className="ml-2">Pilih Semua ({selectedStudents.size}/{students.length})</label>
                        </div>
                    </div>
                    <button onClick={handlePrint} disabled={selectedStudents.size === 0} className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-primary-400 dark:disabled:bg-primary-700/50 disabled:cursor-not-allowed">
                        <IconPrinter className="h-5 w-5" />
                        <span>Cetak {selectedStudents.size} Kartu Terpilih</span>
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-10"><IconLoader className="h-8 w-8 animate-spin text-primary-500" /></div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 no-print mb-6">
                            {students.map(student => (
                                <div key={student.id_user} className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-md">
                                    <input 
                                        type="checkbox" 
                                        id={`student-${student.id_user}`}
                                        checked={selectedStudents.has(student.id_user)}
                                        onChange={(e) => handleSelectOne(student.id_user, e.target.checked)}
                                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                                    />
                                    <label htmlFor={`student-${student.id_user}`} className="ml-2 text-sm">{student.nama_lengkap}</label>
                                </div>
                            ))}
                        </div>
                    
                        <div className="printable-area">
                            <div className="grid grid-cols-2 gap-4">
                                {studentsToPrint.length > 0 ? (
                                    studentsToPrint.map(student => <ExamCard key={student.id_user} user={student} />)
                                ) : (
                                    <p className="no-print col-span-2 text-center text-slate-500 dark:text-slate-400 py-8">Pilih setidaknya satu siswa untuk dicetak kartunya.</p>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default ExamCardPrintView;