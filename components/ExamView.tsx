import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getQuestionsForExam, submitExam, logActivity } from '../services/api';
import { Ujian, Soal, User, AnswerOption, JawabanSiswa, Hasil, ActivityType } from '../types';
import Timer from './Timer';
import QuestionNavigator from './QuestionNavigator';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { IconLoader, IconChevronLeft, IconChevronRight, IconFlag, IconClipboardCheck, IconClipboardList, IconAlertTriangle, IconX, IconMaximize } from './icons/Icons';
import { Logo } from './Logo';

interface ExamViewProps {
  ujian: Ujian & { nama_paket: string; mata_pelajaran: string; jumlah_soal: number };
  user: User;
  onFinishExam: (result: Hasil) => void;
}

// Define component outside to prevent re-creation on re-renders
const ConfirmationModal: React.FC<{ onConfirm: () => void; onCancel: () => void; }> = ({ onConfirm, onCancel }) => (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-4">Konfirmasi Selesai Ujian</h2>
            <p className="text-slate-600 dark:text-slate-300 mb-6">Apakah Anda yakin ingin menyelesaikan ujian ini? Jawaban tidak dapat diubah setelah diserahkan.</p>
            <div className="flex justify-end space-x-4">
                <button onClick={onCancel} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Batal</button>
                <button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition">Yakin & Selesaikan</button>
            </div>
        </div>
    </div>
);

const PreviewModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
  questions: Soal[];
  answers: Record<number, AnswerOption | null>;
}> = ({ isOpen, onClose, onFinish, questions, answers }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full flex flex-col" style={{ height: '90vh' }}>
        <header className="p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold">Pratinjau Jawaban</h2>
        </header>
        <main className="flex-grow overflow-y-auto p-6 space-y-6">
          {questions.map((q, index) => (
             <div key={q.id_soal} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">Soal #{index + 1}</p>
                <p className="mt-1" dangerouslySetInnerHTML={{ __html: q.pertanyaan }} />
                <p className="mt-2 text-sm font-semibold">Jawaban Anda: <span className="text-primary-600 dark:text-primary-400">{answers[q.id_soal] || 'Belum Dijawab'}</span></p>
            </div>
          ))}
        </main>
        <footer className="flex justify-end space-x-4 p-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600">Kembali Mengerjakan</button>
          <button onClick={onFinish} className="px-6 py-2 rounded-lg bg-green-600 text-white">Selesaikan Ujian</button>
        </footer>
      </div>
    </div>
  );
};

type ProcessedSoal = Soal & { shuffledOptions?: { key: AnswerOption; text: string }[]; };

