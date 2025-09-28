// FIX: Declare XLSX on the window object to resolve TypeScript errors.
// This is necessary when the 'xlsx' library is loaded via a script tag.
declare global {
  interface Window {
    XLSX: any;
  }
}

import React, { useContext } from 'react';
// FIX: Import Ujian as BaseUjian to avoid name conflict with local type definition.
import { Hasil, Ujian as BaseUjian } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { IconCheckCircle, IconXCircle, IconMinusCircle, IconDownload, IconHome, IconFilePdf } from './icons/Icons';
import { ThemeContext } from '../App';

// FIX: Define a more specific type for the exam prop that includes details from the question package.
type Ujian = BaseUjian & { nama_paket: string; mata_pelajaran: string; };

interface ResultsViewProps {
  result: Hasil;
  // FIX: Use the more specific Ujian type for the exam prop.
  exam: Ujian;
  onBackToDashboard: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ result, exam, onBackToDashboard }) => {
  const themeContext = useContext(ThemeContext);

  const data = [
    { name: 'Benar', value: result.benar, color: '#22c55e' },
    { name: 'Salah', value: result.salah, color: '#ef4444' },
    { name: 'Tidak Dijawab', value: result.tidak_dijawab, color: '#64748b' },
  ];
  
  const handleExportExcel = () => {
    const ws_data = [
        // FIX: Changed `exam.nama_ujian` to `exam.nama_paket` to match the available property.
        ["Nama Ujian", exam.nama_paket],
        // FIX: This property is now available due to the updated prop type.
        ["Mata Pelajaran", exam.mata_pelajaran],
        ["Tanggal", result.tanggal.toLocaleDateString()],
        [],
        ["SKOR AKHIR", result.nilai],
        [],
        ["DETAIL"],
        ["Benar", result.benar],
        ["Salah", result.salah],
        ["Tidak Dijawab", result.tidak_dijawab],
        ["Total Soal", result.benar + result.salah + result.tidak_dijawab]
    ];
    const ws = window.XLSX.utils.aoa_to_sheet(ws_data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Hasil Ujian");
    // FIX: Changed `exam.nama_ujian` to `exam.nama_paket` to match the available property.
    window.XLSX.writeFile(wb, `Hasil_${exam.nama_paket.replace(/ /g,"_")}.xlsx`);
  };
  
  const handleExportPdf = () => {
    window.print();
  };

  const scoreColor = result.nilai >= 75 ? 'text-green-500 dark:text-green-400' : result.nilai >= 50 ? 'text-yellow-500 dark:text-yellow-400' : 'text-red-500 dark:text-red-400';

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
       <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #root, #root > div {
              height: auto !important;
              min-height: unset !important;
              display: block !important;
            }
            .printable-area, .printable-area * {
              visibility: visible;
            }
            .printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 20px;
              margin: 0;
              box-shadow: none !important;
              border: 1px solid #ccc !important;
              border-radius: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              background-color: #ffffff !important;
            }
            .dark .printable-area {
              background-color: #ffffff !important;
            }
            .printable-area h1, .printable-area p, .printable-area div, .printable-area strong, .printable-area span {
              color: #000000 !important;
            }
          }
        `}
      </style>
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800 shadow-2xl rounded-2xl p-6 md:p-10 text-center printable-area">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">Hasil Ujian</h1>
        {/* FIX: Changed `exam.nama_ujian` to `exam.nama_paket` to match the available property. */}
        <p className="text-slate-500 dark:text-slate-400 mb-8">Berikut adalah rincian hasil ujian Anda untuk <strong>{exam.nama_paket}</strong>.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="flex flex-col items-center justify-center">
            <p className="text-slate-600 dark:text-slate-300 text-lg">Skor Akhir</p>
            <p className={`text-7xl md:text-8xl font-bold my-4 ${scoreColor}`}>{result.nilai.toFixed(2)}</p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: `${result.nilai}%` }}></div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                    contentStyle={themeContext?.theme === 'dark' ? {
                        backgroundColor: '#1e293b',
                        borderColor: '#334155'
                    } : {
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0'
                    }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                <IconCheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-2xl font-bold">{result.benar}</p>
                <p className="text-slate-500 dark:text-slate-400">Benar</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                <IconXCircle className="h-8 w-8 mx-auto text-red-500 mb-2" />
                <p className="text-2xl font-bold">{result.salah}</p>
                <p className="text-slate-500 dark:text-slate-400">Salah</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-700/50 p-4 rounded-lg">
                <IconMinusCircle className="h-8 w-8 mx-auto text-slate-500 mb-2" />
                <p className="text-2xl font-bold">{result.tidak_dijawab}</p>
                <p className="text-slate-500 dark:text-slate-400">Kosong</p>
            </div>
        </div>
        
        <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4 no-print">
          <button
            onClick={onBackToDashboard}
            className="flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <IconHome className="h-5 w-5 mr-2" />
            Kembali ke Dashboard
          </button>
           <button
            onClick={handleExportPdf}
            className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <IconFilePdf className="h-5 w-5 mr-2" />
            Export ke PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            <IconDownload className="h-5 w-5 mr-2" />
            Export ke Excel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsView;