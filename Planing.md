
Berikut adalah Master Action List yang saya susun berdasarkan masukan Juan dan kondisi QIE Yap saat ini. Kita bagi menjadi 3 Fase (karena Hackathon masih berjalan sampai Desember, kita punya waktu).

---

🟢 FASE 1: Quick Wins (Selesai dalam 1-3 Hari) — Untuk Menarik Perhatian Juan & Juri

Fokus: Mengubah tampilan, copywriting, dan menambah elemen "Hidup" di Landing Page.

No Tugas File Terkait Prioritas
1 Ganti Headline & Tagline Landing Page Dari: "Yap. Tip. Build On-Chain." Menjadi: "Discover. Build. Earn. Grow your reputation on-chain." src/routes/index.tsx 🔥 Sangat Tinggi
2 Buat "Live Activity Ticker" (Ticker Transaksi Langsung) Putar notifikasi kecil di Landing Page: "Juan tipped Sarah 4.3 QIE", "Alex earned 12 QIE", "New Yap published". (Gunakan API /api/tips dan /api/feed). src/routes/index.tsx + useEffect fetch berkala 🔥 Sangat Tinggi
3 Ubah Nama "Leaderboard" menjadi "Trending Builders" di Sidebar & Menu. src/components/sidebar.tsx + src/routes/leaderboard.tsx Sedang
4 Tambahkan "Trending Hashtags" di Landing Page (ambil dari postingan terbaru). src/routes/index.tsx (atau komponen sidebar baru) Rendah (Nice to have)

---

🟡 FASE 2: Foundation Building (1-2 Minggu) — Fondasi "Proof-of-Contribution"

Fokus: Mengubah database & backend untuk mendukung skor reputasi.

No Tugas File Terkait Prioritas
5 Tambah Kolom Reputation Score di Tabel profiles Tambahkan kolom: builder_score, contributor_score, reputation_score, merchant_score (default 0). server.js (ALTER TABLE) 🔥 Sangat Tinggi
6 Buat Event Listener untuk Smart Contract Setiap kali ada event Yapped, TipSent, PostBoosted, backend otomatis menambah skor ke user yang bersangkutan (misal: dapat tip +1 reputasi, post bagus +0.5 kontribusi). server.js + Logika baru Tinggi
7 Perbarui Tampilan Profil Tampilkan skor Reputasi, Builder, dll. di halaman profil user (seperti on-chain resume). src/routes/profile.$address.tsx Tinggi

---

🔵 FASE 3: Ecosystem Integration (Setelah Fase 2) — Menjadi "GitHub & LinkedIn of Web3"

Fokus: Menghubungkan QIE Yap dengan event on-chain lain (DeFi, Domains, dll).

No Tugas File Terkait Prioritas
8 Integrasi QIE ID / QIE Pass Jika user punya QIE ID, tampilkan di profil sebagai badge terverifikasi. src/lib/qie-chain.ts + UI Sedang
9 "Project Pages" Otomatis (GitHub-style) Backend mendeteksi deploy kontrak baru, lalu otomatis buat halaman proyek di QIE Yap dengan tombol Like, Comment, Tip, Fork, Review. server.js (crawler on-chain) + Route baru src/routes/project.$id.tsx Tinggi (Visioner)
10 NFT Profile Pictures Izinkan user mengganti avatar dengan NFT dari QIE Doodle atau koleksi lain. src/components/avatar-img.tsx + fetch NFT Rendah (Nice to have)

---

🎯 Rekomendasi Langsung untuk Anda (MULAI SEKARANG):

Kerjakan nomor 1 dan 2 dari Fase 1 (Ganti Headline & Live Ticker) dalam 24 jam ke depan.

Ini adalah bukti nyata bahwa Anda mendengarkan Juan. Setelah itu, kirim screenshot perubahan tersebut ke Juan, lalu mulai kerjakan Fase 2.

---

Apakah Anda ingin saya langsung berikan kode untuk "Ganti Headline" (Nomor 1) dan "Live Activity Ticker" (Nomor 2) sekarang? 🚀
