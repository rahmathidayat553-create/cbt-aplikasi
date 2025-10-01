import React, { useState, useEffect, useCallback } from 'react';
// FIX: Import Ujian as BaseUjian to avoid name conflicts.
import { Ujian as BaseUjian, Soal, AnswerOption } from '../types';
import { getQuestionsForExam, addQuestion, updateQuestion, deleteQuestion } from '../services/api';
import { IconArrowLeft, IconEdit, IconLoader, IconPlus, IconTrash, IconFileText, IconClock, IconBookOpen, IconImage, IconVolume2, IconVideo, IconYoutube, IconX } from './icons/Icons';
import TextEditor from './TextEditor';

// FIX: Define a more detailed Ujian type.
type Ujian = BaseUjian & { nama_paket: string; mata_pelajaran: string };

interface ExamDetailsProps {
  // FIX: Use the more detailed Ujian type.
  exam: Ujian;
  onBack: () => void;
}

const QuestionFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  // FIX: Corrected the Omit type to use `id_paket` instead of the non-existent `id_ujian` on the Soal type.
  onSubmit: (question: Omit<Soal, 'id_soal' | 'id_paket'> | (Partial<Soal> & { id_soal: number })) => void;
  initialData?: Soal | null;
}> = ({ isOpen, onClose, onSubmit, initialData }) => {
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
  });
  const [videoType, setVideoType] = useState<'youtube' | 'upload'>('youtube');


  useEffect(() => {
    if (initialData) {
      setFormData({
        pertanyaan: initialData.pertanyaan,
        opsi_a: initialData.opsi_a,
        opsi_b: initialData.opsi_b,
        opsi_c: initialData.opsi_c,
        opsi_d: initialData.opsi_d,
        opsi_e: initialData.opsi_e || '',
        jawaban_benar: initialData.jawaban_benar,
        jumlah_opsi: initialData.jumlah_opsi || 4,
        gambar: initialData.gambar,
        audio: initialData.audio,
        video: initialData.video,
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
      });
       setVideoType('youtube');
    }
  }, [initialData, isOpen]);
  
  const handleEditorChange = (name: keyof Soal, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJumlahOpsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newJumlah = parseInt(e.target.value, 10) as 4 | 5;
    setFormData(prev => {
        const newState = { ...prev, jumlah_opsi: newJumlah };
        // If switching to 4 options, clear Opsi E and check if answer is E
        if (newJumlah === 4) {
            newState.opsi_e = '';
            if (newState.jawaban_benar === AnswerOption.E) {
                newState.jawaban_benar = AnswerOption.A; // Reset to a valid answer
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
        // if url is empty, remove the video object
        setFormData(prev => ({ ...prev, video: undefined }));
      }
  };

  const handleClearMedia = (field: 'gambar' | 'audio' | 'video') => {
      // Revoke the object URL to free up memory
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
    if (initialData) {
        dataToSubmit.id_soal = initialData.id_soal;
    }
    // Clean up empty fields
    if (!dataToSubmit.gambar) delete dataToSubmit.gambar;
    if (!dataToSubmit.audio) delete dataToSubmit.audio;
    if (!dataToSubmit.video || !dataToSubmit.video.url) delete dataToSubmit.video;
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
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Soal' : 'Tambah Soal Baru'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <TextEditor
              value={formData.pertanyaan || ''}
              onChange={(value) => handleEditorChange('pertanyaan', value)}
              placeholder="Tulis pertanyaan di sini..."
              minHeight="120px"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextEditor value={formData.opsi_a || ''} onChange={(value) => handleEditorChange('opsi_a', value)} placeholder="Opsi A" />
                <TextEditor value={formData.opsi_b || ''} onChange={(value) => handleEditorChange('opsi_b', value)} placeholder="Opsi B" />
                <TextEditor value={formData.opsi_c || ''} onChange={(value) => handleEditorChange('opsi_c', value)} placeholder="Opsi C" />
                <TextEditor value={formData.opsi_d || ''} onChange={(value) => handleEditorChange('opsi_d', value)} placeholder="Opsi D" />
            </div>

             {formData.jumlah_opsi === 5 && (
                <TextEditor value={formData.opsi_e || ''} onChange={(value) => handleEditorChange('opsi_e', value)} placeholder="Opsi E" />
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
      // FIX: Corrected logic to use `id_paket` from the exam, as Soal is related to PaketSoal, not Ujian directly.
      await addQuestion({ ...questionData, id_paket: exam.id_paket });
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
        {/* FIX: Changed `exam.nama_ujian` to `exam.nama_paket` to match available property. */}
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{exam.nama_paket}</h2>
        {/* FIX: Used `exam.mata_pelajaran` which is now available due to updated prop type. */}
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
                      <div className="mt-1 text-slate-800 dark:text-slate-200 prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: q.pertanyaan }} />
                      <div className="flex items-center space-x-2 mt-2">
                          {q.gambar && <span title="Gambar terlampir"><IconImage className="h-4 w-4 text-slate-500" /></span>}
                          {q.audio && <span title="Audio terlampir"><IconVolume2 className="h-4 w-4 text-slate-500" /></span>}
                          {q.video && <span title="Video terlampir"><IconVideo className="h-4 w-4 text-slate-500" /></span>}
                      </div>
                  </div>
                  <div className="flex-shrink-0 ml-4 space-x-1">
                      <button onClick={() => handleOpenModal(q)} className="p-2 text-yellow-500 dark:text-yellow-400 hover:bg-yellow-500/10 rounded-full" aria-label="Edit"><IconEdit className="h-5 w-5"/></button>
                      <button onClick={() => setDeletingQuestion(q)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full" aria-label="Delete"><IconTrash className="h-5 w-5"/></button>
                  </div>
              </div>
               <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm prose dark:prose-invert max-w-none">
                  <div className={q.jawaban_benar === 'A' ? 'text-green-600 dark:text-green-400 font-bold' : ''}><span className="font-bold">A. </span><span dangerouslySetInnerHTML={{__html: q.opsi_a}}/></div>
                  <div className={q.jawaban_benar === 'B' ? 'text-green-600 dark:text-green-400 font-bold' : ''}><span className="font-bold">B. </span><span dangerouslySetInnerHTML={{__html: q.opsi_b}}/></div>
                  <div className={q.jawaban_benar === 'C' ? 'text-green-600 dark:text-green-400 font-bold' : ''}><span className="font-bold">C. </span><span dangerouslySetInnerHTML={{__html: q.opsi_c}}/></div>
                  <div className={q.jawaban_benar === 'D' ? 'text-green-600 dark:text-green-400 font-bold' : ''}><span className="font-bold">D. </span><span dangerouslySetInnerHTML={{__html: q.opsi_d}}/></div>
                  {q.opsi_e && <div className={q.jawaban_benar === 'E' ? 'text-green-600 dark:text-green-400 font-bold' : ''}><span className="font-bold">E. </span><span dangerouslySetInnerHTML={{__html: q.opsi_e}}/></div>}
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