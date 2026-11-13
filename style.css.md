/* ============================================================================
   STYLE.CSS - DESAIN, KOMPONEN, DAN ANIMASI FLEKSIBEL DOMPET PJLP
   ============================================================================ */

body {
    font-family: 'Google Sans', sans-serif;
    font-size: 20px;
    background-color: #f8fafc;
    color: #334155;
    overflow-x: hidden;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

/* Custom Scrollbar Halus */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
}

/* Pengaturan Cetak Print / PDF */
@media print {
    body * {
        visibility: hidden;
    }
    #printable-area, #printable-area * {
        visibility: visible;
    }
    #printable-area {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
    }
    .no-print {
        display: none !important;
    }
}

/* Kalender Interaktif */
.calendar-day.selected {
    background-color: #f97316 !important;
    color: #fff !important;
    border: none !important;
    font-weight: 700 !important;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3) !important;
    transform: translateY(-2px) !important;
}

/* Animasi Modal & Halaman */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: scale(0.95) translateY(10px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

.modal-animate {
    animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
}

/* Desain Kartu (Card) Fleksibel & Interaktif */
.card {
    background-color: #fff !important;
    border-radius: 1.5rem !important;
    border: 1px solid #f1f5f9 !important;
    box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.03) !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.card:hover {
    transform: translateY(-4px) !important;
    box-shadow: 0 16px 30px -5px rgba(0, 0, 0, 0.08) !important;
}

/* Desain Input Form */
.input-style {
    width: 100% !important;
    padding: 0.875rem 1.25rem !important;
    border: 1px solid #e2e8f0 !important;
    border-radius: 1rem !important;
    background-color: #f8fafc !important;
    font-size: 0.875rem !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    outline: 0 !important;
    color: #334155 !important;
}

.input-style:focus {
    background-color: #fff !important;
    border-color: #f97316 !important;
    box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.05), 0 0 0 4px rgba(249, 115, 22, 0.15) !important;
    transform: translateY(-2px) !important;
}

/* Desain Tombol Utama & Sekunder */
.btn-primary {
    background-color: #f97316 !important;
    color: #fff !important;
    padding: 0.875rem 1.5rem !important;
    border-radius: 1rem !important;
    font-weight: 600 !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    cursor: pointer !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25) !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.btn-primary:hover {
    background-color: #ea580c !important;
    transform: translateY(-3px) !important;
    box-shadow: 0 12px 24px -4px rgba(249, 115, 22, 0.35) !important;
}

.btn-primary:active {
    transform: translateY(0) !important;
    box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2) !important;
}

.btn-secondary {
    background-color: #fff !important;
    color: #475569 !important;
    padding: 0.875rem 1.5rem !important;
    border-radius: 1rem !important;
    font-weight: 600 !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
    cursor: pointer !important;
    border: 1px solid #e2e8f0 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03) !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
}

.btn-secondary:hover {
    background-color: #f8fafc !important;
    color: #0f172a !important;
    border-color: #cbd5e1 !important;
    transform: translateY(-3px) !important;
    box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.08) !important;
}

.btn-secondary:active {
    transform: translateY(0) !important;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02) !important;
}

/* Layar Loading Awal (Skeleton) */
.loading-screen {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #f8fafc;
}

.loading-logo-box {
    width: 5rem;
    height: 5rem;
    background-color: #fff;
    border-radius: 1.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 2rem;
    border: 1px solid #f1f5f9;
    animation: dompetBounce 1s infinite;
}

.loading-spinner {
    width: 3rem;
    height: 3rem;
    border: 4px solid #f97316;
    border-top-color: transparent;
    border-radius: 50%;
    animation: dompetSpin 1s linear infinite;
    margin-bottom: 1.25rem;
}

.loading-title {
    font-weight: 800;
    color: #1e293b;
    font-size: 1.5rem;
    font-family: 'Google Sans', sans-serif;
}

.loading-subtitle {
    font-weight: 700;
    color: #64748b;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    background-color: #e2e8f0;
    padding: 0.375rem 1rem;
    border-radius: 9999px;
    animation: dompetPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    font-family: 'Google Sans', sans-serif;
}

@keyframes dompetBounce {
    0%, 100% {
        transform: translateY(-25%);
        animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
    }
    50% {
        transform: none;
        animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
    }
}

@keyframes dompetSpin {
    to {
        transform: rotate(360deg);
    }
}

@keyframes dompetPulse {
    50% {
        opacity: 0.5;
    }
}