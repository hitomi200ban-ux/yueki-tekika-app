// ============================================================
// 地域・言語
// 地域（臨床ルール）は regions/、文言は i18n/、チャンバー画像は chambers.js に置く
// ============================================================
// 現在は日本版のみ。US版追加時に端末の言語・ユーザーの選択から決めるようにする
const ACTIVE_REGION_ID = 'JP';
const region  = REGIONS[ACTIVE_REGION_ID];
const strings = STRINGS[region.locale];

// 文言を取得する（{name} を vars の値で置換）
function t(key, vars) {
    let s = strings[key];
    if (s === undefined) { console.warn('Missing string:', key); return key; }
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
}

// HTML の data-i18n / data-i18n-placeholder に文言を反映する
function applyStrings() {
    document.documentElement.lang = region.locale;
    document.title = t('doc.title');
    document.querySelectorAll('[data-i18n]').forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    // CSS の ::after（「✓ 決定」バッジ）用
    document.documentElement.style.setProperty('--decided-label', JSON.stringify(t('common.decided')));
    document.getElementById('privacyLink').href = region.privacyUrl;
}

applyStrings();

// ============================================================
// 滴下計算（全地域共通）
// 滴下数（滴/分）= 輸液量(mL) × 滴下係数(滴/mL) ÷ 投与時間(分)
// ============================================================
function calcDropRate(volumeMl, dropFactor, totalMinutes) {
    return (volumeMl * dropFactor) / totalMinutes;
}

// ============================================================
// 状態変数
// ============================================================
let selectedTubing = null;   // region.tubing の要素
let selectedFactor = null;   // 滴下係数（滴/mL）
let currentIndex = 0;
let manualVolume = null;
let confirmedIndex = null;

// プリセットの輸液量＋末尾の手動入力（null）
const volumes = [...region.volumes.map(v => v.ml), null];
const MANUAL_INDEX = volumes.length - 1;

// ============================================================
// 要素取得
// ============================================================
const inputScreen         = document.getElementById('inputScreen');
const resultScreen        = document.getElementById('resultScreen');
const tubingGroup         = document.getElementById('tubingGroup');
const calculateBtn        = document.getElementById('calculateBtn');
const backBtn             = document.getElementById('backBtn');
const dropRateDisplay     = document.getElementById('dropRate');
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
    const h = parseInt(hourSelect.value);
    const m = parseInt(minuteSelect.value);
    const totalMin = h * 60 + m;
    document.getElementById('summaryVolume').textContent = vol ? vol : '--';
    document.getElementById('summaryDrop').textContent = selectedFactor !== null ? selectedFactor : '--';
    document.getElementById('summaryHour').textContent = h;
    document.getElementById('summaryMin').textContent = String(m).padStart(2, '0');
    document.getElementById('summaryTotalMin').textContent = totalMin;
}

// ============================================================
// 輸液量スワイパー
// ============================================================
// プリセット画像を地域プロファイルから生成し、手動入力の前に並べる
function renderVolumePresets() {
    const manualItem = swiperTrack.querySelector('.swiper-item[data-volume="manual"]');
    region.volumes.forEach(v => {
        const item = document.createElement('div');
        item.className = 'swiper-item';
        item.dataset.volume = v.ml;
        const img = document.createElement('img');
        img.src = v.image;
        img.alt = v.ml + 'ml';
        item.appendChild(img);
        swiperTrack.insertBefore(item, manualItem);
    });
}

renderVolumePresets();

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
    if (index !== MANUAL_INDEX) {
        document.getElementById('manualConfirmBtn').classList.remove('decided');
    }
    refreshVolumeLabel();
    updateSummary();
}

function refreshVolumeLabel() {
    if (confirmedIndex === null) {
        selectedVolumeText.textContent = t('volume.none');
        return;
    }
    if (volumes[confirmedIndex] !== null) {
        selectedVolumeText.textContent = t('volume.selected', { v: volumes[confirmedIndex] });
    } else {
        selectedVolumeText.textContent = manualVolume ? t('volume.selected', { v: manualVolume }) : t('volume.manualEmpty');
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

const manualVolumeInput = document.getElementById('manualVolume');

function confirmManualVolume() {
    const val = parseFloat(manualVolumeInput.value);
    if (!val || val <= 0) { alert(t('alert.invalidManual')); return; }
    manualVolume = val;
    confirmSelection(MANUAL_INDEX);
    document.getElementById('manualConfirmBtn').classList.add('decided');
}

document.getElementById('manualConfirmBtn').addEventListener('click', confirmManualVolume);

manualVolumeInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        confirmManualVolume();
        manualVolumeInput.blur();
        const Keyboard = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.Keyboard;
        if (Keyboard) Keyboard.hide().catch(() => {});
    }
});

