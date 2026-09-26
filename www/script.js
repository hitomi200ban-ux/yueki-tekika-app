// ============================================================
// 地域・言語
// 地域（臨床ルール）は regions/、文言は i18n/、チャンバー画像は chambers.js に置く
// ============================================================
// どの地域の言語にも当てはまらないときの地域
const DEFAULT_REGION_ID = 'US';
// ユーザーが地域を選んだときの保存先
const REGION_STORAGE_KEY = 'regionId';

// 保存済みの地域（なければ null）
function loadSavedRegionId() {
    try {
        const saved = localStorage.getItem(REGION_STORAGE_KEY);
        return saved && REGIONS[saved] ? saved : null;
    } catch (e) {
        return null;   // 保存領域が使えない環境
    }
}

function saveRegionId(regionId) {
    try { localStorage.setItem(REGION_STORAGE_KEY, regionId); } catch (e) { /* 保存できなくても動作は続ける */ }
}

// 端末の言語から地域を判定する（日本語 → JP、それ以外 → 既定の US）
function detectRegionFromLanguage() {
    const lang = (navigator.language || '').toLowerCase();
    const match = Object.keys(REGIONS).find(id =>
        (REGIONS[id].languages || []).some(prefix => lang.startsWith(prefix)));
    return match || DEFAULT_REGION_ID;
}

// 地域を決める：保存済みならそれを使う。初回起動（未保存）のときだけ端末の言語で判定して保存する。
// 保存後は端末の言語が変わっても判定し直さない（変えるときは地域切替から）
function resolveRegionId() {
    const saved = loadSavedRegionId();
    if (saved) return saved;
    const detected = detectRegionFromLanguage();
    saveRegionId(detected);
    return detected;
}

const region  = REGIONS[resolveRegionId()];
const strings = STRINGS[region.locale];

// 地域によって存在しない文言（ヒントや注意書き）があるかどうか
function hasString(key) {
    return strings[key] !== undefined;
}

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
    // 免責表示は地域プロファイルで指定されたときだけ出す
    if (region.disclaimerKey) {
        const disclaimer = document.getElementById('disclaimer');
        disclaimer.textContent = t(region.disclaimerKey);
        disclaimer.hidden = false;
    }
}

applyStrings();

// ============================================================
// 地域切替（入力画面の一番下のリンク → 地域の選択画面）
// ============================================================
function renderRegionSwitcher() {
    const link = document.getElementById('regionLink');
    link.textContent = t('region.current', { name: region.nativeName });
    link.addEventListener('click', openRegionSheet);
}

function openRegionSheet() {
    const overlay = document.createElement('div');
    overlay.className = 'region-sheet';
    const panel = document.createElement('div');
    panel.className = 'region-sheet-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');

    const title = document.createElement('p');
    title.className = 'region-sheet-title';
    title.textContent = t('region.title');
    panel.appendChild(title);

    Object.values(REGIONS).forEach(r => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'region-option' + (r.id === region.id ? ' active' : '');
        const name = document.createElement('span');
        name.className = 'region-option-name';
        name.textContent = r.nativeName;
        const lang = document.createElement('span');
        lang.className = 'region-option-lang';
        lang.textContent = r.languageName;
        option.append(name, lang);
        option.addEventListener('click', () => {
            if (r.id === region.id) { overlay.remove(); return; }
            switchRegion(r.id);
        });
        panel.appendChild(option);
    });

    const note = document.createElement('p');
    note.className = 'region-sheet-note';
    note.textContent = t('region.note');
    panel.appendChild(note);

    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'region-sheet-cancel';
    cancel.textContent = t('region.cancel');
    cancel.addEventListener('click', () => overlay.remove());
    panel.appendChild(cancel);

    // パネルの外側をタップしても閉じる
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
}

