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
// Canvas滴下アニメーション（画像スプライト方式）
// ============================================================
const canvas     = document.getElementById('dropCanvas');
const ctx        = canvas.getContext('2d');
const chamberImg = document.getElementById('chamberImg');

// 水滴画像の事前読み込み
const dropImgs = [null, null, null, null];
[1,2,3,4].forEach(i => {
    const img = new Image();
    img.src = './img/seizin_tekika' + i + '.PNG';
    dropImgs[i - 1] = img;
});

// seizinyou_tekika.PNG上の緑先端位置（画像サイズに対する割合）
const TIP_RATIO = { x: 0.50, y: 0.295 };

// 将来: liquidLevel(0〜1)を残量と連動させると液面が変化する
let liquidLevel = 0.62;

let tipX = 0, tipY = 0, canvasW = 0, canvasH = 0;
let animFrameId    = null;
let dropIntervalId = null;
let lastTime       = null;
let drops          = [];
let ripples        = [];
let surfaceWaves   = [];

// 各フェーズの画像サイズ（canvas px）
const DROP_SIZE = {
    grow:   { w: 22, h: 14 },
    fall:   { w: 23, h: 23 },
    splash: { w: 32, h: 20 },
};

// フェーズ継続時間（ms）
const PHASE_MS = { grow: 480 };
// 着水フェード時間（ms）
const SPLASH_MS = 220;

function initCanvas() {
    canvasW = chamberImg.offsetWidth;
    canvasH = chamberImg.offsetHeight;
    canvas.width  = canvasW;
    canvas.height = canvasH;
    canvas.style.width  = canvasW + 'px';
    canvas.style.height = canvasH + 'px';
    tipX = canvasW * TIP_RATIO.x;
    tipY = canvasH * TIP_RATIO.y;
}

function getSurfaceY() {
    // seizinyou_tekika.PNG の水面位置に固定（画像高さの約62%）
    return canvasH * 0.62;
}

function spawnDrop() {
    drops.push({
        phase: 'grow',
        x: tipX,
        y: tipY + DROP_SIZE.grow.h,
        vy: 0,
        elapsed: 0,   // フェーズ内の経過ms
    });
}

function updateDrops(dt) {
    const surfaceY = getSurfaceY();
    // 物理: 60fps基準で正規化
    const dtFactor = dt / (1000 / 60);

    drops = drops.filter(d => {
        d.elapsed += dt;

        if (d.phase === 'grow') {
            if (d.elapsed >= PHASE_MS.grow) {
                d.phase   = 'fall';
                d.elapsed = 0;
                d.vy      = 1.8;
            }

        } else if (d.phase === 'fall') {
            d.vy += 0.32 * dtFactor;
            d.y  += d.vy * dtFactor;
            const splashThreshold = surfaceY - DROP_SIZE.splash.h * 0.3;
            if (d.y >= splashThreshold) {
                d.phase   = 'splash';
                d.y       = surfaceY;
                d.elapsed = 0;
                ripples.push({ x: d.x, y: surfaceY, r: 3, maxR: 28, alpha: 0.65 });
                surfaceWaves.push({ x: d.x, amp: 3.5, elapsed: 0 });
            }

        } else if (d.phase === 'splash') {
            if (d.elapsed >= SPLASH_MS) return false;
        }
        return true;
    });
}

function updateRipples(dt) {
    const dtFactor = dt / (1000 / 60);
    ripples = ripples.filter(rp => {
        rp.r     += (rp.maxR - rp.r) * 0.10 * dtFactor;
        rp.alpha -= 0.018 * dtFactor;
        return rp.alpha > 0;
    });
    surfaceWaves = surfaceWaves.filter(w => {
        w.elapsed += dt;
        w.amp     *= Math.pow(0.88, dtFactor);
        return w.amp > 0.10;
    });
}