updateSwiper(region.initialVolumeIndex);

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
// ルート種類選択（地域プロファイルの tubing から生成）
// ============================================================
function selectTubing(tubing, btn) {
    selectedTubing = tubing;
    // 滴下係数が1つだけのルートは、ボタン選択で係数も確定する
    selectedFactor = tubing.factors.length === 1 ? tubing.factors[0] : null;
    tubingGroup.querySelectorAll('.type-btn').forEach(el => el.classList.toggle('active', el === btn));
    updateSummary();
}

function renderTubingButtons() {
    region.tubing.forEach(tubing => {
        const btn = document.createElement('button');
        btn.className = 'type-btn';
        btn.dataset.type = tubing.id;
        const img = document.createElement('img');
        img.src = tubing.image;
        img.alt = t(tubing.altKey);
        const label = document.createElement('span');
        label.textContent = t(tubing.labelKey);
        btn.append(img, label);
        btn.addEventListener('click', () => selectTubing(tubing, btn));
        tubingGroup.appendChild(btn);
    });
}

renderTubingButtons();

// ============================================================
// 計算ボタン
// ============================================================
calculateBtn.addEventListener('click', () => {
    if (confirmedIndex === null) { alert(t('alert.volumeNotSelected')); return; }
    const volume = volumes[confirmedIndex] !== null ? volumes[confirmedIndex] : manualVolume;
    const h = parseInt(hourSelect.value);
    const m = parseInt(minuteSelect.value);
    const hours = h + m / 60;
    if (!volume || volume <= 0) { alert(t('alert.volumeEmpty')); return; }
    if (!selectedFactor) { alert(t('alert.tubing')); return; }
    if (hours <= 0) { alert(t('alert.time')); return; }

    const dropFactor = selectedFactor;
    const dropRate = calcDropRate(volume, dropFactor, hours * 60);
    const dropInterval = 60 / dropRate;

    const dropRateRound = Math.round(dropRate);
    const dropRateExact = dropRate.toFixed(1);
    const secPerDrop = (60 / dropRate).toFixed(1);

    dropRateDisplay.textContent = dropRateRound;
    document.getElementById('dropRateExact').textContent = dropRateExact;
    document.getElementById('dropIntervalSec').textContent = secPerDrop;

    const secColor = selectedTubing.accentColor;
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

    // 選択したルートのチャンバーだけを表示してアニメーションを開始
    const activeChamber = selectedTubing.chamber;
    Object.keys(chamberViews).forEach(key => {
        chamberViews[key].wrap.style.display = key === activeChamber ? 'block' : 'none';
    });
    Object.keys(chamberViews).forEach(key => {
        if (key !== activeChamber) chamberViews[key].animator.stop();
    });
    chamberViews[activeChamber].animator.start(dropInterval);
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
    Object.keys(chamberViews).forEach(key => chamberViews[key].animator.stop());
    stopTickSound();
    // 音をOFFにリセット
    soundOn = false;
    soundBtn.dataset.on = 'false';
    soundBtn.querySelector('.sound-icon').textContent    = '🔇';
    soundBtn.querySelector('.sound-label-v').textContent = t('sound.off');
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
    soundBtn.querySelector('.sound-label-v').textContent = soundOn ? t('sound.on') : t('sound.off');
    if (soundOn) {
        startTickSound(currentTickInterval);
    } else {
        stopTickSound();
    }
});

// ============================================================
// Canvas滴下アニメーション（画像スプライト方式）
// チャンバーごとの座標・サイズ・波紋は chambers.js の設定で切り替える
// ============================================================

// 水滴画像の事前読み込み（全チャンバー共通）
const dropImgs = [null, null, null, null];
[1,2,3,4].forEach(i => {
    const img = new Image();
    img.src = './img/seizin_tekika' + i + '.PNG';
    dropImgs[i - 1] = img;
});

// 成長フェーズの継続時間（ms）
const GROW_MS = 480;
// 着水フェード時間（ms）
const SPLASH_MS = 220;

// n フレーム待ってから fn を実行する（0 なら即実行）
function afterFrames(n, fn) {
    if (n <= 0) { fn(); return; }
    requestAnimationFrame(() => afterFrames(n - 1, fn));
}

