// ============================================================
// 日本版プロファイル（日本の臨床に合わせた設定）
// 地域ごとの「臨床ルール」をまとめる。文言は i18n/ 側の辞書に置く。
// ============================================================
window.REGIONS = window.REGIONS || {};

REGIONS['JP'] = {
    id: 'JP',
    locale: 'ja',
    privacyUrl: 'https://hitomi200ban-ux.github.io/privacy-policy-yueki/',

    // 輸液量プリセット（スワイパーの並び順。手動入力はこの後ろに付く）
    volumes: [
        { ml: 1500, image: './img/1500ml.PNG' },
        { ml: 500,  image: './img/500ml.PNG' },
        { ml: 200,  image: './img/200ml.PNG' },
        { ml: 100,  image: './img/100ml.PNG' },
        { ml: 50,   image: './img/50ml.PNG' },
    ],
    // 起動時にスワイパーで表示しておく位置（0始まり）
    initialVolumeIndex: 1,

    // 輸液ルート
    // factors: 選べる滴下係数（滴/mL）。1つだけならボタン選択で確定する
    // chamber: 結果画面のチャンバー（chambers.js のキー）
    // accentColor: 結果画面「○秒に1滴」の文字色
    tubing: [
        {
            id: 'adult',
            image: './img/seizinyou.PNG',
            labelKey: 'tubing.adult',
            altKey: 'tubing.adultAlt',
            factors: [20],
            chamber: 'jpAdult',
            accentColor: '#66bb6a',
        },
        {
            id: 'child',
            image: './img/sixyouniyou.PNG',
            labelKey: 'tubing.child',
            altKey: 'tubing.childAlt',
            factors: [60],
            chamber: 'jpChild',
            accentColor: '#f48fb1',
        },
    ],
};
