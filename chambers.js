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
};
