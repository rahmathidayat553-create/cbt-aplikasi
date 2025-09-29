import { USERS, UJIAN_LIST, SOAL_LIST, HASIL_LIST, MATA_PELAJARAN_LIST, PAKET_SOAL_LIST } from '../constants';
import { User, Ujian, Soal, JawabanSiswa, Hasil, AnswerOption, ExamResultWithUser, Role, ActivityLog, ActivityType, MataPelajaran, PaketSoal } from '../types';

// Simulate API delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Simulate mutable data stores by creating a deep copy
let mockUsers: User[] = JSON.parse(JSON.stringify(USERS));
let mockUjian: Ujian[] = JSON.parse(JSON.stringify(UJIAN_LIST));
let mockSoal: Soal[] = JSON.parse(JSON.stringify(SOAL_LIST));
let mockMataPelajaran: MataPelajaran[] = JSON.parse(JSON.stringify(MATA_PELAJARAN_LIST));
let mockPaketSoal: PaketSoal[] = JSON.parse(JSON.stringify(PAKET_SOAL_LIST.map(p => ({ id_paket: p.id_paket, id_mapel: p.id_mapel, nama_paket: p.nama_paket }))));
const mockHasil: Hasil[] = JSON.parse(JSON.stringify(HASIL_LIST));
const mockActivityLogs: ActivityLog[] = [];


export const login = async (username: string, password: string): Promise<User | null> => {
  await delay(500);
  const user = mockUsers.find(u => u.username === username && u.password === password);
  if (user) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};

export const getAvailableExams = async (id_user?: number): Promise<(Ujian & {nama_paket: string, mata_pelajaran: string, jumlah_soal: number})[]> => {
  await delay(300);
  let activeExams = mockUjian.filter(u => u.is_active);

  // If a user ID is provided, filter out exams they have already completed.
  if (id_user) {
      const completedExamIds = new Set(mockHasil.filter(h => h.id_user === id_user).map(h => h.id_ujian));
      activeExams = activeExams.filter(u => !completedExamIds.has(u.id_ujian));
  }
  
  return activeExams.map(ujian => {
      const paket = mockPaketSoal.find(p => p.id_paket === ujian.id_paket);
      const mapel = mockMataPelajaran.find(m => m.id_mapel === paket?.id_mapel);
      const jumlah_soal = mockSoal.filter(s => s.id_paket === ujian.id_paket).length;
      
      return {
          ...ujian,
          nama_paket: paket?.nama_paket || "Nama Paket Tidak Ditemukan",
          mata_pelajaran: mapel?.nama_mapel || "Mapel Tidak Ditemukan",
          jumlah_soal,
      }
  });
};

export const verifyToken = async (token: string, id_user: number): Promise<(Ujian & {nama_paket: string, mata_pelajaran: string, jumlah_soal: number}) | null> => {
    await delay(500);
    const exam = mockUjian.find(u => u.token.toUpperCase() === token.toUpperCase() && u.is_active);
    if (!exam) return null;

    // Check if the user has already completed this exam
    const existingResult = mockHasil.find(h => h.id_user === id_user && h.id_ujian === exam.id_ujian);
    if (existingResult) {
        return null; // Exam already taken
    }

    const paket = mockPaketSoal.find(p => p.id_paket === exam.id_paket);
    const mapel = mockMataPelajaran.find(m => m.id_mapel === paket?.id_mapel);
    const jumlah_soal = mockSoal.filter(s => s.id_paket === exam.id_paket).length;
    
    return {
      ...exam,
      nama_paket: paket?.nama_paket || "Nama Paket Tidak Ditemukan",
      mata_pelajaran: mapel?.nama_mapel || "Mapel Tidak Ditemukan",
      jumlah_soal,
    }
}

export const getQuestionsForExam = async (id_ujian: number): Promise<Soal[]> => {
  await delay(1000);
  const exam = mockUjian.find(u => u.id_ujian === id_ujian);
  if (!exam) return [];
  return mockSoal.filter(s => s.id_paket === exam.id_paket);
};

export const submitExam = async (id_user: number, id_ujian: number, answers: JawabanSiswa[]): Promise<Hasil> => {
  await delay(1000);
  const exam = mockUjian.find(u => u.id_ujian === id_ujian);
  if (!exam) throw new Error("Ujian tidak ditemukan");

  const questions = mockSoal.filter(s => s.id_paket === exam.id_paket);
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  answers.forEach(answer => {
    const question = questions.find(q => q.id_soal === answer.id_soal);
    if (question) {
      if (answer.jawaban === null) {
        unanswered++;
      } else if (question.jawaban_benar === answer.jawaban) {
        correct++;
      } else {
        incorrect++;
      }
    }
  });

  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? (correct / totalQuestions) * 100 : 0;

  const result: Hasil = {
    id_hasil: Math.floor(Math.random() * 10000),
    id_user,
    id_ujian,
    nilai: score,
    benar: correct,
    salah: incorrect,
    tidak_dijawab: unanswered,
    tanggal: new Date(),
    jawaban_siswa: answers,
  };

  // Persist the result in the mock database for the "take once" logic to work
  mockHasil.push(result);

  return result;
};

