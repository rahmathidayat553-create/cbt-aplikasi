import React, { useState, useEffect, useCallback } from 'react';
import { MataPelajaran, PaketSoal, Soal, AnswerOption } from '../types';
import { getPaketSoal, addPaketSoal, updatePaketSoal, deletePaketSoal, getMataPelajaran, getQuestionsForPaket, addQuestion, updateQuestion, deleteQuestion } from '../services/api';
import { IconArrowLeft, IconEdit, IconLoader, IconPlus, IconTrash, IconFileText, IconBookOpen } from './icons/Icons';

// Sub-component for Question Form (similar to the one in old ExamDetails)
const QuestionFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (questionData: any) => void;
  initialData?: Soal | null;
}> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState<Partial<Soal>>({
    pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', opsi_e: '',
    jawaban_benar: AnswerOption.A, jumlah_opsi: 4,
  });

  useEffect(() => {
    if (initialData) setFormData(initialData);
    else setFormData({
        pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', opsi_e: '',
        jawaban_benar: AnswerOption.A, jumlah_opsi: 4,
    });
  }, [initialData, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleJumlahOpsiChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newJumlah = parseInt(e.target.value, 10) as 4 | 5;
    setFormData(prev => {
        const newState = { ...prev, jumlah_opsi: newJumlah };
        if (newJumlah === 4) {
            newState.opsi_e = '';
            if (newState.jawaban_benar === AnswerOption.E) newState.jawaban_benar = AnswerOption.A;
        }
        return newState;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-2xl w-full">
        <h2 className="text-2xl font-bold mb-6">{initialData ? 'Edit Soal' : 'Tambah Soal'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <textarea name="pertanyaan" value={formData.pertanyaan} onChange={handleChange} placeholder="Pertanyaan" rows={3} className="input-field" required />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="opsi_a" value={formData.opsi_a} onChange={handleChange} placeholder="Opsi A" className="input-field" required />
                <input name="opsi_b" value={formData.opsi_b} onChange={handleChange} placeholder="Opsi B" className="input-field" required />
                <input name="opsi_c" value={formData.opsi_c} onChange={handleChange} placeholder="Opsi C" className="input-field" required />
                <input name="opsi_d" value={formData.opsi_d} onChange={handleChange} placeholder="Opsi D" className="input-field" required />
            </div>
            {formData.jumlah_opsi === 5 && <input name="opsi_e" value={formData.opsi_e} onChange={handleChange} placeholder="Opsi E" className="input-field" />}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select name="jumlah_opsi" value={formData.jumlah_opsi} onChange={handleJumlahOpsiChange} className="input-field">
                    <option value={4}>4 Opsi</option>
                    <option value={5}>5 Opsi</option>
                </select>
                <select name="jawaban_benar" value={formData.jawaban_benar} onChange={handleChange} className="input-field">
                    {Object.keys(AnswerOption).filter(k => formData.jumlah_opsi === 5 || k !== 'E').map(key => <option key={key} value={key}>{`Opsi ${key}`}</option>)}
                </select>
            </div>
            <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600">Batal</button>
                <button type="submit" className="px-6 py-2 rounded-lg bg-primary-600 text-white">Simpan</button>
            </div>
        </form>
      </div>
    </div>
  )
};

// Sub-component for managing questions within a selected package
const PaketSoalDetailView: React.FC<{
  paket: (PaketSoal & { mata_pelajaran: string, jumlah_soal: number });
  onBack: () => void;
  onDataChange: () => void;
}> = ({ paket, onBack, onDataChange }) => {
  const [questions, setQuestions] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Soal | null>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    const questionList = await getQuestionsForPaket(paket.id_paket);
    setQuestions(questionList);
    setLoading(false);
  }, [paket.id_paket]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSubmitQuestion = async (questionData: any) => {
    if (questionData.id_soal) {
      await updateQuestion(questionData.id_soal, questionData);
    } else {
      await addQuestion({ ...questionData, id_paket: paket.id_paket });
    }
    fetchQuestions();
    onDataChange();
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if(window.confirm("Yakin ingin menghapus soal ini?")) {
      await deleteQuestion(questionId);
      fetchQuestions();
      onDataChange();
    }
  };

  return (
    <>
      <QuestionFormModal
        isOpen={isModalOpen}
        onClose={() => {setIsModalOpen(false); setEditingQuestion(null);}}
        onSubmit={handleSubmitQuestion}
        initialData={editingQuestion}
      />
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            <IconArrowLeft className="h-5 w-5" />
            <span>Kembali ke Bank Soal</span>
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{paket.nama_paket}</h2>
        <p className="text-slate-500 dark:text-slate-400">{paket.mata_pelajaran}</p>
        <div className="flex items-center space-x-6 mt-4 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center space-x-2"><IconBookOpen className="h-5 w-5" /> <span>{questions.length} Soal</span></div>
        </div>
      </div>
       <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold flex items-center"><IconFileText className="h-6 w-6 mr-2" /> Daftar Soal</h3>
            <button onClick={() => { setEditingQuestion(null); setIsModalOpen(true); }} className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                <IconPlus className="h-5 w-5" />
                <span>Tambah Soal</span>
            </button>
        </div>
        {loading ? <div className="text-center py-4"><IconLoader className="h-6 w-6 animate-spin mx-auto" /></div> : questions.length === 0 ? <p className="text-center text-slate-500 py-4">Belum ada soal.</p> :
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={q.id_soal} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-start">
                  <p className="flex-grow"><span className="font-bold">{i+1}.</span> <span dangerouslySetInnerHTML={{__html: q.pertanyaan}} /></p>
                  <div className="flex-shrink-0 ml-4 space-x-1">
                      <button onClick={() => { setEditingQuestion(q); setIsModalOpen(true); }} className="p-2 text-yellow-500"><IconEdit className="h-5 w-5"/></button>
                      <button onClick={() => handleDeleteQuestion(q.id_soal)} className="p-2 text-red-500"><IconTrash className="h-5 w-5"/></button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-600 dark:text-green-400">Jawaban: {q.jawaban_benar}</div>
              </div>
            ))}
          </div>
        }
       </div>
    </>
  );
};


