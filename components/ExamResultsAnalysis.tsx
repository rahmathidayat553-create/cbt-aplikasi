// FIX: Declare XLSX on the window object to resolve TypeScript errors.
// This is necessary when the 'xlsx' library is loaded via a script tag.
declare global {
  interface Window { XLSX: any; }
}
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { Ujian, ExamResultWithUser, Soal } from '../types';
import { getExams, getResultsForExam, getQuestionsForExam } from '../services/api';
import { IconArrowLeft, IconLoader, IconFileSpreadsheet, IconTrophy } from './icons/Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ThemeContext } from '../App';

interface ExamResultsAnalysisProps {
  onBack: () => void;
}

type AnalysisView = 'list' | 'details';
type DetailTab = 'results' | 'analysis';

// FIX: Define a more detailed type for Ujian that includes properties returned by the API.
type FormattedUjian = Ujian & { nama_paket: string; mata_pelajaran: string; jumlah_soal: number; };

interface ItemAnalysisData {
  id_soal: number;
  pertanyaan: string;
  jawaban_benar: string;
  distractors: { A: number; B: number; C: number; D: number; E?: number; unanswered: number };
  correctCount: number;
  totalAttempts: number;
  difficulty: { value: number; label: string };
  discrimination: { value: number; label: string };
}

