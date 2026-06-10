// ============================================================
// 状態変数
// ============================================================
let selectedType = 'adult';
let dropAnimationInterval = null;
let currentIndex = 0;
let manualVolume = null;
let confirmedIndex = null;

const volumes = [1500, 500, 200, 100, 50, null];

// ============================================================
// 要素取得
// ============================================================
const inputScreen         = document.getElementById('inputScreen');
const resultScreen        = document.getElementById('resultScreen');
const adultBtn            = document.getElementById('adultBtn');
const childBtn            = document.getElementById('childBtn');
const calculateBtn        = document.getElementById('calculateBtn');
const backBtn             = document.getElementById('backBtn');
const dropRateDisplay     = document.getElementById('dropRate');
const dropIntervalDisplay = document.getElementById('dropInterval');
const dropArea            = document.getElementById('dropArea');
const swiperTrack         = document.getElementById('swiperTrack');
const selectedVolumeText  = document.getElementById('selectedVolumeText');

// ============================================================
// 投与時間セレクト
// ============================================================
const hourSelect   = document.getElementById('hourSelect');
const minuteSelect = document.getElementById('minuteSelect');

hourSelect.addEventListener('change', updateSummary);
minuteSelect.addEventListener('change', updateSummary);

// ============================================================
// サマリー更新
// ============================================================
function updateSummary() {
    const vol = confirmedIndex !== null
        ? (volumes[confirmedIndex] !== null ? volumes[confirmedIndex] : manualVolume)
        : null;
    const dropLabel = selectedType === 'adult' ? '20滴/mL' : '60滴/mL';
    const h = parseInt(hourSelect.value);
    const m = parseInt(minuteSelect.value);
    const totalMin = h * 60 + m;
    document.getElementById('summaryVolume').textContent = vol ? vol : '--';
    document.getElementById('summaryDrop').textContent = selectedType === 'adult' ? '20' : '60';
    document.getElementById('summaryHour').textContent = h;
    document.getElementById('summaryMin').textContent = String(m).padStart(2, '0');
    document.getElementById('summaryTotalMin').textContent = totalMin;
}

// ============================================================
// 輸液量スワイパー
// ============================================================
function updateSwiper(index) {
    currentIndex = index;
    swiperTrack.style.transform = 'translateX(-' + (index * 100) + '%)';
    refreshVolumeLabel();
    document.querySelectorAll('.swiper-item').forEach((el, i) => {
        el.classList.toggle('browsing', i === index && i !== confirmedIndex);
    });
}

function confirmSelection(index) {
    confirmedIndex = index;
    document.querySelectorAll('.swiper-item').forEach((el, i) => {
        el.classList.toggle('confirmed', i === index);
        el.classList.remove('browsing');
    });
    refreshVolumeLabel();
    updateSummary();
}

function refreshVolumeLabel() {
    if (confirmedIndex === null) {
        selectedVolumeText.textContent = '未選択';
        return;
    }
    if (volumes[confirmedIndex] !== null) {
        selectedVolumeText.textContent = volumes[confirmedIndex] + ' mL 選択中';
    } else {
        selectedVolumeText.textContent = manualVolume ? (manualVolume + ' mL 選択中') : '未入力';
    }
}

document.querySelectorAll('.swiper-item:not([data-volume="manual"])').forEach((el, i) => {
    el.addEventListener('click', () => confirmSelection(i));
});

let swipeStartX = 0, swipeStartY = 0;

swiperTrack.addEventListener('touchstart', (e) => {
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
}, { passive: true });

swiperTrack.addEventListener('touchend', (e) => {
    const dx = swipeStartX - e.changedTouches[0].clientX;
    const dy = swipeStartY - e.changedTouches[0].clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        if (dx > 0 && currentIndex < volumes.length - 1) updateSwiper(currentIndex + 1);
        else if (dx < 0 && currentIndex > 0) updateSwiper(currentIndex - 1);
    }
}, { passive: true });

document.getElementById('prevBtn').addEventListener('click', () => {
    if (currentIndex > 0) updateSwiper(currentIndex - 1);
});
document.getElementById('nextBtn').addEventListener('click', () => {
    if (currentIndex < volumes.length - 1) updateSwiper(currentIndex + 1);
});

document.getElementById('manualConfirmBtn').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('manualVolume').value);
    if (!val || val <= 0) { alert('正しい数値を入力してください。'); return; }
    manualVolume = val;
    confirmSelection(4);
    document.getElementById('manualConfirmBtn').classList.add('decided');
});

updateSwiper(0);

// ============================================================
// ルート種類選択
// ============================================================
adultBtn.addEventListener('click', () => {
    selectedType = 'adult';
    adultBtn.classList.add('active');
    childBtn.classList.remove('active');
    updateSummary();
});

childBtn.addEventListener('click', () => {
    selectedType = 'child';
    childBtn.classList.add('active');
    adultBtn.classList.remove('active');
    updateSummary();
});

// ============================================================
// 計算ボタン
// ============================================================
calculateBtn.addEventListener('click', () => {
    if (confirmedIndex === null) { alert('輸液量を画像タップで選択してください。'); return; }
    const volume = volumes[confirmedIndex] !== null ? volumes[confirmedIndex] : manualVolume;
    const h = parseInt(hourSelect.value);
    const m = parseInt(minuteSelect.value);
    const hours = h + m / 60;
    if (!volume || volume <= 0) { alert('輸液量を入力・決定してください。'); return; }
    if (hours <= 0) { alert('投与時間を選択してください。'); return; }

    const dropFactor = selectedType === 'adult' ? 20 : 60;
    const dropRate = (volume * dropFactor) / (hours * 60);
    const dropInterval = 60 / dropRate;

    dropRateDisplay.textContent = dropRate.toFixed(1) + ' 滴/分';
    dropIntervalDisplay.textContent = dropInterval.toFixed(2) + ' 秒';

    inputScreen.classList.remove('active');
    resultScreen.classList.add('active');
    startDropAnimation(dropInterval);
});

// ============================================================
// 戻るボタン
// ============================================================
backBtn.addEventListener('click', () => {
    stopDropAnimation();
    resultScreen.classList.remove('active');
    inputScreen.classList.add('active');
});

// ============================================================
// 水滴アニメーション
// ============================================================
function startDropAnimation(interval) {
    stopDropAnimation();
    const createDrop = () => {
        const drop = document.createElement('div');
        drop.className = 'drop';
        dropArea.appendChild(drop);
        setTimeout(() => drop.remove(), 2500);
    };
    createDrop();
    dropAnimationInterval = setInterval(createDrop, interval * 1000);
}

function stopDropAnimation() {
    if (dropAnimationInterval) { clearInterval(dropAnimationInterval); dropAnimationInterval = null; }
    if (dropArea) { dropArea.querySelectorAll('.drop').forEach(d => d.remove()); }
}