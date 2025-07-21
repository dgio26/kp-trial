# Sistem Manajemen Cuti

## Deskripsi
Aplikasi web ini adalah sistem manajemen cuti yang memungkinkan karyawan untuk mengajukan cuti dan melalui proses persetujuan berjenjang dari Supervisor, Manager, hingga HR Manager. Proses ini bertujuan untuk memastikan pengelolaan cuti yang terstruktur dan terdokumentasi.

## Alur Proses
1. Pengguna login
2. Dashboard menampilkan daftar pengajuan cuti
3. Klik tombol **"Create"** untuk membuat pengajuan baru
4. Isi form (nama dan departemen otomatis)
5. Klik **Save** → status menjadi `Draft`
6. Klik **Approve** untuk submit → muncul tulisan *"Approved by ..."* dan tanggal
7. Masuk ke dashboard **Supervisor**
8. Supervisor klik **Approve** atau **Reject**
9. Jika disetujui, masuk ke dashboard **Manager**
10. Manager klik **Approve** atau **Reject**
11. Jika disetujui, masuk ke dashboard **HR Manager**
12. HR Manager klik **Approve** → data di database diperbarui
