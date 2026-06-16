import sys
import asyncio

if sys.platform == 'win32':
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception:
        pass

# pyrefly: ignore [missing-import]
import streamlit as st
import pandas as pd

st.set_page_config(page_title="IP & IPK Predictor", layout="wide")

# Styling tambahan agar lebih modern dan clean
st.markdown("""
<style>
    .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
        max-width: 900px;
    }
    h1 {
        font-weight: 600;
        letter-spacing: -0.5px;
        margin-bottom: 0.5rem;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
    }
    .stTabs [data-baseweb="tab"] {
        padding-left: 1rem;
        padding-right: 1rem;
        border-radius: 6px 6px 0px 0px;
    }
    /* Simple styling for the config total box */
    .total-sks-box {
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        padding: 15px 20px;
        border-radius: 8px;
        display: inline-block;
        margin-top: 10px;
    }
</style>
""", unsafe_allow_html=True)

st.title("IP & IPK Predictor")

# Sidebar untuk data global
with st.sidebar:
    st.markdown("### Riwayat Akademik")
    ipk_sebelumnya = st.number_input("IPK Saat Ini (Sem 1-5)", min_value=0.0, max_value=4.0, value=3.50, step=0.01)
    sks_sebelumnya = st.number_input("Total SKS Lulus (Sem 1-5)", min_value=0, value=102, step=1)
    
    st.markdown("---")
    st.markdown("### Target")
    target_ipk = st.number_input("Target IPK Kelulusan", min_value=0.0, max_value=4.0, value=3.80, step=0.01)

# Skala Penilaian
GRADE_MAP = {
    "A": 4.0, "AB": 3.5, "B": 3.0, "BC": 2.5,
    "C": 2.0, "D": 1.0, "E": 0.0
}

def get_grade(score):
    if score >= 85: return "A"
    elif score >= 80: return "AB"
    elif score >= 75: return "B"
    elif score >= 70: return "BC"
    elif score >= 60: return "C"
    elif score >= 50: return "D"
    else: return "E"

courses = {
    "Analitik Bisnis Lanjut (ABL)": {"sks": 2, "components": {"Keaktifan": 0.10, "Tugas": 0.15, "UTS": 0.25, "Laporan Akhir": 0.25, "Presentasi": 0.25}},
    "Pembelajaran Mesin (ML)": {"sks": 3, "components": {"Quiz": 0.10, "Tugas": 0.10, "UTS": 0.25, "UAS": 0.25, "Praktikum": 0.25, "Diskusi Kelompok": 0.05}},
    "Kriptografi": {"sks": 2, "components": {"Kuis": 0.18, "Tugas Individu": 0.12, "Tugas Kelompok": 0.10, "UTS": 0.30, "UAS": 0.30}},
    "Pemodelan Stokastik": {"sks": 3, "components": {"Partisipasi/Kuis": 0.06, "Tugas": 0.17, "Praktik": 0.23, "Presentasi": 0.06, "UTS": 0.21, "UAS": 0.21, "Tugas Kelompok": 0.06}},
    "Metodologi Penelitian": {"sks": 2, "components": {"Keaktifan": 0.10, "Tugas": 0.25, "Presentasi": 0.20, "Laporan Akhir": 0.25, "UTS": 0.10, "UAS": 0.10}},
    "Karier, Etika, dan Kewirausahaan (KEK)": {"sks": 2, "components": {"Modul 1-10": 0.40, "Sumatif": 0.06, "Sikap": 0.04, "Aktivitas WEN": 0.50}},
    "Analisis Big Data (ABD)": {"sks": 3, "components": {"Kehadiran/Kuis": 0.07, "Tugas": 0.11, "Praktik": 0.31, "Presentasi": 0.10, "UTS": 0.15, "Tugas Kelompok": 0.11, "UAS": 0.15}},
    "Analisis Deret Waktu (ADW)": {"sks": 3, "components": {"Kehadiran/Kuis": 0.13, "Tugas": 0.14, "Praktik": 0.16, "Presentasi": 0.11, "UTS": 0.16, "UAS": 0.16, "Tugas Kelompok": 0.14}},
    "Visualisasi Data Interaktif (VDI)": {"sks": 3, "components": {"Partisipasi": 0.15, "Tugas": 0.11, "Praktik": 0.15, "UTS": 0.25, "UAS": 0.25, "Tugas Kelompok": 0.09}},
}

tab_config, tab1, tab2 = st.tabs(["Mata Kuliah", "Kalkulator Nilai", "Simulasi IPK"])

with tab_config:
    st.markdown("##### Pemilihan Mata Kuliah Semester Ini")
    st.caption("Pilih daftar mata kuliah yang Anda ambil. Penyesuaian ini akan langsung memengaruhi kalkulator dan total SKS Anda.")
    st.write("")
    
    active_courses = []
    
    col_c1, col_c2 = st.columns(2)
    for i, (course_name, data) in enumerate(courses.items()):
        col = col_c1 if i % 2 == 0 else col_c2
        if col.checkbox(f"{course_name} — {data['sks']} SKS", value=True, key=f"chk_{course_name}"):
            active_courses.append(course_name)
            
    active_sks = sum(courses[c]["sks"] for c in active_courses)
    
    st.write("")
    st.markdown(f"""
    <div class="total-sks-box">
        <span style="color: #666; font-size: 14px;">Total Beban SKS Semester Ini:</span><br>
        <span style="color: #111; font-size: 20px; font-weight: 600;">{active_sks} SKS</span>
    </div>
    """, unsafe_allow_html=True)


