import { USERS, UJIAN_LIST, SOAL_LIST, HASIL_LIST } from '../constants';
// FIX: Import 'Role' enum to fix type error.
import { User, Ujian, Soal, JawabanSiswa, Hasil, AnswerOption, ExamResultWithUser, Role, ActivityLog, ActivityType } from '../types';

// Simulate API delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// Simulate mutable data stores by creating a deep copy
let mockUsers: User[] = JSON.parse(JSON.stringify(USERS));
let mockUjian: Ujian[] = JSON.parse(JSON.stringify(UJIAN_LIST));
let mockSoal: Soal[] = JSON.parse(JSON.stringify(SOAL_LIST));
const mockHasil: Hasil[] = JSON.parse(JSON.stringify(HASIL_LIST));
const mockActivityLogs: ActivityLog[] = [];


export const login = async (username: string, password: string): Promise<User | null> => {
  await delay(500);
  const user = mockUsers.find(u => u.username === username && u.password === password);
  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
};

export const getAvailableExams = async (): Promise<Ujian[]> => {
  await delay(300);
  // In a real app, this would filter based on current time, user's class, etc.
  return mockUjian;
};

export const verifyToken = async (token: string): Promise<Ujian | null> => {
    await delay(500);
    const exam = mockUjian.find(u => u.token.toUpperCase() === token.toUpperCase());
    return exam || null;
}

export const getQuestionsForExam = async (id_ujian: number): Promise<Soal[]> => {
  await delay(1000);
  return mockSoal.filter(s => s.id_ujian === id_ujian);
};

export const submitExam = async (id_user: number, id_ujian: number, answers: JawabanSiswa[]): Promise<Hasil> => {
  await delay(1000);
  const questions = mockSoal.filter(s => s.id_ujian === id_ujian);
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
  // Don't save mock submissions to the list to keep results consistent for analysis
  // mockHasil.push(result); 
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
        if (password) {
            mockUsers[userIndex].password = password;
        }
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


// --- Exam Management ---
export const getExams = async (): Promise<Ujian[]> => {
    await delay(500);
    return mockUjian;
};

const generateToken = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const addExam = async (examData: Omit<Ujian, 'id_ujian' | 'token' | 'jumlah_soal'>): Promise<Ujian> => {
    await delay(500);
    const newExam: Ujian = { 
        ...examData, 
        id_ujian: Date.now() + Math.random(),
        token: generateToken(),
        jumlah_soal: 0,
        acak_soal: !!examData.acak_soal,
        acak_opsi: !!examData.acak_opsi,
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
    const initialLength = mockUjian.length;
    mockUjian = mockUjian.filter(u => u.id_ujian !== examId);
    // Also delete associated questions
    mockSoal = mockSoal.filter(s => s.id_ujian !== examId);
    return { success: mockUjian.length < initialLength };
};

// --- Question Management ---
const updateExamQuestionCount = (examId: number) => {
    const examIndex = mockUjian.findIndex(u => u.id_ujian === examId);
    if (examIndex !== -1) {
        const count = mockSoal.filter(s => s.id_ujian === examId).length;
        mockUjian[examIndex].jumlah_soal = count;
    }
};

export const getAllQuestions = async (): Promise<Soal[]> => {
    await delay(500);
    return mockSoal;
};

export const addQuestion = async (questionData: Omit<Soal, 'id_soal'>): Promise<Soal> => {
    await delay(200); // Shorter delay for batch imports
    const newQuestion: Soal = {
        ...questionData,
        id_soal: Date.now() + Math.random(),
    };
    
    if (newQuestion.jumlah_opsi === 4) {
        delete newQuestion.opsi_e;
    }

    mockSoal.push(newQuestion);
    if (newQuestion.id_ujian) {
        updateExamQuestionCount(newQuestion.id_ujian);
    }
    return newQuestion;
};

export const updateQuestion = async (questionId: number, questionData: Partial<Omit<Soal, 'id_soal'>>): Promise<Soal | null> => {
    await delay(500);
    const questionIndex = mockSoal.findIndex(s => s.id_soal === questionId);
    if (questionIndex !== -1) {
        const originalExamId = mockSoal[questionIndex].id_ujian;

        mockSoal[questionIndex] = { ...mockSoal[questionIndex], ...questionData };
        
        const updatedQuestion = mockSoal[questionIndex];
        const newExamId = updatedQuestion.id_ujian;

        if (updatedQuestion.jumlah_opsi === 4) {
            delete updatedQuestion.opsi_e;
        }

        if (originalExamId) {
            updateExamQuestionCount(originalExamId);
        }

        if (newExamId && originalExamId !== newExamId) {
            updateExamQuestionCount(newExamId);
        }

        return updatedQuestion;
    }
    return null;
};

export const deleteQuestion = async (questionId: number): Promise<{ success: boolean }> => {
    await delay(500);
    const question = mockSoal.find(s => s.id_soal === questionId);
    if (!question) return { success: false };

    const examId = question.id_ujian;
    const initialLength = mockSoal.length;
    mockSoal = mockSoal.filter(s => s.id_soal !== questionId);
    
    if (mockSoal.length < initialLength) {
        if(examId) {
            updateExamQuestionCount(examId);
        }
        return { success: true };
    }
    return { success: false };
};


// --- Results & Analysis ---
export const getResultsForExam = async (examId: number): Promise<ExamResultWithUser[]> => {
    await delay(700);
    const resultsForExam = mockHasil.filter(h => h.id_ujian === examId);
    
    const resultsWithUser: ExamResultWithUser[] = resultsForExam.map(result => {
        const user = mockUsers.find(u => u.id_user === result.id_user);
        return {
            ...result,
            // FIX: Use Role.SISWA enum instead of string 'siswa' to match the User type.
            user: user ? { ...user, password: '' } : { id_user: 0, username: 'Unknown', nama_lengkap: 'Unknown User', role: Role.SISWA }
        };
    }).sort((a, b) => b.nilai - a.nilai); // Sort by score descending

    return resultsWithUser;
}

// --- Activity Monitoring ---
export const logActivity = async (id_user: number, id_ujian: number, activity_type: ActivityType): Promise<{ success: boolean }> => {
    // No delay, should be fast
    const newLog: ActivityLog = {
        id_log: Date.now() + Math.random(),
        id_user,
        id_ujian,
        activity_type,
        timestamp: new Date(),
    };
    mockActivityLogs.push(newLog);
    console.log("Activity Logged: ", newLog);
    return { success: true };
};

export const getActivityLogsForExam = async (examId: number): Promise<ActivityLog[]> => {
    await delay(600);
    const logs = mockActivityLogs.filter(log => log.id_ujian === examId);

    const logsWithUser = logs.map(log => {
        const user = mockUsers.find(u => u.id_user === log.id_user);
        return {
            ...log,
            user: user ? { ...user, password: '' } : undefined
        };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by most recent first

    return logsWithUser;
};