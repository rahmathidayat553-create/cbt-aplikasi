import React, { useState, useEffect, useCallback } from 'react';
import { Ujian, Soal, AnswerOption } from '../types';
import { getExams, getAllQuestions, addQuestion, updateQuestion, deleteQuestion } from '../services/api';
import { IconArrowLeft, IconEdit, IconLoader, IconPlus, IconTrash, IconFileText, IconImage, IconVolume2, IconVideo } from './icons/Icons';

interface QuestionBankProps {
  onBack: () => void;
}

const QuestionFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (question: Omit<Soal, 'id_soal'> | (Partial<Soal> & { id_soal: number })) => void;
  initialData?: Partial<Soal> | null;
  exams: Ujian[];
}> = ({ isOpen, onClose, onSubmit, initialData, exams }) => {
   const [formData, setFormData] = useState<Partial<Soal>>({
    pertanyaan: '',
    opsi_a: '',
    opsi_b: '',
    opsi_c: '',
    opsi_d: '',
    opsi_e: '',
    jawaban_benar: AnswerOption.A,
    jumlah_opsi: 4,
    gambar: undefined,
    audio: undefined,
    video: undefined,
    id_ujian: undefined,
  });
  const [videoType, setVideoType] = useState<'youtube' | 'upload'>('youtube');

  useEffect(() => {
    if (initialData) {
      setFormData({
        pertanyaan: initialData.pertanyaan || '',
        opsi_a: initialData.opsi_a || '',
        opsi_b: initialData.opsi_b || '',
        opsi_c: initialData.opsi_c || '',
        opsi_d: initialData.opsi_d || '',
        opsi_e: initialData.opsi_e || '',
        jawaban_benar: initialData.jawaban_benar || AnswerOption.A,
        jumlah_opsi: initialData.jumlah_opsi || 4,
        gambar: initialData.gambar,
        audio: initialData.audio,
        video: initialData.video,
        id_ujian: initialData.id_ujian,
      });
      setVideoType(initialData.video?.type || 'youtube');
    } else {
      setFormData({
        pertanyaan: '',
        opsi_a: '',
        opsi_b: '',
        opsi_c: '',
        opsi_d: '',
        opsi_e: '',
        jawaban_benar: AnswerOption.A,
        jumlah_opsi: 4,
        gambar: undefined,
        audio: undefined,
        video: undefined,
        id_ujian: undefined,
      });
      setVideoType('youtube');
    }
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
     if (name === 'id_ujian') {
      setFormData(prev => ({ ...prev, id_ujian: value ? parseInt(value, 10) : undefined }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleJumlahOpsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newJumlah = parseInt(e.target.value, 10) as 4 | 5;
    setFormData(prev => {
        const newState = { ...prev, jumlah_opsi: newJumlah };
        if (newJumlah === 4) {
            newState.opsi_e = '';
            if (newState.jawaban_benar === AnswerOption.E) {
                newState.jawaban_benar = AnswerOption.A;
            }
        }
        return newState;
    });
  };

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'gambar' | 'audio' | 'video') => {
      const file = e.target.files?.[0];
      if (file) {
          if (field === 'video' && file.size > 100 * 1024 * 1024) { // 100MB limit
              alert('Ukuran file video tidak boleh melebihi 100MB.');
              e.target.value = '';
              return;
          }
          const fileUrl = URL.createObjectURL(file);
          if (field === 'video') {
              setFormData(prev => ({ ...prev, video: { type: 'upload', url: fileUrl } }));
          } else {
              setFormData(prev => ({ ...prev, [field]: fileUrl }));
          }
      }
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      if (url) {
        setFormData(prev => ({ ...prev, video: { type: 'youtube', url } }));
      } else {
        setFormData(prev => ({ ...prev, video: undefined }));
      }
  };
  
  const handleClearMedia = (field: 'gambar' | 'audio' | 'video') => {
      const currentUrl = field === 'video' ? formData.video?.url : formData[field];
      if (currentUrl && currentUrl.startsWith('blob:')) {
          URL.revokeObjectURL(currentUrl);
      }
      if (field === 'video') {
        setFormData(prev => ({...prev, video: undefined }));
      } else {
        setFormData(prev => ({ ...prev, [field]: undefined }));
      }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit: any = { ...formData };
    if (initialData && initialData.id_soal) {
        dataToSubmit.id_soal = initialData.id_soal;
    }
     // Clean up empty fields
    if (!dataToSubmit.gambar) delete dataToSubmit.gambar;
    if (!dataToSubmit.audio) delete dataToSubmit.audio;
    if (!dataToSubmit.video || !dataToSubmit.video.url) delete dataToSubmit.video;
    if (dataToSubmit.id_ujian === undefined) delete dataToSubmit.id_ujian;
    if (dataToSubmit.jumlah_opsi === 4) {
        delete dataToSubmit.opsi_e;
    }

    onSubmit(dataToSubmit);
  };

  if (!isOpen) return null;

  const answerOptions = formData.jumlah_opsi === 5
    ? Object.keys(AnswerOption)
    : Object.keys(AnswerOption).filter(k => k !== 'E');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-6">{initialData && initialData.id_soal ? 'Edit Soal' : 'Tambah Soal Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <textarea name="pertanyaan" value={formData.pertanyaan} onChange={handleChange} placeholder="Tulis pertanyaan di sini..." rows={3} className="input-field" required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input name="opsi_a" value={formData.opsi_a} onChange={handleChange} placeholder="Opsi A" className="input-field" required />
              <input name="opsi_b" value={formData.opsi_b} onChange={handleChange} placeholder="Opsi B" className="input-field" required />
              <input name="opsi_c" value={formData.opsi_c} onChange={handleChange} placeholder="Opsi C" className="input-field" required />
              <input name="opsi_d" value={formData.opsi_d} onChange={handleChange} placeholder="Opsi D" className="input-field" required />
            </div>
             {formData.jumlah_opsi === 5 && (
                <input name="opsi_e" value={formData.opsi_e} onChange={handleChange} placeholder="Opsi E" className="input-field" required />
            )}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select name="jumlah_opsi" value={formData.jumlah_opsi} onChange={handleJumlahOpsiChange} className="input-field">
                    <option value={4}>4 Opsi Jawaban</option>
                    <option value={5}>5 Opsi Jawaban</option>
                </select>
                <select name="jawaban_benar" value={formData.jawaban_benar} onChange={handleChange} className="input-field">
                    {answerOptions.map(key => <option key={key} value={key}>{`Opsi ${key}`}</option>)}
                </select>
            </div>
            <select name="id_ujian" value={formData.id_ujian || ''} onChange={handleChange} className="input-field">
              <option value="">Tidak Ditugaskan (Umum)</option>
              {exams.map(exam => <option key={exam.id_ujian} value={exam.id_ujian}>{exam.nama_ujian}</option>)}
            </select>
            
            {/* Media Uploads */}
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Gambar (Opsional)</label>
                    {formData.gambar ? (
                         <div className="flex items-center space-x-2">
                             <img src={formData.gambar} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
                             <button type="button" onClick={() => handleClearMedia('gambar')} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><IconTrash className="h-4 w-4"/></button>
                         </div>
                    ) : (
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'gambar')} className="file-input" />
                    )}
                </div>
                 {/* Audio Upload */}
                <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Audio (MP3, WAV) (Opsional)</label>
                    {formData.audio ? (
                        <div className="flex items-center space-x-2">
                            <audio controls src={formData.audio} className="w-full max-w-xs h-10" />
                            <button type="button" onClick={() => handleClearMedia('audio')} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><IconTrash className="h-4 w-4" /></button>
                        </div>
                    ) : (
                        <input type="file" accept=".mp3,.wav" onChange={(e) => handleFileChange(e, 'audio')} className="file-input" />
                    )}
                </div>
                {/* Video Upload */}
                <div>
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Video (Opsional)</label>
                     {formData.video?.url ? (
                        <div className="flex items-center space-x-2">
                            <p className="text-sm truncate text-blue-500">{formData.video.url}</p>
                            <button type="button" onClick={() => handleClearMedia('video')} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full"><IconTrash className="h-4 w-4" /></button>
                        </div>
                     ) : (
                         <>
                            <div className="flex items-center space-x-4 mb-2">
                                <label><input type="radio" name="videoType" value="youtube" checked={videoType === 'youtube'} onChange={() => setVideoType('youtube')} className="mr-1" /> YouTube URL</label>
                                <label><input type="radio" name="videoType" value="upload" checked={videoType === 'upload'} onChange={() => setVideoType('upload')} className="mr-1" /> Upload File</label>
                            </div>
                            {videoType === 'youtube' ? (
                                <input type="text" placeholder="https://www.youtube.com/watch?v=..." onChange={handleYoutubeUrlChange} className="input-field" />
                            ) : (
                                <div>
                                    <input type="file" accept="video/*" onChange={(e) => handleFileChange(e, 'video')} className="file-input" />
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Maksimum 100MB.</p>
                                </div>
                            )}
                         </>
                     )}
                </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Batal</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition">Simpan</button>
            </div>
        </form>
      </div>
    </div>
  );
};

