import React, { useState } from 'react';
import { IconUpload, IconFileText, IconClipboardList, IconDownload, IconActivity, IconClipboardCheck, IconPanelRightClose, IconPanelRightOpen, IconIdCard, IconUsers, IconBook } from './icons/Icons';
import ExamManagement from './ExamManagement';
import { Ujian } from '../types';
import QuestionBank from './QuestionBank';
import ExamCardPrintView from './ExamCardPrintView';
import ExamResultsAnalysis from './ExamResultsAnalysis';
import ParticipantManagement from './ParticipantManagement';
import ActivityMonitor from './ActivityMonitor';
import QuestionImport from './QuestionImport';
import SubjectManagement from './SubjectManagement';

type View = 'main' | 'exam_management' | 'question_bank' | 'question_import' | 'print_cards' | 'exam_results_analysis' | 'participant_management' | 'activity_monitor' | 'subject_management';

const GuruDashboard: React.FC = () => {
  const [view, setView] = useState<View>('main');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
  
  const renderView = () => {
    switch(view) {
      case 'subject_management': return <SubjectManagement onBack={() => setView('main')} />;
      case 'question_bank': return <QuestionBank onBack={() => setView('main')} />;
      case 'exam_management': return <ExamManagement onBack={() => setView('main')} />;
      case 'question_import': return <QuestionImport onBack={() => setView('main')} />;
      case 'print_cards': return <ExamCardPrintView onBack={() => setView('main')} />;
      case 'exam_results_analysis': return <ExamResultsAnalysis onBack={() => setView('main')} />;
      case 'participant_management': return <ParticipantManagement onBack={() => setView('main')} />;
      case 'activity_monitor': return <ActivityMonitor onBack={() => setView('main')} />;
      case 'main':
      default:
        return (
          <>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg mb-8">
                <p>Selamat datang di Dasbor Guru. Gunakan menu di sidebar kanan untuk mengelola ujian, soal, dan melihat hasil siswa.</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                <button 
                    onClick={handleDownloadTemplate}
                    className="w-full flex items-center justify-center p-4 bg-green-600/10 dark:bg-green-600/20 text-green-600 dark:text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-colors space-x-3 border border-green-500/50">
                    <IconDownload className="h-6 w-6" />
                    <span>Download Template Import Soal (Excel)</span>
                </button>
            </div>
          </>
        );
    }
  }


  const sidebarContent = (
    <>
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">Persiapan Konten</h3>
        <div className="space-y-2">
           <button onClick={() => setView('subject_management')} className="w-full flex items-center p-3 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors space-x-3">
            <IconBook className="h-5 w-5" />
            <span>Manajemen Mapel</span>
          </button>
          <button onClick={() => setView('question_bank')} className="w-full flex items-center p-3 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors space-x-3">
            <IconFileText className="h-5 w-5" />
            <span>Bank Soal</span>
          </button>
          <button onClick={() => setView('question_import')} className="w-full flex items-center p-3 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors space-x-3">
            <IconUpload className="h-5 w-5" />
            <span>Import Soal</span>
          </button>
        </div>
      </div>

       <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">Pelaksanaan Ujian</h3>
        <div className="space-y-2">
          <button onClick={() => setView('exam_management')} className="w-full flex items-center p-3 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors space-x-3">
            <IconClipboardCheck className="h-5 w-5" />
            <span>Manajemen Ujian</span>
          </button>
           <button onClick={() => setView('activity_monitor')} className="w-full flex items-center p-3 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors space-x-3">
            <IconActivity className="h-5 w-5" />
            <span>Aktivitas Peserta</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">Hasil & Analisis</h3>
        <div className="space-y-2">
           <button onClick={() => setView('exam_results_analysis')} className="w-full flex items-center p-3 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors space-x-3">
            <IconClipboardList className="h-5 w-5" />
            <span>Hasil & Analisis Ujian</span>
          </button>
        </div>
      </div>

       <div className="mb-6">
        <h3 className="text-xl font-bold mb-4">Administrasi</h3>
        <div className="space-y-2">
           <button onClick={() => setView('participant_management')} className="w-full flex items-center p-3 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors space-x-3">
            <IconUsers className="h-5 w-5" />
            <span>Data Peserta Ujian</span>
          </button>
           <button onClick={() => setView('print_cards')} className="w-full flex items-center p-3 bg-slate-100 dark:bg-slate-700 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-600 rounded-lg transition-colors space-x-3">
            <IconIdCard className="h-5 w-5" />
            <span>Cetak Kartu Ujian</span>
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex gap-8">
      <main className="flex-1">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Dashboard Guru</h2>
             <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors md:hidden"
                aria-label={isSidebarOpen ? "Tutup sidebar" : "Buka sidebar"}
            >
                {isSidebarOpen ? <IconPanelRightClose className="h-6 w-6" /> : <IconPanelRightOpen className="h-6 w-6" />}
            </button>
        </div>
        {renderView()}
      </main>
      
      <aside className={`transition-all duration-300 w-72 ${isSidebarOpen ? 'ml-0' : '-mr-72 ml-4'}`}>
        <div className="bg-white dark:bg-slate-800/50 rounded-xl p-6 shadow-lg h-full overflow-y-auto">
          {sidebarContent}
        </div>
      </aside>
    </div>
  );
};

export default GuruDashboard;