// ============================================================
// ポルトガル語版プロファイル（ブラジル式 pt-BR を基準にした1版）
// 重力滴下の計算（gotas/min・microgotas/min）のみ。輸液ポンプ（mL/h）の計算は扱わない
// チャンバー画像は英語版と共通。輸液バッグ画像だけブラジル版専用（img/br）
// ============================================================
window.REGIONS = window.REGIONS || {};

REGIONS['PT'] = {
    id: 'PT',
    locale: 'pt-BR',
    // 端末の言語がこれで始まるときにこの地域を選ぶ（pt-BR, pt-PT など）
    languages: ['pt'],
    // 地域切替で表示する名前（その地域の言葉で）
    nativeName: 'Português',
    languageName: 'Português',
    privacyUrl: 'https://hitomi200ban-ux.github.io/privacy-policy-yueki/pt.html',
    // 入力画面に表示する免責文（i18n のキー）
    disclaimerKey: 'disclaimer',
    // 結果の小数点はブラジル式のカンマ（2,4 / 24,7）
    decimalSeparator: ',',

    // 輸液量プリセット（バッグ画像はブラジル版専用。50 mL はブラジルで一般的な製品が見当たらないため置かない＝Outro volume で入力）
    volumes: [
        { ml: 1000, image: './img/br/bag_1000ml.png' },
        { ml: 500,  image: './img/br/bag_500ml.png' },
        { ml: 250,  image: './img/br/bag_250ml.png' },
        { ml: 100,  image: './img/br/bag_100ml.png' },
    ],
    initialVolumeIndex: 1,

    // Equipo（ブラジルの規格 ABNT NBR ISO 8536-4 に合わせ、Macrogotas は 20・Microgotas は 60 で固定）
    // 係数が1つだけなので、ルートを選ぶと係数も確定する（係数ボタンは出ない）
    tubing: [
        {
            id: 'macro',
            image: './img/us/macrodrip.png',
            labelKey: 'tubing.macro',
            subLabelKey: 'tubing.macroSub',
            altKey: 'tubing.macroAlt',
            factors: [20],
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