const QuestionBank: React.FC<QuestionBankProps> = ({ onBack }) => {
  const [questions, setQuestions] = useState<Soal[]>([]);
  const [exams, setExams] = useState<Ujian[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Soal | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Soal | null>(null);

  const examMap = React.useMemo(() => {
    return exams.reduce((acc, exam) => {
      acc[exam.id_ujian] = exam.nama_ujian;
      return acc;
    }, {} as Record<number, string>);
  }, [exams]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [questionList, examList] = await Promise.all([getAllQuestions(), getExams()]);
    setQuestions(questionList.sort((a, b) => b.id_soal - a.id_soal));
    setExams(examList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      await addQuestion(questionData);
    }
    fetchData();
    handleCloseModal();
  };
  
  const handleDelete = async (question: Soal) => {
    await deleteQuestion(question.id_soal);
    fetchData();
    setDeletingQuestion(null);
  };

  return (
    <div>
      <QuestionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingQuestion}
        exams={exams}
      />
       {deletingQuestion && (
         <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-sm w-full text-center">
                <h2 className="text-2xl font-bold mb-4">Hapus Soal?</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">Apakah Anda yakin ingin menghapus soal ini? Ini akan menghapusnya dari bank soal dan ujian mana pun yang terkait.</p>
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
            <span>Kembali ke Dashboard</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Bank Soal</h2>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center"><IconFileText className="h-6 w-6 mr-2" /> Semua Soal</h3>
            <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <IconPlus className="h-5 w-5" />
                <span>Tambah Soal</span>
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
                <th scope="col" className="px-6 py-3">Pertanyaan</th>
                <th scope="col" className="px-6 py-3">Ujian Terkait</th>
                <th scope="col" className="px-6 py-3">Media</th>
                <th scope="col" className="px-6 py-3">Jawaban Benar</th>
                <th scope="col" className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {questions.map(q => (
                <tr key={q.id_soal} className="border-b bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white" style={{ maxWidth: '300px' }}>
                    <div className="truncate" dangerouslySetInnerHTML={{ __html: q.pertanyaan }} />
                  </td>
                  <td className="px-6 py-4">
                    {q.id_ujian ? (
                        <span className="bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-medium px-2.5 py-0.5 rounded-full">{examMap[q.id_ujian] || 'N/A'}</span>
                    ) : (
                        <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium px-2.5 py-0.5 rounded-full">Umum</span>
                    )}
                  </td>
                   <td className="px-6 py-4">
                    <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                        {q.gambar && <span title="Gambar"><IconImage className="h-4 w-4" /></span>}
                        {q.audio && <span title="Audio"><IconVolume2 className="h-4 w-4" /></span>}
                        {q.video && <span title="Video"><IconVideo className="h-4 w-4" /></span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono font-bold">{q.jawaban_benar}</td>
                  <td className="px-6 py-4 text-right space-x-1">
                    <button onClick={() => handleOpenModal(q)} className="p-2 text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300" aria-label="Edit"><IconEdit className="h-5 w-5"/></button>
                    <button onClick={() => setDeletingQuestion(q)} className="p-2 text-red-500 hover:text-red-600 dark:hover:text-red-400" aria-label="Delete"><IconTrash className="h-5 w-5"/></button>
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

export default QuestionBank;