// --- User Management ---
export const getUsers = async (): Promise<User[]> => {
    await delay(500);
    return mockUsers.map(({ password, ...user }) => user);
};
export const addUser = async (userData: Omit<User, 'id_user'>): Promise<User> => {
    await delay(500);
    const newUser: User = { ...userData, id_user: Date.now() + Math.random() };
    mockUsers.push(newUser);
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
};
export const updateUser = async (userId: number, userData: Partial<User>): Promise<User | null> => {
    await delay(500);
    const userIndex = mockUsers.findIndex(u => u.id_user === userId);
    if (userIndex !== -1) {
        const { password, ...rest } = userData;
        mockUsers[userIndex] = { ...mockUsers[userIndex], ...rest };
        if (password) mockUsers[userIndex].password = password;
        const { password: pw, ...userWithoutPassword } = mockUsers[userIndex];
        return userWithoutPassword;
    }
    return null;
};
export const deleteUser = async (userId: number): Promise<{ success: boolean }> => {
    await delay(500);
    if (userId === 1) return { success: false };
    const initialLength = mockUsers.length;
    mockUsers = mockUsers.filter(u => u.id_user !== userId);
    return { success: mockUsers.length < initialLength };
};

// --- Mata Pelajaran Management ---
export const getMataPelajaran = async (): Promise<MataPelajaran[]> => {
    await delay(300);
    return mockMataPelajaran;
}
export const addMataPelajaran = async (data: Omit<MataPelajaran, 'id_mapel'>): Promise<MataPelajaran> => {
    await delay(300);
    const newMapel = { ...data, id_mapel: Date.now() + Math.random() };
    mockMataPelajaran.push(newMapel);
    return newMapel;
}
export const updateMataPelajaran = async (id_mapel: number, data: Partial<MataPelajaran>): Promise<MataPelajaran | null> => {
    await delay(300);
    const index = mockMataPelajaran.findIndex(m => m.id_mapel === id_mapel);
    if (index !== -1) {
        mockMataPelajaran[index] = { ...mockMataPelajaran[index], ...data };
        return mockMataPelajaran[index];
    }
    return null;
}
export const deleteMataPelajaran = async (id_mapel: number): Promise<{ success: boolean }> => {
    await delay(300);
    mockMataPelajaran = mockMataPelajaran.filter(m => m.id_mapel !== id_mapel);
    // In a real DB, you'd handle cascading deletes or prevent deletion if in use.
    return { success: true };
}

// --- Paket Soal Management ---
export const getPaketSoal = async (): Promise<(PaketSoal & { mata_pelajaran: string, jumlah_soal: number })[]> => {
    await delay(500);
    return mockPaketSoal.map(paket => {
        const mapel = mockMataPelajaran.find(m => m.id_mapel === paket.id_mapel);
        const jumlah_soal = mockSoal.filter(s => s.id_paket === paket.id_paket).length;
        return {
            ...paket,
            mata_pelajaran: mapel?.nama_mapel || "N/A",
            jumlah_soal,
        }
    });
}
export const addPaketSoal = async (data: Omit<PaketSoal, 'id_paket'>): Promise<PaketSoal> => {
    await delay(300);
    const newPaket = { ...data, id_paket: Date.now() + Math.random() };
    mockPaketSoal.push(newPaket);
    return newPaket;
}
export const updatePaketSoal = async (id_paket: number, data: Partial<PaketSoal>): Promise<PaketSoal | null> => {
    await delay(300);
    const index = mockPaketSoal.findIndex(p => p.id_paket === id_paket);
    if (index !== -1) {
        mockPaketSoal[index] = { ...mockPaketSoal[index], ...data };
        return mockPaketSoal[index];
    }
    return null;
}
export const deletePaketSoal = async (id_paket: number): Promise<{ success: boolean }> => {
    await delay(300);
    mockPaketSoal = mockPaketSoal.filter(p => p.id_paket !== id_paket);
    mockSoal = mockSoal.filter(s => s.id_paket !== id_paket);
    mockUjian = mockUjian.filter(u => u.id_paket !== id_paket);
    return { success: true };
}

