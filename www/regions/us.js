// ============================================================
// 米国版プロファイル（US clinical practice に合わせた設定）
// 重力滴下の計算（gtt/min）のみ。輸液ポンプ（mL/hr）の計算は扱わない
// ============================================================
window.REGIONS = window.REGIONS || {};

REGIONS['US'] = {
    id: 'US',
    locale: 'en-US',
    // 端末の言語がこれで始まるときにこの地域を選ぶ
    languages: ['en'],
    // 地域切替で表示する名前（その地域の言葉で）
    nativeName: 'United States',
    languageName: 'English',
    privacyUrl: 'https://hitomi200ban-ux.github.io/privacy-policy-yueki/en.html',
    // 入力画面に表示する免責文（i18n のキー）
    disclaimerKey: 'disclaimer',

    // 輸液量プリセット（image が null の間は mL 表示のカードで代用する）
    volumes: [
        { ml: 1000, image: './img/us/bag_1000ml.png' },
        { ml: 500,  image: './img/us/bag_500ml.png' },
        { ml: 250,  image: './img/us/bag_250ml.png' },
        { ml: 100,  image: './img/us/bag_100ml.png' },
        { ml: 50,   image: './img/us/bag_50ml.png' },
    ],
    initialVolumeIndex: 1,

    // IV Tubing（Macrodrip は 10/15/20 から選択、Microdrip は 60 固定）
    tubing: [
        {
            id: 'macro',
            image: './img/us/macrodrip.png',
            labelKey: 'tubing.macro',
            subLabelKey: 'tubing.macroSub',
            altKey: 'tubing.macroAlt',
            factors: [10, 15, 20],
            chamber: 'usMacro',
            accentColor: '#66bb6a',
        },
        {
            id: 'micro',
            image: './img/us/microdrip.png',
            labelKey: 'tubing.micro',
            subLabelKey: 'tubing.microSub',
            altKey: 'tubing.microAlt',
            factors: [60],
            chamber: 'usMicro',
            accentColor: '#f48fb1',
        },
    ],
};