// 選んだ地域を保存して読み込み直す
function switchRegion(regionId) {
    saveRegionId(regionId);
    // ネイティブの広告バナーはページを読み込み直しても残り、読み込み後に表示されなくなるため、先に取り除く
    const AdMob = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;
    const removed = AdMob ? AdMob.removeBanner().catch(() => {}) : Promise.resolve();
    removed.then(() => location.reload());
}

renderRegionSwitcher();

// ============================================================
// 滴下計算（全地域共通）
// 滴下数（滴/分）= 輸液量(mL) × 滴下係数(滴/mL) ÷ 投与時間(分)
// ============================================================
function calcDropRate(volumeMl, dropFactor, totalMinutes) {
    return (volumeMl * dropFactor) / totalMinutes;
}

// 表示用の四捨五入。浮動小数点の誤差で境目の値（0.45 が 0.44999… になる等）が
// 切り下がらないよう、ごく小さな値を足してから丸める
const ROUND_EPSILON = 1e-9;

// 最も近い整数へ四捨五入
function roundHalfUp(x) {
    return Math.round(x + ROUND_EPSILON);
}

// 小数第1位へ四捨五入した文字列
function toFixed1(x) {
    return (Math.round(x * 10 + ROUND_EPSILON) / 10).toFixed(1);
}

// 表示用の小数（地域プロファイルに decimalSeparator があればその記号にする。例：pt-BR は 2,4）
function formatDecimal1(x) {
    const s = toFixed1(x);
    return region.decimalSeparator ? s.replace('.', region.decimalSeparator) : s;
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
    applyUnitStrings();
}

// ============================================================
// 単位の文言（ルートごとの差し替え）
// 地域プロファイルの tubing[].units に「既定のキー → 使うキー」があるルートだけ差し替える
// （スペイン語版の Microgotero → microgotas など）。差し替えのないルートは既定の文言のまま
// ============================================================
const UNIT_STRING_KEYS = [
    'summary.dropUnit',
    'formula.dropUnit',
    'formula.resultUnit',
    'result.rateUnit',
    'result.intervalLabel',
];

function unitKey(key) {
    const units = selectedTubing && selectedTubing.units;
    return (units && units[key]) || key;
}

