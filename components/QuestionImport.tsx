import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Ujian, Soal, AnswerOption } from '../types';
import { getExams, addQuestion } from '../services/api';
import { IconArrowLeft, IconLoader, IconUpload, IconDownload, IconClipboardCheck, IconAlertTriangle, IconX } from './icons/Icons';

declare global {
  interface Window { XLSX: any; }
}

interface QuestionImportProps {
  onBack: () => void;
}

type ImportStep = 'select_file' | 'preview' | 'importing' | 'complete';
type ErrorRow = { row: number; error: string; };
type ValidRow = Omit<Soal, 'id_soal' | 'id_ujian'>;

const QuestionImport: React.FC<QuestionImportProps> = ({ onBack }) => {
  const [step, setStep] = useState<ImportStep>('select_file');
  const [exams, setExams] = useState<Ujian[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState('');
  const [validRows, setValidRows] = useState<ValidRow[]>([]);
  const [errorRows, setErrorRows] = useState<ErrorRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      const examList = await getExams();
      setExams(examList);
      setLoading(false);
    };
    fetchExams();
  }, []);

  const resetState = () => {
    setStep('select_file');
    setFileName('');
    setValidRows([]);
    setErrorRows([]);
    if (fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }

  const handleDownloadTemplate = () => {
     const ws_data = [{ 
        pertanyaan: "Contoh: Apa ibukota Indonesia?",
        opsi_a: "Surabaya",
        opsi_b: "Jakarta",
        opsi_c: "Bandung",
        opsi_d: "Medan",
        opsi_e: "Makassar (opsional, kosongkan jika 4 opsi)",
        jawaban_benar: "B"
    }];
    const ws = window.XLSX.utils.json_to_sheet(ws_data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Template Soal");
    window.XLSX.writeFile(wb, "template_import_soal.xlsx");
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = window.XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json: any[] = window.XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        validateData(json);
        setStep('preview');
      } catch (error) {
        console.error("Error parsing file:", error);
        setErrorRows([{ row: 0, error: "Gagal memproses file. Pastikan format file benar (XLSX, XLS, CSV)." }]);
        setStep('preview');
      } finally {
        setLoading(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const validateData = (data: any[]) => {
    const valid: ValidRow[] = [];
    const errors: ErrorRow[] = [];
    const requiredCols = ['pertanyaan', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'jawaban_benar'];
    const validAnswers = new Set(['A', 'B', 'C', 'D', 'E']);

    data.forEach((row, index) => {
        const rowNum = index + 2; // Excel rows are 1-based, plus header
        
        for (const col of requiredCols) {
            if (!row[col] || row[col].toString().trim() === "") {
                errors.push({ row: rowNum, error: `Kolom '${col}' tidak boleh kosong.` });
                return;
            }
        }
        
        const answer = row.jawaban_benar.toString().toUpperCase().trim();
        if (!validAnswers.has(answer)) {
            errors.push({ row: rowNum, error: `Jawaban '${answer}' tidak valid. Gunakan A, B, C, D, atau E.`});
            return;
        }

        const hasOpsiE = row.opsi_e && row.opsi_e.toString().trim() !== "";
        if (answer === 'E' && !hasOpsiE) {
            errors.push({ row: rowNum, error: "Jawaban 'E' tidak valid karena Opsi E kosong." });
            return;
        }

        const newQuestion: ValidRow = {
            pertanyaan: row.pertanyaan.toString().trim(),
            opsi_a: row.opsi_a.toString().trim(),
            opsi_b: row.opsi_b.toString().trim(),
            opsi_c: row.opsi_c.toString().trim(),
            opsi_d: row.opsi_d.toString().trim(),
            jawaban_benar: answer as AnswerOption,
        };

        if (hasOpsiE) {
            newQuestion.opsi_e = row.opsi_e.toString().trim();
            newQuestion.jumlah_opsi = 5;
        } else {
            newQuestion.jumlah_opsi = 4;
        }

        valid.push(newQuestion);
    });

    setValidRows(valid);
    setErrorRows(errors);
  };

  const handleImport = async () => {
    if (!selectedExamId || validRows.length === 0 || errorRows.length > 0) return;
    
    setStep('importing');
    setLoading(true);

    try {
        const examId = parseInt(selectedExamId, 10);
        for (const question of validRows) {
            await addQuestion({ ...question, id_ujian: examId });
        }
        setStep('complete');
    } catch (error) {
        console.error("Error during import:", error);
        setErrorRows([{ row: 0, error: "Terjadi kesalahan saat menyimpan soal ke database." }]);
        setStep('preview'); // Go back to preview to show the error
    } finally {
        setLoading(false);
    }
  };


  const renderSelectFile = () => (
    <div className="text-center">
        <h3 className="text-xl font-bold mb-4">Langkah 1: Pilih Ujian & Upload File</h3>
        <div className="max-w-md mx-auto space-y-4">
            <select
                value={selectedExamId}
                onChange={(e) => setSelectedExamId(e.target.value)}
                className="input-field w-full"
            >
                <option value="" disabled>-- Pilih Ujian Tujuan --</option>
                {exams.map(exam => <option key={exam.id_ujian} value={exam.id_ujian}>{exam.nama_ujian}</option>)}
            </select>
            
            <div 
                className={`relative border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${selectedExamId ? 'border-primary-500 bg-primary-500/10 hover:bg-primary-500/20' : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 cursor-not-allowed'}`}
                onClick={() => selectedExamId && fileInputRef.current?.click()}
            >
                <IconUpload className={`h-12 w-12 mx-auto ${selectedExamId ? 'text-primary-500' : 'text-slate-400'}`} />
                <p className={`mt-2 font-semibold ${selectedExamId ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500'}`}>
                    {selectedExamId ? 'Klik atau jatuhkan file Excel di sini' : 'Pilih ujian terlebih dahulu'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Hanya file .xlsx, .xls, .csv yang didukung</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".xlsx, .xls, .csv" className="hidden" disabled={!selectedExamId}/>
            </div>

            <button onClick={handleDownloadTemplate} className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                Tidak punya template? Download di sini.
            </button>
        </div>
    </div>
  );

  const renderPreview = () => (
    <div>
        <h3 className="text-xl font-bold mb-4">Langkah 2: Validasi & Pratinjau</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">File: <strong>{fileName}</strong></p>
        
        {errorRows.length > 0 && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <h4 className="font-bold text-red-600 dark:text-red-400 flex items-center mb-2"><IconAlertTriangle className="h-5 w-5 mr-2"/>Ditemukan {errorRows.length} Kesalahan</h4>
                <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1 max-h-40 overflow-y-auto">
                    {errorRows.map((err, i) => <li key={i}>{err.row > 0 && `Baris ${err.row}: `}{err.error}</li>)}
                </ul>
            </div>
        )}
        
        {validRows.length > 0 && (
            <div className="mb-6">
                <h4 className="font-bold text-green-600 dark:text-green-400 mb-2">{validRows.length} soal siap untuk diimpor.</h4>
                <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0">
                            <tr>
                                <th className="p-2 text-left">Pertanyaan</th>
                                <th className="p-2 text-left">Jawaban Benar</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700 dark:text-slate-300">
                            {validRows.map((q, i) => (
                                <tr key={i} className="border-b border-slate-200 dark:border-slate-700">
                                    <td className="p-2 truncate" style={{maxWidth: '300px'}}>{q.pertanyaan}</td>
                                    <td className="p-2 font-mono">{q.jawaban_benar}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center mt-6">
            <button onClick={resetState} className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">
                Upload File Lain
            </button>
            <button
                onClick={handleImport}
                disabled={validRows.length === 0 || errorRows.length > 0}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-primary-400 dark:disabled:bg-primary-700/50 disabled:cursor-not-allowed"
            >
                <IconClipboardCheck className="h-5 w-5" />
                <span>Simpan {validRows.length} Soal</span>
            </button>
        </div>
    </div>
  );
  
  const renderComplete = () => (
    <div className="text-center py-10">
        <IconClipboardCheck className="h-16 w-16 mx-auto text-green-500"/>
        <h3 className="text-2xl font-bold mt-4">Impor Selesai!</h3>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
            <strong>{validRows.length}</strong> soal telah berhasil ditambahkan ke ujian <strong>{exams.find(e => e.id_ujian === parseInt(selectedExamId))?.nama_ujian}</strong>.
        </p>
        <div className="mt-8 space-x-4">
             <button onClick={onBack} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">
                Kembali ke Dashboard
            </button>
            <button onClick={resetState} className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-bold transition">
                Impor Lagi
            </button>
        </div>
    </div>
  );

  const renderContent = () => {
    if (loading) {
        return <div className="flex justify-center items-center py-10"><IconLoader className="h-8 w-8 animate-spin text-primary-500" /><p className="ml-4">Memuat...</p></div>
    }

    switch(step) {
        case 'select_file': return renderSelectFile();
        case 'preview': return renderPreview();
        case 'importing': return <div className="flex justify-center items-center py-10"><IconLoader className="h-8 w-8 animate-spin text-primary-500" /><p className="ml-4">Menyimpan soal...</p></div>;
        case 'complete': return renderComplete();
        default: return null;
    }
  }


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
          <IconArrowLeft className="h-5 w-5" />
          <span>Kembali ke Dashboard</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Import Soal dari Excel</h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default QuestionImport;