// チャンバー1つ分のアニメーションを作る（cfg は chambers.js の設定）
function createDropAnimator(cfg, chamberImg, canvas) {
    const ctx = canvas.getContext('2d');

    let tipX = 0, tipY = 0, canvasW = 0, canvasH = 0;
    let animFrameId    = null;
    let dropIntervalId = null;
    let lastTime       = null;
    let drops          = [];
    let ripples        = [];
    let surfaceWaves   = [];

    function initCanvas() {
        canvasW = chamberImg.offsetWidth;
        canvasH = chamberImg.offsetHeight;
        canvas.width  = canvasW;
        canvas.height = canvasH;
        canvas.style.width  = canvasW + 'px';
        canvas.style.height = canvasH + 'px';
        tipX = canvasW * cfg.tip.x;
        tipY = canvasH * cfg.tip.y;
    }

    function getSurfaceY() {
        return canvasH * cfg.surfaceY;
    }

    function spawnDrop() {
        drops.push({
            phase: 'grow',
            x: tipX,
            y: tipY + cfg.spawnOffsetY,
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
                if (d.elapsed >= GROW_MS) {
                    d.phase   = 'fall';
                    d.elapsed = 0;
                    d.vy      = 1.8;
                }

            } else if (d.phase === 'fall') {
                d.vy += 0.32 * dtFactor;
                d.y  += d.vy * dtFactor;
                const splashThreshold = surfaceY - cfg.dropSize.splash.h * 0.3;
                if (d.y >= splashThreshold) {
                    d.phase   = 'splash';
                    d.y       = surfaceY;
                    d.elapsed = 0;
                    ripples.push({ x: d.x, y: surfaceY, r: cfg.ripple.r, maxR: cfg.ripple.maxR, alpha: cfg.ripple.alpha });
                    surfaceWaves.push({ x: d.x, amp: cfg.wave.amp, elapsed: 0 });
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
        // チャンバー内部の範囲
        const clipLeft  = canvasW * cfg.clip.left;
        const clipRight = canvasW * cfg.clip.right;
        const clipTop   = canvasH * cfg.clip.top;
        const clipBot   = canvasH * cfg.clip.bot;

        const steps = 40;
        const pts = [];
        for (let i = 0; i <= steps; i++) {
            const px = clipLeft + ((clipRight - clipLeft) / steps) * i;
            let py = surfaceY;
            surfaceWaves.forEach(sw => {
                const dist = px - sw.x;
                const tSec = sw.elapsed / 1000;
                py += sw.amp * Math.sin((dist / cfg.wave.wavelength) - tSec * 18) *
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
            ctx.lineWidth = cfg.ripple.lineWidth;
            ctx.stroke();
        });
        ctx.beginPath();
        ctx.moveTo(pts[0].px, pts[0].py);
        pts.forEach(p => ctx.lineTo(p.px, p.py));
        ctx.strokeStyle = 'rgba(180,180,180,0.45)';
        ctx.lineWidth = cfg.surfaceLineWidth;
        ctx.stroke();

        ctx.restore();
    }

    function drawDrops() {
        const size = cfg.dropSize;
        drops.forEach(d => {
            if (d.phase === 'grow') {
                // tekika1: 成長アニメーション（徐々に拡大）
                const progress = Math.min(d.elapsed / GROW_MS, 1);
                const sw = size.grow.w * progress;
                const sh = size.grow.h * progress;
                const img = dropImgs[0];
                if (img && img.complete && sw > 0) {
                    ctx.drawImage(img, tipX - sw / 2 - 1, tipY, sw, sh);
                }

            } else if (d.phase === 'fall') {
                // tekika3: 落下中・速度に応じて縦方向にわずかに伸びる
                const stretch = Math.min(1 + d.vy * 0.022, 1.25);
                const sw = size.fall.w;
                const sh = size.fall.h * stretch;
                const img = dropImgs[2];
                if (img && img.complete) {
                    ctx.drawImage(img, d.x - sw / 2, d.y - sh / 2, sw, sh);
                }

            } else if (d.phase === 'splash') {
                // tekika4: 着水・フェードアウト
                const alpha = 1 - d.elapsed / SPLASH_MS;
                const sw = size.splash.w;
                const sh = size.splash.h;
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

    function start(intervalSec) {
        stop();
        afterFrames(cfg.initDelayFrames, () => {
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
        });
    }

    function stop() {
        if (animFrameId)    { cancelAnimationFrame(animFrameId); animFrameId = null; }
        if (dropIntervalId) { clearInterval(dropIntervalId); dropIntervalId = null; }
        drops = []; ripples = []; surfaceWaves = [];
        lastTime = null;
        if (canvasW > 0) ctx.clearRect(0, 0, canvasW, canvasH);
    }

    return { start, stop };
}

// ============================================================
// 結果画面のチャンバー（地域プロファイルの tubing[].chamber から生成）
// ============================================================
const chamberViews = {};   // チャンバーキー → { wrap, animator }

function renderChambers() {
    const area = document.getElementById('chamberArea');
    region.tubing.forEach(tubing => {
        const key = tubing.chamber;
        if (chamberViews[key]) return;   // 複数のルートで同じチャンバーを共有する場合
        const cfg = CHAMBERS[key];
        const wrap = document.createElement('div');
        wrap.className = 'chamber-wrap';
        // 最初のチャンバー以外は非表示で用意しておく
        if (Object.keys(chamberViews).length > 0) wrap.style.display = 'none';
        const img = document.createElement('img');
        img.src = cfg.image;
        img.className = 'chamber-img';
        const canvas = document.createElement('canvas');
        canvas.className = 'drop-canvas';
        wrap.append(img, canvas);
        area.appendChild(wrap);
        chamberViews[key] = { wrap, animator: createDropAnimator(cfg, img, canvas) };
    });
}

renderChambers();

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

    const bannerAdSpaceInput  = document.getElementById('bannerAdSpace');
    const bannerAdSpaceResult = document.getElementById('bannerAdSpaceResult');
    let bannerVisible = false;
    let onResultScreen = false;
    let bannerHeightPx = 60; // 実測前の概算値（bannerAdSizeChangedで上書きされる）

    // 現在表示中の画面を一番下までスクロールしたときだけ広告を表示する。
    // 広告はビューポート最下部に重なって表示されるため、広告の高さ分を
    // 差し引いた位置を「一番下」とみなし、戻るボタン/プライバシーポリシーと重ならないようにする。
    function updateBannerVisibility() {
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - bannerHeightPx - 1;
        if (atBottom && !bannerVisible) {
            bannerVisible = true;
            AdMob.resumeBanner().catch(() => {});
            applyBannerSpaceHeight(bannerHeightPx);
        } else if (!atBottom && bannerVisible) {
            bannerVisible = false;
            AdMob.hideBanner().catch(() => {});
            applyBannerSpaceHeight(0);
        }
    }

    // 表示中の画面に応じて広告枠の高さを反映する（非表示側は常に高さ0）
    function applyBannerSpaceHeight(heightPx) {
        const inactiveSpace = onResultScreen ? bannerAdSpaceInput : bannerAdSpaceResult;
        if (inactiveSpace) inactiveSpace.style.height = '0';

        if (onResultScreen) {
            // 結果画面は1画面に収まるレイアウトでスクロール余地がほぼないため、
            // 広告の実サイズちょうどの余白だと、端末のdp→px換算誤差（特に高密度エミュレータ等）で
            // 広告が戻るボタンにわずかに重なることがある。そのため実サイズより少し多めに確保する。
            const RESULT_SPACE_MARGIN_RATIO = 1.2;
            if (bannerAdSpaceResult) bannerAdSpaceResult.style.height = heightPx > 0 ? Math.round(heightPx * RESULT_SPACE_MARGIN_RATIO) + 'px' : '0';
        } else {
            // 入力画面はプライバシーポリシー等の余白があるため、
            // 古い端末のdp→px換算誤差を吸収する安全マージン係数で余白を詰める。
            const BANNER_SPACE_SAFETY_RATIO = 0.5;
            if (bannerAdSpaceInput) bannerAdSpaceInput.style.height = heightPx > 0 ? Math.round(heightPx * BANNER_SPACE_SAFETY_RATIO) + 'px' : '0';
        }
    }

    try {
        await AdMob.initialize({});

        // 広告の表示/非表示に連動して広告枠の高さを切り替える（非表示中は高さ0）
        AdMob.addListener('bannerAdSizeChanged', (info) => {
            if (!info) return;
            if (info.height > 0) {
                bannerHeightPx = info.height;
            }
            applyBannerSpaceHeight(info.height > 0 ? info.height : 0);
            updateBannerVisibility();
        });

        await AdMob.showBanner(bannerOptions);
        await AdMob.hideBanner().catch(() => {});

        window.addEventListener('scroll', updateBannerVisibility, { passive: true });
        updateBannerVisibility();

        // 画面切り替え時は一旦非表示状態にリセットし、切り替え後の画面のスクロール位置で再判定する
        calculateBtn.addEventListener('click', () => {
            onResultScreen = true;
            bannerVisible = false;
            AdMob.hideBanner().catch(() => {});
            applyBannerSpaceHeight(0);
            updateBannerVisibility();
        });
        backBtn.addEventListener('click', () => {
            onResultScreen = false;
            bannerVisible = false;
            AdMob.hideBanner().catch(() => {});
            applyBannerSpaceHeight(0);
            updateBannerVisibility();
        });
    } catch (e) {
        console.warn('AdMob init failed:', e);
    }
})();