// ============================================================
// スペイン語版プロファイル（スペイン＋中南米で共通の1版）
// 重力滴下の計算（gotas/min・microgotas/min）のみ。輸液ポンプ（mL/h）の計算は扱わない
// 画像とチャンバーは英語版と共通（画像に文字は mL だけ）
// ============================================================
window.REGIONS = window.REGIONS || {};

REGIONS['ES'] = {
    id: 'ES',
    locale: 'es',
    // 端末の言語がこれで始まるときにこの地域を選ぶ（es-MX, es-419, es-ES など）
    languages: ['es'],
    // 地域切替で表示する名前（その地域の言葉で）
    nativeName: 'Español',
    languageName: 'Español',
    privacyUrl: 'https://hitomi200ban-ux.github.io/privacy-policy-yueki/es.html',
    // 入力画面に表示する免責文（i18n のキー）
    disclaimerKey: 'disclaimer',

    // 輸液量プリセット
    volumes: [
        { ml: 1000, image: './img/us/bag_1000ml.png' },
        { ml: 500,  image: './img/us/bag_500ml.png' },
        { ml: 250,  image: './img/us/bag_250ml.png' },
        { ml: 100,  image: './img/us/bag_100ml.png' },
        { ml: 50,   image: './img/us/bag_50ml.png' },
    ],
    initialVolumeIndex: 1,

    // Equipo de infusión（Macrogotero は 10/15/20 から選択、Microgotero は 60 固定）
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
            // 単位の文言をこのルートだけ差し替える（既定のキー → 使うキー）
            units: {
                'summary.dropUnit':     'summary.dropUnitMicro',
                'formula.dropUnit':     'formula.dropUnitMicro',
                'formula.resultUnit':   'formula.resultUnitMicro',
                'result.rateUnit':      'result.rateUnitMicro',
                'result.intervalLabel': 'result.intervalLabelMicro',
            },
        },
    ],
};
