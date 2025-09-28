import { User, Role, Ujian, Soal, AnswerOption, Hasil } from './types';

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
    acak_soal: true,
    acak_opsi: true,
  },
  {
    id_ujian: 2,
    nama_ujian: 'Ulangan Harian - Biologi Sel',
    mata_pelajaran: 'Biologi',
    waktu_mulai: new Date('2024-09-02T10:00:00'),
    durasi: 45,
    token: 'BIOSEL24',
    jumlah_soal: 4,
    acak_soal: false,
    acak_opsi: true,
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
    opsi_e: 'x = 2.5',
    jawaban_benar: AnswerOption.C,
    jumlah_opsi: 5,
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
    jumlah_opsi: 4,
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
    jumlah_opsi: 4,
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
    jumlah_opsi: 4,
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
    jumlah_opsi: 4,
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
    jumlah_opsi: 4,
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
    jumlah_opsi: 4,
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
    jumlah_opsi: 4,
  },
  {
    id_soal: 204,
    id_ujian: 2,
    pertanyaan: 'Perhatikan video berikut tentang pembelahan sel. Proses apa yang dijelaskan?',
    opsi_a: 'Mitosis',
    opsi_b: 'Meiosis',
    opsi_c: 'Amitosis',
    opsi_d: 'Sitokinesis',
    jawaban_benar: AnswerOption.A,
    jumlah_opsi: 4,
    video: {
      type: 'youtube',
      url: 'https://www.youtube.com/watch?v=L0k-enzoeOM'
    }
  },
];

export const HASIL_LIST: Hasil[] = [
  // Results for Ujian 1 (Matematika)
  {
    id_hasil: 1001,
    id_user: 3, // Siti Aminah
    id_ujian: 1,
    nilai: 80.0,
    benar: 4,
    salah: 1,
    tidak_dijawab: 0,
    tanggal: new Date('2024-09-01T09:30:00'),
    jawaban_siswa: [
      { id_soal: 101, jawaban: AnswerOption.C }, // Benar
      { id_soal: 102, jawaban: AnswerOption.C }, // Benar
      { id_soal: 103, jawaban: AnswerOption.D }, // Salah, jawaban B
      { id_soal: 104, jawaban: AnswerOption.C }, // Benar
      { id_soal: 105, jawaban: AnswerOption.B }, // Benar
    ],
  },
  {
    id_hasil: 1002,
    id_user: 4, // Agus Setiawan
    id_ujian: 1,
    nilai: 40.0,
    benar: 2,
    salah: 2,
    tidak_dijawab: 1,
    tanggal: new Date('2024-09-01T09:32:00'),
    jawaban_siswa: [
      { id_soal: 101, jawaban: AnswerOption.D }, // Salah, jawaban C
      { id_soal: 102, jawaban: AnswerOption.C }, // Benar
      { id_soal: 103, jawaban: null }, // Tidak dijawab
      { id_soal: 104, jawaban: AnswerOption.B }, // Salah, jawaban C
      { id_soal: 105, jawaban: AnswerOption.B }, // Benar
    ],
  },
];