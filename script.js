const GRADE_MAP = {
    "A": 4.0, "AB": 3.5, "B": 3.0, "BC": 2.5,
    "C": 2.0, "D": 1.0, "E": 0.0
};

const courses = {
    "Analitik Bisnis Lanjut (ABL)": { sks: 2, components: {"Keaktifan": 0.10, "Tugas": 0.15, "UTS": 0.25, "Laporan Akhir": 0.25, "Presentasi": 0.25} },
    "Pembelajaran Mesin (ML)": { sks: 3, components: {"Quiz": 0.10, "Tugas": 0.10, "UTS": 0.25, "UAS": 0.25, "Praktikum": 0.25, "Diskusi Kelompok": 0.05} },
    "Kriptografi": { sks: 2, components: {"Kuis": 0.18, "Tugas Individu": 0.12, "Tugas Kelompok": 0.10, "UTS": 0.30, "UAS": 0.30} },
    "Pemodelan Stokastik": { sks: 3, components: {"Partisipasi/Kuis": 0.06, "Tugas": 0.17, "Praktik": 0.23, "Presentasi": 0.06, "UTS": 0.21, "UAS": 0.21, "Tugas Kelompok": 0.06} },
    "Metodologi Penelitian": { sks: 2, components: {"Keaktifan": 0.10, "Tugas": 0.25, "Presentasi": 0.20, "Laporan Akhir": 0.25, "UTS": 0.10, "UAS": 0.10} },
    "Karier, Etika, dan Kewirausahaan (KEK)": { sks: 2, components: {"Modul 1-10": 0.40, "Sumatif": 0.06, "Sikap": 0.04, "Aktivitas WEN": 0.50} },
    "Analisis Big Data (ABD)": { sks: 3, components: {"Kehadiran/Kuis": 0.07, "Tugas": 0.11, "Praktik": 0.31, "Presentasi": 0.10, "UTS": 0.15, "Tugas Kelompok": 0.11, "UAS": 0.15} },
    "Analisis Deret Waktu (ADW)": { sks: 3, components: {"Kehadiran/Kuis": 0.13, "Tugas": 0.14, "Praktik": 0.16, "Presentasi": 0.11, "UTS": 0.16, "UAS": 0.16, "Tugas Kelompok": 0.14} },
    "Visualisasi Data Interaktif (VDI)": { sks: 3, components: {"Partisipasi": 0.15, "Tugas": 0.11, "Praktik": 0.15, "UTS": 0.25, "UAS": 0.25, "Tugas Kelompok": 0.09} },
};

let activeCourseKeys = Object.keys(courses);
let simGrades = {};

function getGrade(score) {
    if (score >= 75) return "A";
    if (score >= 70) return "AB";
    if (score >= 65) return "B";
    if (score >= 60) return "BC";
    if (score >= 50) return "C";
    if (score >= 40) return "D";
    return "E";
}

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initCheckboxes();
    initCalcSelect();
    initSimSelects();
    
    // Global inputs listener
    document.querySelectorAll('.sidebar input').forEach(input => {
        input.addEventListener('input', updateSim);
    });
});

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            e.target.classList.add('active');
            document.getElementById('tab-' + e.target.dataset.tab).classList.add('active');
        });
    });
}

function initCheckboxes() {
    const container = document.getElementById('course-checkboxes');
    container.innerHTML = '';
    
    Object.entries(courses).forEach(([name, data]) => {
        const label = document.createElement('label');
        label.className = 'course-checkbox';
        label.innerHTML = `
            <input type="checkbox" value="${name}" checked>
            ${name} — ${data.sks} SKS
        `;
        const cb = label.querySelector('input');
        cb.addEventListener('change', () => {
            activeCourseKeys = Array.from(container.querySelectorAll('input:checked')).map(i => i.value);
            updateConfigSks();
            initCalcSelect();
            initSimSelects();
        });
        container.appendChild(label);
    });
    updateConfigSks();
}

function updateConfigSks() {
    const totalSks = activeCourseKeys.reduce((sum, key) => sum + courses[key].sks, 0);
    document.getElementById('active-sks-display').innerText = `${totalSks} SKS`;
}

function initCalcSelect() {
    const select = document.getElementById('calc-course-select');
    select.innerHTML = '';
    if (activeCourseKeys.length === 0) {
        select.innerHTML = '<option>Pilih minimal 1 matkul</option>';
        document.getElementById('calc-components').innerHTML = '';
        updateCalcResult(true);
        return;
    }
    
    activeCourseKeys.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.innerText = name;
        select.appendChild(opt);
    });
    
    select.addEventListener('change', renderCalcComponents);
    renderCalcComponents();
}

function renderCalcComponents() {
    const select = document.getElementById('calc-course-select');
    const courseName = select.value;
    if (!courses[courseName]) return;
    
    const container = document.getElementById('calc-components');
    container.innerHTML = '';
    
    const comps = courses[courseName].components;
    Object.entries(comps).forEach(([compName, weight]) => {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.innerHTML = `
            <label>${compName} (${weight * 100}%)</label>
            <input type="number" min="0" max="100" value="85" step="1" data-weight="${weight}">
        `;
        div.querySelector('input').addEventListener('input', () => updateCalcResult(false));
        container.appendChild(div);
    });
    
    updateCalcResult(false);
}