// Main Component
const QuestionBank: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [paketSoal, setPaketSoal] = useState<(PaketSoal & { mata_pelajaran: string, jumlah_soal: number })[]>([]);
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaket, setEditingPaket] = useState<PaketSoal | null>(null);
  const [selectedPaket, setSelectedPaket] = useState<(PaketSoal & { mata_pelajaran: string, jumlah_soal: number }) | null>(null);
  const [formData, setFormData] = useState({ nama_paket: '', id_mapel: '' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [paketList, mapelList] = await Promise.all([getPaketSoal(), getMataPelajaran()]);
    setPaketSoal(paketList);
    setMataPelajaran(mapelList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleOpenModal = (paket: PaketSoal | null = null) => {
    setEditingPaket(paket);
    setFormData({
        nama_paket: paket?.nama_paket || '',
        id_mapel: paket?.id_mapel.toString() || (mataPelajaran.length > 0 ? mataPelajaran[0].id_mapel.toString() : '')
    });
    setIsModalOpen(true);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { nama_paket: formData.nama_paket, id_mapel: parseInt(formData.id_mapel) };
    if (editingPaket) {
      await updatePaketSoal(editingPaket.id_paket, data);
    } else {
      await addPaketSoal(data);
    }
    fetchData();
    setIsModalOpen(false);
    setEditingPaket(null);
  }

  const handleDelete = async (paketId: number) => {
    if(window.confirm("Yakin ingin menghapus paket soal ini? SEMUA soal di dalamnya akan terhapus.")){
      await deletePaketSoal(paketId);
      fetchData();
    }
  }
  
  if (selectedPaket) {
    return <PaketSoalDetailView paket={selectedPaket} onBack={() => setSelectedPaket(null)} onDataChange={fetchData} />;
  }

  return (
    <div>
       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-8 shadow-xl max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">{editingPaket ? 'Edit' : 'Buat'} Paket Soal</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input value={formData.nama_paket} onChange={e => setFormData({...formData, nama_paket: e.target.value})} placeholder="Nama Paket Soal (cth: UAS Ganjil)" className="input-field w-full" required/>
                <select value={formData.id_mapel} onChange={e => setFormData({...formData, id_mapel: e.target.value})} className="input-field w-full" required>
                    <option value="" disabled>Pilih Mata Pelajaran</option>
                    {mataPelajaran.map(m => <option key={m.id_mapel} value={m.id_mapel}>{m.nama_mapel}</option>)}
                </select>
                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-lg bg-slate-200 dark:bg-slate-600">Batal</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-primary-600 text-white">Simpan</button>
                </div>
            </form>
            </div>
        </div>
       )}
       <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
            <IconArrowLeft className="h-5 w-5" />
            <span>Kembali ke Dashboard</span>
        </button>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Bank Soal</h2>
      </div>

       <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold flex items-center"><IconFileText className="h-6 w-6 mr-2" /> Daftar Paket Soal</h3>
          <button onClick={() => handleOpenModal()} className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-lg">
            <IconPlus className="h-5 w-5" />
            <span>Buat Paket Soal</span>
          </button>
        </div>

        {loading ? <div className="text-center py-4"><IconLoader className="h-6 w-6 animate-spin mx-auto" /></div> : paketSoal.length === 0 ? <p className="text-center text-slate-500 py-4">Belum ada paket soal. Buat paket baru untuk memulai.</p> : 
            <div className="space-y-4">
                {paketSoal.map(paket => (
                    <div key={paket.id_paket} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex-grow cursor-pointer" onClick={() => setSelectedPaket(paket)}>
                            <p className="font-bold text-lg text-slate-900 dark:text-white">{paket.nama_paket}</p>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300">{paket.mata_pelajaran}</span>
                            <span className="ml-4 text-sm text-slate-500">{paket.jumlah_soal} soal</span>
                        </div>
                        <div className="flex-shrink-0 ml-4 space-x-1">
                            <button onClick={() => handleOpenModal(paket)} className="p-2 text-yellow-500"><IconEdit className="h-5 w-5"/></button>
                            <button onClick={() => handleDelete(paket.id_paket)} className="p-2 text-red-500"><IconTrash className="h-5 w-5"/></button>
                        </div>
                    </div>
                ))}
            </div>
        }
       </div>
    </div>
  );
};

export default QuestionBank;