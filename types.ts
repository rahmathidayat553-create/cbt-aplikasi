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
  jawaban_benar: AnswerOption;
  gambar?: string; // URL to image
}

export interface Ujian {
  id_ujian: number;
  nama_ujian: string;
  mata_pelajaran: string;
  waktu_mulai: Date;
  durasi: number; // in minutes
  token: string;
  jumlah_soal: number;
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