// ルートを選び直したときに前のルートの単位が残らないよう、毎回すべて書き直す
function applyUnitStrings() {
    UNIT_STRING_KEYS.forEach(key => {
        document.querySelectorAll(`[data-i18n="${key}"]`).forEach(el => {
            el.textContent = t(unitKey(key));
        });
    });
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
        if (v.image) {
            const img = document.createElement('img');
            img.src = v.image;
            img.alt = v.ml + 'ml';
            item.appendChild(img);
        } else {
            // 画像が用意されるまでは容量を大きく表示したカードで代用する
            const card = document.createElement('div');
            card.className = 'volume-placeholder';
            const num = document.createElement('span');
            num.className = 'volume-placeholder-num';
            num.textContent = v.ml;
            const unit = document.createElement('span');
            unit.className = 'volume-placeholder-unit';
            unit.textContent = 'mL';
            card.append(num, unit);
            item.appendChild(card);
        }
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
// 滴下係数を複数から選ぶルート（US の Macrodrip など）用の選択欄。該当ルートがない地域では作らない
let factorGroup = null;

function selectTubing(tubing, btn) {
    const changed = tubing !== selectedTubing;
    selectedTubing = tubing;
    // 滴下係数が1つだけのルートは、ボタン選択で係数も確定する。
    // 複数あるルートは係数ボタンで選ぶまで未確定（同じルートを押し直したときは選択を保つ）
    if (tubing.factors.length === 1) {
        selectedFactor = tubing.factors[0];
    } else if (changed) {
        selectedFactor = null;
    }
    tubingGroup.querySelectorAll('.type-btn').forEach(el => el.classList.toggle('active', el === btn));
    if (factorGroup) renderFactorOptions();
    updateSummary();
}

function selectFactor(factor) {
    selectedFactor = factor;
    renderFactorOptions();
    updateSummary();
}

// 選択中のルートの滴下係数ボタンを表示する（係数が1つだけのルートでは隠す）
function renderFactorOptions() {
    const options = factorGroup.querySelector('.factor-options');
    options.textContent = '';
    if (!selectedTubing || selectedTubing.factors.length === 1) {
        factorGroup.hidden = true;
        return;
    }
    selectedTubing.factors.forEach(factor => {
        const btn = document.createElement('button');
        btn.className = 'factor-btn' + (factor === selectedFactor ? ' active' : '');
        btn.textContent = factor;
        btn.addEventListener('click', () => selectFactor(factor));
        options.appendChild(btn);
    });
    factorGroup.hidden = false;
}

function renderTubingButtons() {
    // 見出しの横のヒント（例：Select drip factor）
    if (hasString('tubing.hint')) {
        const label = tubingGroup.parentElement.querySelector('label');
        const row = document.createElement('div');
        row.className = 'label-hint-row';
        const hint = document.createElement('p');
        hint.className = 'swipe-hint';
        hint.textContent = t('tubing.hint');
        label.replaceWith(row);
        row.append(label, hint);
    }

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
        if (tubing.subLabelKey) {
            const sub = document.createElement('span');
            sub.className = 'type-sub';
            sub.textContent = t(tubing.subLabelKey);
            btn.appendChild(sub);
        }
        btn.addEventListener('click', () => selectTubing(tubing, btn));
        tubingGroup.appendChild(btn);
    });

    if (region.tubing.some(tubing => tubing.factors.length > 1)) {
        factorGroup = document.createElement('div');
        factorGroup.className = 'factor-group';
        factorGroup.hidden = true;
        const label = document.createElement('span');
        label.className = 'factor-label';
        label.textContent = t('tubing.factorLabel');
        const options = document.createElement('div');
        options.className = 'factor-options';
        const unit = document.createElement('span');
        unit.className = 'factor-unit';
        unit.textContent = t('tubing.factorUnit');
        factorGroup.append(label, options, unit);
        tubingGroup.after(factorGroup);
    }

    // ルート選択欄の下の注意書き（例：滴下係数はチューブの包装で確認）
    if (hasString('tubing.note')) {
        const note = document.createElement('p');
        note.className = 'tubing-note';
        note.textContent = t('tubing.note');
        (factorGroup || tubingGroup).after(note);
    }
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
    if (!selectedTubing) { alert(t('alert.tubing')); return; }
    if (!selectedFactor) { alert(t('alert.dropFactor')); return; }
    if (hours <= 0) { alert(t('alert.time')); return; }

    const dropFactor = selectedFactor;
    const dropRate = calcDropRate(volume, dropFactor, hours * 60);
    const dropInterval = 60 / dropRate;

    const dropRateRound = roundHalfUp(dropRate);
    const dropRateExact = formatDecimal1(dropRate);
    const secPerDrop = formatDecimal1(60 / dropRate);

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
    document.getElementById('fExact').textContent    = formatDecimal1(dropRate);
    document.getElementById('fApprox').textContent   = roundHalfUp(dropRate);
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

// 先に予約した音（戻る・音OFFのときに止める）
const pendingTicks = [];

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
    pendingTicks.push(osc);
    osc.onended = () => {
        const i = pendingTicks.indexOf(osc);
        if (i >= 0) pendingTicks.splice(i, 1);
    };
}

function cancelPendingTicks() {
    pendingTicks.splice(0).forEach(osc => {
        try { osc.stop(); } catch (e) { /* 既に止まっている */ }
    });
}

function startTickSound(intervalSec) {
    currentTickInterval = intervalSec;
    // 音はアニメーションの着水タイミングで鳴らすため、ここではAudioCtxの初期化のみ
    if (soundOn) getAudioCtx();
}