function drawSurface() {
    const surfaceY = getSurfaceY();
    // チャンバー内部の左右端（画像幅に対する割合）
    const clipLeft  = canvasW * 0.32;
    const clipRight = canvasW * 0.68;
    const clipTop   = canvasH * 0.33;
    const clipBot   = canvasH * 0.88;

    const steps = 40;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const px = clipLeft + ((clipRight - clipLeft) / steps) * i;
        let py = surfaceY;
        surfaceWaves.forEach(sw => {
            const dist = px - sw.x;
            const t = sw.elapsed / 1000;
            py += sw.amp * Math.sin((dist / 16) - t * 18) *
                  Math.exp(-dist * dist / (canvasW * canvasW * 0.4));
        });
        pts.push({ px, py });
    }

    ctx.save();
    // チャンバー内部のみ描画
    ctx.beginPath();
    ctx.rect(clipLeft, clipTop, clipRight - clipLeft, clipBot - clipTop);
    ctx.clip();

    ripples.forEach(rp => {
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.28, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(180,180,180,${rp.alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
    });
    ctx.beginPath();
    ctx.moveTo(pts[0].px, pts[0].py);
    pts.forEach(p => ctx.lineTo(p.px, p.py));
    ctx.strokeStyle = 'rgba(180,180,180,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
}

function drawDrops() {
    drops.forEach(d => {
        if (d.phase === 'grow') {
            // tekika1: 成長アニメーション（徐々に拡大）
            const progress = Math.min(d.elapsed / PHASE_MS.grow, 1);
            const sw = DROP_SIZE.grow.w * progress;
            const sh = DROP_SIZE.grow.h * progress;
            const img = dropImgs[0];
            if (img && img.complete && sw > 0) {
                ctx.drawImage(img, tipX - sw / 2 - 1, tipY, sw, sh);
            }

        } else if (d.phase === 'fall') {
            // tekika3: 落下中・速度に応じて縦方向にわずかに伸びる
            const stretch = Math.min(1 + d.vy * 0.022, 1.25);
            const sw = DROP_SIZE.fall.w;
            const sh = DROP_SIZE.fall.h * stretch;
            const img = dropImgs[2];
            if (img && img.complete) {
                ctx.drawImage(img, d.x - sw / 2, d.y - sh / 2, sw, sh);
            }

        } else if (d.phase === 'splash') {
            // tekika4: 着水・フェードアウト
            const alpha = 1 - d.elapsed / SPLASH_MS;
            const sw = DROP_SIZE.splash.w;
            const sh = DROP_SIZE.splash.h;
            const img = dropImgs[3];
            if (img && img.complete) {
                ctx.save();
                ctx.globalAlpha = Math.max(alpha, 0);
                ctx.drawImage(img, d.x - sw / 2, d.y - sh / 2, sw, sh);
                ctx.restore();
            }
        }
    });
}

function renderFrame(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min(timestamp - lastTime, 50); // 最大50ms（タブ非表示復帰対策）
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvasW, canvasH);
    updateDrops(dt);
    updateRipples(dt);
    drawSurface();
    drawDrops();
    animFrameId = requestAnimationFrame(renderFrame);
}

function startDropAnimation(intervalSec) {
    stopDropAnimation();
    const doStart = () => {
        initCanvas();
        drops = []; ripples = []; surfaceWaves = [];
        lastTime = null;
        renderFrame(performance.now());
        spawnDrop();
        dropIntervalId = setInterval(spawnDrop, intervalSec * 1000);
    };
    if (chamberImg.complete && chamberImg.naturalWidth > 0) {
        doStart();
    } else {
        chamberImg.onload = doStart;
    }
}

function stopDropAnimation() {
    if (animFrameId)    { cancelAnimationFrame(animFrameId); animFrameId = null; }
    if (dropIntervalId) { clearInterval(dropIntervalId); dropIntervalId = null; }
    drops = []; ripples = []; surfaceWaves = [];
    lastTime = null;
    if (canvasW > 0) ctx.clearRect(0, 0, canvasW, canvasH);
}