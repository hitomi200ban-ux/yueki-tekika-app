// ============================================================
// 結果画面のチャンバー画像と滴下アニメーション設定
// 座標はすべて画像サイズに対する割合。地域プロファイルの tubing[].chamber から参照される。
// ============================================================
window.CHAMBERS = window.CHAMBERS || {};

// 成人用（seizinyou_tekika.PNG）
CHAMBERS['jpAdult'] = {
    image: './img/seizinyou_tekika.PNG',
    tip: { x: 0.50, y: 0.295 },         // 緑先端位置
    surfaceY: 0.62,                     // 水面位置
    clip: { left: 0.32, right: 0.68, top: 0.33, bot: 0.88 },  // チャンバー内部
    dropSize: {                         // 各フェーズの画像サイズ（canvas px）
        grow:   { w: 22, h: 14 },
        fall:   { w: 23, h: 23 },
        splash: { w: 32, h: 20 },
    },
    spawnOffsetY: 14,                   // 生成時に先端から下げる量（落下開始位置）
    ripple: { r: 3, maxR: 28, alpha: 0.65, lineWidth: 1.2 },
    wave: { amp: 3.5, wavelength: 16 },
    surfaceLineWidth: 1.5,
    initDelayFrames: 0,
    // 着水の見た目より音が早く聞こえるため、音だけ遅らせる（ms）
    soundDelayMs: 160,
};

// 小児用（sixyouni_tekika.PNG）
CHAMBERS['jpChild'] = {
    image: './img/sixyouni_tekika.PNG',
    tip: { x: 0.50, y: 0.227 },
    surfaceY: 0.585,
    clip: { left: 0.32, right: 0.69, top: 0.36, bot: 0.88 },
    dropSize: {
        grow:   { w: 8,  h: 6  },
        fall:   { w: 13, h: 13 },
        splash: { w: 18, h: 11 },
    },
    spawnOffsetY: 0,
    ripple: { r: 2, maxR: 18, alpha: 0.60, lineWidth: 1.0 },
    wave: { amp: 2.5, wavelength: 14 },
    surfaceLineWidth: 1.2,
    // 表示切り替え直後は offsetWidth/Height が取れないことがあるため2フレーム待ってから初期化
    initDelayFrames: 2,
    // 着水の見た目より音が早く聞こえるため、音だけ遅らせる（ms）
    soundDelayMs: 200,
};

// US版 Macrodrip（macrodrip_result.png）
// 日本版と同じ基準で合わせている：先端＝滴下口の下端より0.5%上、液面＝メニスカスの線
// 滴下口の太さが成人用ノズルとほぼ同じなので、水滴・波紋は成人用と同じ大きさ
CHAMBERS['usMacro'] = {
    image: './img/us/macrodrip_result.png',
    tip: { x: 0.498, y: 0.376 },
    surfaceY: 0.658,
    clip: { left: 0.325, right: 0.675, top: 0.40, bot: 0.87 },
    dropSize: {
        grow:   { w: 22, h: 14 },
        fall:   { w: 23, h: 23 },
        splash: { w: 32, h: 20 },
    },
    spawnOffsetY: 14,
    ripple: { r: 3, maxR: 28, alpha: 0.65, lineWidth: 1.2 },
    wave: { amp: 3.5, wavelength: 16 },
    surfaceLineWidth: 1.5,
    initDelayFrames: 2,
    // 着水の見た目より音が早く聞こえるため、音だけ遅らせる（ms）
    soundDelayMs: 60,
};

// US版 Microdrip（microdrip_result.png）
// 金属針の太さが小児用とほぼ同じなので、水滴・波紋は小児用と同じ大きさ
CHAMBERS['usMicro'] = {
    image: './img/us/microdrip_result.png',
    tip: { x: 0.491, y: 0.400 },
    surfaceY: 0.661,
    clip: { left: 0.31, right: 0.68, top: 0.42, bot: 0.87 },
    dropSize: {
        grow:   { w: 8,  h: 6  },
        fall:   { w: 13, h: 13 },
        splash: { w: 18, h: 11 },
    },
    spawnOffsetY: 0,
    ripple: { r: 2, maxR: 18, alpha: 0.60, lineWidth: 1.0 },
    wave: { amp: 2.5, wavelength: 14 },
    surfaceLineWidth: 1.2,
    initDelayFrames: 2,
    // 着水の見た目より音が早く聞こえるため、音だけ遅らせる（ms）
    soundDelayMs: 80,
};
