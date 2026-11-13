// ============================================================================
// APP.JS - LOGIKA UTAMA & KOMPONEN REACT DOMPET PJLP
// PENYIMPANAN: GOOGLE SPREADSHEET & GOOGLE DRIVE
// ============================================================================

// MASUKKAN URL WEB APP GOOGLE APPS SCRIPT ANDA DI BAWAH INI:
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyiPXWYE_wyfyqYjRUQniMJ2fRd33QY9tmzx30H6vwkDq9GiMSW2BkZZBvzaUyW7avHeg/exec";

const { useState, useEffect, useRef, useMemo } = React;

// --- DATA AWAL & KONSTANTA ---
const initialUsers = [
    { id: 1, username: 'admin', password: 'admin123', role: 'admin', nama: 'Administrator', foto: '', nik: '-', no_telp: '-', masa_kerja: '-', jabatan: 'Admin Pusat', kelompok_kerja: '-', jumlah_hak_cuti: 12, permissions: [], is_active: true },
    { id: 2, username: 'user1', password: 'user123', role: 'user', nama: 'Budi Santoso', foto: '', nik: '317123456', no_telp: '0812345678', masa_kerja: '2 Tahun', jabatan: 'Petugas Keamanan', kelompok_kerja: 'Regu A', peran_kelompok: 'Ketua', jumlah_hak_cuti: 12, permissions: [], is_active: true }
];

const initialTimeSlots = [
    { id: 1, nama: 'Slot 1 (Pagi)', awal_hadir: '07:00', akhir_hadir: '07:30', batas_toleransi: '07:20', users: [2] },
    { id: 2, nama: 'Slot 2 (Siang)', awal_hadir: '14:30', akhir_hadir: '15:00', batas_toleransi: '14:45', users: [] },
    { id: 3, nama: 'Slot 3 (Malam)', awal_hadir: '22:30', akhir_hadir: '23:00', batas_toleransi: '22:45', users: [] },
    { id: 4, nama: 'Slot 4 (Bebas 1)', awal_hadir: '08:00', akhir_hadir: '08:30', batas_toleransi: '08:15', users: [] },
    { id: 5, nama: 'Slot 5 (Bebas 2)', awal_hadir: '09:00', akhir_hadir: '09:30', batas_toleransi: '09:15', users: [] },
    { id: 9, nama: 'Slot 6 (Bebas 3)', awal_hadir: '10:00', akhir_hadir: '10:30', batas_toleransi: '10:15', users: [] },
    { id: 6, nama: 'Piket', masuk: '07:00', pulang: '07:00', toleransi: 0, users: [] },
    { id: 7, nama: 'Lepas Piket', masuk: '00:00', pulang: '23:59', toleransi: 0, users: [] },
    { id: 8, nama: 'Waktu Pulang', masuk: '00:00', pulang: '23:59', toleransi: 0, users: [] }
];

const ADMIN_FEATURES = [
    { name: 'Live Absensi', icon: 'fa-tower-broadcast' },
    { name: 'Rekap Absen', icon: 'fa-list-check' },
    { name: 'Data Laporan Kerja', icon: 'fa-file-signature' },
    { name: 'Laporan CRM Internal', icon: 'fa-handshake' },
    { name: 'Persetujuan Cuti', icon: 'fa-calendar-check' },
    { name: 'Gaji PJLP', icon: 'fa-money-bill-wave' },
    { name: 'Jadwal Kerja', icon: 'fa-calendar-days' },
    { name: 'Data Dokumen User', icon: 'fa-file-invoice' },
    { name: 'Kelola Bank Sampah', icon: 'fa-recycle' },
    { name: 'Kelola Penilaian', icon: 'fa-star-half-stroke' },
    { name: 'Kelola Paguyuban', icon: 'fa-hand-holding-dollar' },
    { name: 'Kelola Informasi', icon: 'fa-bullhorn' },
    { name: 'Kelola User', icon: 'fa-users-gear' },
    { name: 'Kelola Kelompok Kerja', icon: 'fa-users-rectangle' },
    { name: 'Pengaturan Waktu', icon: 'fa-business-time' },
    { name: 'Pengaturan Lokasi', icon: 'fa-map-location-dot' },
    { name: 'Pengaturan Tampilan', icon: 'fa-palette' },
    { name: 'Database & Backup', icon: 'fa-server' }
];

// --- FUNGSI UTILITAS AMAN (ANTI-CRASH) ---
const generateId = () => Date.now() + Math.floor(Math.random() * 100000);
const getTodayDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; };

const isImageFile = (str) => {
    if (!str) return false;
    const s = String(str);
    return s.startsWith('data:image') || s.includes('drive.google.com/uc') || s.match(/\.(jpeg|jpg|gif|png|webp)$/i);
};

const formatDateIndo = (dateStr) => { 
    if (!dateStr) return '-'; 
    const str = String(dateStr);
    if (str.includes(',')) return str; 
    try { 
        const date = new Date(str); 
        if (isNaN(date.getTime())) return str; 
        return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); 
    } catch (e) { return str; } 
};

const formatMonthIndo = (monthStr) => { 
    if (!monthStr) return '-'; 
    const str = String(monthStr);
    if (str.includes(' ')) return str; 
    try { 
        const [year, month] = str.split('-'); 
        const date = new Date(year, month - 1); 
        if (isNaN(date.getTime())) return str; 
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' }); 
    } catch (e) { return str; } 
};

