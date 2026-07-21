// ============================================================
// 状態変数
// ============================================================
let selectedType = null;
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
    document.getElementById('summaryDrop').textContent = selectedType === 'adult' ? '20' : selectedType === 'child' ? '60' : '--';
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
    // 手動以外が選択されたら決定ボタンをリセット
    if (index !== 5) {
        document.getElementById('manualConfirmBtn').classList.remove('decided');
    }
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
    confirmSelection(5);
    document.getElementById('manualConfirmBtn').classList.add('decided');
});

updateSwiper(1);

// ============================================================
// 投与時間 ▲▼ボタン
// ============================================================
document.getElementById('hourUp').addEventListener('click', () => {
    const sel = document.getElementById('hourSelect');
    if (sel.selectedIndex < sel.options.length - 1) { sel.selectedIndex++; updateSummary(); }
});
document.getElementById('hourDown').addEventListener('click', () => {
    const sel = document.getElementById('hourSelect');
    if (sel.selectedIndex > 0) { sel.selectedIndex--; updateSummary(); }
});
document.getElementById('minuteUp').addEventListener('click', () => {
    const sel = document.getElementById('minuteSelect');
    if (sel.selectedIndex < sel.options.length - 1) { sel.selectedIndex++; updateSummary(); }
});
document.getElementById('minuteDown').addEventListener('click', () => {
    const sel = document.getElementById('minuteSelect');
    if (sel.selectedIndex > 0) { sel.selectedIndex--; updateSummary(); }
});

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
    if (!selectedType) { alert('輸液ルートの種類を選択してください。'); return; }
    if (hours <= 0) { alert('投与時間を選択してください。'); return; }

    const dropFactor = selectedType === 'adult' ? 20 : 60;
    const dropRate = (volume * dropFactor) / (hours * 60);
    const dropInterval = 60 / dropRate;

    const dropRateRound = Math.round(dropRate);
    const dropRateExact = dropRate.toFixed(1);
    const secPerDrop = (60 / dropRate).toFixed(1);

    dropRateDisplay.textContent = dropRateRound;
    document.getElementById('dropRateExact').textContent = dropRateExact;
    document.getElementById('dropIntervalSec').textContent = secPerDrop;

    const secColor = selectedType === 'adult' ? '#66bb6a' : '#f48fb1';
    document.getElementById('dropIntervalSec').style.color = secColor;
    document.querySelectorAll('.rn-sec-unit').forEach(el => el.style.color = secColor);
    document.getElementById('fVolume').textContent   = volume;
    document.getElementById('fDrop').textContent     = dropFactor;
    document.getElementById('fHour').textContent     = parseInt(hourSelect.value);
    document.getElementById('fMin').textContent      = String(parseInt(minuteSelect.value)).padStart(2, '0');
    document.getElementById('fTotalMin').textContent = Math.round(hours * 60);
    document.getElementById('fExact').textContent    = dropRate.toFixed(1);
    document.getElementById('fApprox').textContent   = Math.round(dropRate);
    inputScreen.classList.remove('active');
    resultScreen.classList.add('active');
    document.body.style.padding = '0';

    if (selectedType === 'child') {
        document.getElementById('chamberAdult').style.display = 'none';
        document.getElementById('chamberChild').style.display = 'block';
        stopDropAnimation();
        startChildDropAnimation(dropInterval);
    } else {
        document.getElementById('chamberAdult').style.display = 'block';
        document.getElementById('chamberChild').style.display = 'none';
        stopChildDropAnimation();
        startDropAnimation(dropInterval);
    }
    startTickSound(dropInterval);
});

// ============================================================
// 計算式アコーディオン
// ============================================================
document.getElementById('formulaToggle').addEventListener('click', () => {
    const btn  = document.getElementById('formulaToggle');
    const body = document.getElementById('formulaBody');
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    body.classList.toggle('open', !open);
});

// ============================================================
// 戻るボタン
// ============================================================
backBtn.addEventListener('click', () => {
    stopDropAnimation();
    stopChildDropAnimation();
    stopTickSound();
    // 音をOFFにリセット
    soundOn = false;
    soundBtn.dataset.on = 'false';
    soundBtn.querySelector('.sound-icon').textContent    = '🔇';
    soundBtn.querySelector('.sound-label-v').textContent = '音OFF';
    // アコーディオンをリセット
    document.getElementById('formulaToggle').setAttribute('aria-expanded', 'false');
    document.getElementById('formulaBody').classList.remove('open');
    resultScreen.classList.remove('active');
    inputScreen.classList.add('active');
    document.body.style.padding = '20px';
});

// ============================================================
// 音ON/OFFボタン（メトロノーム音）
// ============================================================
const soundBtn = document.getElementById('soundBtn');
let soundOn = false;
let audioCtx = null;
let tickIntervalId = null;
let currentTickInterval = 1.0;

function getAudioCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function scheduleTick(ac, when) {
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, when);
    osc.frequency.exponentialRampToValueAtTime(600, when + 0.04);
    gain.gain.setValueAtTime(0.35, when);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.06);
    osc.start(when);
    osc.stop(when + 0.06);
}

