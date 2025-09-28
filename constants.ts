import { User, Role, Ujian, Soal, AnswerOption } from './types';

export const USERS: User[] = [
  { id_user: 1, username: 'admin', password: 'password', nama_lengkap: 'Admin Utama', role: Role.ADMIN },
  { id_user: 2, username: 'guru1', password: 'password', nama_lengkap: 'Budi Hartono, S.Pd.', role: Role.GURU },
  { id_user: 3, username: 'siswa1', password: 'password', nama_lengkap: 'Siti Aminah', role: Role.SISWA, kelas: 'XII IPA 1' },
  { id_user: 4, username: 'siswa2', password: 'password', nama_lengkap: 'Agus Setiawan', role: Role.SISWA, kelas: 'XII IPA 1' },
];

export const UJIAN_LIST: Ujian[] = [
  {
    id_ujian: 1,
    nama_ujian: 'Ujian Akhir Semester - Matematika',
    mata_pelajaran: 'Matematika Wajib',
    waktu_mulai: new Date('2024-09-01T08:00:00'),
    durasi: 90,
    token: 'MATEM24',
    jumlah_soal: 5,
  },
  {
    id_ujian: 2,
    nama_ujian: 'Ulangan Harian - Biologi Sel',
    mata_pelajaran: 'Biologi',
    waktu_mulai: new Date('2024-09-02T10:00:00'),
    durasi: 45,
    token: 'BIOSEL24',
    jumlah_soal: 3,
  },
];

export const SOAL_LIST: Soal[] = [
  // Matematika
  {
    id_soal: 101,
    id_ujian: 1,
    pertanyaan: 'Hasil dari <b>2x + 5 = 15</b> adalah...',
    opsi_a: 'x = 3',
    opsi_b: 'x = 4',
    opsi_c: 'x = 5',
    opsi_d: 'x = 10',
    jawaban_benar: AnswerOption.C,
  },
  {
    id_soal: 102,
    id_ujian: 1,
    pertanyaan: 'Sebuah persegi memiliki sisi 8 cm. Berapakah luasnya?',
    opsi_a: '16 cm²',
    opsi_b: '32 cm²',
    opsi_c: '64 cm²',
    opsi_d: '128 cm²',
    jawaban_benar: AnswerOption.C,
  },
  {
    id_soal: 103,
    id_ujian: 1,
    pertanyaan: 'Berapakah nilai dari π (pi) hingga dua desimal?',
    opsi_a: '3.12',
    opsi_b: '3.14',
    opsi_c: '3.16',
    opsi_d: '3.18',
    jawaban_benar: AnswerOption.B,
    gambar: 'https://picsum.photos/400/200?random=1'
  },
  {
    id_soal: 104,
    id_ujian: 1,
    pertanyaan: 'Jika sebuah dadu dilempar, berapakah peluang munculnya angka genap?',
    opsi_a: '1/6',
    opsi_b: '1/3',
    opsi_c: '1/2',
    opsi_d: '2/3',
    jawaban_benar: AnswerOption.C,
  },
  {
    id_soal: 105,
    id_ujian: 1,
    pertanyaan: 'Berapa jumlah sudut dalam sebuah segitiga?',
    opsi_a: '90°',
    opsi_b: '180°',
    opsi_c: '270°',
    opsi_d: '360°',
    jawaban_benar: AnswerOption.B,
  },
  // Biologi
  {
    id_soal: 201,
    id_ujian: 2,
    pertanyaan: 'Bagian sel yang berfungsi sebagai pusat pengatur seluruh kegiatan sel adalah...',
    opsi_a: 'Mitokondria',
    opsi_b: 'Ribosom',
    opsi_c: 'Nukleus (Inti Sel)',
    opsi_d: 'Membran Sel',
    jawaban_benar: AnswerOption.C,
    gambar: 'https://picsum.photos/400/250?random=2'
  },
  {
    id_soal: 202,
    id_ujian: 2,
    pertanyaan: 'Organel sel yang berfungsi untuk respirasi sel adalah...',
    opsi_a: 'Mitokondria',
    opsi_b: 'Lisosom',
    opsi_c: 'Badan Golgi',
    opsi_d: 'Retikulum Endoplasma',
    jawaban_benar: AnswerOption.A,
  },
  {
    id_soal: 203,
    id_ujian: 2,
    pertanyaan: 'Manakah dari berikut ini yang HANYA ditemukan pada sel tumbuhan?',
    opsi_a: 'Membran Sel',
    opsi_b: 'Dinding Sel',
    opsi_c: 'Sitoplasma',
    opsi_d: 'Nukleus',
    jawaban_benar: AnswerOption.B,
  },
];