const formatTanggalCuti = (dateString) => {
    if (!dateString) return '-';
    const arrStr = String(dateString).split(',').map(d => d.trim()).sort();
    if (arrStr.length === 0 || !arrStr[0]) return '-';
    const monthsIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const groups = {};
    arrStr.forEach(d => {
        const parts = d.split('-');
        if(parts.length !== 3) return;
        const year = parts[0]; 
        const monthIdx = parseInt(parts[1], 10) - 1; 
        const day = parseInt(parts[2], 10);
        if(isNaN(monthIdx) || isNaN(day)) return;
        const month = monthsIndo[monthIdx]; 
        const key = `${month} ${year}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(day);
    });
    const formattedGroups = Object.entries(groups).map(([monthYear, days]) => {
        days.sort((a, b) => a - b);
        if (days.length === 1) return `${days[0]} ${monthYear}`;
        if (days.length === 2) return `${days[0]} dan ${days[1]} ${monthYear}`;
        const lastDay = days.pop(); 
        return `${days.join(', ')} dan ${lastDay} ${monthYear}`;
    });
    return formattedGroups.length > 0 ? formattedGroups.join(', ') : '-';
};

const getMinutes = (timeStr) => { 
    if (!timeStr) return 0; 
    const str = String(timeStr);
    if(!str.includes(':')) return 0;
    const [h, m] = str.split(':').map(Number); 
    return (h || 0) * 60 + (m || 0); 
};

const isTimeInWindow = (current, start, end) => { if (!start || !end) return true; if (start <= end) return current >= start && current <= end; return current >= start || current <= end; };
const calculateLateMinutes = (current, toleransi) => { if (!toleransi) return 0; let curM = getMinutes(current); let tolM = getMinutes(toleransi); if (curM < tolM && tolM > 20 * 60) curM += 24 * 60; return curM > tolM ? (curM - tolM) : 0; };
const checkIsLate = (current, start, toleransi, end) => { if (!start || !toleransi || !end) return false; let curM = getMinutes(current); let startM = getMinutes(start); let tolM = getMinutes(toleransi); let endM = getMinutes(end); if (endM < startM) { if (curM <= endM || curM < startM) curM += 24 * 60; if (tolM <= endM || tolM < startM) tolM += 24 * 60; } return curM > tolM; };
const getDistanceFromLatLonInM = (lat1, lon1, lat2, lon2) => { const R = 6371e3; const dLat = (Number(lat2)-Number(lat1)) * Math.PI / 180; const dLon = (Number(lon2)-Number(lon1)) * Math.PI / 180; const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(Number(lat1) * Math.PI / 180) * Math.cos(Number(lat2) * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); };

// Kompresi File sebelum dikirim ke Google Drive
const processFile = (file) => {
    return new Promise((resolve, reject) => {
        if (!file) return resolve(null);
        const isImage = file.type.startsWith('image/');
        const isPDF = file.type === 'application/pdf';
        if (!isImage && !isPDF) return reject('Format tidak didukung. Hanya menerima Gambar atau PDF.');
        if (isPDF && file.size > 5 * 1024 * 1024) return reject('Gagal: Ukuran PDF maksimal 5 MB.');
        if (isImage && file.size > 15 * 1024 * 1024) return reject('Gagal: Ukuran Foto melebihi 15MB.');

        if (isImage) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    setTimeout(() => {
                        const canvas = document.createElement('canvas');
                        const MAX_WIDTH = 800; const MAX_HEIGHT = 800;
                        let width = img.width; let height = img.height;
                        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } } 
                        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                        canvas.width = width; canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.drawImage(img, 0, 0, width, height);
                        resolve({ data: canvas.toDataURL('image/webp', 0.65), type: 'image' });
                    }, 0);
                };
            };
            reader.onerror = () => reject('Gagal membaca gambar.');
        } else {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => resolve({ data: event.target.result, type: 'pdf' });
            reader.onerror = () => reject('Gagal membaca file PDF.');
        }
    });
};

// ============================================================================
// KOMPONEN REUSABLE
// ============================================================================

const RealTimeGreeting = ({ userName, isLogin }) => {
    const [time, setTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const hours = time.getHours();
    let greeting = 'Selamat Pagi';
    if (hours >= 3 && hours < 11) greeting = 'Selamat Pagi';
    else if (hours >= 11 && hours < 15) greeting = 'Selamat Siang';
    else if (hours >= 15 && hours < 18) greeting = 'Selamat Sore';
    else greeting = 'Selamat Malam';

    const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/\./g, ':');
    const dateStr = time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (isLogin) {
        return (
            <div className="text-center mb-8 bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-inner">
                <p className="font-extrabold text-slate-800 text-2xl sm:text-3xl mb-2">{greeting} 👋</p>
                <p className="text-sm sm:text-base font-semibold text-slate-500">{dateStr}</p>
            </div>
        );
    }

    return (
        <div className="mb-8 flex flex-col justify-center items-center card p-8 sm:p-10 text-center shadow-md">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-3">{greeting}, {userName?.split(' ')[0]} 👋</h2>
            <p className="text-base sm:text-lg font-semibold text-slate-500 mb-6">{dateStr}</p>
            <div className="inline-flex items-center gap-4 bg-gradient-to-r from-slate-800 to-slate-900 px-10 py-4 rounded-full shadow-xl border border-slate-700 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                <i className="fa-regular fa-clock text-orange-500 text-3xl sm:text-4xl animate-pulse"></i>
                <div className="font-mono text-4xl sm:text-5xl font-bold text-white tracking-widest">
                    {timeStr}
                </div>
            </div>
        </div>
    );
};

const RiwayatAbsensi = ({ absensi, isUser, dbOps }) => {
    const [isModalOpen, setIsModalOpen] = useState(false); 
    const [editData, setEditData] = useState(null);
    const [filterNama, setFilterNama] = useState(''); 
    const [filterTanggal, setFilterTanggal] = useState(''); 
    const [filterJenis, setFilterJenis] = useState('');
    const [filterKeterangan, setFilterKeterangan] = useState('');

    const [filterBulanLaporan, setFilterBulanLaporan] = useState(() => getTodayDate().substring(0, 7));
    const [filterNamaLaporanBulanan, setFilterNamaLaporanBulanan] = useState('');

    const rekapBulanan = useMemo(() => {
        if (isUser) return [];
        const dataBulanIni = absensi.filter(a => String(a.tanggal).startsWith(filterBulanLaporan));
        const rekap = {};
        dataBulanIni.forEach(log => {
            const nama = log.nama || 'Unknown';
            if (!rekap[nama]) {
                rekap[nama] = { nama, hadir:0, pulang:0, piket:0, lepasPiket:0, sakit:0, izin:0, cuti:0, libur:0, telatKali:0, telatMenit:0 };
            }
            const jenis = String(log.jenis || '');
            if (jenis === 'Hadir') rekap[nama].hadir++;
            if (jenis === 'Hadir (Terlambat)') {
                rekap[nama].hadir++;
                rekap[nama].telatKali++;
                const match = String(log.keterangan || '').match(/Terlambat\s+(\d+)\s+Menit/i);
                if (match) rekap[nama].telatMenit += parseInt(match[1], 10);
            }
            if (jenis === 'Pulang') rekap[nama].pulang++;
            if (jenis === 'Piket') rekap[nama].piket++;
            if (jenis === 'Lepas Piket') rekap[nama].lepasPiket++;
            if (jenis === 'Sakit') rekap[nama].sakit++;
            if (jenis === 'Izin') rekap[nama].izin++;
            if (jenis === 'Cuti') rekap[nama].cuti++;
            if (jenis === 'Libur') rekap[nama].libur++;
        });
        return Object.values(rekap)
            .filter(r => r.nama.toLowerCase().includes(filterNamaLaporanBulanan.toLowerCase()))
            .sort((a, b) => a.nama.localeCompare(b.nama));
    }, [absensi, filterBulanLaporan, filterNamaLaporanBulanan, isUser]);

    const handlePrintLaporanBulananPDF = () => {
        if (rekapBulanan.length === 0) return Swal.fire('Info', 'Belum ada data absensi di bulan ini.', 'info');
        try {
            const { jsPDF } = window.jspdf; const doc = new jsPDF('landscape');
            doc.setFont("helvetica", "bold"); doc.setFontSize(16);
            doc.text("LAPORAN BULANAN ABSENSI PJLP", 14, 15);
            doc.setFontSize(10); doc.setFont("helvetica", "normal");
            doc.text(`Periode: ${formatMonthIndo(filterBulanLaporan)}`, 14, 21);
            doc.setLineWidth(0.5); doc.line(14, 24, 282, 24);
            const tableRows = rekapBulanan.map((r, i) => [
                i + 1, r.nama, r.hadir, r.telatKali, r.telatMenit, r.pulang, r.piket, r.lepasPiket, r.sakit, r.izin, r.cuti, r.libur
            ]);
            doc.autoTable({
                head: [["No", "Nama Pegawai", "Total Hadir", "Telat (Kali)", "Telat (Menit)", "Pulang", "Piket", "Lepas Piket", "Sakit", "Izin", "Cuti", "Libur"]],
                body: tableRows, startY: 28, styles: { fontSize: 8 }, headStyles: { fillColor: [249, 115, 22] }
            });
            doc.save(`Laporan_Absensi_${filterBulanLaporan}.pdf`);
        } catch (err) { Swal.fire('Error', 'Gagal membuat PDF', 'warning'); }
    };

    const handleDownloadLaporanBulananCSV = () => {
        if (rekapBulanan.length === 0) return Swal.fire('Info', 'Belum ada data absensi di bulan ini.', 'info');
        let csv = "\uFEFFNo;Nama Pegawai;Total Hadir;Telat (Kali);Telat (Menit);Pulang;Piket;Lepas Piket;Sakit;Izin;Cuti;Libur\n";
        rekapBulanan.forEach((r, i) => {
            csv += `"${i+1}";"${r.nama}";"${r.hadir}";"${r.telatKali}";"${r.telatMenit}";"${r.pulang}";"${r.piket}";"${r.lepasPiket}";"${r.sakit}";"${r.izin}";"${r.cuti}";"${r.libur}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); 
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a"); link.setAttribute("href", url); 
        link.setAttribute("download", `Laporan_Absensi_${filterBulanLaporan}.csv`); 
        document.body.appendChild(link); link.click(); link.remove();
    };

    const filteredAbsensi = absensi.filter(log => {
        const safeNama = String(log.nama || '');
        const safeJenis = String(log.jenis || '');
        const safeKeterangan = String(log.keterangan || '');
        const matchNama = safeNama.toLowerCase().includes(filterNama.toLowerCase());
        const matchTanggal = filterTanggal === '' || String(log.tanggal) === filterTanggal;
        const matchJenis = filterJenis === '' || safeJenis.toLowerCase().includes(filterJenis.toLowerCase());
        const matchKeterangan = safeKeterangan.toLowerCase().includes(filterKeterangan.toLowerCase());
        return matchNama && matchTanggal && matchJenis && matchKeterangan;
    }).sort((a, b) => {
        const nameCmp = String(a.nama || '').localeCompare(String(b.nama || ''));
        return nameCmp !== 0 ? nameCmp : String(b.tanggal || '').localeCompare(String(a.tanggal || ''));
    });

    const handlePrintPDF = () => { 
        if(filteredAbsensi.length === 0) return Swal.fire('Info', 'Belum ada data untuk diunduh.', 'info'); 
        try { 
            const { jsPDF } = window.jspdf; const doc = new jsPDF(); 
            doc.setFont("helvetica", "bold"); doc.setFontSize(16);
            doc.text("REKAP RIWAYAT ABSENSI PJLP", 14, 15); 
            doc.setFontSize(10); doc.setFont("helvetica", "normal");
            doc.text("Sistem Manajemen & Administrasi Terintegrasi", 14, 21);
            doc.setLineWidth(0.5); doc.line(14, 24, 196, 24);
            const tableRows = filteredAbsensi.map(log => [log.nama || '-', formatDateIndo(log.tanggal), log.waktu || '-', log.jenis || '-', log.keterangan || '-', log.bukti ? 'Terlampir' : 'Tidak Ada']); 
            doc.autoTable({ head: [["Nama", "Tanggal", "Waktu", "Jenis", "Keterangan", "Foto"]], body: tableRows, startY: 28, styles: { fontSize: 9 }, headStyles: { fillColor: [249, 115, 22] } }); 
            doc.save("Riwayat_Absensi.pdf"); 
        } catch (err) { Swal.fire('Error', 'Gagal membuat PDF', 'warning'); } 
    };
    
    const handleDownloadExcel = () => { 
        if(filteredAbsensi.length === 0) return Swal.fire('Info', 'Belum ada data.', 'info');
        let csv = "\uFEFFNama Pegawai;Tanggal;Waktu;Jenis;Keterangan;Foto\n"; 
        filteredAbsensi.forEach(r => { 
            const ket = String(r.keterangan || '').replace(/\n/g, ' ');
            const foto = r.bukti ? r.bukti : 'Tidak Ada';
            csv += `"${r.nama || '-'}";"${formatDateIndo(r.tanggal)}";"${r.waktu || '-'}";"${r.jenis || '-'}";"${ket}";"${foto}"\n`; 
        }); 
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); 
        const link = document.createElement("a"); link.setAttribute("href", url); link.setAttribute("download", "Riwayat_Absensi.csv"); document.body.appendChild(link); link.click(); link.remove(); 
    };
    
    const handleDelete = (id) => { Swal.fire({ title: 'Hapus?', icon: 'warning', showCancelButton: true }).then((res) => { if (res.isConfirmed) dbOps.remove('absensi', id); }); };
    const handleSaveEdit = (e) => { e.preventDefault(); const upd = { ...editData, waktu: editData.waktu_input }; delete upd.waktu_input; dbOps.update('absensi', editData.id, upd); setIsModalOpen(false); Swal.fire('Tersimpan', '', 'success'); };

    return (
        <div id="printable-area">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <h3 className="font-bold text-lg hidden sm:block">Riwayat Kehadiran</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={handlePrintPDF} className="btn-primary flex-1 sm:flex-none text-sm px-4 py-2"><i className="fa-solid fa-file-pdf mr-2"></i>PDF</button>
                    {!isUser && <button onClick={handleDownloadExcel} className="btn-secondary flex-1 sm:flex-none text-sm px-4 py-2"><i className="fa-solid fa-file-excel mr-2"></i>CSV</button>}
                </div>
            </div>
            <div className={`card p-4 mb-5 grid grid-cols-1 ${!isUser ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-4 no-print`}>
                {!isUser && ( <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Cari Nama</label><input type="text" placeholder="Ketik nama pegawai..." value={filterNama} onChange={(e) => setFilterNama(e.target.value)} className="input-style py-2 px-3 text-xs" /></div> )}
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Filter Tanggal</label><input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="input-style py-2 px-3 text-xs" /></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Filter Jenis</label><select value={filterJenis} onChange={(e) => setFilterJenis(e.target.value)} className="input-style py-2 px-3 text-xs"><option value="">Semua Jenis</option><option value="Hadir">Hadir / Terlambat</option><option value="Pulang">Pulang</option><option value="Piket">Piket</option><option value="Lepas Piket">Lepas Piket</option><option value="Sakit">Sakit</option><option value="Izin">Izin</option><option value="Cuti">Cuti</option><option value="Libur">Libur</option></select></div>
                <div><label className="text-xs font-semibold text-slate-500 mb-1 block">Cari Keterangan</label><input type="text" placeholder="Ketik keterangan..." value={filterKeterangan} onChange={(e) => setFilterKeterangan(e.target.value)} className="input-style py-2 px-3 text-xs" /></div>
            </div>
            <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="p-4">Nama</th><th className="p-4">Tanggal</th><th className="p-4">Waktu</th><th className="p-4">Jenis</th><th className="p-4">Keterangan</th><th className="p-4 text-center no-print">Foto</th>{!isUser && <th className="p-4 text-center">Aksi</th>}</tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredAbsensi.length === 0 ? <tr><td colSpan={!isUser ? "7" : "6"} className="p-8 text-center text-slate-400">Data Tidak Ditemukan</td></tr> : filteredAbsensi.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="p-4 font-bold">{log.nama || '-'}</td>
                                <td className="p-4 text-slate-600">{formatDateIndo(log.tanggal)}</td>
                                <td className="p-4 font-mono text-xs">{log.waktu || '-'}</td>
                                <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${String(log.jenis||'').includes('Terlambat')?'bg-rose-100 text-rose-700':'bg-emerald-100 text-emerald-700'}`}>{log.jenis || '-'}</span></td>
                                <td className="p-4 text-xs text-slate-500">{log.keterangan || '-'}</td>
                                <td className="p-4 text-center no-print">{isImageFile(log.bukti) ? <img src={log.bukti} loading="lazy" alt="Foto" className="h-10 w-10 object-cover rounded-lg border shadow-sm mx-auto cursor-pointer hover:opacity-80" onClick={()=>Swal.fire({imageUrl: log.bukti})}/> : (log.bukti ? <a href={log.bukti} target="_blank" rel="noreferrer" className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border font-semibold"><i className="fa-solid fa-download"></i></a> : <span className="text-slate-300">-</span>)}</td>
                                {!isUser && (<td className="p-4 text-center"><button onClick={() => {setEditData({ ...log, waktu_input: String(log.waktu||'').replace(/\./g, ':').substring(0, 5) }); setIsModalOpen(true);}} className="text-amber-500 mr-3"><i className="fa-solid fa-pen"></i></button><button onClick={() => handleDelete(log.id)} className="text-rose-500"><i className="fa-solid fa-trash"></i></button></td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && editData && (<div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"><div className="bg-white rounded-2xl w-full max-w-sm p-6 modal-animate"><h3 className="font-bold text-lg mb-4">Edit Absensi</h3><form onSubmit={handleSaveEdit} className="space-y-4"><input type="date" required value={editData.tanggal} onChange={e=>setEditData({...editData, tanggal: e.target.value})} className="input-style"/><input type="time" required value={editData.waktu_input || ''} onChange={e=>setEditData({...editData, waktu_input: e.target.value})} className="input-style"/><select required value={editData.jenis} onChange={e=>setEditData({...editData, jenis: e.target.value})} className="input-style"><option value="Hadir">Hadir</option><option value="Hadir (Terlambat)">Hadir (Terlambat)</option><option value="Pulang">Pulang</option><option value="Piket">Piket</option><option value="Lepas Piket">Lepas Piket</option></select><input type="text" value={editData.keterangan || ''} onChange={e=>setEditData({...editData, keterangan: e.target.value})} className="input-style"/><div className="flex gap-2 justify-end mt-4"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 border rounded-lg text-sm font-semibold">Batal</button><button type="submit" className="btn-primary text-sm px-4 py-2">Simpan</button></div></form></div></div>)}
            
            {!isUser && (
                <div className="mt-8 card p-6 no-print">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                        <div>
                            <h3 className="font-bold text-lg text-slate-800"><i className="fa-solid fa-chart-pie text-orange-500 mr-2"></i>Laporan Bulanan Absensi</h3>
                            <p className="text-xs text-slate-500 mt-1">Akumulasi rekapitulasi kehadiran seluruh pegawai per bulan.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            <input type="text" placeholder="Cari nama pegawai..." value={filterNamaLaporanBulanan} onChange={(e) => setFilterNamaLaporanBulanan(e.target.value)} className="input-style py-2 px-3 text-xs w-full sm:w-auto min-w-[150px]" />
                            <input type="month" value={filterBulanLaporan} onChange={(e) => setFilterBulanLaporan(e.target.value)} className="input-style py-2 px-3 text-xs w-full sm:w-auto" />
                            <button onClick={handlePrintLaporanBulananPDF} className="btn-primary flex-1 sm:flex-none text-xs py-2 px-4 bg-rose-500 hover:bg-rose-600 shadow-sm"><i className="fa-solid fa-file-pdf mr-2"></i>Cetak PDF</button>
                            <button onClick={handleDownloadLaporanBulananCSV} className="btn-secondary flex-1 sm:flex-none text-xs py-2 px-4 shadow-sm"><i className="fa-solid fa-file-excel mr-2"></i>Cetak CSV</button>
                        </div>
                    </div>
                    <div className="overflow-x-auto border rounded-xl border-slate-200">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-100 border-b border-slate-200">
                                <tr>
                                    <th className="p-3 font-semibold text-slate-700">Nama Pegawai</th>
                                    <th className="p-3 font-semibold text-center text-emerald-600">Total Hadir</th>
                                    <th className="p-3 font-semibold text-center text-red-600">Telat (x)</th>
                                    <th className="p-3 font-semibold text-center text-red-600">Mnt Telat</th>
                                    <th className="p-3 font-semibold text-center text-orange-600">Pulang</th>
                                    <th className="p-3 font-semibold text-center text-teal-600">Piket</th>
                                    <th className="p-3 font-semibold text-center text-cyan-600">Lps Pkt</th>
                                    <th className="p-3 font-semibold text-center text-rose-600">Sakit</th>
                                    <th className="p-3 font-semibold text-center text-blue-600">Izin</th>
                                    <th className="p-3 font-semibold text-center text-indigo-600">Cuti</th>
                                    <th className="p-3 font-semibold text-center text-violet-600">Libur</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rekapBulanan.length === 0 ? <tr><td colSpan="11" className="p-6 text-center text-slate-400">Tidak ada data absensi di bulan ini.</td></tr> : 
                                rekapBulanan.map((r, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-3 font-bold text-slate-800">{r.nama}</td>
                                        <td className="p-3 text-center font-bold text-emerald-600">{r.hadir}</td>
                                        <td className="p-3 text-center font-bold text-red-600">{r.telatKali}</td>
                                        <td className="p-3 text-center font-bold text-red-600">{r.telatMenit}</td>
                                        <td className="p-3 text-center font-semibold text-orange-600">{r.pulang}</td>
                                        <td className="p-3 text-center font-semibold text-teal-600">{r.piket}</td>
                                        <td className="p-3 text-center font-semibold text-cyan-600">{r.lepasPiket}</td>
                                        <td className="p-3 text-center font-semibold text-rose-600">{r.sakit}</td>
                                        <td className="p-3 text-center font-semibold text-blue-600">{r.izin}</td>
                                        <td className="p-3 text-center font-semibold text-indigo-600">{r.cuti}</td>
                                        <td className="p-3 text-center font-semibold text-violet-600">{r.libur}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// ============================================================================
// KOMPONEN USER (PJLP)
// ============================================================================

const UserAbsensi = ({ user, absensi, dbOps, timeSlots, gpsSettings, laporanKerja = [], crmInternal = [], bankSampah = [], jadwalKerja = [] }) => {
    const [showCamera, setShowCamera] = useState(false); const [absenType, setAbsenType] = useState(''); const videoRef = useRef(null); const canvasRef = useRef(null); const [stream, setStream] = useState(null);

    useEffect(() => {
        return () => { if (stream) stream.getTracks().forEach(track => track.stop()); };
    }, [stream]);

    const mySlotInfo = timeSlots.find(slot => (slot.users || []).map(String).includes(String(user.id)) && (slot.id <= 5 || slot.id === 9));
    const pulangSlotInfo = timeSlots.find(slot => slot.id === 8);
    const piketSlotInfo = timeSlots.find(slot => slot.id === 6);
    const lepasPiketSlotInfo = timeSlots.find(slot => slot.id === 7);

    const todayLogs = absensi.filter(a => String(a.id_user) === String(user.id) && String(a.tanggal) === getTodayDate());
    const hasHadir = todayLogs.some(a => String(a.jenis || '').includes('Hadir'));
    const hasPulang = todayLogs.some(a => String(a.jenis || '') === 'Pulang');
    const hasPiket = todayLogs.some(a => String(a.jenis || '') === 'Piket');
    const hasLepasPiket = todayLogs.some(a => String(a.jenis || '') === 'Lepas Piket');
    const hasFullDayOff = todayLogs.some(a => ['Sakit', 'Izin', 'Cuti', 'Libur'].includes(String(a.jenis || '')));

    const isOffDisabled = hasFullDayOff || hasHadir || hasLepasPiket || hasPiket;

    const nowState = new Date(); const currentTimeState = `${nowState.getHours().toString().padStart(2, '0')}:${nowState.getMinutes().toString().padStart(2, '0')}`;
    const inHadirTime = (mySlotInfo && mySlotInfo.awal_hadir && mySlotInfo.akhir_hadir) ? isTimeInWindow(currentTimeState, mySlotInfo.awal_hadir, mySlotInfo.akhir_hadir) : false;
    const inPulangTime = (pulangSlotInfo && pulangSlotInfo.masuk && pulangSlotInfo.pulang) ? isTimeInWindow(currentTimeState, pulangSlotInfo.masuk, pulangSlotInfo.pulang) : false;
    const inPiketTime = (piketSlotInfo && piketSlotInfo.masuk && piketSlotInfo.pulang) ? isTimeInWindow(currentTimeState, piketSlotInfo.masuk, piketSlotInfo.pulang) : false;
    const inLepasPiketTime = (lepasPiketSlotInfo && lepasPiketSlotInfo.masuk && lepasPiketSlotInfo.pulang) ? isTimeInWindow(currentTimeState, lepasPiketSlotInfo.masuk, lepasPiketSlotInfo.pulang) : false;

    const absenButtons = [
        { id: 'Hadir', icon: 'fa-sign-in-alt', color: 'bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 hover:from-emerald-500 hover:via-green-600 hover:to-teal-700', requireCamera: true, disabled: hasFullDayOff || hasHadir || hasLepasPiket || !inHadirTime },
        { id: 'Pulang', icon: 'fa-sign-out-alt', color: 'bg-gradient-to-br from-orange-400 via-amber-500 to-red-500 hover:from-orange-500 hover:via-amber-600 hover:to-red-600', requireCamera: true, disabled: hasFullDayOff || hasPulang || !inPulangTime },
        { id: 'Piket', icon: 'fa-shield-alt', color: 'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-500 hover:from-teal-500 hover:via-cyan-600 hover:to-blue-600', requireCamera: true, disabled: hasFullDayOff || hasPiket || !inPiketTime },
        { id: 'Lepas Piket', icon: 'fa-home', color: 'bg-gradient-to-br from-amber-300 via-yellow-500 to-orange-500 hover:from-amber-400 hover:via-yellow-600 hover:to-orange-600', requireCamera: true, disabled: hasFullDayOff || hasLepasPiket || !inLepasPiketTime },
        { id: 'Sakit', icon: 'fa-procedures', color: 'bg-gradient-to-br from-rose-400 via-pink-500 to-red-500 hover:from-rose-500 hover:via-pink-600 hover:to-red-600', requireUpload: true, disabled: isOffDisabled },
        { id: 'Izin', icon: 'fa-envelope-open-text', color: 'bg-gradient-to-br from-blue-400 via-indigo-500 to-violet-600 hover:from-blue-500 hover:via-indigo-600 hover:to-violet-700', requireUpload: true, disabled: isOffDisabled },
        { id: 'Cuti', icon: 'fa-plane-departure', color: 'bg-gradient-to-br from-indigo-400 via-purple-500 to-fuchsia-600 hover:from-indigo-500 hover:via-purple-600 hover:to-fuchsia-700', requireUpload: true, disabled: isOffDisabled },
        { id: 'Libur', icon: 'fa-calendar-check', color: 'bg-gradient-to-br from-slate-400 via-gray-500 to-zinc-600 hover:from-slate-500 hover:via-gray-600 hover:to-zinc-700', requireUpload: false, disabled: isOffDisabled }
    ];

    const handleAbsenClick = async (btn) => {
        if (btn.disabled) return;
        const now = new Date(); const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const gps = (gpsSettings && gpsSettings.length > 0) ? gpsSettings[0] : null;
        const needsGPS = ['Hadir', 'Pulang', 'Piket', 'Lepas Piket'].includes(btn.id);

        if (gps && gps.isActive && needsGPS) {
            if (!gps.latitude || !gps.longitude) return Swal.fire('Error', 'Admin belum mengatur koordinat pusat.', 'error');
            Swal.fire({ title: 'Cek Lokasi...', html: 'Pastikan GPS HP aktif.', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
            try {
                const userLoc = await new Promise((resolve, reject) => { if (!navigator.geolocation) reject('Geolokasi tidak didukung.'); navigator.geolocation.getCurrentPosition((pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }), (err) => reject('Izin lokasi ditolak.')); });
                const dist = getDistanceFromLatLonInM(userLoc.lat, userLoc.lon, parseFloat(gps.latitude), parseFloat(gps.longitude));
                if (dist > parseFloat(gps.radius)) return Swal.fire('Di Luar Jangkauan', `Anda berjarak ${Math.round(dist)} m dari kantor.`, 'error');
                Swal.close();
            } catch (err) { return Swal.fire('Gagal', err, 'error'); }
        }

        if (btn.requireCamera) {
            setAbsenType(btn.id); setShowCamera(true);
            try { const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } }); setStream(s); if(videoRef.current) videoRef.current.srcObject = s; } catch (err) { Swal.fire('Kamera Diblokir', 'Browser menolak akses kamera.', 'error'); setShowCamera(false); }
        } else if (btn.requireUpload) {
            const { value: file } = await Swal.fire({ title: `Upload Bukti ${btn.id}`, input: 'file', inputAttributes: { accept: 'image/*,application/pdf' }, showCancelButton: true });
            if (file) { try { const res = await processFile(file); saveAbsensi(btn.id, res.data); } catch(err) { Swal.fire('Error', err, 'error'); } }
        } else {
            Swal.fire({ title: `Kirim Absen ${btn.id}?`, showCancelButton: true, confirmButtonText: 'Kirim' }).then((res) => { if (res.isConfirmed) saveAbsensi(btn.id, null); });
        }
    };

    const takePhoto = () => {
        const video = videoRef.current; const canvas = canvasRef.current; 
        const MAX_DIM = 400; let w = video.videoWidth; let h = video.videoHeight;
        if (w > h) { if (w > MAX_DIM) { h *= MAX_DIM / w; w = MAX_DIM; } } else { if (h > MAX_DIM) { w *= MAX_DIM / h; h = MAX_DIM; } }
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d'); ctx.drawImage(video, 0, 0, w, h);
        const now = new Date(); const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); const timeStr = now.toLocaleTimeString('id-ID'); const timestamp = `${dateStr} ${timeStr}`;
        ctx.font = 'bold 14px Arial'; ctx.fillStyle = '#ffeb3b'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.shadowColor = 'black'; ctx.shadowBlur = 6; ctx.lineWidth = 2; ctx.strokeStyle = 'black';
        const yPos = h - 10; ctx.strokeText(timestamp, w / 2, yPos); ctx.fillText(timestamp, w / 2, yPos);
        const photoData = canvas.toDataURL('image/jpeg', 0.4); 
        if (stream) stream.getTracks().forEach(track => track.stop()); setShowCamera(false); saveAbsensi(absenType, photoData);
    };

    const saveAbsensi = (jenis, bukti) => {
        const now = new Date(); let finalJenis = jenis; let keteranganKeterlambatan = '-'; 
        if (jenis === 'Hadir' && mySlotInfo && mySlotInfo.awal_hadir && mySlotInfo.batas_toleransi && mySlotInfo.akhir_hadir) {
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            if (checkIsLate(currentTime, mySlotInfo.awal_hadir, mySlotInfo.batas_toleransi, mySlotInfo.akhir_hadir)) { finalJenis = 'Hadir (Terlambat)'; keteranganKeterlambatan = `Terlambat ${calculateLateMinutes(currentTime, mySlotInfo.batas_toleransi)} Menit`; } else { keteranganKeterlambatan = 'Tepat Waktu'; }
        }
        dbOps.add('absensi', { id: generateId(), id_user: user.id, nama: user.nama, tanggal: getTodayDate(), waktu: now.toLocaleTimeString('id-ID'), jenis: finalJenis, keterangan: keteranganKeterlambatan, bukti: bukti });
        Swal.fire({icon: 'success', title: 'Berhasil', text: `Absen tersimpan ke Spreadsheet & Drive!`, confirmButtonColor: '#f97316'});
    };

    const closeCamera = () => { if (stream) stream.getTracks().forEach(track => track.stop()); setShowCamera(false); };
    const userLogs = absensi.filter(a => String(a.id_user) === String(user.id));

    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const [holidays, setHolidays] = useState({});
    const [loadingHolidays, setLoadingHolidays] = useState(false);

    useEffect(() => {
        setLoadingHolidays(true);
        fetch(`https://api-harilibur.vercel.app/api?year=${calYear}`)
        .then(res => res.json())
        .then(data => {
            const hols = {};
            if(Array.isArray(data)) { data.forEach(d => { if(d.is_national_holiday) hols[d.holiday_date] = d.holiday_name; }); }
            setHolidays(hols); setLoadingHolidays(false);
        }).catch(() => { setLoadingHolidays(false); });
    }, [calYear]);

    const nextMonth = () => { if(calMonth===11){setCalMonth(0);setCalYear(calYear+1);}else{setCalMonth(calMonth+1);} };
    const prevMonth = () => { if(calMonth===0){setCalMonth(11);setCalYear(calYear-1);}else{setCalMonth(calMonth-1);} };

    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay(); 
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const calDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    const attendanceMap = {};
    userLogs.forEach(log => {
        const logDate = new Date(log.tanggal);
        if (logDate.getFullYear() === calYear && logDate.getMonth() === calMonth) {
            const day = logDate.getDate();
            if (!attendanceMap[day]) attendanceMap[day] = [];
            attendanceMap[day].push(log);
        }
    });

    const cJenis = (j) => userLogs.filter(a => String(a.jenis || '') === j).length;
    const currentMonthStr = getTodayDate().substring(0, 7);
    const terlambatBulanIni = userLogs.filter(a => String(a.jenis || '') === 'Hadir (Terlambat)' && String(a.tanggal || '').startsWith(currentMonthStr)).length;
    const totalMenitTerlambat = userLogs
        .filter(a => String(a.jenis || '') === 'Hadir (Terlambat)' && String(a.tanggal || '').startsWith(currentMonthStr))
        .reduce((total, a) => {
            const match = String(a.keterangan || '').match(/Terlambat\s+(\d+)\s+Menit/i);
            return total + (match ? parseInt(match[1], 10) : 0);
        }, 0);
    
    const laporanUser = laporanKerja.filter(l => String(l.id_user) === String(user.id) && String(l.tanggal || '').startsWith(currentMonthStr));
    const jumlahLaporan = laporanUser.length;
    const crmUserBulanIni = (crmInternal || []).filter(c => String(c.id_user) === String(user.id) && String(c.tanggal || '').startsWith(currentMonthStr));
    const totalCrm = crmUserBulanIni.length;
    const crmSelesai = crmUserBulanIni.filter(c => c.status_penyelesaian === 'Selesai').length;
    
    const stats = [
        { label: 'Hadir', count: userLogs.filter(a=>String(a.jenis || '').includes('Hadir')).length, color: 'text-emerald-600 bg-emerald-50', icon: 'fa-sign-in-alt' },
        { label: 'Pulang', count: cJenis('Pulang'), color: 'text-orange-600 bg-orange-50', icon: 'fa-sign-out-alt' },
        { label: 'Piket', count: cJenis('Piket'), color: 'text-teal-600 bg-teal-50', icon: 'fa-shield-alt' },
        { label: 'Lepas Piket', count: cJenis('Lepas Piket'), color: 'text-cyan-600 bg-cyan-50', icon: 'fa-home' },
        { label: 'Sakit', count: cJenis('Sakit'), color: 'text-rose-600 bg-rose-50', icon: 'fa-procedures' },
        { label: 'Izin', count: cJenis('Izin'), color: 'text-blue-600 bg-blue-50', icon: 'fa-envelope-open-text' },
        { label: 'Cuti', count: cJenis('Cuti'), color: 'text-indigo-600 bg-indigo-50', icon: 'fa-plane-departure' },
        { label: 'Libur', count: cJenis('Libur'), color: 'text-violet-600 bg-violet-50', icon: 'fa-calendar-check' },
        { label: 'Telat (Kali)', count: terlambatBulanIni, color: 'text-amber-600 bg-amber-50', icon: 'fa-user-clock' },
        { label: 'Telat (Menit)', count: totalMenitTerlambat, color: totalMenitTerlambat > 540 ? 'text-white bg-red-600 shadow-md shadow-red-500/50' : 'text-rose-600 bg-rose-50', icon: 'fa-stopwatch' },
        { label: 'Jml Laporan', count: jumlahLaporan, color: 'text-purple-600 bg-purple-50', icon: 'fa-file-signature' },
        { label: 'Jml Tugas', count: crmSelesai, color: 'text-indigo-600 bg-indigo-50', icon: 'fa-list-check' }
    ];

    const hadirBulanIni = userLogs.filter(a => String(a.jenis || '').includes('Hadir') && String(a.tanggal || '').startsWith(currentMonthStr)).length;
    let perfKehadiran = hadirBulanIni === 0 ? 0 : hadirBulanIni <= 5 ? 25 : hadirBulanIni <= 10 ? 50 : hadirBulanIni <= 15 ? 75 : 100;
    let perfLaporan = jumlahLaporan === 0 ? 0 : jumlahLaporan === 1 ? 50 : 100;
    let perfTugas = totalCrm === 0 ? 0 : crmSelesai === 0 ? 50 : crmSelesai === 1 ? 75 : 100;
    const sampahUserBulanIni = (bankSampah || []).filter(b => String(b.id_user) === String(user.id) && String(b.tanggal || '').startsWith(currentMonthStr));
    const totalBeratSampah = sampahUserBulanIni.reduce((sum, b) => sum + Number(b.berat || 0), 0);
    let perfKewajiban = totalBeratSampah > 5 ? 100 : totalBeratSampah >= 5 ? 90 : totalBeratSampah >= 4 ? 75 : totalBeratSampah >= 3 ? 45 : totalBeratSampah >= 2 ? 30 : totalBeratSampah >= 1 ? 15 : 0;
    
    const performaStats = [
        { label: 'Performa Kehadiran', count: `${perfKehadiran}%`, color: 'text-emerald-600 bg-emerald-50', icon: 'fa-user-check' },
        { label: 'Performa Laporan', count: `${perfLaporan}%`, color: 'text-blue-600 bg-blue-50', icon: 'fa-file-signature' },
        { label: 'Performa Tugas', count: `${perfTugas}%`, color: 'text-purple-600 bg-purple-50', icon: 'fa-list-check' },
        { label: 'Performa Kewajiban', count: `${perfKewajiban}%`, color: 'text-indigo-600 bg-indigo-50', icon: 'fa-star' }
    ];

    const hasReportToday = laporanKerja.some(l => String(l.id_user) === String(user.id) && String(l.tanggal) === getTodayDate());
    const pendingCrmCount = (crmInternal || []).filter(c => String(c.id_user) === String(user.id) && c.status_penyelesaian !== 'Selesai').length;

    return (
        <div>
            <div className="flex flex-col gap-3 mb-6">
                {hasFullDayOff && (
                    <div className="bg-white border border-amber-100 border-l-4 border-l-amber-500 p-3 rounded-xl flex items-start gap-3 shadow-sm">
                        <div className="bg-amber-100 p-2 rounded-lg shrink-0"><i className="fa-solid fa-lock text-amber-500 text-sm"></i></div>
                        <div><p className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider mb-0.5">Absensi Dinonaktifkan</p><p className="text-[11px] text-slate-500 font-medium leading-relaxed">Anda telah memilih Sakit, Izin, Cuti, atau Libur hari ini.</p></div>
                    </div>
                )}
                {!hasHadir && !hasFullDayOff && (
                    <div className="bg-gradient-to-r from-blue-50 to-white border border-blue-100 border-l-4 border-l-blue-500 p-3 rounded-xl flex items-start gap-3 shadow-sm">
                        <div className="bg-white shadow-sm p-2 rounded-lg shrink-0"><i className="fa-solid fa-bell text-blue-500 text-sm animate-bounce"></i></div>
                        <div><p className="text-[11px] font-extrabold text-blue-700 uppercase tracking-wider mb-0.5">Pengingat Absensi!</p><p className="text-[11px] text-slate-600 font-medium leading-relaxed">Anda belum melakukan Absen Hadir hari ini.</p></div>
                    </div>
                )}
                {!hasReportToday && !hasFullDayOff && (
                    <div className="bg-gradient-to-r from-purple-50 to-white border border-purple-100 border-l-4 border-l-purple-500 p-3 rounded-xl flex items-start gap-3 shadow-sm">
                        <div className="bg-white shadow-sm p-2 rounded-lg shrink-0"><i className="fa-solid fa-file-signature text-purple-500 text-sm animate-pulse"></i></div>
                        <div><p className="text-[11px] font-extrabold text-purple-700 uppercase tracking-wider mb-0.5">Laporan Kerja Belum Diisi!</p><p className="text-[11px] text-slate-600 font-medium leading-relaxed">Jangan lupa mengisi aktivitas harian Anda hari ini.</p></div>
                    </div>
                )}
                {pendingCrmCount > 0 && !hasFullDayOff && (
                    <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 border-l-4 border-l-indigo-500 p-3 rounded-xl flex items-start gap-3 shadow-sm">
                        <div className="bg-white shadow-sm p-2 rounded-lg shrink-0"><i className="fa-solid fa-clipboard-list text-indigo-500 text-sm animate-bounce"></i></div>
                        <div><p className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider mb-0.5">Tugas CRM Baru!</p><p className="text-[11px] text-slate-600 font-medium leading-relaxed">Ada <b className="text-indigo-600">{pendingCrmCount}</b> tugas CRM menanti.</p></div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {absenButtons.map(btn => (
                    <button type="button" key={btn.id} onClick={() => handleAbsenClick(btn)} disabled={btn.disabled} className={`${btn.color} ${btn.disabled ? 'opacity-40 cursor-not-allowed grayscale' : 'shadow-sm active:scale-95'} text-white rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all h-28`}>
                        <i className={`fa-solid ${btn.icon} text-2xl`}></i><span className="font-bold text-sm">{btn.id}</span>
                    </button>
                ))}
            </div>
            <div className="mb-8">
                <h3 className="font-bold text-slate-800 mb-4 text-lg">Statistik Kehadiran</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {stats.map(s => (<div key={s.label} className="card p-3 sm:p-4 flex flex-col items-center justify-center text-center"><div className={`${s.color} w-10 h-10 rounded-full flex items-center justify-center mb-2`}><i className={`fa-solid ${s.icon} text-lg`}></i></div><span className="text-xl font-bold text-slate-800">{s.count}</span><span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-1 leading-tight">{s.label}</span></div>))}
                </div>
            </div>
            <div className="mb-8">
                <h3 className="font-bold text-slate-800 mb-4 text-lg">Statistik Performa (Bulan Ini)</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {performaStats.map(s => (<div key={s.label} className="card p-3 sm:p-4 flex flex-col items-center justify-center text-center"><div className={`${s.color} w-10 h-10 rounded-full flex items-center justify-center mb-2`}><i className={`fa-solid ${s.icon} text-lg`}></i></div><span className="text-xl font-bold text-slate-800">{s.count}</span><span className="text-[9px] sm:text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-1 leading-tight">{s.label}</span></div>))}
                </div>
            </div>

            <div className="mb-8 card p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg"><i className="fa-solid fa-calendar-days text-orange-500 mr-2"></i>Kalender Aktivitas</h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Kehadiran & Hari Libur Nasional</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <button type="button" onClick={prevMonth} className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"><i className="fa-solid fa-chevron-left"></i></button>
                        <span className="text-xs font-bold text-slate-700 min-w-[120px] text-center bg-white border border-slate-200 px-3 py-1.5 rounded-lg">
                            {loadingHolidays ? <i className="fa-solid fa-spinner fa-spin"></i> : `${monthNames[calMonth]} ${calYear}`}
                        </span>
                        <button type="button" onClick={nextMonth} className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600"><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-[10px] sm:text-xs mb-2">
                    {['M','S','S','R','K','J','S'].map((d,i)=><div key={i} className={`font-bold py-1 ${i===0 ? 'text-rose-500' : 'text-slate-400'}`}>{d}</div>)}
                    {blanks.map(b => <div key={`blank-${b}`}></div>)}
                    {calDays.map(day => { 
                        const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; 
                        const isSunday = new Date(calYear, calMonth, day).getDay() === 0;
                        const isHoliday = holidays[dateStr];
                        const isTanggalMerah = isSunday || isHoliday;
                        const dayLogs = attendanceMap[day] || [];
                        const hasHadirDay = dayLogs.some(l => String(l.jenis).includes('Hadir') && !String(l.jenis).includes('Terlambat'));
                        const hasTelatDay = dayLogs.some(l => String(l.jenis).includes('Terlambat'));
                        const hasPiketDay = dayLogs.some(l => ['Piket', 'Lepas Piket'].includes(String(l.jenis)));
                        const hasOffDay = dayLogs.some(l => ['Sakit', 'Izin', 'Cuti', 'Libur'].includes(String(l.jenis)));
                        const myJadwal = jadwalKerja.find(j => String(j.id_user) === String(user.id) && j.tanggal === dateStr);
                        let bgClass = isTanggalMerah ? 'bg-rose-50 text-rose-600 border-rose-100 font-bold' : 'bg-slate-50 text-slate-700 border-transparent font-medium';
                        if (hasHadirDay || hasPiketDay) bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold';
                        else if (hasTelatDay) bgClass = 'bg-red-100 text-red-800 border-red-300 font-bold';
                        else if (hasOffDay) bgClass = 'bg-purple-50 text-purple-700 border-purple-200 font-bold';
                        else if (myJadwal) bgClass = 'bg-blue-50 text-blue-700 border-blue-200 font-bold';
                        return (
                            <div key={day} className={`py-2 rounded-xl border transition-all ${bgClass} shadow-sm`}>
                                <span className="block">{day}</span>
                            </div>
                        ); 
                    })}
                </div>
            </div>

            <div className="card p-6">
                <h3 className="font-bold text-slate-800 mb-4 text-lg">Aktivitas Hari Ini</h3>
                {todayLogs.length === 0 ? <p className="text-center text-slate-400 py-6">Belum ada aktivitas.</p> : (<ul className="space-y-3">{todayLogs.map(log => (<li key={log.id} className="bg-slate-50 p-4 rounded-xl flex justify-between items-center border border-slate-100"><div className="pl-2 border-l-4 border-orange-500"><p className="font-bold text-slate-800 text-sm">{log.jenis || '-'}</p><p className="text-xs text-slate-500 mt-1">{formatDateIndo(log.tanggal)} | {log.waktu || '-'}</p></div><div className="text-right">{log.keterangan && log.keterangan !== '-' && (<span className="text-[10px] px-2 py-1 rounded-md font-bold bg-emerald-100 text-emerald-700">{log.keterangan}</span>)}</div></li>))}</ul>)}
            </div>
            {showCamera && (<div className="fixed inset-0 bg-slate-900/90 z-[60] flex flex-col items-center justify-center p-4"><h3 className="text-white text-xl mb-4 font-bold">Kamera: {absenType}</h3><div className="relative w-full max-w-md bg-black rounded-3xl overflow-hidden"><video ref={videoRef} autoPlay playsInline className="w-full h-auto object-cover" style={{minHeight: '400px'}}></video><canvas ref={canvasRef} className="hidden"></canvas><div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6"><button onClick={takePhoto} className="bg-white text-orange-500 rounded-full h-14 w-14 flex items-center justify-center hover:scale-110 transition-transform"><i className="fa-solid fa-camera text-xl"></i></button><button onClick={closeCamera} className="bg-rose-500 text-white rounded-full h-14 w-14 flex items-center justify-center hover:scale-110 transition-transform"><i className="fa-solid fa-times text-xl"></i></button></div></div></div>)}
        </div>
    );
};

const UserCuti = ({ user, cuti, dbOps }) => {
    const [alasan, setAlasan] = useState(''); const [alasanLainnya, setAlasanLainnya] = useState(''); const [alamat, setAlamat] = useState(''); const [provinsi, setProvinsi] = useState(''); const [kota, setKota] = useState(''); const [kecamatan, setKecamatan] = useState(''); const [kelurahan, setKelurahan] = useState(''); const [selectedDates, setSelectedDates] = useState([]);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); const [editForm, setEditForm] = useState(null);
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay();
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

    const nextMonth = () => { if(calMonth===11){setCalMonth(0);setCalYear(calYear+1);}else{setCalMonth(calMonth+1);} };
    const prevMonth = () => { if(calMonth===0){setCalMonth(11);setCalYear(calYear-1);}else{setCalMonth(calMonth-1);} };
    const toggleDate = (day) => { const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; setSelectedDates(selectedDates.includes(dateStr) ? selectedDates.filter(d => d !== dateStr) : [...selectedDates, dateStr]); };
    
    const myCuti = cuti.filter(c => String(c.id_user) === String(user.id));
    let sisaCutiUser = user.jumlah_hak_cuti !== undefined ? Number(user.jumlah_hak_cuti) : 12;
    myCuti.filter(c => c.status === 'Menunggu' || c.status === 'Revisi').forEach(c => { if (c.tanggal_cuti) sisaCutiUser -= String(c.tanggal_cuti||'').split(',').length; });

    const handleSubmit = (e) => { 
        e.preventDefault(); 
        if(selectedDates.length === 0) return Swal.fire('Oops', 'Pilih minimal 1 tanggal.', 'warning'); 
        if(selectedDates.length > sisaCutiUser) return Swal.fire('Oops', `Sisa cuti Anda hanya ${sisaCutiUser} hari.`, 'warning');
        const finalAlasan = alasan === 'Lainnya' ? alasanLainnya : alasan; 
        const alamatLengkap = `${alamat}, Kel. ${kelurahan}, Kec. ${kecamatan}, ${kota}, Prov. ${provinsi}`; 
        dbOps.add('cuti', { id: generateId(), id_user: user.id, nama: user.nama, nik: user.nik, jabatan: user.jabatan, no_telp: user.no_telp, masa_kerja: user.masa_kerja, tanggal_pengajuan: getTodayDate(), tanggal_cuti: [...selectedDates].sort().join(', '), alasan: finalAlasan, alamat: alamatLengkap, status: 'Menunggu', bukti_persetujuan: null, keterangan_admin: '' }); 
        Swal.fire('Sukses', 'Pengajuan terkirim.', 'success'); 
        setAlasan(''); setAlasanLainnya(''); setAlamat(''); setKelurahan(''); setKecamatan(''); setKota(''); setProvinsi(''); setSelectedDates([]); 
    };
    
    const handleDelete = (id) => { Swal.fire({ title: 'Hapus Pengajuan Cuti?', icon: 'warning', showCancelButton: true }).then((res) => { if (res.isConfirmed) dbOps.remove('cuti', id); }); };
    const openEdit = (c) => { setEditForm({ id: c.id, tanggal_cuti: c.tanggal_cuti || '', alasan: c.alasan || '', alamat: c.alamat || '' }); setIsEditModalOpen(true); };
    const handleSaveEdit = (e) => { e.preventDefault(); dbOps.update('cuti', editForm.id, { tanggal_cuti: e.target.tanggal_cuti.value, alasan: e.target.alasan.value, alamat: e.target.alamat.value, status: 'Menunggu', keterangan_admin: '' }); setIsEditModalOpen(false); Swal.fire('Tersimpan', 'Pengajuan diperbarui.', 'success'); };

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="card p-6">
                <h3 className="font-bold text-lg mb-4 border-b pb-2">Form Pengajuan Cuti (Sisa: {sisaCutiUser} Hari)</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-5">
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-semibold">Pilih Tanggal Cuti</label>
                            <div className="flex gap-2 items-center">
                                <button type="button" onClick={prevMonth} className="px-2 py-1 bg-slate-100 rounded-lg"><i className="fa-solid fa-chevron-left"></i></button>
                                <span className="text-xs font-bold px-3 py-1.5 border rounded-lg">{monthNames[calMonth]} {calYear}</span>
                                <button type="button" onClick={nextMonth} className="px-2 py-1 bg-slate-100 rounded-lg"><i className="fa-solid fa-chevron-right"></i></button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                            {['M','S','S','R','K','J','S'].map((d,i)=><div key={i} className="font-bold py-1 text-slate-400">{d}</div>)}
                            {blanks.map(b => <div key={`blank-${b}`}></div>)}
                            {days.map(day => { 
                                const dateStr = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`; 
                                return <div key={day} onClick={() => toggleDate(day)} className={`py-1.5 rounded-lg cursor-pointer transition-all ${selectedDates.includes(dateStr) ? 'calendar-day selected' : 'bg-slate-50 hover:bg-orange-100'}`}>{day}</div>; 
                            })}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div><label className="text-xs font-semibold mb-1 block">Alasan Cuti</label><select required value={alasan} onChange={e=>setAlasan(e.target.value)} className="input-style"><option value="">-- Pilih --</option><option value="Cuti Acara/Keperluan Pribadi">Cuti Acara/Keperluan Pribadi</option><option value="Cuti Acara/Keperluan Keluarga">Cuti Acara/Keperluan Keluarga</option><option value="Cuti Melahirkan">Cuti Melahirkan</option><option value="Cuti Pulang Kampung">Cuti Pulang Kampung</option><option value="Lainnya">Lainnya (Tulis Manual)</option></select>{alasan === 'Lainnya' && <textarea required value={alasanLainnya} onChange={e=>setAlasanLainnya(e.target.value)} placeholder="Tulis manual..." className="input-style mt-2"></textarea>}</div>
                        <div className="bg-slate-50 p-4 rounded-xl space-y-3"><label className="text-xs font-semibold block">Alamat Selama Cuti</label><input required value={alamat} onChange={e=>setAlamat(e.target.value)} placeholder="Jalan/RT/RW" className="input-style"/><input required value={provinsi} onChange={e=>setProvinsi(e.target.value)} placeholder="Provinsi" className="input-style"/><div className="grid grid-cols-2 gap-2"><input required value={kota} onChange={e=>setKota(e.target.value)} placeholder="Kota/Kabupaten" className="input-style"/><input required value={kecamatan} onChange={e=>setKecamatan(e.target.value)} placeholder="Kecamatan" className="input-style"/></div><input required value={kelurahan} onChange={e=>setKelurahan(e.target.value)} placeholder="Kelurahan" className="input-style"/></div>
                        <button type="submit" className="btn-primary w-full mt-4">Kirim Pengajuan</button>
                    </div>
                </form>
            </div>
            <div>
                <h3 className="font-bold text-lg mb-4 border-b pb-2">Status Cuti Saya</h3>
                <div className="space-y-4 max-h-[650px] overflow-y-auto pr-2">
                    {myCuti.length === 0 ? <p className="text-slate-400 text-sm text-center py-10">Belum ada pengajuan.</p> : myCuti.map(c => (
                        <div key={c.id} className="card p-5">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2.5 py-1 rounded">{formatDateIndo(c.tanggal_pengajuan)}</span>
                                <span className="text-[10px] px-3 py-1.5 rounded-md font-bold border uppercase bg-amber-50 text-amber-700">{c.status || 'Menunggu'}</span>
                            </div>
                            <p className="text-sm font-semibold mb-1">{String(c.tanggal_cuti||'').split(',').length} Hari ({formatTanggalCuti(c.tanggal_cuti)})</p>
                            <p className="text-xs text-slate-500 mb-3 bg-white p-3 rounded-lg border italic">"{c.alasan || '-'}"</p>
                            {c.status !== 'Disetujui' && (
                                <div className="flex gap-2 justify-end mt-3 pt-3 border-t">
                                    <button onClick={() => openEdit(c)} className="text-xs font-bold text-amber-500 border px-3 py-1 rounded-lg">Edit</button>
                                    <button onClick={() => handleDelete(c.id)} className="text-xs font-bold text-rose-500 border px-3 py-1 rounded-lg">Hapus</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            {isEditModalOpen && editForm && (
                <div className="fixed inset-0 bg-slate-900/50 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 modal-animate">
                        <h3 className="text-lg font-bold mb-4 border-b pb-2">Edit Pengajuan Cuti</h3>
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <input name="tanggal_cuti" required defaultValue={editForm.tanggal_cuti} className="input-style text-sm font-semibold"/>
                            <textarea name="alasan" required defaultValue={editForm.alasan} rows="3" className="input-style text-sm"></textarea>
                            <textarea name="alamat" required defaultValue={editForm.alamat} rows="2" className="input-style text-sm"></textarea>
                            <div className="flex justify-end gap-2 mt-6"><button type="button" onClick={()=>setIsEditModalOpen(false)} className="px-5 py-2 border rounded-xl text-sm font-bold">Batal</button><button type="submit" className="btn-primary text-sm px-6 py-2">Update</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const UserPenilaian = ({ penilaian, user }) => (
    <div className="max-w-3xl mx-auto">
        {penilaian.length === 0 ? <div className="card p-10 text-center text-slate-500">Belum ada penilaian kinerja.</div> : penilaian.map(p => (
            <div key={p.id} className="card p-6 mb-6">
                <h3 className="font-bold text-lg text-orange-600 mb-4 border-b pb-2">Periode: {formatMonthIndo(p.bulan)}</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-emerald-50 p-4 rounded-xl text-center"><p className="text-[10px] font-bold text-emerald-800 uppercase">Disiplin</p><p className="text-3xl font-extrabold text-emerald-600 mt-1">{p.disiplin || '-'}</p></div>
                    <div className="bg-blue-50 p-4 rounded-xl text-center"><p className="text-[10px] font-bold text-blue-800 uppercase">T. Jawab</p><p className="text-3xl font-extrabold text-blue-600 mt-1">{p.tanggung_jawab || '-'}</p></div>
                    <div className="bg-fuchsia-50 p-4 rounded-xl text-center"><p className="text-[10px] font-bold text-fuchsia-800 uppercase">Patuh</p><p className="text-3xl font-extrabold text-fuchsia-600 mt-1">{p.kepatuhan || '-'}</p></div>
                </div>
                {p.nama_penilai && <p className="text-xs text-slate-500 font-semibold">Pemberi Nilai: <span className="text-slate-800">{p.nama_penilai}</span></p>}
            </div>
        ))}
    </div>
);

const UserInformasi = ({ informasi }) => (
    <div className="max-w-4xl mx-auto space-y-4">
        {informasi.length === 0 ? <div className="card p-10 text-center text-slate-400">Tidak ada pengumuman.</div> : informasi.map(i => (
            <div key={i.id} className="card p-6 border-l-4 border-orange-500">
                <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-lg text-slate-800">{i.judul || '-'}</h3><span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded">{formatDateIndo(i.tanggal)}</span></div>
                <p className="text-sm text-slate-600 whitespace-pre-line mb-4">{i.isi || '-'}</p>
                {i.lampiran && isImageFile(i.lampiran) && <img src={i.lampiran} className="w-full max-h-[400px] object-cover rounded-xl border cursor-pointer" onClick={() => window.Swal.fire({imageUrl: i.lampiran})} />}
            </div>
        ))}
    </div>
);

const UserBankSampah = ({ bankSampah }) => { 
    const total = bankSampah.reduce((a, c) => a + Number(c.total_harga || 0), 0); 
    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 mb-6 text-center rounded-3xl shadow-lg">
                <p className="text-sm font-semibold opacity-80 uppercase">Total Saldo Terkumpul</p>
                <h3 className="text-3xl font-extrabold mt-1">Rp {total.toLocaleString('id-ID')}</h3>
            </div>
            <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4">Tanggal</th><th className="p-4">Jenis</th><th className="p-4">Berat (Kg)</th><th className="p-4">Total Harga</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {bankSampah.length===0?<tr><td colSpan="4" className="p-6 text-center text-slate-400">Kosong</td></tr>:bankSampah.map(b=><tr key={b.id}><td className="p-4">{formatDateIndo(b.tanggal)}</td><td className="p-4">{b.jenis_sampah || '-'}</td><td className="p-4 font-semibold">{b.berat || '0'} Kg</td><td className="p-4 font-bold text-emerald-600">Rp {Number(b.total_harga || 0).toLocaleString()}</td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const UserDokumen = ({ user, dokumen, dbOps }) => { 
    const [nama, setNama] = useState(''); 
    const handle = async (e) => { e.preventDefault(); const fileInput = e.target.lampiran; const simpan = (lampData=null, tipe=null, nm=null) => { dbOps.add('dokumen', { id: generateId(), id_user: user.id, nama_pegawai: user.nama, tanggal: getTodayDate(), nama_dokumen: nama, lampiran: lampData, tipe_lampiran: tipe, nama_file: nm, status: 'Menunggu', keterangan_admin: '' }); setNama(''); e.target.reset(); Swal.fire('Sukses','Dokumen berhasil diunggah ke Drive!','success'); }; if(fileInput && fileInput.files.length > 0) { try { const res = await processFile(fileInput.files[0]); simpan(res.data, res.type, fileInput.files[0].name); } catch(err) { Swal.fire('Error', err, 'error'); } } else { simpan(); } }; 
    const handleDelete = (id) => { Swal.fire({ title: 'Hapus Dokumen?', icon: 'warning', showCancelButton: true }).then((res) => { if (res.isConfirmed) dbOps.remove('dokumen', id); }); };
    const myDocs = dokumen.filter(d => String(d.id_user) === String(user.id));
    return (
        <div className="grid md:grid-cols-2 gap-8">
            <form onSubmit={handle} className="card p-6 h-fit"><h3 className="font-bold text-lg mb-4 border-b pb-2">Upload Dokumen Baru</h3><input required value={nama} onChange={e=>setNama(e.target.value)} placeholder="Nama/Jenis Dokumen" className="input-style mb-4 font-semibold text-sm"/><div className="bg-slate-50 p-3 rounded-xl mb-4 border"><input required name="lampiran" type="file" accept="image/*,application/pdf" className="text-xs w-full cursor-pointer"/></div><button type="submit" className="btn-primary w-full mt-2">Upload File</button></form>
            <div className="space-y-4">
                {myDocs.length===0 ? <p className="text-sm text-slate-400 text-center py-10">Belum ada dokumen.</p> : myDocs.map(d => (
                    <div key={d.id} className="card p-5">
                        <div className="flex justify-between items-start mb-3"><div><p className="font-bold text-sm text-slate-800">{d.nama_dokumen || '-'}</p><p className="text-[10px] text-slate-400">{formatDateIndo(d.tanggal)}</p></div><span className="px-2 py-1 rounded-md text-[9px] font-bold uppercase border bg-amber-50 text-amber-700">{d.status || 'Menunggu'}</span></div>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">{isImageFile(d.lampiran) ? <img src={d.lampiran} onClick={()=>Swal.fire({imageUrl: d.lampiran})} className="h-8 w-8 object-cover rounded cursor-pointer border" /> : (d.lampiran ? <a href={d.lampiran} target="_blank" rel="noreferrer" className="bg-slate-100 border px-3 py-1.5 rounded-lg font-bold text-[10px]">Buka File</a> : null)}<button onClick={() => handleDelete(d.id)} className="text-[10px] font-bold text-rose-500 border border-rose-200 px-3 py-1.5 rounded-lg">Hapus</button></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const UserPaguyuban = ({ paguyuban, user }) => { 
    const myIuran = paguyuban.filter(p => String(p.id_user) === String(user.id) || p.id_user === 'all');
    const total = myIuran.reduce((a, c) => a + Number(c.nominal||0), 0); 
    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 mb-6 text-center rounded-3xl shadow-lg">
                <p className="text-sm font-semibold opacity-80 uppercase">Total Iuran Dibayar</p>
                <h3 className="text-3xl font-extrabold mt-1">Rp {total.toLocaleString('id-ID')}</h3>
            </div>
            <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4">Tanggal</th><th className="p-4">Nominal</th><th className="p-4">Status</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {myIuran.length===0?<tr><td colSpan="3" className="p-6 text-center text-slate-400">Kosong</td></tr>:myIuran.map(p=><tr key={p.id}><td className="p-4">{formatDateIndo(p.bulan)}</td><td className="p-4 font-bold">Rp {Number(p.nominal||0).toLocaleString('id-ID')}</td><td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-[10px] font-bold">Lunas</span></td></tr>)}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const UserKelompokKerja = ({ user, users }) => {
    const myGroup = user.kelompok_kerja || 'Tanpa Kelompok';
    const teamMembers = users.filter(u => (u.kelompok_kerja || 'Tanpa Kelompok') === myGroup && u.role !== 'admin');
    return (
        <div className="max-w-5xl mx-auto">
            <div className="rounded-[1.5rem] p-6 bg-gradient-to-br from-orange-500 to-orange-600 text-white mb-8 shadow-lg">
                <h2 className="text-xs font-bold opacity-90 uppercase tracking-widest mb-1">Kelompok Kerja Anda</h2>
                <h1 className="text-3xl font-extrabold">{myGroup}</h1>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamMembers.map(m => (
                    <div key={m.id} className="card p-4 flex items-center gap-4">
                        {m.foto ? <img src={m.foto} className="w-12 h-12 rounded-full object-cover border" /> : <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">{String(m.nama||'U').charAt(0)}</div>}
                        <div><p className="font-bold text-sm text-slate-800">{m.nama || '-'}</p><p className="text-[10px] text-slate-500">{m.jabatan || 'PJLP'} • {m.no_telp || '-'}</p></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const UserLaporanKerja = ({ user, laporanKerja, dbOps }) => {
    const standardObjek = ['Sampah', 'Saluran', 'Genangan', 'Banjir', 'JPU', 'Jalan', 'Pohon', 'Fasilitas Umum', 'Fasilitas Kantor', 'Administrasi', 'Pelayanan Masyarakat', 'Hubungan Kerja'];
    const [objekSelectAdd, setObjekSelectAdd] = useState('');
    const myLaporan = laporanKerja.filter(l => String(l.id_user) === String(user.id));

    const handleAdd = async (e) => {
        e.preventDefault();
        const form = e.target;
        const fileInput = form.lampiran;
        const finalObjekKerja = form.objek_kerja_select.value === 'Lainnya' ? form.objek_kerja_manual.value : form.objek_kerja_select.value;

        const simpan = (lampData = null, tipe = null, nm = null) => {
            const now = new Date();
            dbOps.add('laporanKerja', {
                id: generateId(), id_user: user.id, nama: user.nama, kelompok_kerja: user.kelompok_kerja || '',
                tanggal: form.tanggal.value, waktu_submit: now.toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace(/\./g, ':'),
                objek_kerja: finalObjekKerja, jenis_kegiatan: form.jenis_kegiatan.value, lokasi_kegiatan: form.lokasi_kegiatan.value,
                proses_pekerjaan: form.proses_pekerjaan.value, keterangan: form.keterangan.value, lampiran: lampData, tipe_lampiran: tipe, nama_file: nm
            });
            form.reset(); setObjekSelectAdd('');
            window.Swal.fire('Sukses', 'Laporan Kerja berhasil dikirim ke Spreadsheet & Drive!', 'success');
        };

        if (fileInput && fileInput.files.length > 0) {
            window.Swal.fire({title: 'Mengupload ke Drive...', allowOutsideClick: false, didOpen: () => window.Swal.showLoading()});
            try { const res = await processFile(fileInput.files[0]); simpan(res.data, res.type, fileInput.files[0].name); } catch(err) { window.Swal.fire('Error', String(err), 'error'); }
        } else { simpan(); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <form onSubmit={handleAdd} className="card p-6 border-t-4 border-t-blue-500">
                <h3 className="font-bold text-lg mb-4 border-b pb-2">Buat Laporan Baru</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div><label className="text-xs font-semibold mb-1 block">Tanggal</label><input type="date" name="tanggal" required readOnly value={getTodayDate()} className="input-style bg-slate-100"/></div>
                    <div><label className="text-xs font-semibold mb-1 block">Progres (%)</label><select required name="proses_pekerjaan" className="input-style"><option value="50">50%</option><option value="100">100%</option></select></div>
                    <div>
                        <label className="text-xs font-semibold mb-1 block">Objek Kerja</label>
                        <select name="objek_kerja_select" required value={objekSelectAdd} onChange={e=>setObjekSelectAdd(e.target.value)} className="input-style mb-2">
                            <option value="" disabled hidden>Pilih Objek Kerja</option>
                            {standardObjek.map(o => <option key={o} value={o}>{o}</option>)}
                            <option value="Lainnya">Lainnya (Tulis Manual)</option>
                        </select>
                        {objekSelectAdd === 'Lainnya' && <input required name="objek_kerja_manual" placeholder="Tuliskan objek kerja..." className="input-style"/>}
                    </div>
                    <div><label className="text-xs font-semibold mb-1 block">Jenis Kegiatan</label><input required name="jenis_kegiatan" placeholder="Cth: Pembersihan saluran" className="input-style"/></div>
                    <div className="md:col-span-2"><label className="text-xs font-semibold mb-1 block">Lokasi Kegiatan</label><input required name="lokasi_kegiatan" placeholder="Cth: Jl. Sudirman RT01/02" className="input-style"/></div>
                    <div className="md:col-span-2"><label className="text-xs font-semibold mb-1 block">Keterangan</label><textarea required name="keterangan" rows="2" className="input-style text-sm"></textarea></div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border mb-4"><label className="text-xs font-semibold mb-2 block">Upload Foto Kegiatan</label><input type="file" name="lampiran" accept="image/*,application/pdf" className="text-xs w-full bg-white p-2 rounded border"/></div>
                <button type="submit" className="btn-primary w-full bg-blue-600">Kirim Laporan</button>
            </form>
            <div className="card p-6 overflow-x-auto">
                <h3 className="font-bold text-lg mb-4">Riwayat Laporan Saya</h3>
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4">Tanggal</th><th className="p-4">Kegiatan</th><th className="p-4">Lokasi</th><th className="p-4 text-center">Progres</th><th className="p-4 text-center">Foto</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {myLaporan.map(log => (
                            <tr key={log.id}><td className="p-4 font-bold">{formatDateIndo(log.tanggal)}</td><td className="p-4">{log.jenis_kegiatan}</td><td className="p-4">{log.lokasi_kegiatan}</td><td className="p-4 text-center">{log.proses_pekerjaan}%</td><td className="p-4 text-center">{isImageFile(log.lampiran) ? <img src={log.lampiran} className="h-10 w-10 object-cover rounded mx-auto cursor-pointer" onClick={()=>window.Swal.fire({imageUrl: log.lampiran})}/> : '-'}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ============================================================================
// KOMPONEN ADMIN (BAGIAN 2)
// ============================================================================

const AdminLiveAbsensi = ({ absensi, users, laporanKerja, crmInternal }) => {
    const todayLogs = absensi.filter(a => String(a.tanggal) === getTodayDate()).sort((a, b) => {
        const nameCmp = String(a.nama || '').localeCompare(String(b.nama || ''));
        return nameCmp !== 0 ? nameCmp : String(b.waktu || '').localeCompare(String(a.waktu || ''));
    });
    const todayReports = laporanKerja ? laporanKerja.filter(l => String(l.tanggal) === getTodayDate()) : [];
    const pjlpUsers = users.filter(u => u.role !== 'admin').sort((a, b) => String(a.nama || '').localeCompare(String(b.nama || '')));
    
    const userStatuses = pjlpUsers.map(u => { 
        const uLogs = todayLogs.filter(l => String(l.id_user) === String(u.id)); 
        const isOff = uLogs.some(l => ['Sakit', 'Izin', 'Cuti', 'Libur'].includes(String(l.jenis || ''))); 
        const isHadir = uLogs.some(l => String(l.jenis || '').includes('Hadir')); 
        const isPiket = uLogs.some(l => String(l.jenis || '') === 'Piket'); 
        const isTerlambat = uLogs.some(l => String(l.jenis || '') === 'Hadir (Terlambat)'); 
        const isPulang = uLogs.some(l => String(l.jenis || '') === 'Pulang'); 
        const isLepasPiket = uLogs.some(l => String(l.jenis || '') === 'Lepas Piket'); 

        let status = 'Belum Absen'; 
        if (isOff) status = String(uLogs.find(l => ['Sakit', 'Izin', 'Cuti', 'Libur'].includes(String(l.jenis || '')))?.jenis || 'Sakit'); 
        else if (isPulang) status = 'Pulang';
        else if (isLepasPiket) status = 'Lepas Piket';
        else if (isTerlambat) status = 'Terlambat';
        else if (isHadir) status = 'Hadir';
        else if (isPiket) status = 'Piket';
        return { ...u, status }; 
    });

    const belumAbsenUsers = userStatuses.filter(u => u.status === 'Belum Absen');
    const usersWithReports = todayReports.map(l => String(l.id_user));
    const belumLaporanUsers = pjlpUsers.filter(u => !usersWithReports.includes(String(u.id)));

    const stats = [
        { label: 'Total PJLP', count: pjlpUsers.length, color: 'text-slate-600 bg-slate-100 border-slate-300', icon: 'fa-users' },
        { label: 'Hadir', count: userStatuses.filter(u => u.status === 'Hadir').length, color: 'text-emerald-600 bg-emerald-50 border-emerald-300', icon: 'fa-sign-in-alt' },
        { label: 'Pulang', count: userStatuses.filter(u => u.status === 'Pulang').length, color: 'text-orange-600 bg-orange-50 border-orange-300', icon: 'fa-sign-out-alt' },
        { label: 'Piket', count: userStatuses.filter(u => u.status === 'Piket').length, color: 'text-teal-600 bg-teal-50 border-teal-300', icon: 'fa-shield-alt' },
        { label: 'Lepas Piket', count: userStatuses.filter(u => u.status === 'Lepas Piket').length, color: 'text-cyan-600 bg-cyan-50 border-cyan-300', icon: 'fa-home' },
        { label: 'Sakit', count: userStatuses.filter(u => u.status === 'Sakit').length, color: 'text-rose-600 bg-rose-50 border-rose-300', icon: 'fa-procedures' },
        { label: 'Izin', count: userStatuses.filter(u => u.status === 'Izin').length, color: 'text-blue-600 bg-blue-50 border-blue-300', icon: 'fa-envelope-open-text' },
        { label: 'Cuti', count: userStatuses.filter(u => u.status === 'Cuti').length, color: 'text-indigo-600 bg-indigo-50 border-indigo-300', icon: 'fa-plane-departure' },
        { label: 'Libur', count: userStatuses.filter(u => u.status === 'Libur').length, color: 'text-violet-600 bg-violet-50 border-violet-300', icon: 'fa-calendar-check' },
        { label: 'Belum Absen', count: belumAbsenUsers.length, color: 'text-amber-600 bg-amber-50 border-amber-300', icon: 'fa-user-clock' },
        { label: 'Terlambat', count: userStatuses.filter(u => u.status === 'Terlambat').length, color: 'text-red-600 bg-red-50 border-red-300', icon: 'fa-user-times' },
        { label: 'Sudah Laporan', count: pjlpUsers.length - belumLaporanUsers.length, color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-300', icon: 'fa-file-signature' }
    ];

    const crmStatusData = pjlpUsers.filter(u => crmInternal && crmInternal.some(c => String(c.id_user) === String(u.id))).map(u => {
        const userCrms = (crmInternal || []).filter(c => String(c.id_user) === String(u.id));
        const hasIncomplete = userCrms.some(c => c.status_penyelesaian !== 'Selesai');
        return { ...u, hasIncomplete, totalCrm: userCrms.length, completedCrm: userCrms.filter(c => c.status_penyelesaian === 'Selesai').length };
    });

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="bg-slate-800 text-white p-6 md:p-8 rounded-[2rem] shadow-xl flex items-center justify-between">
                <div><p className="font-semibold mb-1 uppercase tracking-widest text-[10px] bg-white/20 inline-block px-3 py-1 rounded-full">Dashboard Admin</p><h3 className="text-2xl sm:text-3xl font-extrabold">Live Absensi {formatDateIndo(getTodayDate())}</h3></div>
                <div className="hidden sm:flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border border-white/30"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative rounded-full h-2.5 w-2.5 bg-rose-500"></span></span><span className="text-xs font-bold tracking-widest">SPREADSHEET LIVE</span></div>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-4">
                {stats.map(s => (
                    <div key={s.label} className={`card p-3 sm:p-4 text-center flex flex-col items-center justify-center border-b-4 ${s.color.split(' ')[2]}`}>
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-2 ${s.color.split(' ')[1]} ${s.color.split(' ')[0]}`}><i className={`fa-solid ${s.icon} text-sm sm:text-lg`}></i></div>
                        <span className={`text-xl sm:text-2xl font-extrabold block ${s.color.split(' ')[0]}`}>{s.count}</span>
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1 leading-tight">{s.label}</span>
                    </div>
                ))}
            </div>

            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
                <div className="md:col-span-2 space-y-6">
                    <div className="card p-6">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg"><i className="fa-solid fa-list-ul text-orange-500 mr-2"></i>Aktivitas Terbaru</h3><span className="text-[10px] font-bold bg-slate-100 px-3 py-1 rounded-full border">{todayLogs.length} Entri</span></div>
                        <div className="overflow-y-auto max-h-[350px] pr-2">
                            {todayLogs.length === 0 ? <p className="text-center py-10 text-slate-400">Belum ada aktivitas.</p> : <ul className="space-y-3">
                                {todayLogs.map(log => (
                                    <li key={log.id} className="bg-slate-50 border p-3 rounded-xl flex justify-between items-center">
                                        <div><p className="font-bold text-sm">{log.nama || '-'}</p><p className="text-[10px] text-slate-500 font-mono mt-0.5"><i className="fa-regular fa-clock mr-1"></i>Pukul {log.waktu || '-'}</p></div>
                                        <div className="text-right"><span className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${String(log.jenis||'').includes('Terlambat') ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{log.jenis || '-'}</span></div>
                                    </li>
                                ))}
                            </ul>}
                        </div>
                    </div>
                    <div className="card p-6">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg"><i className="fa-solid fa-user-clock text-amber-500 mr-2"></i>PJLP Belum Absensi</h3><span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-3 py-1 rounded-full">{belumAbsenUsers.length} Orang</span></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2">
                            {belumAbsenUsers.map(u => (
                                <div key={u.id} className="bg-slate-50 border p-3 rounded-xl flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500 text-xs">{String(u.nama||'U').charAt(0)}</div><div><p className="font-bold text-sm text-slate-800">{u.nama || '-'}</p><p className="text-[10px] text-slate-500">{u.jabatan || 'PJLP'}</p></div></div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="card p-6">
                    <h3 className="font-bold text-lg mb-4 text-slate-800"><i className="fa-solid fa-clipboard-list text-indigo-500 mr-2"></i>Status CRM PJLP</h3>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {crmStatusData.length === 0 ? <p className="text-center text-slate-400 text-sm py-4">Belum ada tugas CRM.</p> : crmStatusData.map(u => (
                            <div key={u.id} className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between">
                                <div><p className="font-bold text-xs">{u.nama || '-'}</p><p className="text-[9px] text-slate-500">{u.completedCrm}/{u.totalCrm} Selesai</p></div>
                                <span className={`text-[8px] font-bold px-2 py-1 rounded uppercase ${u.hasIncomplete ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{u.hasIncomplete ? 'Proses' : 'Selesai'}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminDatabase = ({ allData, dbOps, gasUrl, onChangeGasUrl }) => {
    const handleExportDB = () => { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allData)); const dn = document.createElement('a'); dn.setAttribute("href", dataStr); dn.setAttribute("download", `Backup_Spreadsheet_DB_${new Date().getTime()}.json`); document.body.appendChild(dn); dn.click(); dn.remove(); };
    const handleImportDB = async (e) => { const file = e.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (event) => { try { const parsed = JSON.parse(event.target.result); Swal.fire({title: 'Memulihkan ke Spreadsheet...', allowOutsideClick: false, didOpen: () => Swal.showLoading()}); for (const colName of Object.keys(parsed)) { if (Array.isArray(parsed[colName])) { for (const item of parsed[colName]) { await dbOps.add(colName, item); } } } Swal.fire('Sukses', 'Data direstore ke Spreadsheet!', 'success'); } catch (err) { Swal.fire('Error', 'File tidak valid.', 'error'); } e.target.value = ""; }; reader.readAsText(file); };
    
    const tampilanSettings = allData.pengaturanTampilan || [];
    const currentTampilan = tampilanSettings.length > 0 ? tampilanSettings[0] : { id: 1 };
    const hiddenMenus = currentTampilan.hiddenMenus || [];
    const [localScale, setLocalScale] = useState(currentTampilan.globalScale || 16);

    const ALL_MENUS = [
        'Live Absensi', 'Rekap Absen', 'Data Laporan Kerja', 'Laporan CRM Internal', 'Persetujuan Cuti', 'Gaji PJLP', 'Jadwal Kerja', 'Data Dokumen User', 'Kelola Bank Sampah', 'Kelola Penilaian', 'Kelola Paguyuban', 'Kelola Informasi', 'Kelola User', 'Kelola Kelompok Kerja', 'Pengaturan Waktu', 'Pengaturan Lokasi', 'Pengaturan Tampilan', 'Database & Backup',
        'Absensi', 'Riwayat Absensi', 'Laporan Kerja', 'Foto Edit', 'Pengajuan Cuti', 'Dokumen Saya', 'Bank Sampah', 'Penilaian', 'Paguyuban', 'Informasi', 'Kelompok Kerja', 'Profil Saya'
    ];
    const uniqueMenus = [...new Set(ALL_MENUS)];

    const toggleMenu = (menuName) => {
        if (menuName === 'Database & Backup') return Swal.fire('Ditolak', 'Menu ini tidak boleh disembunyikan.', 'error');
        let updatedHidden = hiddenMenus.includes(menuName) ? hiddenMenus.filter(m => m !== menuName) : [...hiddenMenus, menuName];
        dbOps.update('pengaturanTampilan', 1, { ...currentTampilan, hiddenMenus: updatedHidden });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="card p-6 border-t-4 border-t-emerald-500">
                <h3 className="font-bold text-lg mb-2"><i className="fa-solid fa-table text-emerald-600 mr-2"></i>Koneksi Google Spreadsheet & Drive</h3>
                <p className="text-xs text-slate-500 mb-4">URL Web App Google Apps Script saat ini:</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input readOnly value={gasUrl || 'Belum diatur'} className="input-style font-mono text-xs bg-slate-100 flex-1" />
                    <button onClick={onChangeGasUrl} className="btn-primary text-xs px-4 py-2 shrink-0"><i className="fa-solid fa-link mr-2"></i>Ubah URL Spreadsheet</button>
                </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
                <div className="card p-8 text-center"><div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"><i className="fa-solid fa-download"></i></div><h4 className="font-bold text-lg mb-2">Backup Data (.json)</h4><button onClick={handleExportDB} className="btn-secondary w-full mt-4">Download Backup</button></div>
                <div className="card p-8 text-center"><div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl mx-auto mb-4"><i className="fa-solid fa-upload"></i></div><h4 className="font-bold text-lg mb-2">Restore Data (.json)</h4><label className="btn-primary w-full cursor-pointer block mt-4">Pilih File<input type="file" accept=".json" className="hidden" onChange={handleImportDB} /></label></div>
            </div>

            <div className="card p-6 border-t-4 border-t-slate-800">
                <h3 className="font-bold text-lg mb-4"><i className="fa-solid fa-eye-slash mr-2"></i>Sembunyikan Menu (Hidden Menu)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {uniqueMenus.map(menu => (
                        <label key={menu} className={`flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border shadow-sm ${hiddenMenus.includes(menu) ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                            <input type="checkbox" checked={hiddenMenus.includes(menu)} onChange={() => toggleMenu(menu)} className="w-4 h-4 text-rose-600 rounded" />
                            <span className={`text-[11px] font-bold ${hiddenMenus.includes(menu) ? 'text-rose-700 line-through' : 'text-slate-700'}`}>{menu}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="card p-6 border-t-4 border-t-orange-500">
                <h3 className="font-bold text-lg mb-2"><i className="fa-solid fa-text-height mr-2"></i>Skala Ukuran Font Aplikasi</h3>
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border">
                    <span className="text-sm font-bold text-slate-400">A-</span>
                    <input type="range" min="10" max="24" step="1" value={localScale} onChange={(e) => { const val = Number(e.target.value); setLocalScale(val); document.documentElement.style.fontSize = val + 'px'; }} onMouseUp={() => dbOps.update('pengaturanTampilan', 1, { ...currentTampilan, globalScale: localScale })} className="w-full h-3 bg-slate-200 rounded-lg cursor-pointer" />
                    <span className="text-xl font-bold text-slate-800">A+</span>
                    <span className="font-bold text-sm w-20 text-center bg-white p-2 rounded-lg border text-orange-600">{localScale} px</span>
                </div>
            </div>
        </div>
    );
};

const AdminUsers = ({ users, dbOps, adminFeatures }) => {
    const [isModalOpen, setIsModalOpen] = useState(false); const [editingUser, setEditingUser] = useState(null); 
    const [formData, setFormData] = useState({ nama: '', username: '', password: '', nik: '', no_telp: '', masa_kerja: '', jabatan: '', kelompok_kerja: '', jumlah_hak_cuti: 12, role: 'user', foto: '', permissions: [], is_active: true });
    const [filterNama, setFilterNama] = useState('');

    const filteredUsers = useMemo(() => users.filter(u => (u.nama || '').toLowerCase().includes(filterNama.toLowerCase())).sort((a, b) => (a.nama || '').localeCompare(b.nama || '')), [users, filterNama]);
    const openAddModal = () => { setEditingUser(null); setFormData({ nama: '', username: '', password: '', nik: '', no_telp: '', masa_kerja: '', jabatan: '', kelompok_kerja: '', jumlah_hak_cuti: 12, role: 'user', foto: '', permissions: [], is_active: true }); setIsModalOpen(true); };
    const openEditModal = (u) => { setEditingUser(u); setFormData({ permissions: [], jabatan: '', kelompok_kerja: '', jumlah_hak_cuti: 12, is_active: true, ...u }); setIsModalOpen(true); };
    const handlePhoto = async (e) => { const f = e.target.files[0]; if(f){ try { const res = await processFile(f); setFormData({...formData, foto:res.data}); } catch(err) { Swal.fire('Error', err, 'error'); } }};
    const handleSave = (e) => { e.preventDefault(); if (editingUser) { dbOps.update('users', editingUser.id, { ...formData, id: editingUser.id }); } else { dbOps.add('users', { ...formData, id: generateId() }); } setIsModalOpen(false); };
    const handleDelete = (id) => { if(id === 1) return Swal.fire('Ditolak', 'Akun Master', 'error'); Swal.fire({ title: 'Hapus Pegawai?', icon: 'warning', showCancelButton: true }).then(r => { if(r.isConfirmed) dbOps.remove('users', id); }); };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <button onClick={openAddModal} className="btn-primary text-sm py-2"><i className="fa-solid fa-plus mr-2"></i>Tambah User</button>
                <input type="text" placeholder="Cari nama..." value={filterNama} onChange={(e) => setFilterNama(e.target.value)} className="input-style py-2 px-3 text-xs max-w-xs" />
            </div>
            <div className="card overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap text-sm">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4">Nama</th><th className="p-4">Jabatan</th><th className="p-4">NIK</th><th className="p-4">Kelompok</th><th className="p-4">Role</th><th className="p-4">Username</th><th className="p-4">Password</th><th className="p-4 text-center">Aksi</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(u=>(
                            <tr key={u.id} className="hover:bg-slate-50">
                                <td className="p-4 font-bold">{u.nama || '-'}</td><td className="p-4">{u.jabatan||'-'}</td><td className="p-4 font-mono text-xs">{u.nik||'-'}</td><td className="p-4">{u.kelompok_kerja||'-'}</td><td className="p-4 uppercase text-xs font-bold">{u.role}</td><td className="p-4 font-mono text-xs text-blue-600">{u.username}</td><td className="p-4 font-mono text-xs text-slate-400">{u.password}</td>
                                <td className="p-4 text-center"><button onClick={()=>openEditModal(u)} className="text-amber-500 mr-3"><i className="fa-solid fa-pen"></i></button><button onClick={()=>handleDelete(u.id)} className="text-rose-500"><i className="fa-solid fa-trash"></i></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && (<div className="fixed inset-0 bg-slate-900/50 z-[60] flex justify-center items-center p-4"><div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 modal-animate"><h3 className="font-bold text-xl mb-4 border-b pb-2">{editingUser?'Edit Pegawai':'Tambah Pegawai'}</h3><form onSubmit={handleSave} className="space-y-4"><div className="grid md:grid-cols-2 gap-4"><div className="md:col-span-2 flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-dashed">{formData.foto ? <img src={formData.foto} className="w-20 h-20 rounded-full object-cover"/>:<div className="w-20 h-20 rounded-full bg-white border flex items-center justify-center text-slate-300"><i className="fa-solid fa-camera text-xl"></i></div>}<input type="file" accept="image/*" onChange={handlePhoto} className="mt-3 text-xs w-48"/></div><div><label className="text-xs font-semibold mb-1 block">Nama Lengkap *</label><input required value={formData.nama} onChange={e=>setFormData({...formData, nama:e.target.value})} className="input-style"/></div><div><label className="text-xs font-semibold mb-1 block">Jabatan</label><input value={formData.jabatan} onChange={e=>setFormData({...formData, jabatan:e.target.value})} className="input-style"/></div><div><label className="text-xs font-semibold mb-1 block">NIK</label><input value={formData.nik} onChange={e=>setFormData({...formData, nik:e.target.value})} className="input-style"/></div><div><label className="text-xs font-semibold mb-1 block">No Telp</label><input value={formData.no_telp} onChange={e=>setFormData({...formData, no_telp:e.target.value})} className="input-style"/></div><div><label className="text-xs font-semibold mb-1 block">Masa Kerja</label><input value={formData.masa_kerja} onChange={e=>setFormData({...formData, masa_kerja:e.target.value})} className="input-style"/></div><div><label className="text-xs font-semibold mb-1 block">Hak Akses</label><select value={formData.role} onChange={e=>setFormData({...formData, role:e.target.value})} className="input-style"><option value="user">PJLP</option><option value="sub_admin">Sub Admin</option><option value="admin">Admin Utama</option></select></div><div><label className="text-xs font-semibold mb-1 block">Kelompok Kerja</label><input value={formData.kelompok_kerja || ''} onChange={e=>setFormData({...formData, kelompok_kerja:e.target.value})} className="input-style"/></div><div><label className="text-xs font-semibold mb-1 block">Hak Cuti</label><input type="number" required value={formData.jumlah_hak_cuti} onChange={e=>setFormData({...formData, jumlah_hak_cuti:Number(e.target.value)||0})} className="input-style"/></div><div className="md:col-span-2 grid grid-cols-2 gap-4 border-t pt-4"><div><label className="text-xs font-semibold text-orange-600 block mb-1">Username *</label><input required value={formData.username} onChange={e=>setFormData({...formData, username:e.target.value})} className="input-style font-mono"/></div><div><label className="text-xs font-semibold text-orange-600 block mb-1">Password *</label><input required value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} className="input-style font-mono"/></div></div></div><div className="flex justify-end gap-2 mt-6 border-t pt-4"><button type="button" onClick={()=>setIsModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm font-bold">Batal</button><button type="submit" className="btn-primary text-sm px-5 py-2">Simpan</button></div></form></div></div>)}
        </div>
    );
};

const AdminTimeSlots = ({ timeSlots, dbOps, users }) => {
    const [draftUsers, setDraftUsers] = useState({});
    useEffect(() => { const initialDraft = {}; timeSlots.forEach(slot => { initialDraft[slot.id] = slot.users || []; }); setDraftUsers(initialDraft); }, [timeSlots]);
    const handleAddUser = (slotId) => { const selectEl = document.getElementById(`add-user-${slotId}`); const userId = Number(selectEl.value); if (!userId) return; setDraftUsers(prev => ({ ...prev, [slotId]: [...(prev[slotId] || []), userId] })); selectEl.value = ""; };
    const handleRemoveUser = (slotId, userId) => { setDraftUsers(prev => ({ ...prev, [slotId]: (prev[slotId] || []).filter(id => id !== userId) })); };
    const handleSaveAll = async () => { for (const slot of timeSlots) { const slotId = slot.id; const updateData = { ...slot, users: draftUsers[slotId] || [], nama: document.getElementById(`nama-${slotId}`)?.value || slot.nama }; if (slotId <= 5 || slotId === 9) { updateData.awal_hadir = document.getElementById(`awal-${slotId}`).value; updateData.akhir_hadir = document.getElementById(`akhir-${slotId}`).value; updateData.batas_toleransi = document.getElementById(`tol-${slotId}`).value; } else { updateData.masuk = document.getElementById(`masuk-${slotId}`).value; updateData.pulang = document.getElementById(`pulang-${slotId}`).value; } await dbOps.update('timeSlots', slotId, updateData); } Swal.fire('Sukses', 'Jadwal disimpan ke Spreadsheet', 'success'); };

    return (
        <div>
            <div className="flex justify-between items-center mb-6"><p className="text-sm text-slate-500">Atur jam kerja & alokasi petugas.</p><button onClick={handleSaveAll} className="btn-primary px-6 py-2 text-sm"><i className="fa-solid fa-save mr-2"></i>Simpan Perubahan</button></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {timeSlots.map(slot => (
                    <div key={slot.id} className="card p-5 flex flex-col border-t-4 border-t-orange-500">
                        <input id={`nama-${slot.id}`} defaultValue={slot.nama} className="font-bold text-lg mb-4 input-style py-1 px-2" />
                        <div className="space-y-2 mb-4 bg-slate-50 p-3 rounded-lg">
                            {slot.id <= 5 || slot.id === 9 ? (
                                <><div className="flex justify-between text-xs font-semibold"><span>Awal Hadir:</span><input id={`awal-${slot.id}`} type="time" defaultValue={slot.awal_hadir||slot.masuk} className="bg-transparent text-right font-mono"/></div><div className="flex justify-between text-xs font-semibold"><span>Batas Hadir:</span><input id={`akhir-${slot.id}`} type="time" defaultValue={slot.akhir_hadir||slot.pulang} className="bg-transparent text-right font-mono"/></div><div className="flex justify-between text-xs font-bold text-rose-600 pt-2 border-t"><span>Toleransi:</span><input id={`tol-${slot.id}`} type="time" defaultValue={slot.batas_toleransi} className="bg-transparent text-right font-mono"/></div></>
                            ) : ( <><div className="flex justify-between text-xs font-semibold"><span>Mulai:</span><input id={`masuk-${slot.id}`} type="time" defaultValue={slot.masuk} className="bg-transparent text-right font-mono"/></div><div className="flex justify-between text-xs font-semibold"><span>Selesai:</span><input id={`pulang-${slot.id}`} type="time" defaultValue={slot.pulang} className="bg-transparent text-right font-mono"/></div></> )}
                        </div>
                        {(slot.id <= 5 || slot.id === 9) && (
                            <div className="mt-auto border-t pt-4">
                                <div className="flex flex-wrap gap-1.5 mb-3 bg-slate-50 p-2 rounded-lg min-h-[50px]">
                                    {(draftUsers[slot.id] || []).map(uid => users.find(x => String(x.id) === String(uid))).filter(Boolean).map(u => ( <span key={u.id} className="bg-white border text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">{u.nama}<button onClick={()=>handleRemoveUser(slot.id, u.id)} className="text-rose-500 ml-1"><i className="fa-solid fa-times"></i></button></span> ))}
                                </div>
                                <div className="flex gap-2"><select id={`add-user-${slot.id}`} className="input-style py-1.5 px-2 text-xs"><option value="">+ Tambah Pegawai</option>{users.filter(u => !(draftUsers[slot.id] || []).map(String).includes(String(u.id))).map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}</select><button onClick={()=>handleAddUser(slot.id)} className="bg-emerald-100 text-emerald-700 px-3 rounded-lg"><i className="fa-solid fa-check"></i></button></div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const AdminLokasi = ({ gpsSettings, dbOps }) => {
    const [formData, setFormData] = useState({ id: 1, isActive: false, latitude: '', longitude: '', radius: 100, locationName: 'Kantor' });
    useEffect(() => { if (gpsSettings && gpsSettings.length > 0) setFormData(gpsSettings[0]); }, [gpsSettings]);
    const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.type==='checkbox'?e.target.checked:e.target.value});
    const handleGetLocation = () => { navigator.geolocation.getCurrentPosition(pos => setFormData({...formData, latitude: pos.coords.latitude, longitude: pos.coords.longitude})); };
    const handleSave = (e) => { e.preventDefault(); dbOps.add('pengaturanLokasi', {...formData, id:1}); };

    return (
        <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSave} className="card p-6 md:p-8 border-t-4 border-t-orange-500 space-y-5">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border">
                    <div><h4 className="font-bold text-slate-800">Aktifkan Pembatasan Lokasi GPS</h4></div>
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-5 h-5"/>
                </div>
                <div className="grid md:grid-cols-2 gap-5"><div><label className="text-xs font-bold mb-1 block">Nama Area</label><input type="text" name="locationName" value={formData.locationName} onChange={handleChange} className="input-style"/></div><div><label className="text-xs font-bold mb-1 block">Radius (Meter)</label><input type="number" name="radius" value={formData.radius} onChange={handleChange} className="input-style"/></div></div>
                <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-semibold">Latitude</label><input type="text" name="latitude" value={formData.latitude} onChange={handleChange} className="input-style font-mono text-xs"/></div><div><label className="text-xs font-semibold">Longitude</label><input type="text" name="longitude" value={formData.longitude} onChange={handleChange} className="input-style font-mono text-xs"/></div></div>
                <button type="button" onClick={handleGetLocation} className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg text-sm">Deteksi Koordinat Saat Ini</button>
                <button type="submit" className="btn-primary w-full">Simpan Pengaturan GPS</button>
            </form>
        </div>
    );
};

const AdminTampilan = ({ tampilanSettings, dbOps }) => {
    const [formData, setFormData] = useState({ id: 1, tema: 'light', warna: '#f97316', font: '"Google Sans", sans-serif', ukuranFont: 20, ukuranFontBottomNav: 10, background: '#f8fafc', appIcon: '', appName: 'Dompet PJLP', presetTema: 'custom', templateGrid: '', bottomNav: ['Riwayat Absensi', 'Laporan Kerja', 'Foto Edit', 'Laporan CRM Internal'] });
    
    const AVAILABLE_MENUS = ['Absensi', 'Riwayat Absensi', 'Laporan Kerja', 'Laporan CRM Internal', 'Foto Edit', 'Pengajuan Cuti', 'Gaji PJLP', 'Jadwal Kerja', 'Dokumen Saya', 'Bank Sampah', 'Penilaian', 'Paguyuban', 'Informasi', 'Kelompok Kerja', 'Profil Saya'];
    
    const THEME_PRESETS = [
        { id: 'custom', name: 'Kustom (Atur Manual)' },
        { id: 'ocean', name: 'Ocean Blue (Biru Laut Gradasi)', warna: '#0284c7', background: 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 50%, #0284c7 100%)', tema: 'light' },
        { id: 'sunset', name: 'Sunset (Jingga Senja Gradasi)', warna: '#ea580c', background: 'linear-gradient(135deg, #ffedd5 0%, #fdba74 50%, #ea580c 100%)', tema: 'light' },
        { id: 'emerald', name: 'Emerald (Hijau Zamrud Gradasi)', warna: '#059669', background: 'linear-gradient(135deg, #d1fae5 0%, #6ee7b7 50%, #059669 100%)', tema: 'light' },
        { id: 'purple', name: 'Purple Haze (Ungu Elegan Gradasi)', warna: '#9333ea', background: 'linear-gradient(135deg, #f3e8ff 0%, #d8b4fe 50%, #9333ea 100%)', tema: 'light' },
        { id: 'midnight', name: 'Midnight Space (Malam Angkasa)', warna: '#6366f1', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)', tema: 'dark' },
        { id: 'fire', name: 'Fireblood (Merah Gelap Gradasi)', warna: '#ef4444', background: 'linear-gradient(135deg, #2a0800 0%, #450a0a 50%, #7f1d1d 100%)', tema: 'dark' },
        { id: 'sunrise', name: 'Sunrise (Fajar 3 Warna)', warna: '#f97316', background: 'linear-gradient(135deg, #f43f5e 0%, #f97316 50%, #eab308 100%)', tema: 'dark' },
        { id: 'aurora', name: 'Aurora (Ungu Pink 3 Warna)', warna: '#d946ef', background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 50%, #f43f5e 100%)', tema: 'dark' },
        { id: 'forest', name: 'Forest (Hijau Alam 3 Warna)', warna: '#10b981', background: 'linear-gradient(135deg, #14b8a6 0%, #10b981 50%, #84cc16 100%)', tema: 'dark' },
        { id: 'galaxy', name: 'Galaxy (Bintang Angkasa 3 Warna)', warna: '#8b5cf6', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)', tema: 'dark' }
    ];

    useEffect(() => {
        if (tampilanSettings && tampilanSettings.length > 0) setFormData(prev => ({ ...prev, ...tampilanSettings[0] }));
    }, [tampilanSettings]);

    const handleBottomNavToggle = (menuName) => {
        setFormData(prev => {
            const currentNav = prev.bottomNav || [];
            if (currentNav.includes(menuName)) {
                return { ...prev, bottomNav: currentNav.filter(n => n !== menuName) };
            } else {
                if (currentNav.length >= 5) {
                    Swal.fire('Maksimal 5 Menu', 'Bottom Navigation Bar disarankan maksimal 5 menu agar tampilan tetap proporsional dan rapi di layar HP.', 'warning');
                    return prev;
                }
                return { ...prev, bottomNav: [...currentNav, menuName] };
            }
        });
    };

    const handleChange = (e) => {
        const isColorChange = ['tema', 'warna', 'background'].includes(e.target.name);
        setFormData({
            ...formData, 
            [e.target.name]: e.target.value,
            ...(isColorChange ? { presetTema: 'custom' } : {})
        });
    };

    const handlePresetChange = (e) => {
        const presetId = e.target.value;
        if (presetId === 'custom') {
            setFormData({...formData, presetTema: 'custom'});
        } else {
            const preset = THEME_PRESETS.find(p => p.id === presetId);
            if (preset) {
                setFormData({
                    ...formData,
                    presetTema: preset.id,
                    tema: preset.tema,
                    warna: preset.warna,
                    background: preset.background
                });
            }
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        dbOps.add('pengaturanTampilan', {...formData, id:1});
        Swal.fire('Disimpan', 'Pengaturan tampilan berhasil diperbarui ke Spreadsheet!', 'success');
    };

    return (
        <div className="max-w-3xl mx-auto">
            <form onSubmit={handleSave} className="card p-6 md:p-8 border-t-4" style={{borderTopColor: formData.warna}}>
                <h3 className="font-bold text-xl mb-6 border-b pb-2">Pengaturan Tampilan Aplikasi</h3>
                
                <div className="bg-indigo-50 p-4 sm:p-5 rounded-2xl border border-indigo-100 mb-6 shadow-inner">
                    <label className="text-sm font-extrabold text-indigo-800 mb-2 block"><i className="fa-solid fa-wand-magic-sparkles mr-2"></i>Preset Tema Instan (Gradasi Menawan)</label>
                    <select name="presetTema" value={formData.presetTema || 'custom'} onChange={handlePresetChange} className="input-style font-bold text-indigo-700 bg-white border-indigo-200">
                        {THEME_PRESETS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                <div className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs font-bold mb-1 block">Nama Aplikasi</label>
                            <input type="text" name="appName" value={formData.appName} onChange={handleChange} className="input-style font-bold"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold mb-1 block">Tema UI (Terang / Gelap)</label>
                            <select name="tema" value={formData.tema} onChange={handleChange} className="input-style">
                                <option value="light">Light Mode</option>
                                <option value="dark">Dark Mode</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold mb-1 block">Warna Utama</label>
                            <div className="flex gap-2 items-center">
                                <input type="color" name="warna" value={formData.warna} onChange={handleChange} className="h-10 w-16 p-1 border rounded cursor-pointer"/>
                                <input type="text" name="warna" value={formData.warna} onChange={handleChange} className="input-style flex-1 font-mono text-xs"/>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold mb-1 block">Jenis Font</label>
                            <select name="font" value={formData.font} onChange={handleChange} className="input-style">
                                <option value='"Google Sans", sans-serif'>Google Sans</option>
                                <option value="Arial, sans-serif">Arial</option>
                                <option value="Verdana, sans-serif">Verdana</option>
                                <option value="Tahoma, sans-serif">Tahoma</option>
                                <option value="Georgia, serif">Georgia</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold mb-1 block">Ukuran Font Dasar (px)</label>
                            <input type="number" name="ukuranFont" value={formData.ukuranFont} onChange={handleChange} className="input-style"/>
                        </div>
                        <div>
                            <label className="text-xs font-bold mb-1 block">Ukuran Font Menu Bawah (px)</label>
                            <input type="number" name="ukuranFontBottomNav" value={formData.ukuranFontBottomNav} onChange={handleChange} className="input-style"/>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold mb-1 block">Background Aplikasi (Warna HEX / Gradasi CSS)</label>
                        <input type="text" name="background" value={formData.background} onChange={handleChange} className="input-style text-xs font-mono"/>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-5 pt-4 border-t border-slate-100">
                        <div>
                            <label className="text-xs font-bold mb-1 block">Icon Aplikasi</label>
                            <div className="flex items-center gap-3">
                                {formData.appIcon ? <img src={formData.appIcon} className="w-14 h-14 rounded-xl object-cover border bg-white" /> : <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400"><i className="fa-solid fa-wallet text-xl"></i></div>}
                                <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files[0]; if(file) { const res = await processFile(file); setFormData({...formData, appIcon: res.data}); } }} className="text-xs w-full bg-white p-2 rounded border cursor-pointer"/>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold mb-1 block">Template Grid Laporan (16:9)</label>
                            <div className="flex items-center gap-3">
                                {formData.templateGrid ? <img src={formData.templateGrid} className="w-14 h-14 rounded-xl object-cover border bg-white" /> : <div className="w-14 h-14 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400"><i className="fa-solid fa-image text-xl"></i></div>}
                                <input type="file" accept="image/*" onChange={async (e) => { const file = e.target.files[0]; if(file) { const res = await processFile(file); setFormData({...formData, templateGrid: res.data}); } }} className="text-xs w-full bg-white p-2 rounded border cursor-pointer"/>
                            </div>
                        </div>
                    </div>

                    <div className="pt-5 border-t border-slate-100">
                        <label className="text-sm font-extrabold text-slate-800 mb-3 block"><i className="fa-solid fa-layer-group text-orange-500 mr-2"></i>Pengaturan Bottom Navigation Bar (Maksimal 5 Menu)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                            {AVAILABLE_MENUS.map(menu => (
                                <label key={menu} className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border shadow-sm">
                                    <input type="checkbox" checked={(formData.bottomNav || []).includes(menu)} onChange={() => handleBottomNavToggle(menu)} className="w-4 h-4 text-orange-600 rounded" />
                                    <span className="text-[10px] font-bold text-slate-700">{menu}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <button type="submit" className="btn-primary w-full mt-8">Simpan Pengaturan</button>
            </form>
        </div>
    );
};

const AdminLaporanKerja = ({ laporanKerja, dbOps }) => {
    const handleDelete = (id) => { Swal.fire({ title: 'Hapus Laporan?', icon: 'warning', showCancelButton: true }).then((result) => { if (result.isConfirmed) dbOps.remove('laporanKerja', id); }); };
    return (
        <div className="max-w-7xl mx-auto card overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b"><tr><th className="p-4">Nama</th><th className="p-4">Tanggal</th><th className="p-4">Objek</th><th className="p-4">Kegiatan</th><th className="p-4">Lokasi</th><th className="p-4">Progres</th><th className="p-4 text-center">Foto</th><th className="p-4 text-center">Aksi</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                    {laporanKerja.map(log => (
                        <tr key={log.id}><td className="p-4 font-bold">{log.nama}</td><td className="p-4">{formatDateIndo(log.tanggal)}</td><td className="p-4">{log.objek_kerja}</td><td className="p-4">{log.jenis_kegiatan}</td><td className="p-4">{log.lokasi_kegiatan}</td><td className="p-4">{log.proses_pekerjaan}%</td><td className="p-4 text-center">{isImageFile(log.lampiran) ? <img src={log.lampiran} className="h-10 w-10 object-cover rounded mx-auto cursor-pointer" onClick={()=>Swal.fire({imageUrl: log.lampiran})}/> : '-'}</td><td className="p-4 text-center"><button onClick={() => handleDelete(log.id)} className="text-rose-500"><i className="fa-solid fa-trash"></i></button></td></tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const AdminCuti = ({ cuti, dbOps, users }) => {
    const handlePrintFormCuti = (c) => {
        try {
            const { jsPDF } = window.jspdf; const doc = new jsPDF({ format: [215.9, 330.2] });
            const u = users.find(x => String(x.id) === String(c.id_user));
            const nama = c.nama || '-'; const nik = c.nik || (u ? u.nik : '-');
            doc.setFont("helvetica", "bold"); doc.setFontSize(12);
            doc.text("FORMULIR PERMINTAAN DAN PEMBERIAN CUTI", 108, 30, null, null, "center");
            doc.autoTable({ startY: 40, body: [['Nama', nama, 'NIK', nik], ['Alasan', c.alasan || '-', 'Status', c.status || 'Menunggu'], ['Tanggal Cuti', formatTanggalCuti(c.tanggal_cuti), 'Alamat', c.alamat || '-']] });
            doc.save(`Form_Cuti_${nama}.pdf`);
        } catch (err) { Swal.fire('Error', 'Gagal membuat PDF', 'error'); }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-4">
            {cuti.map(c => (
                <div key={c.id} className="card p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-extrabold text-lg">{c.nama} <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 ml-2">{c.status}</span></h3>
                        <p className="text-xs text-slate-500 mt-1">{formatTanggalCuti(c.tanggal_cuti)} • "{c.alasan}"</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => handlePrintFormCuti(c)} className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold">Cetak F4</button>
                        <button onClick={() => dbOps.update('cuti', c.id, { status: 'Disetujui' })} className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold">Setujui</button>
                        <button onClick={() => dbOps.update('cuti', c.id, { status: 'Ditolak' })} className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold">Tolak</button>
                        <button onClick={() => dbOps.remove('cuti', c.id)} className="text-rose-500 px-2"><i className="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const AdminPenilaian = ({ users, penilaian, dbOps, currentUser }) => {
    const handleNilai = (e) => { e.preventDefault(); const fd = new FormData(e.target); dbOps.add('penilaian', { id: generateId(), id_user: parseInt(fd.get('user')), bulan: fd.get('bulan'), nama_penilai: fd.get('nama_penilai'), disiplin: fd.get('d'), tanggung_jawab: fd.get('t'), kepatuhan: fd.get('k') }); e.target.reset(); };
    return (
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <form onSubmit={handleNilai} className="card p-6 space-y-4 h-fit">
                <h3 className="font-bold text-lg border-b pb-2">Input Evaluasi</h3>
                <select name="user" required className="input-style"><option value="">-- Pilih Pegawai --</option>{users.map(u=><option key={u.id} value={u.id}>{u.nama}</option>)}</select>
                <input name="bulan" required type="month" className="input-style"/>
                <div className="grid grid-cols-3 gap-2"><input name="d" required type="number" placeholder="Disiplin" className="input-style"/><input name="t" required type="number" placeholder="T.Jawab" className="input-style"/><input name="k" required type="number" placeholder="Patuh" className="input-style"/></div>
                <input name="nama_penilai" required defaultValue={currentUser?.nama || ''} className="input-style" placeholder="Penilai"/>
                <button type="submit" className="btn-primary w-full">Simpan Nilai</button>
            </form>
            <div className="md:col-span-2 space-y-4">
                {penilaian.map(p => { const u = users.find(x => String(x.id) === String(p.id_user)); return (
                    <div key={p.id} className="card p-5 flex justify-between items-center">
                        <div><p className="font-bold text-lg">{u ? u.nama : '-'}</p><p className="text-xs text-slate-500">{formatMonthIndo(p.bulan)}</p></div>
                        <div className="flex gap-3 items-center"><span className="font-bold text-emerald-600">D: {p.disiplin}</span><span className="font-bold text-blue-600">T: {p.tanggung_jawab}</span><span className="font-bold text-fuchsia-600">P: {p.kepatuhan}</span><button onClick={()=>dbOps.remove('penilaian', p.id)} className="text-rose-500 ml-3"><i className="fa-solid fa-trash"></i></button></div>
                    </div>
                ); })}
            </div>
        </div>
    );
};

const AdminInformasi = ({ informasi, dbOps, currentUser }) => {
    const handleAdd = async (e) => { e.preventDefault(); const form = e.target; const fi = form.lampiran; const save = (l=null) => { dbOps.add('informasi', { id: generateId(), tanggal: getTodayDate(), judul: form.judul.value, isi: form.isi.value, nama_pengelola: currentUser?.nama || 'Admin', lampiran: l }); form.reset(); }; if(fi && fi.files.length > 0) { const res = await processFile(fi.files[0]); save(res.data); } else save(); };
    return (
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <form onSubmit={handleAdd} className="card p-6 space-y-4 h-fit"><h3 className="font-bold border-b pb-2">Buat Pengumuman</h3><input name="judul" required placeholder="Judul" className="input-style"/><textarea name="isi" required placeholder="Isi..." rows="4" className="input-style"></textarea><input type="file" name="lampiran" accept="image/*,application/pdf" className="text-xs w-full"/><button type="submit" className="btn-primary w-full">Sebarkan</button></form>
            <div className="lg:col-span-2 space-y-4">{informasi.map(info => (<div key={info.id} className="card p-6"><div className="flex justify-between"><h3 className="font-bold text-lg">{info.judul}</h3><button onClick={()=>dbOps.remove('informasi', info.id)} className="text-rose-500"><i className="fa-solid fa-trash"></i></button></div><p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{info.isi}</p></div>))}</div>
        </div>
    );
};

const AdminBankSampah = ({ users, bankSampah, dbOps, currentUser }) => {
    const handleAdd = (e) => { e.preventDefault(); const fd = new FormData(e.target); const kg = parseFloat(fd.get('berat')); const harga = parseInt(fd.get('harga')); dbOps.add('bankSampah', { id: generateId(), id_user: parseInt(fd.get('user')), tanggal: getTodayDate(), berat: kg, harga_per_kg: harga, total_harga: kg * harga, jenis_sampah: fd.get('jenis_sampah'), nama_pencatat: currentUser?.nama || 'Admin' }); e.target.reset(); };
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <form onSubmit={handleAdd} className="card p-6 grid sm:grid-cols-4 gap-4"><select name="user" required className="input-style"><option value="">-- Pilih Pegawai --</option>{users.map(u=><option key={u.id} value={u.id}>{u.nama}</option>)}</select><input name="berat" type="number" step="0.1" required placeholder="Berat (Kg)" className="input-style"/><input name="harga" type="number" defaultValue="1000" required placeholder="Harga/Kg" className="input-style"/><button className="btn-primary">Simpan</button></form>
            <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-4">Tanggal</th><th className="p-4">Kg</th><th className="p-4">Total Rp</th><th className="p-4 text-center">Aksi</th></tr></thead><tbody>{bankSampah.map(b => (<tr key={b.id} className="border-b"><td className="p-4">{formatDateIndo(b.tanggal)}</td><td className="p-4 font-bold">{b.berat} Kg</td><td className="p-4 text-emerald-600 font-bold">Rp {Number(b.total_harga).toLocaleString('id-ID')}</td><td className="p-4 text-center"><button onClick={()=>dbOps.remove('bankSampah', b.id)} className="text-rose-500"><i className="fa-solid fa-trash"></i></button></td></tr>))}</tbody></table></div>
        </div>
    );
};

const AdminDokumen = ({ dokumen, dbOps }) => (
    <div className="max-w-6xl mx-auto card overflow-x-auto">
        <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-4">Pegawai</th><th className="p-4">Tanggal</th><th className="p-4">Dokumen</th><th className="p-4">Status</th><th className="p-4 text-center">Aksi</th></tr></thead><tbody>
            {dokumen.map(d => (<tr key={d.id} className="border-b"><td className="p-4 font-bold">{d.nama_pegawai}</td><td className="p-4">{formatDateIndo(d.tanggal)}</td><td className="p-4">{d.nama_dokumen}</td><td className="p-4">{d.status}</td><td className="p-4 text-center flex justify-center gap-2">{d.lampiran && <a href={d.lampiran} target="_blank" rel="noreferrer" className="px-2 py-1 border rounded text-xs">Lihat</a>}<button onClick={()=>dbOps.update('dokumen', d.id, {status:'Disetujui'})} className="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs font-bold">Setujui</button><button onClick={()=>dbOps.remove('dokumen', d.id)} className="text-rose-500 px-2"><i className="fa-solid fa-trash"></i></button></td></tr>))}
        </tbody></table>
    </div>
);

const AdminPaguyuban = ({ users, paguyuban, dbOps, currentUser }) => {
    const handleAdd = (e) => { e.preventDefault(); const su = e.target.user.value === 'all' ? 'all' : parseInt(e.target.user.value, 10); dbOps.add('paguyuban', { id: generateId(), id_user: su, bulan: e.target.bulan.value, nominal: e.target.nominal.value, nama_pencatat: currentUser?.nama || 'Admin' }); e.target.reset(); };
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <form onSubmit={handleAdd} className="card p-6 grid sm:grid-cols-4 gap-4"><select name="user" required className="input-style"><option value="all">Semua Pegawai</option>{users.map(u=><option key={u.id} value={u.id}>{u.nama}</option>)}</select><input name="bulan" type="date" required className="input-style"/><input name="nominal" type="number" required placeholder="Nominal Rp" className="input-style"/><button className="btn-primary">Catat Iuran</button></form>
            <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-4">Tanggal</th><th className="p-4">Nominal</th><th className="p-4 text-center">Aksi</th></tr></thead><tbody>{paguyuban.map(p => (<tr key={p.id} className="border-b"><td className="p-4">{formatDateIndo(p.bulan)}</td><td className="p-4 font-bold">Rp {Number(p.nominal||0).toLocaleString('id-ID')}</td><td className="p-4 text-center"><button onClick={()=>dbOps.remove('paguyuban', p.id)} className="text-rose-500"><i className="fa-solid fa-trash"></i></button></td></tr>))}</tbody></table></div>
        </div>
    );
};

const AdminKelompokKerja = ({ users }) => {
    const groupedUsers = users.reduce((acc, u) => { if (u.role === 'admin') return acc; const group = u.kelompok_kerja || 'Tanpa Kelompok'; if (!acc[group]) acc[group] = []; acc[group].push(u); return acc; }, {});
    return (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {Object.entries(groupedUsers).map(([group, members]) => (
                <div key={group} className="card p-5"><h4 className="font-extrabold text-lg border-b pb-2 mb-3">{group} ({members.length})</h4><div className="space-y-2">{members.map(m => (<div key={m.id} className="text-sm font-semibold">{m.nama} <span className="text-xs text-slate-400">({m.jabatan})</span></div>))}</div></div>
            ))}
        </div>
    );
};

// ============================================================================
// BAGIAN 3: CRM CHAT, FOTO EDIT 16:9, JADWAL, GAJI, & MESIN UTAMA SPREADSHEET
// ============================================================================

const AdminCRM = ({ users, crmInternal, dbOps }) => {
    const [activeChat, setActiveChat] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [chatPhoto, setChatPhoto] = useState(null);
    const chatEndRef = useRef(null);

    const [formTanggal, setFormTanggal] = useState(getTodayDate());
    const [formWaktu, setFormWaktu] = useState(() => new Date().toLocaleTimeString('id-ID', {hour: '2-digit', minute: '2-digit'}).replace(/\./g, ':'));
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const [formKoordinat, setFormKoordinat] = useState('');
    const [formAlamat, setFormAlamat] = useState('');

    useEffect(() => {
        if (activeChat) {
            const updated = crmInternal.find(c => String(c.id) === String(activeChat.id));
            if (updated) setActiveChat(updated);
        }
    }, [crmInternal]);

    const handleUserToggle = (userId) => {
        setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
    };

    const handleSendChat = (e) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() && !chatPhoto) return;
        const currentRiwayat = activeChat.riwayat_tindak_lanjut || [];
        const newLog = {
            id: generateId(),
            waktu: new Date().toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}).replace(/\./g, ':'),
            status: 'Balasan Admin',
            pesan: chatInput.trim(),
            foto: chatPhoto
        };
        dbOps.update('crmInternal', activeChat.id, { riwayat_tindak_lanjut: [...currentRiwayat, newLog] });
        setChatInput('');
        setChatPhoto(null);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        if (selectedUsers.length === 0) return Swal.fire('Peringatan', 'Pilih minimal 1 pegawai.', 'warning');
        const fd = new FormData(e.target);
        const baseId = generateId();

        for (let i = 0; i < selectedUsers.length; i++) {
            await dbOps.add('crmInternal', {
                id: baseId + i,
                id_user: selectedUsers[i],
                tanggal: formTanggal,
                waktu: formWaktu,
                kategori: fd.get('kategori'),
                permasalahan: fd.get('permasalahan'),
                nama_pelapor: fd.get('nama_pelapor'),
                catatan: fd.get('catatan'),
                tindak_lanjut: fd.get('tindak_lanjut'),
                foto: capturedPhoto,
                koordinat: formKoordinat,
                detail_alamat: formAlamat,
                status_penyelesaian: 'Belum Diproses',
                riwayat_tindak_lanjut: []
            });
        }
        e.target.reset();
        setCapturedPhoto(null); setFormKoordinat(''); setFormAlamat(''); setSelectedUsers([]);
        Swal.fire('Sukses', 'Tugas CRM berhasil dikirim ke Spreadsheet & Drive!', 'success');
    };

    const handleToggleStatus = (crmItem) => {
        const newStatus = crmItem.status_penyelesaian === 'Selesai' ? 'Sedang Dikerjakan' : 'Selesai';
        dbOps.update('crmInternal', crmItem.id, { status_penyelesaian: newStatus });
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <form onSubmit={handleAdd} className="card p-6 border-t-4 border-t-indigo-500 space-y-4">
                <h3 className="font-bold text-lg border-b pb-2">Buat Catatan / Tugas CRM</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div><label className="text-xs font-semibold mb-1 block">Nama Pelapor</label><input name="nama_pelapor" required defaultValue="Lurah" className="input-style"/></div>
                    <div><label className="text-xs font-semibold mb-1 block">Kategori</label><input name="kategori" required defaultValue="Penanganan Prasarana dan Sarana" className="input-style"/></div>
                    <div><label className="text-xs font-semibold mb-1 block">Permasalahan</label><input name="permasalahan" required defaultValue="Sampah / Saluran" className="input-style"/></div>
                    <div><label className="text-xs font-semibold mb-1 block">Arahan / Perintah</label><input name="tindak_lanjut" required defaultValue="Tindak Lanjuti Segera" className="input-style"/></div>
                </div>
                <div><label className="text-xs font-semibold mb-1 block">Detail Lokasi / Alamat</label><input value={formAlamat} onChange={e=>setFormAlamat(e.target.value)} placeholder="Nama Jalan, RT/RW..." className="input-style"/></div>
                <div><label className="text-xs font-semibold mb-1 block">Catatan / Deskripsi</label><textarea name="catatan" required rows="2" className="input-style text-sm"></textarea></div>
                <div className="bg-slate-50 p-3 rounded-xl border">
                    <label className="text-xs font-semibold mb-2 block">Foto Bukti (Opsional)</label>
                    <input type="file" accept="image/*" onChange={async(e) => { const f = e.target.files[0]; if(f){ const res = await processFile(f); setCapturedPhoto(res.data); } }} className="text-xs w-full bg-white p-2 rounded border"/>
                </div>
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    <label className="text-xs font-bold text-indigo-800 mb-2 block">Tugaskan Kepada Pegawai ({selectedUsers.length} Terpilih):</label>
                    <div className="max-h-36 overflow-y-auto bg-white border rounded-lg p-2 grid sm:grid-cols-2 gap-1">
                        {users.map(u => (
                            <label key={u.id} className="flex items-center gap-2 p-1.5 hover:bg-indigo-50 rounded cursor-pointer">
                                <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => handleUserToggle(u.id)} className="w-4 h-4 text-indigo-600 rounded" />
                                <span className="text-xs font-bold text-slate-700 truncate">{u.nama}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <button type="submit" className="btn-primary bg-indigo-600 w-full">Simpan & Tugaskan CRM</button>
            </form>

            <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 border-b"><tr><th className="p-4">Tanggal</th><th className="p-4">Pegawai</th><th className="p-4">Permasalahan</th><th className="p-4">Ruang Chat & Status</th><th className="p-4 text-center">Foto</th><th className="p-4 text-center">Aksi</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                        {crmInternal.map(c => {
                            const u = users.find(x => String(x.id) === String(c.id_user));
                            return (
                                <tr key={c.id} className="hover:bg-slate-50">
                                    <td className="p-4 text-xs">{formatDateIndo(c.tanggal)}</td>
                                    <td className="p-4 font-bold">{u ? u.nama : '-'}</td>
                                    <td className="p-4"><span className="font-bold text-xs block">{c.permasalahan}</span><span className="text-[10px] text-slate-500">{c.catatan}</span></td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => setActiveChat({...c, nama_pegawai: u ? u.nama : 'PJLP'})} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-xl font-bold text-xs"><i className="fa-brands fa-whatsapp mr-1"></i> Chat ({(c.riwayat_tindak_lanjut || []).length})</button>
                                            <button onClick={() => handleToggleStatus(c)} className={`text-xs px-3 py-1.5 rounded-xl font-bold border ${c.status_penyelesaian === 'Selesai' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>{c.status_penyelesaian || 'Belum Diproses'}</button>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">{isImageFile(c.foto) ? <img src={c.foto} className="h-8 w-8 object-cover rounded mx-auto cursor-pointer" onClick={()=>window.Swal.fire({imageUrl: c.foto})}/> : '-'}</td>
                                    <td className="p-4 text-center"><button onClick={()=>dbOps.remove('crmInternal', c.id)} className="text-rose-500"><i className="fa-solid fa-trash"></i></button></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {activeChat && (
                <div className="fixed inset-0 bg-[#efeae2] z-[100] flex flex-col">
                    <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
                        <button onClick={() => setActiveChat(null)} className="p-2 text-slate-600"><i className="fa-solid fa-arrow-left text-xl"></i></button>
                        <div><h2 className="font-bold text-base">{activeChat.nama_pegawai || 'Pegawai'}</h2><p className="text-xs text-slate-500">{activeChat.permasalahan} • {activeChat.status_penyelesaian}</p></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border max-w-md">
                            <p className="text-xs font-bold text-rose-600 mb-1">Tugas Awal Admin:</p>
                            <p className="text-sm">"{activeChat.catatan}"</p>
                            {isImageFile(activeChat.foto) && <img src={activeChat.foto} className="mt-2 rounded-xl max-h-48 object-cover cursor-pointer" onClick={()=>window.Swal.fire({imageUrl: activeChat.foto})} />}
                        </div>
                        {(activeChat.riwayat_tindak_lanjut || []).map((log, idx) => {
                            const fromAdmin = log.status === 'Balasan Admin';
                            return (
                                <div key={log.id || idx} className={`flex flex-col max-w-md ${fromAdmin ? 'ml-auto items-end' : 'items-start'}`}>
                                    <span className="text-[10px] text-slate-500 mb-1 font-bold">{fromAdmin ? 'Admin' : 'PJLP'} • {log.waktu}</span>
                                    <div className={`p-3 rounded-2xl shadow-sm border text-sm ${fromAdmin ? 'bg-[#dcf8c6]' : 'bg-white'}`}>
                                        <p>{log.pesan}</p>
                                        {isImageFile(log.foto) && <img src={log.foto} className="mt-2 rounded-xl max-h-48 object-cover cursor-pointer" onClick={()=>window.Swal.fire({imageUrl: log.foto})} />}
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef}></div>
                    </div>
                    <form onSubmit={handleSendChat} className="bg-slate-50 border-t p-3 flex items-center gap-2">
                        <label className="p-3 text-slate-500 cursor-pointer"><i className="fa-solid fa-paperclip text-xl"></i><input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files[0]; if(f) { const res = await processFile(f); setChatPhoto(res.data); } }} /></label>
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ketik balasan..." className="input-style flex-1 rounded-full"/>
                        <button type="submit" className="btn-primary rounded-full w-12 h-12 p-0"><i className="fa-solid fa-paper-plane"></i></button>
                    </form>
                </div>
            )}
        </div>
    );
};

const UserCRM = ({ user, crmInternal, dbOps }) => {
    const [activeChat, setActiveChat] = useState(null);
    const [chatInput, setChatInput] = useState('');
    const [chatPhoto, setChatPhoto] = useState(null);
    const myCrm = crmInternal.filter(c => String(c.id_user) === String(user.id));

    useEffect(() => {
        if (activeChat) {
            const updated = crmInternal.find(c => String(c.id) === String(activeChat.id));
            if (updated) setActiveChat(updated);
        }
    }, [crmInternal]);

    const handleSendChat = (e) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() && !chatPhoto) return;
        const currentRiwayat = activeChat.riwayat_tindak_lanjut || [];
        const newLog = {
            id: generateId(),
            waktu: new Date().toLocaleString('id-ID', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}).replace(/\./g, ':'),
            status: 'Progres',
            pesan: chatInput.trim(),
            foto: chatPhoto
        };
        dbOps.update('crmInternal', activeChat.id, {
            status_penyelesaian: 'Sedang Dikerjakan',
            riwayat_tindak_lanjut: [...currentRiwayat, newLog]
        });
        setChatInput('');
        setChatPhoto(null);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-4">Catatan & Tugas CRM Internal</h2>
            {myCrm.length === 0 ? <div className="card p-10 text-center text-slate-400">Belum ada tugas CRM.</div> : myCrm.map(c => (
                <div key={c.id} className="card p-6 border-l-4 border-indigo-500">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border">{c.kategori}</span>
                            <h3 className="font-bold text-slate-800 text-sm mt-2">{formatDateIndo(c.tanggal)} • {c.permasalahan}</h3>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded bg-amber-50 text-amber-700 border">{c.status_penyelesaian || 'Belum Diproses'}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-3">"{c.catatan}"</p>
                    {isImageFile(c.foto) && <img src={c.foto} className="max-h-40 rounded-lg border mb-4 cursor-pointer" onClick={()=>window.Swal.fire({imageUrl: c.foto})} />}
                    <button onClick={() => setActiveChat(c)} className="w-full py-3 rounded-xl font-bold text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200"><i className="fa-brands fa-whatsapp mr-2 text-lg"></i>Buka Ruang Kerja / Kirim Bukti Tindak Lanjut ({(c.riwayat_tindak_lanjut || []).length})</button>
                </div>
            ))}

            {activeChat && (
                <div className="fixed inset-0 bg-[#efeae2] z-[100] flex flex-col">
                    <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
                        <button onClick={() => setActiveChat(null)} className="p-2 text-slate-600"><i className="fa-solid fa-arrow-left text-xl"></i></button>
                        <div><h2 className="font-bold text-base">Ruang Tindak Lanjut CRM</h2><p className="text-xs text-slate-500">{activeChat.permasalahan}</p></div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="bg-white p-4 rounded-2xl shadow-sm border max-w-md">
                            <p className="text-xs font-bold text-rose-600 mb-1">Instruksi Admin:</p>
                            <p className="text-sm">"{activeChat.catatan}"</p>
                        </div>
                        {(activeChat.riwayat_tindak_lanjut || []).map((log, idx) => {
                            const fromAdmin = log.status === 'Balasan Admin';
                            return (
                                <div key={log.id || idx} className={`flex flex-col max-w-md ${!fromAdmin ? 'ml-auto items-end' : 'items-start'}`}>
                                    <span className="text-[10px] text-slate-500 mb-1 font-bold">{fromAdmin ? 'Admin' : user.nama} • {log.waktu}</span>
                                    <div className={`p-3 rounded-2xl shadow-sm border text-sm ${!fromAdmin ? 'bg-[#dcf8c6]' : 'bg-white'}`}>
                                        <p>{log.pesan}</p>
                                        {isImageFile(log.foto) && <img src={log.foto} className="mt-2 rounded-xl max-h-48 object-cover cursor-pointer" onClick={()=>window.Swal.fire({imageUrl: log.foto})} />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <form onSubmit={handleSendChat} className="bg-slate-50 border-t p-3 flex items-center gap-2">
                        <label className="p-3 text-slate-500 cursor-pointer"><i className="fa-solid fa-camera text-xl"></i><input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files[0]; if(f) { const res = await processFile(f); setChatPhoto(res.data); } }} /></label>
                        <input value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ketik laporan penyelesaian..." className="input-style flex-1 rounded-full"/>
                        <button type="submit" className="btn-primary rounded-full w-12 h-12 p-0"><i className="fa-solid fa-paper-plane"></i></button>
                    </form>
                </div>
            )}
        </div>
    );
};

const UserProfil = ({ user, dbOps }) => {
    const [formData, setFormData] = useState({
        foto: user.foto || '', nama: user.nama || '', jabatan: user.jabatan || '',
        nik: user.nik || '', no_telp: user.no_telp || '', masa_kerja: user.masa_kerja || '',
        kelompok_kerja: user.kelompok_kerja || '', username: user.username || '', password: user.password || ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const res = await processFile(file);
            setFormData({ ...formData, foto: res.data });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        await dbOps.update('users', user.id, {
            foto: formData.foto, nik: formData.nik, no_telp: formData.no_telp,
            masa_kerja: formData.masa_kerja, username: formData.username, password: formData.password
        });
        const updatedUser = { ...user, ...formData };
        localStorage.setItem('dompet_pjlp_user', JSON.stringify(updatedUser));
        window.Swal.fire('Sukses', 'Profil berhasil disimpan ke Spreadsheet & Drive!', 'success');
    };

    return (
        <div className="max-w-4xl mx-auto card p-6 md:p-8 border-t-4 border-t-orange-500">
            <h2 className="text-2xl font-extrabold text-slate-800 mb-6 border-b pb-2">Profil Saya</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center">
                    {formData.foto ? <img src={formData.foto} className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md mb-3" /> : <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center text-4xl font-extrabold text-slate-400 mb-3">{String(formData.nama || 'U').charAt(0)}</div>}
                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="text-xs" />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                    <div><label className="text-xs font-bold mb-1 block">Nama Lengkap</label><input type="text" value={formData.nama} readOnly className="input-style bg-slate-100" /></div>
                    <div><label className="text-xs font-bold mb-1 block">Jabatan</label><input type="text" value={formData.jabatan} readOnly className="input-style bg-slate-100" /></div>
                    <div><label className="text-xs font-bold mb-1 block">NIK</label><input type="text" name="nik" value={formData.nik} onChange={handleChange} className="input-style" /></div>
                    <div><label className="text-xs font-bold mb-1 block">No. Telpon</label><input type="text" name="no_telp" value={formData.no_telp} onChange={handleChange} className="input-style" /></div>
                    <div><label className="text-xs font-bold mb-1 block">Username Login</label><input type="text" name="username" required value={formData.username} onChange={handleChange} className="input-style font-mono" /></div>
                    <div><label className="text-xs font-bold mb-1 block">Password Login</label><input type="text" name="password" required value={formData.password} onChange={handleChange} className="input-style font-mono" /></div>
                </div>
                <button type="submit" className="btn-primary w-full"><i className="fa-solid fa-floppy-disk mr-2"></i>Simpan Profil</button>
            </form>
        </div>
    );
};

const UserFotoEdit = ({ user, templateGrid }) => {
    const [kegiatan, setKegiatan] = useState('');
    const [lokasi, setLokasi] = useState('');
    const [foto0, setFoto0] = useState(null);
    const [foto50, setFoto50] = useState(null);
    const [foto100, setFoto100] = useState(null);
    const canvasRef = useRef(null);

    const handleImageUpload = (e, setter) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setter(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    const drawCover = (ctx, imgSrc, x, y, w, h) => {
        return new Promise((resolve) => {
            if (!imgSrc) {
                ctx.fillStyle = '#fef08a'; ctx.fillRect(x, y, w, h); resolve(); return;
            }
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const imgRatio = img.width / img.height; const boxRatio = w / h;
                let renderW, renderH, renderX, renderY;
                if (imgRatio > boxRatio) { renderH = h; renderW = img.width * (h / img.height); renderX = x + (w - renderW) / 2; renderY = y; }
                else { renderW = w; renderH = img.height * (w / img.width); renderX = x; renderY = y + (h - renderH) / 2; }
                ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
                ctx.drawImage(img, renderX, renderY, renderW, renderH);
                ctx.restore(); resolve();
            };
            img.onerror = () => { ctx.fillStyle = '#fef08a'; ctx.fillRect(x, y, w, h); resolve(); };
            img.src = imgSrc;
        });
    };

    const generateGrid = async () => {
        if (!foto0 || !foto50 || !foto100 || !kegiatan.trim() || !lokasi.trim()) {
            return window.Swal.fire('Peringatan', 'Lengkapi kegiatan, lokasi, dan 3 foto progres.', 'warning');
        }
        const canvas = canvasRef.current; const ctx = canvas.getContext('2d');
        canvas.width = 960; canvas.height = 540;
        ctx.scale(0.5, 0.5);
        const cw = 1920; const ch = 1080; const hw = 960; const hh = 540;

        await drawCover(ctx, templateGrid, 0, 0, hw, hh);
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        ctx.fillRect(20, 20, hw - 40, hh - 40);
        ctx.fillStyle = '#0f172a'; ctx.font = 'bold 28px sans-serif';
        ctx.fillText('LAPORAN KEGIATAN HARIAN PJLP', 50, 80);
        ctx.font = 'bold 22px sans-serif';
        const now = new Date();
        ctx.fillText(`Nama      : ${user.nama || '-'}`, 50, 150);
        ctx.fillText(`Kelompok  : ${user.kelompok_kerja || '-'}`, 50, 195);
        ctx.fillText(`Tanggal   : ${now.toLocaleDateString('id-ID')}`, 50, 240);
        ctx.fillText(`Lokasi    : ${lokasi}`, 50, 285);
        ctx.fillText(`Kegiatan  : ${kegiatan}`, 50, 330);

        await drawCover(ctx, foto0, hw, 0, hw, hh);
        await drawCover(ctx, foto50, 0, hh, hw, hh);
        await drawCover(ctx, foto100, hw, hh, hw, hh);

        const drawLabel = (text, x, y) => {
            ctx.fillStyle = 'rgba(249, 115, 22, 0.9)'; ctx.fillRect(x, y, 120, 50);
            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px sans-serif'; ctx.fillText(text, x + 20, y + 35);
        };
        drawLabel('0%', hw, 0); drawLabel('50%', 0, hh); drawLabel('100%', hw, hh);

        const dataUrl = canvas.toDataURL('image/webp', 0.85);
        const link = document.createElement('a');
        link.download = `Grid_${user.nama.replace(/\s+/g, '_')}_${Date.now()}.webp`;
        link.href = dataUrl; link.click();
        window.Swal.fire('Selesai', 'Foto Grid 16:9 berhasil diunduh!', 'success');
    };

    return (
        <div className="max-w-4xl mx-auto card p-6 border-t-4 border-t-orange-500 space-y-5">
            <h2 className="text-xl font-extrabold text-slate-800 border-b pb-2"><i className="fa-solid fa-images text-orange-500 mr-2"></i>Foto Edit (Grid Laporan 16:9)</h2>
            <input type="text" value={kegiatan} onChange={e=>setKegiatan(e.target.value)} placeholder="Nama Kegiatan..." className="input-style"/>
            <input type="text" value={lokasi} onChange={e=>setLokasi(e.target.value)} placeholder="Lokasi Kegiatan (RT/RW/Jalan)..." className="input-style"/>
            <div className="grid sm:grid-cols-3 gap-4">
                {[['Foto 0%', foto0, setFoto0], ['Foto 50%', foto50, setFoto50], ['Foto 100%', foto100, setFoto100]].map(([lbl, val, setter], idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border text-center">
                        <p className="font-bold text-sm mb-2">{lbl}</p>
                        {val && <img src={val} className="w-full h-28 object-cover rounded mb-2"/>}
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setter)} className="text-xs w-full"/>
                    </div>
                ))}
            </div>
            <button onClick={generateGrid} className="btn-primary w-full"><i className="fa-solid fa-download mr-2"></i>Proses & Unduh Grid Laporan</button>
            <canvas ref={canvasRef} className="hidden"></canvas>
        </div>
    );
};

const AdminJadwalKerja = ({ users, jadwalKerja, dbOps }) => {
    const [idUser, setIdUser] = useState('');
    const [tanggal, setTanggal] = useState(getTodayDate());
    const [namaShift, setNamaShift] = useState('Pagi');
    const [keterangan, setKeterangan] = useState('');
    const pjlpUsers = users.filter(u => u.role !== 'admin');

    const handleSubmit = (e) => {
        e.preventDefault();
        dbOps.add('jadwalKerja', { id: generateId(), id_user: parseInt(idUser), tanggal, nama_shift: namaShift, keterangan });
        Swal.fire('Sukses', 'Jadwal disimpan ke Spreadsheet', 'success');
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <form onSubmit={handleSubmit} className="card p-6 grid sm:grid-cols-4 gap-4">
                <select required value={idUser} onChange={e=>setIdUser(e.target.value)} className="input-style"><option value="">-- Pilih Pegawai --</option>{pjlpUsers.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}</select>
                <input type="date" required value={tanggal} onChange={e=>setTanggal(e.target.value)} className="input-style"/>
                <select value={namaShift} onChange={e=>setNamaShift(e.target.value)} className="input-style"><option value="Pagi">Pagi</option><option value="Siang">Siang</option><option value="Sore">Sore</option><option value="Piket">Piket</option><option value="Lepas Piket">Lepas Piket</option><option value="Libur">Libur</option></select>
                <button type="submit" className="btn-primary">Simpan Jadwal</button>
            </form>
            <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm"><thead className="bg-slate-50 border-b"><tr><th className="p-4">Tanggal</th><th className="p-4">Pegawai</th><th className="p-4">Shift</th><th className="p-4 text-center">Aksi</th></tr></thead><tbody>
                    {jadwalKerja.map(j => { const u = pjlpUsers.find(x => String(x.id) === String(j.id_user)); return (
                        <tr key={j.id} className="border-b"><td className="p-4 font-bold">{formatDateIndo(j.tanggal)}</td><td className="p-4">{u ? u.nama : '-'}</td><td className="p-4"><span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{j.nama_shift}</span></td><td className="p-4 text-center"><button onClick={()=>dbOps.remove('jadwalKerja', j.id)} className="text-rose-500"><i className="fa-solid fa-trash"></i></button></td></tr>
                    ); })}
                </tbody></table>
            </div>
        </div>
    );
};

const UserJadwalKerja = ({ user, jadwalKerja }) => {
    const myJadwal = jadwalKerja.filter(j => String(j.id_user) === String(user.id));
    return (
        <div className="max-w-4xl mx-auto card p-6">
            <h3 className="font-extrabold text-xl mb-4"><i className="fa-solid fa-calendar-day text-indigo-500 mr-2"></i>Jadwal Kerja Saya</h3>
            {myJadwal.length === 0 ? <p className="text-slate-400 text-center py-8">Belum ada jadwal kerja khusus.</p> : (
                <div className="space-y-3">{myJadwal.map(j => (<div key={j.id} className="p-4 bg-slate-50 rounded-xl border flex justify-between items-center"><span className="font-bold">{formatDateIndo(j.tanggal)}</span><span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold">{j.nama_shift}</span></div>))}</div>
            )}
        </div>
    );
};

const AdminGaji = ({ users, gaji, dbOps }) => {
    const [formData, setFormData] = useState({ id_user: '', periode: getTodayDate().substring(0,7), no_rekening: '', jumlah_gaji: 5000000, potongan_pph: 0, potongan_absen: 0, potongan_bpjs: 50000, status_transfer: 'Belum Transfer' });
    const handleSave = (e) => {
        e.preventDefault();
        const total_diterima = Number(formData.jumlah_gaji) - Number(formData.potongan_pph) - Number(formData.potongan_absen) - Number(formData.potongan_bpjs);
        dbOps.add('gaji', { id: generateId(), ...formData, total_diterima });
        Swal.fire('Sukses', 'Data gaji disimpan ke Spreadsheet', 'success');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <form onSubmit={handleSave} className="card p-6 grid sm:grid-cols-3 gap-4 border-t-4 border-t-emerald-500">
                <select required value={formData.id_user} onChange={e=>setFormData({...formData, id_user:e.target.value})} className="input-style"><option value="">-- Pilih Pegawai --</option>{users.map(u => <option key={u.id} value={u.id}>{u.nama}</option>)}</select>
                <input type="month" required value={formData.periode} onChange={e=>setFormData({...formData, periode:e.target.value})} className="input-style"/>
                <input type="text" required placeholder="No. Rekening (Bank DKI...)" value={formData.no_rekening} onChange={e=>setFormData({...formData, no_rekening:e.target.value})} className="input-style"/>
                <input type="number" required placeholder="Gaji Pokok" value={formData.jumlah_gaji} onChange={e=>setFormData({...formData, jumlah_gaji:e.target.value})} className="input-style"/>
                <input type="number" required placeholder="Potongan BPJS" value={formData.potongan_bpjs} onChange={e=>setFormData({...formData, potongan_bpjs:e.target.value})} className="input-style"/>
                <button type="submit" className="btn-primary">Tambah Slip Gaji</button>
            </form>
            <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap"><thead className="bg-slate-50 border-b"><tr><th className="p-4">Periode</th><th className="p-4">Pegawai</th><th className="p-4">No Rek</th><th className="p-4">Total Diterima</th><th className="p-4">Status</th><th className="p-4 text-center">Aksi</th></tr></thead><tbody>
                    {gaji.map(g => { const u = users.find(x => String(x.id) === String(g.id_user)); return (
                        <tr key={g.id} className="border-b"><td className="p-4 font-bold">{formatMonthIndo(g.periode)}</td><td className="p-4">{u ? u.nama : '-'}</td><td className="p-4 font-mono text-xs">{g.no_rekening}</td><td className="p-4 font-bold text-emerald-600">Rp {Number(g.total_diterima).toLocaleString('id-ID')}</td><td className="p-4"><select value={g.status_transfer} onChange={e=>dbOps.update('gaji', g.id, {status_transfer:e.target.value})} className="text-xs font-bold p-1 border rounded"><option value="Belum Transfer">Belum Transfer</option><option value="Sudah Transfer">Sudah Transfer</option></select></td><td className="p-4 text-center"><button onClick={()=>dbOps.remove('gaji', g.id)} className="text-rose-500"><i className="fa-solid fa-trash"></i></button></td></tr>
                    ); })}
                </tbody></table>
            </div>
        </div>
    );
};

const UserGaji = ({ user, gaji }) => {
    const myGaji = gaji.filter(g => String(g.id_user) === String(user.id));
    const handlePrintSlip = (g) => {
        const { jsPDF } = window.jspdf; const doc = new jsPDF();
        doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.text("SLIP GAJI PJLP", 105, 20, null, null, "center");
        doc.autoTable({ startY: 35, head: [["Deskripsi", "Jumlah"]], body: [["Nama Pegawai", user.nama], ["Periode", formatMonthIndo(g.periode)], ["No. Rekening", g.no_rekening || '-'], ["Gaji Pokok", `Rp ${Number(g.jumlah_gaji).toLocaleString('id-ID')}`], ["Total Diterima", `Rp ${Number(g.total_diterima).toLocaleString('id-ID')}`]] });
const DashboardLayout = ({ user, onLogout, tabs, activeTab, setActiveTab, onUpdateProfile, isSyncing, sisaCuti, children, appIcon, appName, bottomNav, bottomNavFontSize, onRefresh, isConnected }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const handlePhotoUpload = async (e) => { const file = e.target.files[0]; if (file) { const res = await processFile(file); onUpdateProfile(user.id, { foto: res.data }); window.Swal.fire('Sukses','Foto Profil Diperbarui','success'); } };
    const activeBottomNav = bottomNav || ['Riwayat Absensi', 'Laporan Kerja', 'Foto Edit', 'Laporan CRM Internal'];
    const bottomNavTabs = tabs.filter(t => activeBottomNav.includes(t.name));

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 z-40" onClick={() => setIsSidebarOpen(false)}></div>}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 text-slate-800 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 flex flex-col shadow-lg`}>
                <div className="p-5 border-b border-slate-100 flex items-center gap-3">
                    {appIcon ? <img src={appIcon} className="w-12 h-12 rounded-xl object-cover shadow-sm bg-white p-0.5 border" /> : <div className="w-12 h-12 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm"><i className="fa-solid fa-wallet text-white text-2xl"></i></div>}
                    <h1 className="text-xl font-extrabold text-slate-800 tracking-wide">{appName || 'Dompet PJLP'}</h1>
                </div>
                <div className="p-6 border-b border-slate-100 flex flex-col items-center">
                    <div className="relative group cursor-pointer mb-3">
                        {user.foto ? <img src={user.foto} className="w-20 h-20 rounded-full object-cover border-4 border-slate-50 shadow-sm" /> : <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-3xl font-extrabold border-4 border-white text-slate-400">{String(user.nama || 'U').charAt(0).toUpperCase()}</div>}
                        <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><i className="fa-solid fa-camera text-white text-lg"></i><input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} /></label>
                    </div>
                    <span className="font-extrabold text-slate-800 text-center text-base">{user.nama || '-'}</span>
                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 border text-slate-500 px-3 py-1 rounded mt-2">{user.role || '-'}</span>
                    {user.role !== 'admin' && <span className="text-xs font-bold text-orange-700 mt-2 bg-orange-50 border border-orange-100 px-3 py-1 rounded"><i className="fa-solid fa-calendar-check text-orange-500 mr-1.5"></i> Sisa Cuti: {sisaCuti}</span>}
                </div>
                <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1 custom-scrollbar">
                    {tabs.map((tab, idx) => tab.isDivider ? 
                        <div key={idx} className="px-2 mt-5 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{tab.label}</div> : 
                        <button key={tab.name} onClick={() => { setActiveTab(tab.name); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold relative ${activeTab === tab.name ? 'bg-orange-50 text-orange-600 border border-orange-100 shadow-sm' : 'text-slate-500 hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}>
                            <i className={`fa-solid ${tab.icon} w-6 text-center text-base`}></i>
                            <span className="text-sm tracking-wide">{tab.name}</span>
                            {tab.badge > 0 && (
                                <span className="ml-auto bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm min-w-[20px] text-center animate-pulse">
                                    {tab.badge > 99 ? '99+' : tab.badge}
                                </span>
                            )}
                        </button>
                    )}
                </nav>
            </aside>
            <div className="flex-1 flex flex-col overflow-hidden bg-transparent">
                <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 hover:text-slate-800"><i className="fa-solid fa-bars text-xl sm:text-2xl"></i></button>
                        <div className="hidden sm:flex items-center gap-1 border-l border-r px-3 mx-1 border-slate-200">
                            <button onClick={() => window.history.back()} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors" title="Kembali"><i className="fa-solid fa-chevron-left"></i></button>
                            <button onClick={() => window.history.forward()} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors" title="Maju"><i className="fa-solid fa-chevron-right"></i></button>
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800 hidden sm:block">{activeTab}</h2>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button onClick={onRefresh} className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-colors ${isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`} title="Klik untuk Sinkronisasi atau Mengatur URL Spreadsheet">
                            <i className={`fa-solid ${isConnected ? 'fa-rotate' : 'fa-triangle-exclamation'} mr-1.5 ${isSyncing ? 'fa-spin text-orange-500' : ''}`}></i>
                            {isSyncing ? 'Menyinkronkan...' : (isConnected ? 'Spreadsheet Aktif' : 'URL Belum Diatur!')}
                        </button>
                        <button onClick={onLogout} className="text-rose-500 hover:text-rose-600 p-2 rounded-full hover:bg-rose-50 transition-colors" title="Keluar Akun">
                            <i className="fa-solid fa-sign-out-alt text-xl"></i>
                        </button>
                    </div>
                </header>
                <main className={`flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar relative z-0 ${user.role === 'user' ? 'pb-24 md:pb-6' : ''}`}>
                    <div className="max-w-7xl mx-auto">
                        <RealTimeGreeting userName={user.nama} />
                        <h2 className="text-xl font-extrabold text-slate-800 mb-4 sm:hidden border-b pb-2">{activeTab}</h2>
                        {children}
                    </div>
                </main>
                {user.role === 'user' && (
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center px-1 pt-2 z-50 shadow-[0_-4px_15px_rgba(0,0,0,0.05)]" style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}>
                        {bottomNavTabs.map(tab => {
                            const shortName = tab.name === 'Laporan CRM Internal' ? 'CRM' : tab.name === 'Riwayat Absensi' ? 'Riwayat' : tab.name === 'Laporan Kerja' ? 'Laporan' : tab.name;
                            return (
                                <button key={tab.name} onClick={() => { setActiveTab(tab.name); setIsSidebarOpen(false); }} className={`flex flex-col items-center justify-center w-full pt-1 pb-1 transition-colors ${activeTab === tab.name ? 'text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}>
                                    <div className="relative mb-1">
                                        <i className={`fa-solid ${tab.icon} text-[22px]`}></i>
                                        {tab.badge > 0 && (
                                            <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[8px] font-extrabold px-1.5 py-0.5 rounded-full shadow-sm min-w-[16px] text-center">
                                                {tab.badge > 99 ? '99+' : tab.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="font-bold text-center truncate w-full px-0.5" style={{ fontSize: bottomNavFontSize ? `${bottomNavFontSize}px` : '9px' }}>{shortName}</span>
                                </button>
                            );
                        })}
                    </nav>
                )}
            </div>
        </div>
    );
};

const Login = ({ users, onLogin, appIcon, appName, onSetupUrl }) => {
    const [username, setUsername] = useState(''); 
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    const handleLogin = (e) => { 
        e.preventDefault(); 
        let u = users.find(u => String(u.username) === username && String(u.password) === password); 
        if (!u) u = initialUsers.find(u => String(u.username) === username && String(u.password) === password);
        if (u) { 
            if ((u.is_active === false || String(u.is_active) === 'false') && u.role !== 'admin') {
                window.Swal.fire('Akses Ditolak', 'Akun Anda sedang dinonaktifkan oleh Admin.', 'warning');
            } else { onLogin(u); }
        } else { window.Swal.fire('Error', 'Username atau Password salah!', 'error'); }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-slate-100 w-full max-w-md">
                <RealTimeGreeting isLogin={true} />
                <div className="text-center mb-8">
                    {appIcon ? <img src={appIcon} className="w-20 h-20 rounded-2xl object-cover shadow-lg mx-auto mb-4 bg-white p-1 border" /> : <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><i className="fa-solid fa-wallet text-4xl text-white"></i></div>}
                    <h2 className="text-3xl font-extrabold text-slate-800">{appName || 'Dompet PJLP'}</h2>
                    <p className="text-sm font-bold text-slate-500 mt-1.5">Database Google Spreadsheet & Drive</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                        <label className="block text-center text-slate-700 mb-2 font-bold text-xs uppercase">Username</label>
                        <input type="text" autoFocus className="input-style text-center font-semibold" placeholder="Masukkan username" value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, ''))} required />
                    </div>
                    <div>
                        <label className="block text-center text-slate-700 mb-2 font-bold text-xs uppercase">Password</label>
                        <div className="relative">
                            <input type={showPassword ? "text" : "password"} className="input-style text-center font-semibold" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400"><i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i></button>
                        </div>
                    </div>
                    <button type="submit" className="btn-primary w-full py-3.5 text-lg mt-6">Login</button>
                </form>
                <div className="mt-6 text-center">
                    <button type="button" onClick={onSetupUrl} className="text-xs font-bold text-emerald-600 hover:underline"><i className="fa-solid fa-table mr-1"></i>Atur Koneksi URL Spreadsheet</button>
                </div>
                <p className="text-center text-xs text-slate-400 mt-4 font-medium">Hak Cipta &copy; 2026 Muhidin</p>
            </div>
        </div>
    );
};

// ============================================================================
// KOMPONEN INDUK <App /> & KONEKSI GOOGLE APPS SCRIPT (SPREADSHEET + DRIVE)
// ============================================================================

const App = () => {
    const [gasUrl, setGasUrl] = useState(() => {
        if (GOOGLE_SCRIPT_URL && GOOGLE_SCRIPT_URL.startsWith('https://script.google.com')) return GOOGLE_SCRIPT_URL.trim();
        return (localStorage.getItem('dompet_pjlp_gas_url') || '').trim();
    });

    const isConnected = Boolean(gasUrl && gasUrl.startsWith('https://script.google.com') && gasUrl.endsWith('/exec'));

    const [currentUser, setCurrentUser] = useState(() => { 
        try { const s = localStorage.getItem('dompet_pjlp_user'); return s ? JSON.parse(s) : null; } catch(e) { return null; } 
    });
    
    const [users, setUsers] = useState(initialUsers); 
    const [timeSlots, setTimeSlots] = useState(initialTimeSlots); 
    const [absensi, setAbsensi] = useState([]); 
    const [cuti, setCuti] = useState([]); 
    const [penilaian, setPenilaian] = useState([]); 
    const [informasi, setInformasi] = useState([]); 
    const [bankSampah, setBankSampah] = useState([]); 
    const [dokumen, setDokumen] = useState([]); 
    const [paguyuban, setPaguyuban] = useState([]); 
    const [laporanKerja, setLaporanKerja] = useState([]); 
    const [gpsSettings, setGpsSettings] = useState([{ id: 1, isActive: false, latitude: '', longitude: '', radius: 100, locationName: 'Kantor Pusat' }]); 
    const [crmInternal, setCrmInternal] = useState([]); 
    const [pengaturanTampilan, setPengaturanTampilan] = useState([{ id: 1, tema: 'light', warna: '#f97316', font: '"Google Sans", sans-serif', ukuranFont: 20, ukuranFontBottomNav: 10, background: '#f8fafc', appIcon: '', appName: 'Dompet PJLP', presetTema: 'custom', templateGrid: '', bottomNav: ['Riwayat Absensi', 'Laporan Kerja', 'Foto Edit', 'Laporan CRM Internal'] }]); 
    const [jadwalKerja, setJadwalKerja] = useState([]); 
    const [gaji, setGaji] = useState([]); 
    const [chatMessages, setChatMessages] = useState([]);
    
    const [activeTab, setActiveTab] = useState(''); 
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSeenCounts, setLastSeenCounts] = useState({});
    const hasSeededRef = useRef(false);

    useEffect(() => {
        if (currentUser) {
            try {
                const saved = localStorage.getItem('dompet_pjlp_last_seen_' + currentUser.id);
                if (saved) setLastSeenCounts(JSON.parse(saved));
            } catch(e) {}
        } else {
            setLastSeenCounts({});
        }
    }, [currentUser]);

    const getSetter = (col) => {
        switch(col) {
            case 'users': return setUsers; case 'timeSlots': return setTimeSlots; case 'absensi': return setAbsensi; case 'cuti': return setCuti; case 'penilaian': return setPenilaian; case 'informasi': return setInformasi; case 'bankSampah': return setBankSampah; case 'dokumen': return setDokumen; case 'paguyuban': return setPaguyuban; case 'laporanKerja': return setLaporanKerja; case 'crmInternal': return setCrmInternal; case 'pengaturanLokasi': return setGpsSettings; case 'pengaturanTampilan': return setPengaturanTampilan; case 'jadwalKerja': return setJadwalKerja; case 'gaji': return setGaji; case 'chatMessages': return setChatMessages; default: return null;
        }
    };

    // Fungsi Membaca Seluruh Data dari Google Spreadsheet (+ Auto-Seed jika Spreadsheet masih baru/kosong)
    const fetchAllFromSpreadsheet = React.useCallback(async (urlToUse = gasUrl) => {
        if (!urlToUse || !urlToUse.startsWith('https://script.google.com')) return;
        setIsSyncing(true);
        try {
            const response = await fetch(`${urlToUse}?action=getAll&t=${Date.now()}`, {
                method: 'GET',
                redirect: 'follow'
            });
            const text = await response.text();
            const json = JSON.parse(text);
            if (json.status === 'success' && json.data) {
                const d = json.data;
                
                // Jika Spreadsheet masih baru dan tabel users kosong, kirim data awal otomatis!
                if ((!d.users || d.users.length === 0) && !hasSeededRef.current) {
                    hasSeededRef.current = true;
                    await fetch(urlToUse, {
                        method: 'POST',
                        redirect: 'follow',
                        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                        body: JSON.stringify({
                            action: 'seed',
                            payload: {
                                users: initialUsers,
                                timeSlots: initialTimeSlots,
                                pengaturanLokasi: [{ id: 1, isActive: false, latitude: '', longitude: '', radius: 100, locationName: 'Kantor Pusat' }],
                                pengaturanTampilan: [{ id: 1, tema: 'light', warna: '#f97316', font: '"Google Sans", sans-serif', ukuranFont: 20, ukuranFontBottomNav: 10, background: '#f8fafc', appIcon: '', appName: 'Dompet PJLP', presetTema: 'custom', templateGrid: '', bottomNav: ['Riwayat Absensi', 'Laporan Kerja', 'Foto Edit', 'Laporan CRM Internal'] }]
                            }
                        })
                    });
                } else if (d.users && d.users.length > 0) {
                    setUsers(d.users);
                }

                if (d.timeSlots && d.timeSlots.length > 0) setTimeSlots(d.timeSlots);
                if (d.absensi) setAbsensi(d.absensi.sort((a,b) => b.id - a.id));
                if (d.cuti) setCuti(d.cuti.sort((a,b) => b.id - a.id));
                if (d.penilaian) setPenilaian(d.penilaian.sort((a,b) => b.id - a.id));
                if (d.informasi) setInformasi(d.informasi.sort((a,b) => b.id - a.id));
                if (d.bankSampah) setBankSampah(d.bankSampah.sort((a,b) => b.id - a.id));
                if (d.dokumen) setDokumen(d.dokumen.sort((a,b) => b.id - a.id));
                if (d.paguyuban) setPaguyuban(d.paguyuban.sort((a,b) => b.id - a.id));
                if (d.laporanKerja) setLaporanKerja(d.laporanKerja.sort((a,b) => b.id - a.id));
                if (d.crmInternal) setCrmInternal(d.crmInternal.sort((a,b) => b.id - a.id));
                if (d.pengaturanLokasi && d.pengaturanLokasi.length > 0) setGpsSettings(d.pengaturanLokasi);
                if (d.pengaturanTampilan && d.pengaturanTampilan.length > 0) setPengaturanTampilan(d.pengaturanTampilan);
                if (d.jadwalKerja) setJadwalKerja(d.jadwalKerja);
                if (d.gaji) setGaji(d.gaji);
                if (d.chatMessages) setChatMessages(d.chatMessages);
            }
        } catch (err) {
            console.warn('Gagal mengambil data dari Spreadsheet:', err);
        }
        setIsSyncing(false);
    }, [gasUrl]);

    useEffect(() => {
        if (gasUrl && gasUrl.startsWith('https://script.google.com')) {
            fetchAllFromSpreadsheet(gasUrl);
            const interval = setInterval(() => fetchAllFromSpreadsheet(gasUrl), 15000);
            return () => clearInterval(interval);
        }
    }, [gasUrl, fetchAllFromSpreadsheet]);

    const handleSetupGasUrl = async () => {
        const { value: newUrl } = await window.Swal.fire({
            title: 'Hubungkan Google Spreadsheet',
            html: '<p style="font-size:12px;color:#64748b;margin-bottom:8px;">Tempelkan <b>URL Web App</b> dari Google Apps Script Anda (wajib berakhiran <b>/exec</b> dan akses disetel ke <b>Siapa saja / Anyone</b>):</p>',
            input: 'url',
            inputValue: gasUrl,
            inputPlaceholder: 'https://script.google.com/macros/s/AKfycb.../exec',
            showCancelButton: true,
            confirmButtonText: 'Simpan & Hubungkan',
            confirmButtonColor: '#f97316'
        });
        if (newUrl) {
            const cleanUrl = newUrl.trim();
            if (!cleanUrl.startsWith('https://script.google.com') || !cleanUrl.endsWith('/exec')) {
                return window.Swal.fire('URL Tidak Valid', 'Pastikan URL diawali https://script.google.com dan diakhiri dengan /exec (bukan /dev).', 'error');
            }
            localStorage.setItem('dompet_pjlp_gas_url', cleanUrl);
            setGasUrl(cleanUrl);
            hasSeededRef.current = false;
            await fetchAllFromSpreadsheet(cleanUrl);
            window.Swal.fire('Berhasil Terhubung!', 'Seluruh data kini otomatis tersimpan ke Google Spreadsheet & Drive Anda.', 'success');
        }
    };

    // Operasi CRUD dengan Penanganan Redirect Google Apps Script & Peringatan jika URL belum diisi
    const dbOps = useMemo(() => {
        const sendToGas = async (payload, setter, fallbackId) => {
            if (!gasUrl || !gasUrl.startsWith('https://script.google.com')) {
                window.Swal.fire({
                    icon: 'warning',
                    title: 'URL Spreadsheet Belum Diatur!',
                    text: 'Data baru saja disimpan di layar sementara. Agar masuk ke Google Spreadsheet & Drive, silakan masukkan URL Web App (/exec) Anda.',
                    confirmButtonText: 'Atur URL Sekarang',
                    showCancelButton: true
                }).then(r => { if (r.isConfirmed) handleSetupGasUrl(); });
                return;
            }
            setIsSyncing(true);
            try {
                const res = await fetch(gasUrl, {
                    method: 'POST',
                    redirect: 'follow',
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify(payload)
                });
                const text = await res.text();
                const json = JSON.parse(text);
                if (json.status === 'success' && json.data && setter) {
                    setter(prev => prev.map(item => String(item.id) === String(fallbackId) ? json.data : item));
                } else if (json.status === 'error') {
                    window.Swal.fire('Gagal Menyimpan ke Spreadsheet', json.message || 'Terjadi kesalahan pada Google Script', 'error');
                }
            } catch (e) {
                console.error('Error sinkronisasi Spreadsheet:', e);
                window.Swal.fire({
                    toast: true, position: 'top-end', icon: 'error',
                    title: 'Gagal terhubung ke Spreadsheet. Cek izin Deploy Anyone (/exec).',
                    showConfirmButton: false, timer: 4000
                });
            }
            setIsSyncing(false);
        };

        return {
            add: async (col, data) => {
                const setter = getSetter(col);
                if (setter) setter(prev => [data, ...prev.filter(item => String(item.id) !== String(data.id))]);
                await sendToGas({ action: 'add', collection: col, id: data.id, data }, setter, data.id);
            },
            update: async (col, id, data) => {
                const setter = getSetter(col);
                if (setter) setter(prev => prev.map(item => String(item.id) === String(id) ? { ...item, ...data } : item));
                await sendToGas({ action: 'update', collection: col, id, data }, setter, id);
            },
            remove: async (col, id) => {
                const setter = getSetter(col);
                if (setter) setter(prev => prev.filter(item => String(item.id) !== String(id)));
                await sendToGas({ action: 'remove', collection: col, id }, null, id);
            }
        };
    }, [gasUrl]);

    const changeTab = React.useCallback((tabName) => {
        if (activeTab !== tabName) {
            setActiveTab(tabName);
            try { window.history.pushState({ tab: tabName }, '', `?tab=${encodeURIComponent(tabName)}`); } catch (e) {}
        }
    }, [activeTab]);

    const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('dompet_pjlp_user'); setActiveTab(''); };
    const handleLogin = (u) => { setCurrentUser(u); localStorage.setItem('dompet_pjlp_user', JSON.stringify(u)); setActiveTab(u.role === 'admin' ? 'Live Absensi' : 'Absensi'); };
    const handleUpdateProfile = (id, data) => dbOps.update('users', id, data);

    const userTabs = [ { name: 'Absensi', icon: 'fa-clipboard-user' }, { name: 'Riwayat Absensi', icon: 'fa-clock-rotate-left' }, { name: 'Laporan Kerja', icon: 'fa-briefcase' }, { name: 'Laporan CRM Internal', icon: 'fa-handshake' }, { name: 'Foto Edit', icon: 'fa-images' }, { name: 'Pengajuan Cuti', icon: 'fa-calendar-alt' }, { name: 'Gaji PJLP', icon: 'fa-money-bill-wave' }, { name: 'Jadwal Kerja', icon: 'fa-calendar-days' }, { name: 'Dokumen Saya', icon: 'fa-folder-open' }, { name: 'Bank Sampah', icon: 'fa-recycle' }, { name: 'Penilaian', icon: 'fa-star' }, { name: 'Paguyuban', icon: 'fa-users' }, { name: 'Informasi', icon: 'fa-bullhorn' }, { name: 'Kelompok Kerja', icon: 'fa-users-viewfinder' }, { name: 'Profil Saya', icon: 'fa-id-badge' } ];
    let myTabs = [];
    if (currentUser) {
        if (currentUser.role === 'admin') myTabs = ADMIN_FEATURES;
        else if (currentUser.role === 'sub_admin') {
            const p = ADMIN_FEATURES.filter(t => (currentUser.permissions || []).includes(t.name));
            myTabs = [...userTabs];
            if (p.length > 0) { myTabs.push({ isDivider: true, label: 'MENU ADMIN TERBATAS' }); myTabs = [...myTabs, ...p]; }
        } else myTabs = userTabs;
    }

    const currentTampilan = pengaturanTampilan.length > 0 ? pengaturanTampilan[0] : { tema: 'light', warna: '#f97316', font: '"Google Sans", sans-serif', ukuranFont: 20, ukuranFontBottomNav: 10, background: '#f8fafc', appIcon: '', appName: 'Dompet PJLP', presetTema: 'custom', templateGrid: '', bottomNav: ['Riwayat Absensi', 'Laporan Kerja', 'Foto Edit', 'Laporan CRM Internal'] };
    const hiddenMenusGlobal = currentTampilan.hiddenMenus || [];
    if (hiddenMenusGlobal.length > 0) {
        myTabs = myTabs.filter(t => t.isDivider || !hiddenMenusGlobal.includes(t.name));
    }

    // Pengaturan Skala & Tema Dinamis agar Tampilan Fleksibel dan Halus
    useEffect(() => {
        document.documentElement.style.fontSize = (currentTampilan.globalScale || 16) + 'px';
    }, [currentTampilan.globalScale]);

    let bgStyleStr = `background-color: ${currentTampilan.background || '#f8fafc'} !important;`;
    if (currentTampilan.background && (currentTampilan.background.includes('url') || currentTampilan.background.includes('gradient'))) {
        bgStyleStr = `background-image: ${currentTampilan.background} !important; background-size: cover; background-attachment: fixed;`;
    }

    // Lencana Notifikasi (Badge Angka Merah)
    const currentCounts = useMemo(() => {
        const counts = {};
        if (!currentUser) return counts;
        const isAdmin = currentUser.role === 'admin' || currentUser.role === 'sub_admin';
        if (isAdmin) {
            counts['Live Absensi'] = absensi.filter(a => String(a.tanggal) === getTodayDate()).length;
            counts['Rekap Absen'] = absensi.length;
            counts['Data Laporan Kerja'] = laporanKerja.length;
            counts['Laporan CRM Internal'] = crmInternal.length;
            counts['Persetujuan Cuti'] = cuti.length;
            counts['Data Dokumen User'] = dokumen.length;
            counts['Kelola Bank Sampah'] = bankSampah.length;
            counts['Kelola Paguyuban'] = paguyuban.length;
            counts['Kelola Penilaian'] = penilaian.length;
            counts['Kelola Informasi'] = informasi.length;
            counts['Kelola User'] = users.length;
            counts['Jadwal Kerja'] = jadwalKerja.length;
            counts['Gaji PJLP'] = gaji.length;
        } else {
            counts['Laporan CRM Internal'] = crmInternal.filter(c => String(c.id_user) === String(currentUser.id)).length;
            counts['Pengajuan Cuti'] = cuti.filter(c => String(c.id_user) === String(currentUser.id)).length;
            counts['Dokumen Saya'] = dokumen.filter(d => String(d.id_user) === String(currentUser.id)).length;
            counts['Gaji PJLP'] = gaji.filter(g => String(g.id_user) === String(currentUser.id)).length;
            counts['Jadwal Kerja'] = jadwalKerja.filter(j => String(j.id_user) === String(currentUser.id)).length;
            counts['Penilaian'] = penilaian.filter(p => String(p.id_user) === String(currentUser.id)).length;
            counts['Bank Sampah'] = bankSampah.filter(b => String(b.id_user) === String(currentUser.id)).length;
            counts['Paguyuban'] = paguyuban.filter(p => String(p.id_user) === String(currentUser.id) || p.id_user === 'all').length;
            counts['Informasi'] = informasi.length;
        }
        return counts;
    }, [currentUser, absensi, laporanKerja, cuti, dokumen, bankSampah, paguyuban, penilaian, crmInternal, gaji, jadwalKerja, informasi, users]);

    useEffect(() => {
        if (currentUser && activeTab) {
            setLastSeenCounts(prev => {
                const currentVal = currentCounts[activeTab] || 0;
                if (prev[activeTab] !== currentVal) {
                    const updated = { ...prev, [activeTab]: currentVal };
                    localStorage.setItem('dompet_pjlp_last_seen_' + currentUser.id, JSON.stringify(updated));
                    return updated;
                }
                return prev;
            });
        }
    }, [activeTab, currentCounts, currentUser]);

    const tabsWithBadges = myTabs.map(tab => {
        if (tab.isDivider) return tab;
        let badge = 0;
        if (tab.name !== activeTab) {
            const cCount = currentCounts[tab.name] || 0;
            const lsCount = lastSeenCounts[tab.name] || 0;
            if (cCount > lsCount) badge = cCount - lsCount;
        }
        return { ...tab, badge };
    });

    useEffect(() => {
        if (currentUser && !activeTab) setActiveTab(currentUser.role === 'admin' ? 'Live Absensi' : 'Absensi');
    }, [currentUser, activeTab]);

    let sisaCutiUser = currentUser ? (currentUser.jumlah_hak_cuti !== undefined ? Number(currentUser.jumlah_hak_cuti) : 12) : 12;
    if (currentUser) {
        const m = cuti.filter(c => String(c.id_user) === String(currentUser.id) && (c.status === 'Menunggu' || c.status === 'Revisi'));
        m.forEach(c => { if(c.tanggal_cuti) sisaCutiUser -= String(c.tanggal_cuti || '').split(',').length; });
    }

    const allData = { users, timeSlots, absensi, cuti, penilaian, informasi, bankSampah, dokumen, paguyuban, laporanKerja, pengaturanLokasi: gpsSettings, crmInternal, pengaturanTampilan, jadwalKerja, gaji };

    return (
        <>
            <style>
                {`
                    body, .min-h-screen, .flex.h-screen.bg-slate-50 {
                        font-family: ${currentTampilan.font || '"Google Sans", sans-serif'} !important;
                        font-size: ${currentTampilan.ukuranFont || 20}px !important;
                        ${bgStyleStr}
                        ${currentTampilan.tema === 'dark' ? 'color: #f1f5f9 !important;' : ''}
                    }
                    .bg-orange-500, .bg-orange-600 { background-color: ${currentTampilan.warna || '#f97316'} !important; }
                    .text-orange-500, .text-orange-600 { color: ${currentTampilan.warna || '#f97316'} !important; }
                    .border-orange-500 { border-color: ${currentTampilan.warna || '#f97316'} !important; }
                    .btn-primary { background-color: ${currentTampilan.warna || '#f97316'} !important; box-shadow: 0 4px 12px ${currentTampilan.warna || '#f97316'}40 !important; }
                    
                    ${currentTampilan.tema === 'dark' ? 
                        ".card, .bg-white, .bg-slate-50, aside, header, .modal-animate { background-color: #1e293b !important; border-color: #334155 !important; color: #f1f5f9 !important; } " +
                        ".text-slate-800, .text-slate-700, .text-slate-600 { color: #f1f5f9 !important; } " +
                        ".text-slate-500, .text-slate-400 { color: #cbd5e1 !important; } " +
                        ".border-slate-100, .border-slate-200, .border-b { border-color: #334155 !important; } " +
                        ".input-style { background-color: #0f172a !important; color: #f1f5f9 !important; border-color: #334155 !important; }" 
                    : ""}
                `}
            </style>
            {!currentUser ? (
                <Login users={users} onLogin={handleLogin} appIcon={currentTampilan.appIcon} appName={currentTampilan.appName} onSetupUrl={handleSetupGasUrl} />
            ) : (
                <DashboardLayout user={currentUser} onLogout={handleLogout} tabs={tabsWithBadges} activeTab={activeTab} setActiveTab={changeTab} onUpdateProfile={handleUpdateProfile} isSyncing={isSyncing} sisaCuti={sisaCutiUser} appIcon={currentTampilan.appIcon} appName={currentTampilan.appName} bottomNav={currentTampilan.bottomNav} bottomNavFontSize={currentTampilan.ukuranFontBottomNav} onRefresh={() => isConnected ? fetchAllFromSpreadsheet(gasUrl) : handleSetupGasUrl()} isConnected={isConnected}>
                    {activeTab === 'Live Absensi' && <AdminLiveAbsensi absensi={absensi} users={users} laporanKerja={laporanKerja} crmInternal={crmInternal} />}
                    {activeTab === 'Kelola User' && <AdminUsers users={users} dbOps={dbOps} adminFeatures={ADMIN_FEATURES} />}
                    {activeTab === 'Database & Backup' && <AdminDatabase allData={allData} dbOps={dbOps} gasUrl={gasUrl} onChangeGasUrl={handleSetupGasUrl} />}
                    {activeTab === 'Pengaturan Waktu' && <AdminTimeSlots timeSlots={timeSlots} dbOps={dbOps} users={users.filter(u=>u.role!=='admin')} />}
                    {activeTab === 'Pengaturan Lokasi' && <AdminLokasi gpsSettings={gpsSettings} dbOps={dbOps} />}
                    {activeTab === 'Pengaturan Tampilan' && <AdminTampilan tampilanSettings={pengaturanTampilan} dbOps={dbOps} />}
                    {activeTab === 'Rekap Absen' && <RiwayatAbsensi absensi={absensi} isUser={false} dbOps={dbOps} />}
                    {activeTab === 'Data Laporan Kerja' && <AdminLaporanKerja laporanKerja={laporanKerja} users={users} dbOps={dbOps} />}
                    {activeTab === 'Persetujuan Cuti' && <AdminCuti cuti={cuti} dbOps={dbOps} users={users} absensi={absensi} />}
                    {activeTab === 'Kelola Penilaian' && <AdminPenilaian users={users.filter(u=>u.role!=='admin')} penilaian={penilaian} dbOps={dbOps} currentUser={currentUser} />}
                    {activeTab === 'Kelola Informasi' && <AdminInformasi informasi={informasi} dbOps={dbOps} currentUser={currentUser} />}
                    {activeTab === 'Kelola Bank Sampah' && <AdminBankSampah users={users.filter(u=>u.role!=='admin')} bankSampah={bankSampah} dbOps={dbOps} currentUser={currentUser} />}
                    {activeTab === 'Data Dokumen User' && <AdminDokumen dokumen={dokumen} dbOps={dbOps} />}
                    {activeTab === 'Kelola Paguyuban' && <AdminPaguyuban users={users.filter(u=>u.role!=='admin')} paguyuban={paguyuban} dbOps={dbOps} currentUser={currentUser} />}
                    {activeTab === 'Kelola Kelompok Kerja' && <AdminKelompokKerja users={users} dbOps={dbOps} />}
                    {activeTab === 'Laporan CRM Internal' && (currentUser.role === 'admin' || currentUser.role === 'sub_admin') && <AdminCRM users={users.filter(u=>u.role!=='admin')} crmInternal={crmInternal} dbOps={dbOps} />}
                    {activeTab === 'Jadwal Kerja' && (currentUser.role === 'admin' || currentUser.role === 'sub_admin') && <AdminJadwalKerja users={users} jadwalKerja={jadwalKerja} dbOps={dbOps} />}
                    {activeTab === 'Gaji PJLP' && (currentUser.role === 'admin' || currentUser.role === 'sub_admin') && <AdminGaji users={users.filter(u=>u.role!=='admin')} gaji={gaji} dbOps={dbOps} />}
                    
                    {activeTab === 'Absensi' && <UserAbsensi user={currentUser} absensi={absensi} dbOps={dbOps} timeSlots={timeSlots} gpsSettings={gpsSettings} laporanKerja={laporanKerja} crmInternal={crmInternal} bankSampah={bankSampah} jadwalKerja={jadwalKerja} />}
                    {activeTab === 'Riwayat Absensi' && <RiwayatAbsensi absensi={absensi.filter(a => String(a.id_user) === String(currentUser.id))} isUser={true} dbOps={dbOps} />}
                    {activeTab === 'Kelompok Kerja' && <UserKelompokKerja user={currentUser} users={users} />}
                    {activeTab === 'Laporan Kerja' && <UserLaporanKerja user={currentUser} laporanKerja={laporanKerja} dbOps={dbOps} users={users} />}
                    {activeTab === 'Foto Edit' && <UserFotoEdit user={currentUser} templateGrid={currentTampilan.templateGrid} />}
                    {activeTab === 'Pengajuan Cuti' && <UserCuti user={currentUser} cuti={cuti} dbOps={dbOps} />}
                    {activeTab === 'Penilaian' && <UserPenilaian penilaian={penilaian.filter(p => String(p.id_user) === String(currentUser.id))} user={currentUser} />}
                    {activeTab === 'Informasi' && <UserInformasi informasi={informasi} />}
                    {activeTab === 'Bank Sampah' && <UserBankSampah user={currentUser} bankSampah={bankSampah.filter(b => String(b.id_user) === String(currentUser.id))} />}
                    {activeTab === 'Dokumen Saya' && <UserDokumen user={currentUser} dokumen={dokumen.filter(d => String(d.id_user) === String(currentUser.id))} dbOps={dbOps} />}
                    {activeTab === 'Paguyuban' && <UserPaguyuban paguyuban={paguyuban} user={currentUser} />}
                    {activeTab === 'Laporan CRM Internal' && currentUser.role === 'user' && <UserCRM user={currentUser} crmInternal={crmInternal} dbOps={dbOps} />}
                    {activeTab === 'Jadwal Kerja' && currentUser.role === 'user' && <UserJadwalKerja user={currentUser} jadwalKerja={jadwalKerja} absensi={absensi} />}
                    {activeTab === 'Gaji PJLP' && currentUser.role === 'user' && <UserGaji user={currentUser} gaji={gaji} />}
                    {activeTab === 'Profil Saya' && <UserProfil user={currentUser} dbOps={dbOps} />}
                </DashboardLayout>
            )}
        </>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);