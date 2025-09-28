import React, { useState, useEffect, useCallback } from 'react';
import { Ujian, Soal, AnswerOption } from '../types';
import { getQuestionsForExam, addQuestion, updateQuestion, deleteQuestion } from '../services/api';
import { IconArrowLeft, IconEdit, IconLoader, IconPlus, IconTrash, IconFileText, IconClock, IconBookOpen } from './icons/Icons';

interface ExamDetailsProps {
  exam: Ujian;
  onBack: () => void;
}

const QuestionFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: Omit<Soal, 'id_soal' | 'id_ujian'> | (Partial<Soal> & { id_soal: number })) => void;
  initialData?: Soal | null;
}> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    pertanyaan: '',
    opsi_a: '',
    opsi_b: '',
    opsi_c: '',
    opsi_d: '',
    jawaban_benar: AnswerOption.A,
    gambar: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        pertanyaan: initialData.pertanyaan,
        opsi_a: initialData.opsi_a,
        opsi_b: initialData.opsi_b,
        opsi_c: initialData.opsi_c,
        opsi_d: initialData.opsi_d,
        jawaban_benar: initialData.jawaban_benar,
        gambar: initialData.gambar || '',
      });
    } else {
      setFormData({
        pertanyaan: '',
        opsi_a: '',
        opsi_b: '',
        opsi_c: '',
        opsi_d: '',
        jawaban_benar: AnswerOption.A,
        gambar: '',
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit: any = { ...formData };
    if (initialData) {
        dataToSubmit.id_soal = initialData.id_soal;
    }
    if (!dataToSubmit.gambar) {
        delete dataToSubmit.gambar;
    }
    onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Soal' : 'Tambah Soal Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <textarea name="pertanyaan" value={formData.pertanyaan} onChange={handleChange} placeholder="Tulis pertanyaan di sini..." rows={4} className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            <input name="opsi_a" value={formData.opsi_a} onChange={handleChange} placeholder="Opsi A" className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            <input name="opsi_b" value={formData.opsi_b} onChange={handleChange} placeholder="Opsi B" className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            <input name="opsi_c" value={formData.opsi_c} onChange={handleChange} placeholder="Opsi C" className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            <input name="opsi_d" value={formData.opsi_d} onChange={handleChange} placeholder="Opsi D" className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" required />
            <select name="jawaban_benar" value={formData.jawaban_benar} onChange={handleChange} className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500">
              {Object.keys(AnswerOption).map(key => <option key={key} value={key}>{`Opsi ${key}`}</option>)}
            </select>
            <input name="gambar" value={formData.gambar} onChange={handleChange} placeholder="URL Gambar (Opsional)" className="shadow appearance-none border border-slate-300 dark:border-slate-700 rounded-lg w-full py-3 px-4 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white leading-tight focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Batal</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition">Simpan</button>
            </div>
        </form>
      </div>
    </div>
  );
};

const ExamDetails: React.FC<ExamDetailsProps> = ({ exam, onBack }) => {
  const [questions, setQuestions] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Soal | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Soal | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const questionList = await getQuestionsForExam(exam.id_ujian);
    setQuestions(questionList);
    setLoading(false);
  }, [exam.id_ujian]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleOpenModal = (question: Soal | null = null) => {
    setEditingQuestion(question);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleSubmit = async (questionData: any) => {
    if (questionData.id_soal) {
      await updateQuestion(questionData.id_soal, questionData);
    } else {
      await addQuestion({ ...questionData, id_ujian: exam.id_ujian });
    }
    fetchQuestions();
    // In a real app, the parent would refetch the exam list to get updated counts
    handleCloseModal();
  };
  
  const handleDelete = async (question: Soal) => {
    await deleteQuestion(question.id_soal);
    fetchQuestions();
    setDeletingQuestion(null);
  };

  return (
    <div>
      <QuestionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingQuestion}
      />
       {deletingQuestion && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full text-center">
                <h2 className="text-2xl font-bold mb-4">Hapus Soal?</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Apakah Anda yakin ingin menghapus soal ini?</p>
                <div className="flex justify-center space-x-4">
                    <button onClick={() => setDeletingQuestion(null)} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Batal</button>
                    <button onClick={() => handleDelete(deletingQuestion)} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">Ya, Hapus</button>
                </div>
            </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <IconArrowLeft className="h-5 w-5" />
            <span>Kembali ke Manajemen Ujian</span>
        </button>
      </div>
      
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{exam.nama_ujian}</h2>
        <p className="text-slate-500 dark:text-slate-400">{exam.mata_pelajaran}</p>
        <div className="flex items-center space-x-6 mt-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center space-x-2"><IconBookOpen className="h-5 w-5" /> <span>{questions.length} Soal</span></div>
            <div className="flex items-center space-x-2"><IconClock className="h-5 w-5" /> <span>{exam.durasi} Menit</span></div>
        </div>
      </div>


      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center"><IconFileText className="h-6 w-6 mr-2" /> Daftar Soal</h3>
            <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <IconPlus className="h-5 w-5" />
                <span>Tambah Soal</span>
            </button>
        </div>
        
        {loading ? (
            <div className="flex justify-center items-center py-10">
                <IconLoader className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        ) : questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id_soal} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-start">
                  <div className="flex-grow">
                      <p className="font-semibold text-slate-500 dark:text-slate-400 text-sm">Soal #{index + 1}</p>
                      <p className="mt-1 text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: q.pertanyaan }} />
                  </div>
                  <div className="flex-shrink-0 ml-4 space-x-1">
                      <button onClick={() => handleOpenModal(q)} className="p-2 text-yellow-500 dark:text-yellow-400 hover:bg-yellow-500/10 rounded-full" aria-label="Edit"><IconEdit className="h-5 w-5"/></button>
                      <button onClick={() => setDeletingQuestion(q)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full" aria-label="Delete"><IconTrash className="h-5 w-5"/></button>
                  </div>
              </div>
               <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <p className={q.jawaban_benar === 'A' ? 'text-green-600 dark:text-green-400 font-bold' : ''}>A. {q.opsi_a}</p>
                  <p className={q.jawaban_benar === 'B' ? 'text-green-600 dark:text-green-400 font-bold' : ''}>B. {q.opsi_b}</p>
                  <p className={q.jawaban_benar === 'C' ? 'text-green-600 dark:text-green-400 font-bold' : ''}>C. {q.opsi_c}</p>
                  <p className={q.jawaban_benar === 'D' ? 'text-green-600 dark:text-green-400 font-bold' : ''}>D. {q.opsi_d}</p>
              </div>
            </div>
          ))}
        </div>
        ) : (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                <p>Belum ada soal untuk ujian ini.</p>
                <p>Klik "Tambah Soal" untuk memulai.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default ExamDetails;