function startTickSound(intervalSec) {
    currentTickInterval = intervalSec;
    // 音はアニメーションの着水タイミングで鳴らすため、ここではAudioCtxの初期化のみ
    if (soundOn) getAudioCtx();
}

function stopTickSound() {
    // 着水イベント駆動のため特に停止処理不要
}

soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.dataset.on = soundOn;
    soundBtn.querySelector('.sound-icon').textContent    = soundOn ? '🔊' : '🔇';
    soundBtn.querySelector('.sound-label-v').textContent = soundOn ? '音ON' : '音OFF';
    if (soundOn) {
        startTickSound(currentTickInterval);
    } else {
        stopTickSound();
    }
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
                // 着水タイミングで音を鳴らす
                if (soundOn && audioCtx) scheduleTick(audioCtx, audioCtx.currentTime);
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

// ============================================================
// 小児用Canvas滴下アニメーション（成人用と独立）
// ============================================================
const canvasC      = document.getElementById('dropCanvasChild');
const ctxC         = canvasC.getContext('2d');
const chamberImgC  = document.getElementById('chamberImgChild');

// sixyouni_tekika.PNG: 針先は幅50%・高さ約36%、液面約60%
const CHILD_TIP_RATIO    = { x: 0.50, y: 0.227 };
const CHILD_SURFACE_Y    = 0.585;
const CHILD_CLIP = { left: 0.32, right: 0.69, top: 0.36, bot: 0.88 };
const CHILD_DROP_SIZE = {
    grow:   { w: 8, h: 6  },
    fall:   { w: 13, h: 13 },
    splash: { w: 18, h: 11 },
};

let cAnimFrameId    = null;
let cDropIntervalId = null;
let cLastTime       = null;
let cDrops          = [];
let cRipples        = [];
let cSurfaceWaves   = [];
let cCanvasW = 0, cCanvasH = 0;
let cTipX = 0, cTipY = 0;

function initCanvasC() {
    cCanvasW = chamberImgC.offsetWidth;
    cCanvasH = chamberImgC.offsetHeight;
    canvasC.width  = cCanvasW;
    canvasC.height = cCanvasH;
    canvasC.style.width  = cCanvasW + 'px';
    canvasC.style.height = cCanvasH + 'px';
    cTipX = cCanvasW * CHILD_TIP_RATIO.x;
    cTipY = cCanvasH * CHILD_TIP_RATIO.y;
}

function getSurfaceYC() { return cCanvasH * CHILD_SURFACE_Y; }

function spawnDropC() {
    cDrops.push({ phase: 'grow', x: cTipX, y: cTipY, vy: 0, elapsed: 0 });
}

function updateDropsC(dt) {
    const surfaceY = getSurfaceYC();
    const dtF = dt / (1000 / 60);
    cDrops = cDrops.filter(d => {
        d.elapsed += dt;
        if (d.phase === 'grow') {
            if (d.elapsed >= 480) { d.phase = 'fall'; d.elapsed = 0; d.vy = 1.8; }
        } else if (d.phase === 'fall') {
            d.vy += 0.32 * dtF;
            d.y  += d.vy * dtF;
            if (d.y >= surfaceY - CHILD_DROP_SIZE.splash.h * 0.3) {
                d.phase = 'splash'; d.y = surfaceY; d.elapsed = 0;
                cRipples.push({ x: d.x, y: surfaceY, r: 2, maxR: 18, alpha: 0.60 });
                cSurfaceWaves.push({ x: d.x, amp: 2.5, elapsed: 0 });
                if (soundOn && audioCtx) scheduleTick(audioCtx, audioCtx.currentTime);
            }
        } else if (d.phase === 'splash') {
            if (d.elapsed >= 220) return false;
        }
        return true;
    });
}

function updateRipplesC(dt) {
    const dtF = dt / (1000 / 60);
    cRipples = cRipples.filter(rp => {
        rp.r     += (rp.maxR - rp.r) * 0.10 * dtF;
        rp.alpha -= 0.018 * dtF;
        return rp.alpha > 0;
    });
    cSurfaceWaves = cSurfaceWaves.filter(w => {
        w.elapsed += dt;
        w.amp     *= Math.pow(0.88, dtF);
        return w.amp > 0.10;
    });
}

function drawSurfaceC() {
    const surfaceY = getSurfaceYC();
    const clipL = cCanvasW * CHILD_CLIP.left;
    const clipR = cCanvasW * CHILD_CLIP.right;
    const clipT = cCanvasH * CHILD_CLIP.top;
    const clipB = cCanvasH * CHILD_CLIP.bot;
    const steps = 40;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
        const px = clipL + ((clipR - clipL) / steps) * i;
        let py = surfaceY;
        cSurfaceWaves.forEach(sw => {
            const dist = px - sw.x;
            const t = sw.elapsed / 1000;
            py += sw.amp * Math.sin((dist / 14) - t * 18) *
                  Math.exp(-dist * dist / (cCanvasW * cCanvasW * 0.4));
        });
        pts.push({ px, py });
    }
    ctxC.save();
    ctxC.beginPath();
    ctxC.rect(clipL, clipT, clipR - clipL, clipB - clipT);
    ctxC.clip();
    cRipples.forEach(rp => {
        ctxC.beginPath();
        ctxC.ellipse(rp.x, rp.y, rp.r, rp.r * 0.28, 0, 0, Math.PI * 2);
        ctxC.strokeStyle = `rgba(180,180,180,${rp.alpha})`;
        ctxC.lineWidth = 1.0;
        ctxC.stroke();
    });
    ctxC.beginPath();
    ctxC.moveTo(pts[0].px, pts[0].py);
    pts.forEach(p => ctxC.lineTo(p.px, p.py));
    ctxC.strokeStyle = 'rgba(180,180,180,0.45)';
    ctxC.lineWidth = 1.2;
    ctxC.stroke();
    ctxC.restore();
}