// --- Exam Management ---
export const getExams = async (): Promise<(Ujian & {nama_paket: string, mata_pelajaran: string, jumlah_soal: number})[]> => {
    await delay(500);
    return mockUjian.map(ujian => {
        const paket = mockPaketSoal.find(p => p.id_paket === ujian.id_paket);
        const mapel = mockMataPelajaran.find(m => m.id_mapel === paket?.id_mapel);
        const jumlah_soal = mockSoal.filter(s => s.id_paket === ujian.id_paket).length;
        return {
            ...ujian,
            nama_paket: paket?.nama_paket || "N/A",
            mata_pelajaran: mapel?.nama_mapel || "N/A",
            jumlah_soal,
        };
    });
};
const generateToken = () => Math.random().toString(36).substring(2, 8).toUpperCase();
export const addExam = async (examData: Omit<Ujian, 'id_ujian' | 'token' | 'is_active'>): Promise<Ujian> => {
    await delay(500);
    const newExam: Ujian = { 
        ...examData, 
        id_ujian: Date.now() + Math.random(),
        token: generateToken(),
        is_active: false, // Exams are inactive by default
    };
    mockUjian.push(newExam);
    return newExam;
};
export const updateExam = async (examId: number, examData: Partial<Omit<Ujian, 'id_ujian'>>): Promise<Ujian | null> => {
    await delay(500);
    const examIndex = mockUjian.findIndex(u => u.id_ujian === examId);
    if (examIndex !== -1) {
        mockUjian[examIndex] = { ...mockUjian[examIndex], ...examData };
        return mockUjian[examIndex];
    }
    return null;
};
export const deleteExam = async (examId: number): Promise<{ success: boolean }> => {
    await delay(500);
    mockUjian = mockUjian.filter(u => u.id_ujian !== examId);
    return { success: true };
};

// --- Question Management ---
const updatePaketQuestionCount = (paketId: number) => {
    // This is a helper, not exported. In a real app, a DB trigger or backend logic would handle this.
};
export const getQuestionsForPaket = async (id_paket: number): Promise<Soal[]> => {
    await delay(500);
    return mockSoal.filter(s => s.id_paket === id_paket);
};
export const addQuestion = async (questionData: Omit<Soal, 'id_soal'>): Promise<Soal> => {
    await delay(200);
    const newQuestion: Soal = { ...questionData, id_soal: Date.now() + Math.random() };
    if (newQuestion.jumlah_opsi === 4) delete newQuestion.opsi_e;
    mockSoal.push(newQuestion);
    updatePaketQuestionCount(newQuestion.id_paket);
    return newQuestion;
};
export const updateQuestion = async (questionId: number, questionData: Partial<Omit<Soal, 'id_soal'>>): Promise<Soal | null> => {
    await delay(500);
    const questionIndex = mockSoal.findIndex(s => s.id_soal === questionId);
    if (questionIndex !== -1) {
        mockSoal[questionIndex] = { ...mockSoal[questionIndex], ...questionData };
        if (mockSoal[questionIndex].jumlah_opsi === 4) delete mockSoal[questionIndex].opsi_e;
        return mockSoal[questionIndex];
    }
    return null;
};
export const deleteQuestion = async (questionId: number): Promise<{ success: boolean }> => {
    await delay(500);
    mockSoal = mockSoal.filter(s => s.id_soal !== questionId);
    return { success: true };
};

// --- Results & Analysis ---
export const getResultsForExam = async (examId: number): Promise<ExamResultWithUser[]> => {
    await delay(700);
    const resultsForExam = mockHasil.filter(h => h.id_ujian === examId);
    const resultsWithUser: ExamResultWithUser[] = resultsForExam.map(result => {
        const user = mockUsers.find(u => u.id_user === result.id_user);
        return {
            ...result,
            user: user ? { ...user, password: '' } : { id_user: 0, username: 'Unknown', nama_lengkap: 'Unknown User', role: Role.SISWA }
        };
    }).sort((a, b) => b.nilai - a.nilai);
    return resultsWithUser;
}

// --- Activity Monitoring ---
export const logActivity = async (id_user: number, id_ujian: number, activity_type: ActivityType): Promise<{ success: boolean }> => {
    const newLog: ActivityLog = { id_log: Date.now() + Math.random(), id_user, id_ujian, activity_type, timestamp: new Date() };
    mockActivityLogs.push(newLog);
    console.log("Activity Logged:", newLog); // For debugging
    return { success: true };
};
export const getActivityLogsForExam = async (examId: number): Promise<ActivityLog[]> => {
    await delay(600);
    const logs = mockActivityLogs.filter(log => log.id_ujian === examId);
    const logsWithUser = logs.map(log => {
        const user = mockUsers.find(u => u.id_user === log.id_user);
        return { ...log, user: user ? { ...user, password: '' } : undefined };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return logsWithUser;
};