const ExamResultsAnalysis: React.FC<ExamResultsAnalysisProps> = ({ onBack }) => {
  const [view, setView] = useState<AnalysisView>('list');
  // FIX: Use the more specific FormattedUjian type for the exams state.
  const [exams, setExams] = useState<FormattedUjian[]>([]);
  // FIX: Use the more specific FormattedUjian type for the selectedExam state.
  const [selectedExam, setSelectedExam] = useState<FormattedUjian | null>(null);
  const [results, setResults] = useState<ExamResultWithUser[]>([]);
  const [questions, setQuestions] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState<DetailTab>('results');
  const themeContext = useContext(ThemeContext);

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      const examList = await getExams();
      // FIX: Cast to FormattedUjian as getExams returns the extended type.
      setExams(examList as FormattedUjian[]);
      setLoading(false);
    };
    fetchExams();
  }, []);

  // FIX: Update the type of the `exam` parameter.
  const handleSelectExam = useCallback(async (exam: FormattedUjian) => {
    setLoading(true);
    setSelectedExam(exam);
    const [examResults, examQuestions] = await Promise.all([
      getResultsForExam(exam.id_ujian),
      getQuestionsForExam(exam.id_ujian)
    ]);
    setResults(examResults);
    setQuestions(examQuestions);
    setView('details');
    setLoading(false);
  }, []);

  const handleBackToList = () => {
    setView('list');
    setSelectedExam(null);
    setResults([]);
    setQuestions([]);
  };
  
  const scoreDistributionData = useMemo(() => {
    if (results.length === 0) return [];

    const bins = Array(10).fill(0).map((_, i) => ({
      range: `${i * 10 + 1}-${(i + 1) * 10}`,
      count: 0,
    }));
    
    bins[9].range = "91-100"; // Adjust last bin label

    results.forEach(result => {
      if (result.nilai > 0) {
        const binIndex = Math.min(Math.floor((result.nilai - 1) / 10), 9);
        bins[binIndex].count++;
      }
    });

    return bins;
  }, [results]);

  const itemAnalysisData = useMemo<ItemAnalysisData[]>(() => {
    if (questions.length === 0 || results.length === 0) return [];
  
    const totalStudents = results.length;
    // Ensure results are sorted by score for upper/lower group analysis
    const sortedResults = [...results].sort((a, b) => b.nilai - a.nilai);
    const upperGroupSize = Math.ceil(totalStudents / 2);
    // Correctly calculate lower group size
    const lowerGroupSize = totalStudents - upperGroupSize;
    const upperGroup = sortedResults.slice(0, upperGroupSize);
    const lowerGroup = sortedResults.slice(upperGroupSize);
  
    return questions.map(q => {
      const analysis: ItemAnalysisData = {
        id_soal: q.id_soal,
        pertanyaan: q.pertanyaan,
        jawaban_benar: q.jawaban_benar,
        distractors: { A: 0, B: 0, C: 0, D: 0, unanswered: 0 },
        correctCount: 0,
        totalAttempts: totalStudents,
        difficulty: { value: 0, label: 'N/A' },
        discrimination: { value: 0, label: 'N/A' },
      };
      if (q.jumlah_opsi === 5) {
        analysis.distractors.E = 0;
      }
  
      let correctUpper = 0;
      let correctLower = 0;
  
      results.forEach(res => {
        const studentAnswer = res.jawaban_siswa.find(ans => ans.id_soal === q.id_soal);
        if (!studentAnswer || studentAnswer.jawaban === null) {
          analysis.distractors.unanswered++;
        } else {
          if (analysis.distractors[studentAnswer.jawaban] !== undefined) {
             analysis.distractors[studentAnswer.jawaban]++;
          }
          if (studentAnswer.jawaban === q.jawaban_benar) {
            analysis.correctCount++;
            // Check if user is in upper or lower group
            if (upperGroup.some(u => u.id_user === res.id_user)) correctUpper++;
            if (lowerGroup.some(l => l.id_user === res.id_user)) correctLower++;
          }
        }
      });
      
      // Difficulty Index (P)
      const diffValue = totalStudents > 0 ? analysis.correctCount / totalStudents : 0;
      analysis.difficulty = {
        value: diffValue,
        label: diffValue >= 0.7 ? 'Mudah' : diffValue >= 0.3 ? 'Sedang' : 'Sukar',
      };
      
      // Discrimination Index (D)
      const discValue = upperGroupSize > 0 && lowerGroupSize > 0 
        ? (correctUpper / upperGroupSize) - (correctLower / lowerGroupSize)
        : 0;
      analysis.discrimination = {
          value: discValue,
          label: discValue >= 0.4 ? 'Sangat Baik' : discValue >= 0.3 ? 'Baik' : discValue >= 0.2 ? 'Cukup' : 'Jelek'
      };
  
      return analysis;
    });
  }, [questions, results]);

  const exportResultsToExcel = () => {
    const data = results.map((res, index) => ({
      "Peringkat": index + 1,
      "Nama Siswa": res.user.nama_lengkap,
      "Kelas": res.user.kelas || 'N/A',
      "Nilai": res.nilai.toFixed(2),
      "Benar": res.benar,
      "Salah": res.salah,
      "Tidak Dijawab": res.tidak_dijawab,
    }));
    const ws = window.XLSX.utils.json_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Hasil Ujian");
    // FIX: Changed `nama_ujian` to `nama_paket` which is available.
    window.XLSX.writeFile(wb, `Hasil_${selectedExam?.nama_paket.replace(/ /g, "_")}.xlsx`);
  };

  const exportAnalysisToExcel = () => {
    const data = itemAnalysisData.map((item, index) => ({
      "No": index + 1,
      "Pertanyaan": item.pertanyaan.replace(/<[^>]*>?/gm, ''), // remove html tags
      "Jawaban Benar": item.jawaban_benar,
      "Jwb A": item.distractors.A,
      "Jwb B": item.distractors.B,
      "Jwb C": item.distractors.C,
      "Jwb D": item.distractors.D,
      ...(item.distractors.E !== undefined && { "Jwb E": item.distractors.E }),
      "Kosong": item.distractors.unanswered,
      "Tingkat Kesukaran": `${item.difficulty.label} (${item.difficulty.value.toFixed(2)})`,
      "Daya Pembeda": `${item.discrimination.label} (${item.discrimination.value.toFixed(2)})`,
    }));
    const ws = window.XLSX.utils.json_to_sheet(data);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Analisis Butir Soal");
    // FIX: Changed `nama_ujian` to `nama_paket` which is available.
    window.XLSX.writeFile(wb, `Analisis_${selectedExam?.nama_paket.replace(/ /g, "_")}.xlsx`);
  }

  const renderContent = () => {
    if (loading) {
      return <div className="flex justify-center items-center py-10"><IconLoader className="h-8 w-8 animate-spin text-primary-500" /></div>;
    }

    if (view === 'list') {
      return (
        <div className="space-y-4">
          {exams.length > 0 ? exams.map(exam => (
            <button key={exam.id_ujian} onClick={() => handleSelectExam(exam)} className="w-full text-left p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition">
              {/* FIX: Changed `nama_ujian` to `nama_paket` which is available. */}
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">{exam.nama_paket}</h3>
              {/* FIX: `mata_pelajaran` is now available on the typed `exam` object. */}
              <p className="text-sm text-slate-500 dark:text-slate-400">{exam.mata_pelajaran}</p>
            </button>
          )) : <p className="text-center text-slate-500 dark:text-slate-400">Tidak ada ujian yang ditemukan.</p>}
        </div>
      );
    }
    
    if (view === 'details' && selectedExam) {
      const topStudents = results.slice(0, 3);
      const rankColors = [
        'text-yellow-400', // Gold
        'text-slate-400',  // Silver
        'text-orange-400'  // Bronze
      ];
      return (
        <div>
          <button onClick={handleBackToList} className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white mb-4">
            <IconArrowLeft className="h-4 w-4" />
            <span>Kembali ke Daftar Ujian</span>
          </button>
          <div className="flex justify-between items-start mb-4">
            <div>
              {/* FIX: Changed `nama_ujian` to `nama_paket` which is available. */}
              <h3 className="text-2xl font-bold">{selectedExam.nama_paket}</h3>
              <p className="text-slate-500 dark:text-slate-400">Total Peserta: {results.length}</p>
            </div>
            {detailTab === 'results' && results.length > 0 && <button onClick={exportResultsToExcel} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg text-sm"><IconFileSpreadsheet className="h-4 w-4" /><span>Export Hasil</span></button>}
            {detailTab === 'analysis' && results.length > 0 && <button onClick={exportAnalysisToExcel} className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg text-sm"><IconFileSpreadsheet className="h-4 w-4" /><span>Export Analisis</span></button>}
          </div>

          {topStudents.length > 0 && (
            <div className="mb-8">
                <h4 className="text-xl font-bold mb-4">Peringkat Teratas</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {topStudents.map((student, index) => (
                        <div key={student.id_hasil} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 flex items-center space-x-4">
                            <IconTrophy className={`h-10 w-10 shrink-0 ${rankColors[index]}`} />
                            <div>
                                <p className="font-bold text-slate-900 dark:text-white truncate">{student.user.nama_lengkap}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Skor: <span className="font-bold text-lg text-primary-500 dark:text-primary-400">{student.nilai.toFixed(1)}</span></p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          )}

          {scoreDistributionData.length > 0 && (
             <div className="mb-8">
                <h4 className="text-xl font-bold mb-4">Distribusi Skor</h4>
                <div className="h-64 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scoreDistributionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={themeContext?.theme === 'dark' ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="range" tick={{ fill: themeContext?.theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: themeContext?.theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}
                        contentStyle={themeContext?.theme === 'dark' ? { backgroundColor: '#1e293b', border: '1px solid #334155' } : {}}
                        labelStyle={{ color: themeContext?.theme === 'dark' ? '#cbd5e1' : '#1e293b' }}
                      />
                      <Bar dataKey="count" name="Jumlah Siswa" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
          )}


          <div className="border-b border-slate-200 dark:border-slate-700 mb-4">
            <nav className="flex space-x-4" aria-label="Tabs">
              <button onClick={() => setDetailTab('results')} className={`${detailTab === 'results' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Hasil Siswa</button>
              <button onClick={() => setDetailTab('analysis')} className={`${detailTab === 'analysis' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>Analisis Butir Soal</button>
            </nav>
          </div>
          
          {results.length === 0 && <div className="text-center py-10 text-slate-500 dark:text-slate-400">Belum ada hasil untuk ujian ini.</div>}
          
          {results.length > 0 && detailTab === 'results' && (
             <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3">Peringkat</th>
                    <th className="px-4 py-3">Nama Siswa</th>
                    <th className="px-4 py-3">Nilai</th>
                    <th className="px-4 py-3">Benar</th>
                    <th className="px-4 py-3">Salah</th>
                    <th className="px-4 py-3">Kosong</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 dark:text-slate-300">
                  {results.map((res, index) => (
                    <tr key={res.id_hasil} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/20">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{res.user.nama_lengkap}</td>
                      <td className="px-4 py-3 font-bold">{res.nilai.toFixed(1)}</td>
                      <td className="px-4 py-3 text-green-600 dark:text-green-400">{res.benar}</td>
                      <td className="px-4 py-3 text-red-600 dark:text-red-400">{res.salah}</td>
                      <td className="px-4 py-3 text-slate-500">{res.tidak_dijawab}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

           {results.length > 0 && detailTab === 'analysis' && (
              <div className="space-y-4">
                {itemAnalysisData.map((item, index) => (
                  <div key={item.id_soal} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                    <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">Soal #{index + 1}</p>
                    <p className="mt-1 text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: item.pertanyaan }} />
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="col-span-2 md:col-span-4 grid grid-cols-2 md:grid-cols-6 gap-2">
                           {Object.entries(item.distractors).map(([option, count]) => (
                               <div key={option} className={`p-2 rounded-md text-center ${option === item.jawaban_benar ? 'bg-green-100 dark:bg-green-900/50 ring-1 ring-green-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                   <p className="font-bold text-slate-800 dark:text-white">{option === 'unanswered' ? 'Kosong' : `Opsi ${option}`}</p>
                                   <p className="text-slate-600 dark:text-slate-300">{count} siswa</p>
                               </div>
                           ))}
                        </div>
                        <div className="p-2 bg-sky-100 dark:bg-sky-900/50 rounded-md">
                            <p className="font-bold text-sky-800 dark:text-sky-300">Tingkat Kesukaran</p>
                            <p className="text-sky-600 dark:text-sky-400">{item.difficulty.label} ({item.difficulty.value.toFixed(2)})</p>
                        </div>
                         <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-md">
                            <p className="font-bold text-purple-800 dark:text-purple-300">Daya Pembeda</p>
                            <p className="text-purple-600 dark:text-purple-400">{item.discrimination.label} ({item.discrimination.value.toFixed(2)})</p>
                        </div>
                    </div>
                  </div>
                ))}
              </div>
          )}

        </div>
      );
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <button onClick={view === 'details' ? handleBackToList : onBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <IconArrowLeft className="h-5 w-5" />
            <span>{view === 'details' ? 'Kembali ke Daftar Ujian' : 'Kembali ke Dashboard'}</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Hasil & Analisis Ujian</h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        {renderContent()}
      </div>
    </div>
  );
};

export default ExamResultsAnalysis;