function stopTickSound() {
    // 音はアニメーション側で少し先まで予約しているので、まだ鳴っていない分を取り消す
    cancelPendingTicks();
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
// 落下の計算の基準（60fps の1フレーム）
const FRAME_MS = 1000 / 60;
// 音を何ms先まで予約しておくか（画面の描き直しが一瞬止まってもリズムが崩れないように）
const SOUND_LOOKAHEAD_MS = 250;
// これより遅れた音は鳴らさずに飛ばす（遅れた音をまとめて鳴らすとリズムが崩れるため）
const SOUND_LATE_MS = 30;

// 落下開始から f フレーム後の移動量（px）。
// 1フレームごとに「速度 += 0.32、位置 += 速度」（初速 1.8）と進めた場合と同じ値になる式
function fallDistance(f) {
    return 1.96 * f + 0.16 * f * f;
}

// 落下開始から f フレーム後の速度（水滴の縦の伸びに使う）
function fallVelocity(f) {
    return 1.8 + 0.32 * f;
}

// 距離 distance を落ちるのにかかるフレーム数（fallDistance の逆算）
function fallFrames(distance) {
    return (-1.96 + Math.sqrt(1.96 * 1.96 + 0.64 * Math.max(distance, 0))) / 0.32;
}

// n フレーム待ってから fn を実行する（0 なら即実行）
function afterFrames(n, fn) {
    if (n <= 0) { fn(); return; }
    requestAnimationFrame(() => afterFrames(n - 1, fn));
}

// チャンバー1つ分のアニメーションを作る（cfg は chambers.js の設定）
function createDropAnimator(cfg, chamberImg, canvas) {
    const ctx = canvas.getContext('2d');

    let tipX = 0, tipY = 0, canvasW = 0, canvasH = 0;
    let animFrameId     = null;
    let soundTimerId    = null;
    let lastTime        = null;
    let drops           = [];
    let ripples         = [];
    let surfaceWaves    = [];
    // 滴下の時刻表：k 滴目は startTime + k × intervalMs に出はじめる。
    // タイマーで1滴ずつ作るのではなく時刻から計算するので、描き直しが遅れてもずれがたまらない
    let startTime       = 0;
    let intervalMs      = 1000;
    let fallMs          = 0;    // 落下にかかる時間
    let lastSplashIndex = -1;   // 波紋を出し終えた最後の水滴
    let nextSoundIndex  = 0;    // 次に音を予約する水滴

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

    // 落下にかかる時間を求める（キャンバスの大きさが決まってから）
    function computeFallMs() {
        const startY = tipY + cfg.spawnOffsetY;
        const splashThreshold = getSurfaceY() - cfg.dropSize.splash.h * 0.3;
        fallMs = fallFrames(splashThreshold - startY) * FRAME_MS;
    }

    // k 滴目が水面に着く時刻
    function splashTimeOf(k) {
        return startTime + k * intervalMs + GROW_MS + fallMs;
    }

    // 時刻 now に見えている水滴を、時刻表から計算して並べる
    function updateDrops(now) {
        const surfaceY = getSurfaceY();
        const startY   = tipY + cfg.spawnOffsetY;
        const lifeMs   = GROW_MS + fallMs + SPLASH_MS;
        const first = Math.max(0, Math.ceil((now - startTime - lifeMs) / intervalMs));
        const last  = Math.floor((now - startTime) / intervalMs);
        // 描き直しが長く止まっている間に消えた水滴の波紋は出さない
        lastSplashIndex = Math.max(lastSplashIndex, first - 1);

        drops = [];
        for (let k = first; k <= last; k++) {
            const age = now - (startTime + k * intervalMs);
            if (age < GROW_MS) {
                drops.push({ phase: 'grow', x: tipX, y: startY, vy: 0, elapsed: age });
            } else if (age < GROW_MS + fallMs) {
                const f = (age - GROW_MS) / FRAME_MS;
                drops.push({ phase: 'fall', x: tipX, y: startY + fallDistance(f), vy: fallVelocity(f), elapsed: age - GROW_MS });
            } else {
                drops.push({ phase: 'splash', x: tipX, y: surfaceY, vy: 0, elapsed: age - GROW_MS - fallMs });
                if (k > lastSplashIndex) {
                    lastSplashIndex = k;
                    ripples.push({ x: tipX, y: surfaceY, r: cfg.ripple.r, maxR: cfg.ripple.maxR, alpha: cfg.ripple.alpha });
                    surfaceWaves.push({ x: tipX, amp: cfg.wave.amp, elapsed: 0 });
                }
            }
        }
    }

    // 着水の音を少し先まで予約する。音は AudioContext の時計で鳴るので、
    // 画面の描き直しが一瞬止まっても一定のリズムで鳴る
    function scheduleSounds() {
        const now = performance.now();
        // 見た目と合わせるため、チャンバーごとに音を遅らせる（soundDelayMs）。
        // 着水の絵は着水時刻の次のフレームで出るので、その平均（半フレーム）も足す
        const delayMs = (cfg.soundDelayMs || 0) + FRAME_MS / 2;
        const soundTimeOf = k => splashTimeOf(k) + delayMs;
        while (soundTimeOf(nextSoundIndex) < now - SOUND_LATE_MS) nextSoundIndex++;
        if (!soundOn || !audioCtx) return;
        while (soundTimeOf(nextSoundIndex) <= now + SOUND_LOOKAHEAD_MS) {
            const waitMs = Math.max(0, soundTimeOf(nextSoundIndex) - now);
            scheduleTick(audioCtx, audioCtx.currentTime + waitMs / 1000);
            nextSoundIndex++;
        }
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
        const dt = Math.min(timestamp - lastTime, 50); // 波紋用。最大50ms（タブ非表示復帰対策）
        lastTime = timestamp;

        ctx.clearRect(0, 0, canvasW, canvasH);
        updateDrops(timestamp);
        updateRipples(dt);
        scheduleSounds();
        drawSurface();
        drawDrops();
        animFrameId = requestAnimationFrame(renderFrame);
    }

    function start(intervalSec) {
        stop();
        afterFrames(cfg.initDelayFrames, () => {
            const doStart = () => {
                initCanvas();
                computeFallMs();
                drops = []; ripples = []; surfaceWaves = [];
                lastTime = null;
                intervalMs      = intervalSec * 1000;
                startTime       = performance.now();
                lastSplashIndex = -1;
                nextSoundIndex  = 0;
                renderFrame(startTime);
                // 描き直しが遅れているときも音の予約が途切れないよう、タイマーでも予約する
                soundTimerId = setInterval(scheduleSounds, 100);
            };
            if (chamberImg.complete && chamberImg.naturalWidth > 0) {
                doStart();
            } else {
                chamberImg.onload = doStart;
            }
        });
    }

    function stop() {
        if (animFrameId)  { cancelAnimationFrame(animFrameId); animFrameId = null; }
        if (soundTimerId) { clearInterval(soundTimerId); soundTimerId = null; }
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
    // 今どちらの画面か。広告の準備が終わる前に計算された場合もずれないよう、画面の実際の状態で判定する
    const isResultScreen = () => resultScreen.classList.contains('active');
    let bannerHeightPx = 60; // 実測前の概算値（bannerAdSizeChangedで上書きされる）
    // バナーが WebView の下端から持ち上がっている量（Android 15 以上でナビゲーションバーの高さ。AdLayoutPlugin から取得）
    let bannerOffsetPx = 0;
    // 画面の一番下のボタン（入力画面は地域切替リンク、結果画面は戻るボタン）と広告の間に必ず空けるすき間
    const BANNER_GAP_PX = 12;

    // バナーの実際の位置（持ち上がり量）を Android 側から取得する
    async function refreshBannerOffset() {
        const AdLayout = window.Capacitor.Plugins && window.Capacitor.Plugins.AdLayout;
        if (!AdLayout) return;
        try {
            const res = await AdLayout.getBannerBottomOffset();
            bannerOffsetPx = res && res.offset > 0 ? res.offset : 0;
        } catch (e) { /* 取得できないときは持ち上がりなしとみなす */ }
    }

    // 現在表示中の画面を一番下までスクロールしたときだけ広告を表示する。
    // 広告はビューポート最下部に重なって表示されるため、広告が覆う範囲（高さ＋持ち上がり量）を
    // 差し引いた位置を「一番下」とみなし、戻るボタン/地域切替リンクと重ならないようにする。
    function updateBannerVisibility() {
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - (bannerHeightPx + bannerOffsetPx) - 1;
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

    // 要素の下端のページ上の位置。画面切り替えのアニメーション（translateY）の影響を受けないよう、
    // getBoundingClientRect ではなくレイアウト上の位置（offsetTop の合計）で求める
    function layoutBottom(el) {
        let y = el.offsetHeight;
        for (let e = el; e; e = e.offsetParent) y += e.offsetTop;
        return y;
    }

    // 表示中の画面に応じて広告枠の高さを反映する（非表示側は常に高さ0）。
    // 一番下までスクロールしたとき、一番下のボタンの下端と広告の上端の間に BANNER_GAP_PX のすき間ができる高さにする
    function applyBannerSpaceHeight(heightPx) {
        const onResult = isResultScreen();
        const space    = onResult ? bannerAdSpaceResult : bannerAdSpaceInput;
        const inactive = onResult ? bannerAdSpaceInput : bannerAdSpaceResult;
        if (inactive) inactive.style.height = '0';
        if (!space) return;
        if (heightPx <= 0) { space.style.height = '0'; return; }

        const lastControl = onResult ? backBtn : document.getElementById('regionLink');
        // 一番下のボタンの下端からページの末尾までのうち、広告枠以外の部分（body の余白など）
        const controlBottom = layoutBottom(lastControl);
        const tail = document.documentElement.scrollHeight - controlBottom - space.offsetHeight;
        const needed = heightPx + bannerOffsetPx + BANNER_GAP_PX - tail;
        space.style.height = Math.max(0, Math.ceil(needed)) + 'px';
    }

    try {
        await AdMob.initialize({});
        // 持ち上がり量は画面の向きが変わらない限り一定なので、起動時に一度だけ取得する
        // （通知ごとに取得を待つと、非表示→表示の通知の処理順が入れ替わり余白が 0 のまま残る）
        await refreshBannerOffset();

        // 広告の表示/非表示に連動して広告枠の高さを切り替える（非表示中は高さ0）
        AdMob.addListener('bannerAdSizeChanged', (info) => {
            if (!info) return;
            if (info.height > 0) {
                bannerHeightPx = info.height;
            }
            // 非表示（高さ0）の通知が表示のあとに届くことがあるため、通知の値ではなく
            // 今広告を出しているかどうかで余白を決める
            applyBannerSpaceHeight(bannerVisible ? bannerHeightPx : 0);
            updateBannerVisibility();
        });

        await AdMob.showBanner(bannerOptions);
        await AdMob.hideBanner().catch(() => {});

        window.addEventListener('scroll', updateBannerVisibility, { passive: true });
        updateBannerVisibility();

        // 画面切り替え時は一旦非表示状態にリセットし、切り替え後の画面のスクロール位置で再判定する
        calculateBtn.addEventListener('click', () => {
            bannerVisible = false;
            AdMob.hideBanner().catch(() => {});
            applyBannerSpaceHeight(0);
            updateBannerVisibility();
        });
        backBtn.addEventListener('click', () => {
            bannerVisible = false;
            AdMob.hideBanner().catch(() => {});
            applyBannerSpaceHeight(0);
            updateBannerVisibility();
        });
    } catch (e) {
        console.warn('AdMob init failed:', e);
    }
})();