export enum Role {
  ADMIN = 'admin',
  GURU = 'guru',
  SISWA = 'siswa',
}

export enum AnswerOption {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
}

export enum ActivityType {
  TAB_SWITCH = 'tab_switch',
  FULLSCREEN_EXIT = 'fullscreen_exit',
}

export interface User {
  id_user: number;
  username: string;
  password?: string; // Should not be sent to client in a real app
  nama_lengkap: string;
  role: Role;
  kelas?: string;
}

export interface Soal {
  id_soal: number;
  id_ujian?: number;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d: string;
  opsi_e?: string;
  jawaban_benar: AnswerOption;
  jumlah_opsi?: 4 | 5;
  gambar?: string; // URL to image or object URL
  audio?: string; // URL to audio or object URL
  video?: {
    type: 'youtube' | 'upload';
    url: string;
  };
}

export interface Ujian {
  id_ujian: number;
  nama_ujian: string;
  mata_pelajaran: string;
  waktu_mulai: Date;
  durasi: number; // in minutes
  token: string;
  jumlah_soal: number;
  acak_soal?: boolean;
  acak_opsi?: boolean;
}

export interface JawabanSiswa {
  id_soal: number;
  jawaban: AnswerOption | null;
}

export interface Hasil {
  id_hasil: number;
  id_user: number;
  id_ujian: number;
  nilai: number;
  benar: number;
  salah: number;
  tidak_dijawab: number;
  tanggal: Date;
  jawaban_siswa: JawabanSiswa[];
}

export interface ExamResultWithUser extends Hasil {
  user: User;
}

export interface ActivityLog {
  id_log: number;
  id_user: number;
  id_ujian: number;
  activity_type: ActivityType;
  timestamp: Date;
  user?: User;
}