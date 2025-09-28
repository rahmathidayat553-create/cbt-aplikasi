import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getQuestionsForExam, submitExam } from '../services/api';
import { Ujian, Soal, User, AnswerOption, JawabanSiswa, Hasil } from '../types';
import Timer from './Timer';
import QuestionNavigator from './QuestionNavigator';
import { useAntiCheat } from '../hooks/useAntiCheat';
import { IconLoader, IconChevronLeft, IconChevronRight, IconFlag, IconClipboardCheck, IconClipboardList } from './icons/Icons';

interface ExamViewProps {
  ujian: Ujian;
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
          <p className="text-slate-500 dark:text-slate-400">Tinjau jawaban Anda sebelum menyelesaikan ujian.</p>
        </header>
        <main className="flex-grow overflow-y-auto p-6 space-y-6">
          {questions.map((q, index) => {
            const selectedAnswer = answers[q.id_soal];
            return (
              <div key={q.id_soal} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">Soal #{index + 1}</p>
                <p className="mt-1 text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: q.pertanyaan }} />
                {q.gambar && <img src={q.gambar} alt={`Ilustrasi soal ${index + 1}`} className="my-2 rounded-lg max-w-xs" />}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {(Object.keys(AnswerOption) as Array<keyof typeof AnswerOption>).map(key => {
                    const optionKey = `opsi_${key.toLowerCase()}` as keyof Soal;
                    return (
                        <p key={key} className={selectedAnswer === AnswerOption[key] ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                            {key}. {q[optionKey] as string}
                        </p>
                    );
                  })}
                </div>
                 {selectedAnswer === null && <p className="mt-2 text-sm text-yellow-600 dark:text-yellow-400 font-semibold">Belum dijawab</p>}
              </div>
            );
          })}
        </main>
        <footer className="flex justify-end space-x-4 p-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <button onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Kembali Mengerjakan</button>
          <button onClick={onFinish} className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition">Selesaikan Ujian</button>
        </footer>
      </div>
    </div>
  );
};