const ExamView: React.FC<ExamViewProps> = ({ ujian, user, onFinishExam }) => {
  const [examStarted, setExamStarted] = useState(false);
  const [showTabSwitchWarning, setShowTabSwitchWarning] = useState(false);
  const [requiresFullscreenReentry, setRequiresFullscreenReentry] = useState(false);
  const isFinishing = useRef(false);
  
  useAntiCheat({
    onTabSwitch: () => {
      setShowTabSwitchWarning(true);
      logActivity(user.id_user, ujian.id_ujian, ActivityType.TAB_SWITCH);
    },
    onFullscreenExit: () => {
        if (!isFinishing.current) {
            logActivity(user.id_user, ujian.id_ujian, ActivityType.FULLSCREEN_EXIT);
            setRequiresFullscreenReentry(true);
        }
    },
    enabled: examStarted
  });

  const [questions, setQuestions] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerOption | null>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  const processedQuestions = useMemo<ProcessedSoal[]>(() => {
    let tempQuestions: ProcessedSoal[] = JSON.parse(JSON.stringify(questions));
    if (ujian.acak_soal) tempQuestions.sort(() => Math.random() - 0.5);
    if (ujian.acak_opsi) {
      tempQuestions = tempQuestions.map(q => {
        let options = [{ key: AnswerOption.A, text: q.opsi_a }, { key: AnswerOption.B, text: q.opsi_b }, { key: AnswerOption.C, text: q.opsi_c }, { key: AnswerOption.D, text: q.opsi_d }];
        if (q.jumlah_opsi === 5 && q.opsi_e) options.push({ key: AnswerOption.E, text: q.opsi_e });
        return { ...q, shuffledOptions: options.sort(() => Math.random() - 0.5) };
      });
    }
    return tempQuestions;
  }, [questions, ujian.acak_soal, ujian.acak_opsi]);
  
  const finishExam = useCallback(async () => {
    isFinishing.current = true;
    if (document.fullscreenElement) await document.exitFullscreen();
    const studentAnswers: JawabanSiswa[] = processedQuestions.map(q => ({ id_soal: q.id_soal, jawaban: answers[q.id_soal] || null }));
    const result = await submitExam(user.id_user, ujian.id_ujian, studentAnswers);
    onFinishExam(result);
  }, [user.id_user, ujian.id_ujian, answers, onFinishExam, processedQuestions]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const fetchedQuestions = await getQuestionsForExam(ujian.id_ujian);
      setQuestions(fetchedQuestions);
      setAnswers(fetchedQuestions.reduce((acc, q) => ({ ...acc, [q.id_soal]: null }), {}));
      setLoading(false);
    };
    fetchQuestions();
  }, [ujian.id_ujian]);

  const handleAnswerSelect = useCallback((id_soal: number, answer: AnswerOption) => setAnswers(prev => ({ ...prev, [id_soal]: answer })), []);
  
  const handleToggleFlag = (questionId: number) => {
    setFlaggedQuestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(questionId)) newSet.delete(questionId);
        else newSet.add(questionId);
        return newSet;
    });
  };

  const handleStartExamAttempt = async () => {
    const element = document.documentElement as any;
    try {
      if (element.requestFullscreen) await element.requestFullscreen();
      else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen();
      else if (element.msRequestFullscreen) await element.msRequestFullscreen();
      setExamStarted(true);
    } catch (err) {
      alert("Gagal masuk mode layar penuh. Ujian akan tetap dimulai, namun disarankan untuk mengaktifkan manual.");
      setExamStarted(true);
    }
  };
  
  const handleReenterFullscreen = async () => {
    const element = document.documentElement as any;
    try {
      if (element.requestFullscreen) await element.requestFullscreen();
      else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen();
      else if (element.msRequestFullscreen) await element.msRequestFullscreen();
      setRequiresFullscreenReentry(false);
    } catch (err) {
        // User might have denied it, do nothing, they are stuck on the overlay.
    }
  };

  if (!examStarted) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
            <div className="text-center bg-white dark:bg-slate-800 p-10 rounded-2xl shadow-2xl max-w-lg">
                <IconMaximize className="h-16 w-16 mx-auto text-primary-500 mb-6" />
                <h1 className="text-3xl font-bold mb-2">Ujian akan dimulai</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8">Ujian ini akan berjalan dalam mode layar penuh untuk menjaga fokus dan integritas.</p>
                <button onClick={handleStartExamAttempt} className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-lg text-lg">Mulai Ujian Sekarang</button>
            </div>
        </div>
    );
  }

  if (loading || processedQuestions.length === 0) return <div className="min-h-screen flex items-center justify-center"><IconLoader className="h-12 w-12 animate-spin text-primary-500" /></div>;
  
  const currentQuestion = processedQuestions[currentQuestionIndex];
  
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      {requiresFullscreenReentry && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-[100]">
            <IconAlertTriangle className="h-16 w-16 text-yellow-400 mb-4" />
            <h2 className="text-3xl font-bold text-white mb-2">Mode Layar Penuh Diperlukan</h2>
            <p className="text-slate-300 mb-8">Anda harus kembali ke mode layar penuh untuk melanjutkan ujian.</p>
            <button onClick={handleReenterFullscreen} className="flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-lg">
                <IconMaximize className="h-5 w-5 mr-2" />
                Masuk Kembali ke Layar Penuh
            </button>
        </div>
      )}
      {showConfirmModal && <ConfirmationModal onConfirm={() => { setShowConfirmModal(false); finishExam(); }} onCancel={() => setShowConfirmModal(false)} />}
      <PreviewModal isOpen={showPreviewModal} onClose={() => setShowPreviewModal(false)} onFinish={() => { setShowPreviewModal(false); setShowConfirmModal(true); }} questions={processedQuestions} answers={answers}/>
      {showTabSwitchWarning && (<div className="bg-yellow-500 text-white p-3 flex justify-between items-center text-sm z-20"><div className="flex items-center"><IconAlertTriangle className="h-5 w-5 mr-2" /><span>PERINGATAN: Beralih dari jendela ujian terdeteksi.</span></div><button onClick={() => setShowTabSwitchWarning(false)}><IconX className="h-5 w-5" /></button></div>)}
      
      <header className="bg-white dark:bg-slate-800 shadow-md p-3 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center space-x-4">
            <Logo className="h-12 w-12" />
            <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">SMKN 9 Bulukumba</p>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{ujian.nama_paket}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{ujian.mata_pelajaran}</p>
            </div>
        </div>
        <div className="flex items-center space-x-4">
             <button 
                onClick={() => handleToggleFlag(currentQuestion.id_soal)} 
                className={`hidden md:flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    flaggedQuestions.has(currentQuestion.id_soal) 
                    ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' 
                    : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
            >
                <IconFlag className="h-5 w-5" />
                <span>{flaggedQuestions.has(currentQuestion.id_soal) ? 'Hapus Tanda' : 'Tandai Soal'}</span>
            </button>
            <Timer durationInMinutes={ujian.durasi} onTimeUp={finishExam} />
        </div>
      </header>

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <main className="flex-grow p-4 md:p-8 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Soal No. {currentQuestionIndex + 1}</p>
            <div className="text-lg leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: currentQuestion.pertanyaan }} />
            <div className="space-y-4">
              {(currentQuestion.shuffledOptions || []).map((option, index) => (
                  <label key={option.key} className={`flex items-start p-4 rounded-lg border-2 cursor-pointer ${answers[currentQuestion.id_soal] === option.key ? 'bg-primary-500/10 border-primary-500' : 'bg-slate-100 dark:bg-slate-700/50 hover:border-primary-400'}`}>
                    <input type="radio" name={`q-${currentQuestion.id_soal}`} className="sr-only" onChange={() => handleAnswerSelect(currentQuestion.id_soal, option.key)} checked={answers[currentQuestion.id_soal] === option.key}/>
                    <span className={`font-bold mr-4 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full border-2 ${answers[currentQuestion.id_soal] === option.key ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-400'}`}>{String.fromCharCode(65 + index)}</span>
                    <span className="flex-grow">{option.text}</span>
                  </label>
              ))}
            </div>
          </div>
        </main>
        <aside className="w-full md:w-80 bg-white/50 dark:bg-slate-800/50 p-4 shrink-0 overflow-y-auto border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700">
           <QuestionNavigator questionCount={processedQuestions.length} currentIndex={currentQuestionIndex} answers={answers} questions={processedQuestions} onSelectQuestion={setCurrentQuestionIndex} flaggedQuestions={flaggedQuestions}/>
          <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm">Dijawab: <span className="font-bold">{Object.values(answers).filter(a => a !== null).length} / {processedQuestions.length}</span></div>
          <div className="mt-4 flex flex-col space-y-2">
              <div className="flex justify-between">
                <button onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0} className="w-full mr-1 flex items-center justify-center px-4 py-3 bg-slate-200 dark:bg-slate-600 rounded-lg disabled:opacity-50"><IconChevronLeft className="h-5 w-5 mr-1" /> Prev</button>
                <button onClick={() => setCurrentQuestionIndex(p => Math.min(processedQuestions.length - 1, p + 1))} disabled={currentQuestionIndex === processedQuestions.length - 1} className="w-full ml-1 flex items-center justify-center px-4 py-3 bg-slate-200 dark:bg-slate-600 rounded-lg disabled:opacity-50">Next <IconChevronRight className="h-5 w-5 ml-1" /></button>
              </div>
               <button onClick={() => handleToggleFlag(currentQuestion.id_soal)} className={`w-full flex items-center justify-center px-4 py-3 font-bold rounded-lg md:hidden ${flaggedQuestions.has(currentQuestion.id_soal) ? 'bg-yellow-500/20 text-yellow-600' : 'bg-slate-200 dark:bg-slate-600'}`}><IconFlag className="h-5 w-5 mr-2" /> {flaggedQuestions.has(currentQuestion.id_soal) ? 'Hapus Tanda' : 'Tandai'}</button>
              <button onClick={() => setShowPreviewModal(true)} className="w-full flex items-center justify-center px-4 py-3 bg-sky-600 text-white font-bold rounded-lg"><IconClipboardList className="h-5 w-5 mr-2" /> Preview</button>
              <button onClick={() => setShowConfirmModal(true)} className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white font-bold rounded-lg"><IconClipboardCheck className="h-5 w-5 mr-2" /> Selesaikan</button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ExamView;