with tab1:
    st.markdown("##### Hitung Prediksi Nilai Akhir")
    
    if not active_courses:
        st.info("Silakan pilih minimal satu mata kuliah pada tab 'Mata Kuliah'.")
    else:
        st.caption("Masukkan estimasi nilai untuk masing-masing komponen evaluasi mata kuliah.")
        
        selected_course = st.selectbox("Mata Kuliah", active_courses, label_visibility="collapsed")
        data = courses[selected_course]
        
        st.write("")
        cols = st.columns(min(len(data['components']), 4))
        final_score = 0
        
        comp_idx = 0
        for comp_name, weight in data['components'].items():
            with cols[comp_idx % 4]:
                val = st.number_input(
                    f"{comp_name} ({int(weight*100)}%)", 
                    min_value=0.0, max_value=100.0, value=85.0, step=1.0, 
                    key=f"tab1_{selected_course}_{comp_name}"
                )
                final_score += val * weight
            comp_idx += 1
            
        grade_letter = get_grade(final_score)
        grade_point = GRADE_MAP[grade_letter]
        
        st.write("")
        st.write("---")
        res_col1, res_col2, res_col3 = st.columns(3)
        res_col1.metric("Skor Akhir", f"{final_score:.2f}")
        res_col2.metric("Indeks", grade_letter)
        res_col3.metric("Bobot", f"{grade_point:.2f}")


with tab2:
    st.markdown("##### Skenario Kelulusan Semester 6")
    
    if not active_courses:
        st.info("Silakan pilih minimal satu mata kuliah pada tab 'Mata Kuliah'.")
    else:
        st.caption("Tentukan target indeks untuk setiap mata kuliah, lalu lihat bagaimana pengaruhnya terhadap IPK.")
        
        st.write("")
        
        cols_matkul = st.columns(3)
        idx = 0
        total_sks_sem6 = 0
        total_bobot_sem6 = 0
        results = []
        
        for course_name in active_courses:
            data = courses[course_name]
            with cols_matkul[idx % 3]:
                selected_grade = st.selectbox(
                    f"{course_name} ({data['sks']} SKS)", 
                    list(GRADE_MAP.keys()), 
                    index=0, 
                    key=f"tab2_{course_name}"
                )
                grade_point = GRADE_MAP[selected_grade]
                
                total_sks_sem6 += data['sks']
                total_bobot_sem6 += grade_point * data['sks']
                
                results.append({
                    "Mata Kuliah": course_name,
                    "SKS": data['sks'],
                    "Indeks": selected_grade,
                    "Bobot": grade_point,
                    "Total Poin": grade_point * data['sks']
                })
            idx += 1
            
        ip_sem6 = total_bobot_sem6 / total_sks_sem6 if total_sks_sem6 > 0 else 0
        total_sks_all = sks_sebelumnya + total_sks_sem6
        total_bobot_all = (ipk_sebelumnya * sks_sebelumnya) + total_bobot_sem6
        ipk_baru = total_bobot_all / total_sks_all if total_sks_all > 0 else 0

        st.write("---")
        
        st.markdown("##### Proyeksi Hasil")
        metric_col1, metric_col2 = st.columns(2)
        metric_col1.metric(f"IP Semester 6 ({total_sks_sem6} SKS)", f"{ip_sem6:.2f}")
        metric_col2.metric(f"IPK Kumulatif ({total_sks_all} SKS)", f"{ipk_baru:.2f}", delta=f"{ipk_baru - ipk_sebelumnya:.2f}")

        st.write("")
        
        # Validasi pembagian untuk SKS Semester 6 agar tidak error jika 0
        if total_sks_sem6 > 0:
            ip_sem6_needed = ((target_ipk * total_sks_all) - (ipk_sebelumnya * sks_sebelumnya)) / total_sks_sem6
            if ip_sem6_needed > 4.0:
                st.error(f"Target IPK {target_ipk} tidak realistis karena membutuhkan IP Semester 6 sebesar {ip_sem6_needed:.2f} (maksimal 4.00).", icon="⚠️")
            else:
                st.info(f"Untuk mencapai IPK {target_ipk}, Anda membutuhkan minimal IP Semester 6 sebesar **{ip_sem6_needed:.2f}**.", icon="🎯")
        else:
            st.warning("Tambahkan minimal 1 SKS untuk melihat perhitungan target IPK.")
            
        st.write("")
        with st.expander("Detail Poin Semester 6"):
            st.dataframe(pd.DataFrame(results), use_container_width=True, hide_index=True)

# Keterangan skala diletakkan halus di bawah sebagai footer
st.markdown("""
<div style='text-align: center; color: #999; font-size: 13px; margin-top: 60px; padding-top: 20px; border-top: 1px solid #eee;'>
    Skala Indeks: A (85-100) • AB (80-84.99) • B (75-79.99) • BC (70-74.99) • C (60-69.99) • D (50-59.99) • E (0-49.99)
</div>
""", unsafe_allow_html=True)