const ExamView: React.FC<ExamViewProps> = ({ ujian, user, onFinishExam }) => {
  useAntiCheat();
  const [questions, setQuestions] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerOption | null>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  const shuffledQuestions = useMemo(() => {
    // In a real scenario, shuffling should be done once and stored.
    // For this mock, we shuffle when questions are fetched.
    return [...questions].sort(() => Math.random() - 0.5);
  }, [questions]);
  
  const finishExam = useCallback(async () => {
    const studentAnswers: JawabanSiswa[] = shuffledQuestions.map(q => ({
      id_soal: q.id_soal,
      jawaban: answers[q.id_soal] || null,
    }));
    const result = await submitExam(user.id_user, ujian.id_ujian, studentAnswers);
    onFinishExam(result);
  }, [user.id_user, ujian.id_ujian, answers, onFinishExam, shuffledQuestions]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const fetchedQuestions = await getQuestionsForExam(ujian.id_ujian);
      setQuestions(fetchedQuestions);
      const initialAnswers: Record<number, AnswerOption | null> = {};
      fetchedQuestions.forEach(q => { initialAnswers[q.id_soal] = null; });
      setAnswers(initialAnswers);
      setLoading(false);
    };
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ujian.id_ujian]);


  const handleAnswerSelect = useCallback((id_soal: number, answer: AnswerOption) => {
    setAnswers(prev => ({ ...prev, [id_soal]: answer }));
  }, []);
  
  const handleToggleFlag = (questionId: number) => {
    setFlaggedQuestions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(questionId)) {
            newSet.delete(questionId);
        } else {
            newSet.add(questionId);
        }
        return newSet;
    });
  };

  const handleFinishClick = () => {
    setShowConfirmModal(true);
  };
  
  const confirmFinish = () => {
    setShowConfirmModal(false);
    finishExam();
  };

  const handlePreviewFinish = () => {
    setShowPreviewModal(false);
    handleFinishClick();
  };

  if (loading) {
    return <div className="min-h-screen flex flex-col items-center justify-center"><IconLoader className="h-12 w-12 animate-spin text-primary-500" /><p className="mt-4">Memuat soal...</p></div>;
  }
  
  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const answeredCount = Object.values(answers).filter(a => a !== null).length;

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-900">
      {showConfirmModal && <ConfirmationModal onConfirm={confirmFinish} onCancel={() => setShowConfirmModal(false)} />}
      <PreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onFinish={handlePreviewFinish}
        questions={shuffledQuestions}
        answers={answers}
      />
      <header className="bg-white dark:bg-slate-800 shadow-md p-4 flex justify-between items-center shrink-0 z-10">
        <div>
          <h1 className="text-xl font-bold">{ujian.nama_ujian}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{ujian.mata_pelajaran}</p>
        </div>
        <Timer durationInMinutes={ujian.durasi} onTimeUp={finishExam} />
      </header>

      <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
        <main className="flex-grow p-4 md:p-8 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Soal No. {currentQuestionIndex + 1}</p>
            <div className="text-lg leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: currentQuestion.pertanyaan }} />
            {currentQuestion.gambar && <img src={currentQuestion.gambar} alt="Ilustrasi soal" className="my-4 rounded-lg max-w-sm mx-auto" />}
            <div className="space-y-4">
              {(Object.keys(AnswerOption) as Array<keyof typeof AnswerOption>).map(key => {
                const optionKey = `opsi_${key.toLowerCase()}` as keyof Soal;
                return (
                  <label key={key} className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[currentQuestion.id_soal] === AnswerOption[key] ? 'bg-primary-500/10 dark:bg-primary-500/20 border-primary-500' : 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 hover:border-primary-400'}`}>
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id_soal}`}
                      className="sr-only"
                      onChange={() => handleAnswerSelect(currentQuestion.id_soal, AnswerOption[key])}
                      checked={answers[currentQuestion.id_soal] === AnswerOption[key]}
                    />
                    <span className={`font-bold mr-4 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full border-2 ${answers[currentQuestion.id_soal] === AnswerOption[key] ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-400 dark:border-slate-500 text-slate-500 dark:text-slate-400'}`}>{key}</span>
                    <span className="flex-grow">{currentQuestion[optionKey] as string}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </main>

        <aside className="w-full md:w-80 bg-white/50 dark:bg-slate-800/50 p-4 shrink-0 overflow-y-auto border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700">
           <QuestionNavigator
            questionCount={shuffledQuestions.length}
            currentIndex={currentQuestionIndex}
            answers={answers}
            questions={shuffledQuestions}
            onSelectQuestion={setCurrentQuestionIndex}
            flaggedQuestions={flaggedQuestions}
          />
          <div className="mt-4 p-4 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm">
            <p>Dijawab: <span className="font-bold">{answeredCount} / {shuffledQuestions.length}</span></p>
          </div>
          <div className="mt-4 flex flex-col space-y-2">
              <div className="flex justify-between">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="w-full mr-1 flex items-center justify-center px-4 py-3 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <IconChevronLeft className="h-5 w-5 mr-1" /> Previous
                </button>
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(shuffledQuestions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === shuffledQuestions.length - 1}
                  className="w-full ml-1 flex items-center justify-center px-4 py-3 bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <IconChevronRight className="h-5 w-5 ml-1" />
                </button>
              </div>
               <button
                onClick={() => handleToggleFlag(currentQuestion.id_soal)}
                className={`w-full flex items-center justify-center px-4 py-3 font-bold rounded-lg transition-colors ${
                  flaggedQuestions.has(currentQuestion.id_soal)
                    ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-500'
                }`}
              >
                <IconFlag className="h-5 w-5 mr-2" /> 
                {flaggedQuestions.has(currentQuestion.id_soal) ? 'Hapus Tanda' : 'Tandai Soal'}
              </button>
              <button
                onClick={() => setShowPreviewModal(true)}
                className="w-full flex items-center justify-center px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg"
                >
                <IconClipboardList className="h-5 w-5 mr-2" /> Preview Jawaban
              </button>
              <button
                onClick={handleFinishClick}
                className="w-full flex items-center justify-center px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg"
              >
                <IconClipboardCheck className="h-5 w-5 mr-2" /> Selesaikan Ujian
              </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ExamView;