function updateCalcResult(isEmpty) {
    if (isEmpty) {
        document.getElementById('res-score').innerText = "0.00";
        document.getElementById('res-grade').innerText = "-";
        document.getElementById('res-point').innerText = "0.00";
        return;
    }

    const container = document.getElementById('calc-components');
    const inputs = container.querySelectorAll('input');
    
    let totalScore = 0;
    inputs.forEach(input => {
        const val = parseFloat(input.value) || 0;
        const weight = parseFloat(input.dataset.weight);
        totalScore += val * weight;
    });
    
    const letter = getGrade(totalScore);
    const point = GRADE_MAP[letter];
    
    document.getElementById('res-score').innerText = totalScore.toFixed(2);
    document.getElementById('res-grade').innerText = letter;
    document.getElementById('res-point').innerText = point.toFixed(2);
}

function initSimSelects() {
    const container = document.getElementById('sim-course-selects');
    container.innerHTML = '';
    simGrades = {};
    
    if (activeCourseKeys.length === 0) {
        updateSim();
        return;
    }
    
    activeCourseKeys.forEach(name => {
        const data = courses[name];
        simGrades[name] = "A"; // default
        
        const div = document.createElement('div');
        div.className = 'input-group';
        
        const optionsHTML = Object.keys(GRADE_MAP).map(g => `<option value="${g}">${g}</option>`).join('');
        
        div.innerHTML = `
            <label>${name} (${data.sks} SKS)</label>
            <select data-course="${name}">
                ${optionsHTML}
            </select>
        `;
        
        const select = div.querySelector('select');
        select.addEventListener('change', (e) => {
            simGrades[name] = e.target.value;
            updateSim();
        });
        container.appendChild(div);
    });
    
    updateSim();
}

function updateSim() {
    const currentIpk = parseFloat(document.getElementById('current-ipk').value) || 0;
    const currentSks = parseInt(document.getElementById('current-sks').value) || 0;
    const targetIpk = parseFloat(document.getElementById('target-ipk').value) || 0;
    
    let totalSksSem6 = 0;
    let totalBobotSem6 = 0;
    
    const tbody = document.getElementById('sim-tbody');
    tbody.innerHTML = '';
    
    activeCourseKeys.forEach(name => {
        const data = courses[name];
        const grade = simGrades[name] || "A";
        const point = GRADE_MAP[grade];
        const totalPoin = point * data.sks;
        
        totalSksSem6 += data.sks;
        totalBobotSem6 += totalPoin;
        
        tbody.innerHTML += `
            <tr>
                <td>${name}</td>
                <td>${data.sks}</td>
                <td><strong>${grade}</strong></td>
                <td>${point.toFixed(2)}</td>
                <td>${totalPoin.toFixed(2)}</td>
            </tr>
        `;
    });
    
    document.getElementById('lbl-ip-sem').innerText = `IP Semester 6 (${totalSksSem6} SKS)`;
    const ipSem6 = totalSksSem6 > 0 ? totalBobotSem6 / totalSksSem6 : 0;
    document.getElementById('sim-ip').innerText = ipSem6.toFixed(3);
    
    const totalSksAll = currentSks + totalSksSem6;
    const totalBobotAll = (currentIpk * currentSks) + totalBobotSem6;
    
    document.getElementById('lbl-ipk').innerText = `IPK Kumulatif (${totalSksAll} SKS)`;
    const newIpk = totalSksAll > 0 ? totalBobotAll / totalSksAll : 0;
    document.getElementById('sim-ipk').innerText = newIpk.toFixed(3);
    
    const deltaEl = document.getElementById('sim-delta');
    const delta = newIpk - currentIpk;
    deltaEl.innerText = (delta >= 0 ? '+' : '') + delta.toFixed(3);
    deltaEl.className = 'delta ' + (delta >= 0 ? 'positive' : 'negative');
    
    const alertBox = document.getElementById('target-alert');
    if (totalSksSem6 > 0) {
        const ipNeeded = ((targetIpk * totalSksAll) - (currentIpk * currentSks)) / totalSksSem6;
        if (ipNeeded > 4.0) {
            alertBox.className = 'alert error';
            alertBox.innerHTML = `<strong>Target IPK ${targetIpk.toFixed(2)} Tidak Realistis</strong><br>Membutuhkan IP Semester 6 sebesar ${ipNeeded.toFixed(2)} (Maksimal 4.00).`;
        } else if (newIpk < targetIpk) {
            alertBox.className = 'alert warning';
            alertBox.innerHTML = `<strong>Simulasi Belum Mencapai Target!</strong><br>Secara teori IPK ${targetIpk.toFixed(2)} masih bisa dicapai, tetapi Anda butuh IP Semester 6 minimal <strong>${ipNeeded.toFixed(2)}</strong>. (Simulasi Anda saat ini baru mencapai IP ${ipSem6.toFixed(2)}).`;
        } else {
            alertBox.className = 'alert success';
            alertBox.innerHTML = `<strong>Target IPK ${targetIpk.toFixed(2)} Tercapai! 🎉</strong><br>Selamat! Simulasi IP Semester 6 Anda (${ipSem6.toFixed(2)}) sudah melampaui batas aman yang dibutuhkan (${ipNeeded.toFixed(2)}).`;
        }
        alertBox.style.display = 'block';
    } else {
        alertBox.style.display = 'none';
    }
}