function drawDropsC() {
    cDrops.forEach(d => {
        if (d.phase === 'grow') {
            const progress = Math.min(d.elapsed / 480, 1);
            const sw = CHILD_DROP_SIZE.grow.w * progress;
            const sh = CHILD_DROP_SIZE.grow.h * progress;
            const img = dropImgs[0];
            if (img && img.complete && sw > 0)
                ctxC.drawImage(img, cTipX - sw / 2 - 1, cTipY, sw, sh);
        } else if (d.phase === 'fall') {
            const stretch = Math.min(1 + d.vy * 0.022, 1.25);
            const sw = CHILD_DROP_SIZE.fall.w;
            const sh = CHILD_DROP_SIZE.fall.h * stretch;
            const img = dropImgs[2];
            if (img && img.complete)
                ctxC.drawImage(img, d.x - sw / 2, d.y - sh / 2, sw, sh);
        } else if (d.phase === 'splash') {
            const alpha = Math.max(1 - d.elapsed / 220, 0);
            const sw = CHILD_DROP_SIZE.splash.w;
            const sh = CHILD_DROP_SIZE.splash.h;
            const img = dropImgs[3];
            if (img && img.complete) {
                ctxC.save();
                ctxC.globalAlpha = alpha;
                ctxC.drawImage(img, d.x - sw / 2, d.y - sh / 2, sw, sh);
                ctxC.restore();
            }
        }
    });
}

function renderFrameC(timestamp) {
    if (!cLastTime) cLastTime = timestamp;
    const dt = Math.min(timestamp - cLastTime, 50);
    cLastTime = timestamp;
    ctxC.clearRect(0, 0, cCanvasW, cCanvasH);
    updateDropsC(dt);
    updateRipplesC(dt);
    drawSurfaceC();
    drawDropsC();
    cAnimFrameId = requestAnimationFrame(renderFrameC);
}

function startChildDropAnimation(intervalSec) {
    stopChildDropAnimation();
    // display:noneの状態ではoffsetWidth/Heightが0になるため
    // 表示切り替え後にrequestAnimationFrameで1フレーム待ってからinit
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const doStart = () => {
                initCanvasC();
                cDrops = []; cRipples = []; cSurfaceWaves = [];
                cLastTime = null;
                renderFrameC(performance.now());
                spawnDropC();
                cDropIntervalId = setInterval(spawnDropC, intervalSec * 1000);
            };
            if (chamberImgC.complete && chamberImgC.naturalWidth > 0) {
                doStart();
            } else {
                chamberImgC.onload = doStart;
            }
        });
    });
}

function stopChildDropAnimation() {
    if (cAnimFrameId)    { cancelAnimationFrame(cAnimFrameId); cAnimFrameId = null; }
    if (cDropIntervalId) { clearInterval(cDropIntervalId); cDropIntervalId = null; }
    cDrops = []; cRipples = []; cSurfaceWaves = [];
    cLastTime = null;
    if (cCanvasW > 0) ctxC.clearRect(0, 0, cCanvasW, cCanvasH);
}

// ============================================================
// AdMob バナー広告（入力画面下部のみ・結果画面には表示しない）
// ============================================================
// 本番バナーユニットID
const ADMOB_BANNER_ID = 'ca-app-pub-4905596514841693/1496836491';

(async function initAdMob() {
    if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) {
        return; // ブラウザプレビュー等では何もしない
    }
    const AdMob = window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
    if (!AdMob) {
        console.warn('AdMob plugin not found on window.Capacitor.Plugins');
        return;
    }

    // BannerAdPosition / BannerAdSize は enum なので文字列値を直接使用
    const bannerOptions = {
        adId: ADMOB_BANNER_ID,
        adSize: 'ADAPTIVE_BANNER',
        position: 'BOTTOM_CENTER',
        margin: 0,
    };

    try {
        await AdMob.initialize({});
        await AdMob.showBanner(bannerOptions);

        // 結果画面ではバナーを隠し、入力画面に戻ったら再表示する
        calculateBtn.addEventListener('click', () => {
            AdMob.hideBanner().catch(() => {});
        });
        backBtn.addEventListener('click', () => {
            AdMob.showBanner(bannerOptions).catch(() => {});
        });
    } catch (e) {
        console.warn('AdMob init failed:', e);
    }
})();