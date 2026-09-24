// ============================================================
// 英語（米国）の文言辞書
// 米国の看護・臨床教育で一般的な表記（gtt/mL, gtt/min, hr, min）に合わせる
// 単位の前のスペースは表示上必要なもの（flex 内は   を使う）
// ============================================================
window.STRINGS = window.STRINGS || {};

STRINGS['en-US'] = {
    'doc.title':            'IV Drip Rate Calculator | Gravity Drip Calculator for Nurses',
    'app.title':            'IV Drip Rate Calculator',
    'app.subtitle':         'Gravity drip calculator for nurses & nursing students',
    'common.decided':       '✓ Selected',

    // 入力画面：輸液量
    'volume.label':         'Volume',
    'volume.hint':          'Swipe or tap to select',
    'volume.manualLabel':   'Custom volume',
    'volume.manualPlaceholder': 'e.g., 250',
    'volume.manualConfirm': 'Set',
    'volume.none':          'Not selected',
    'volume.selected':      '{v} mL selected',
    'volume.manualEmpty':   'Not entered',

    // 入力画面：輸液ルート
    'tubing.label':         'IV Tubing',
    'tubing.hint':          'Select drip factor',
    'tubing.macro':         'Macrodrip',
    'tubing.macroSub':      '10 / 15 / 20 gtt/mL',
    'tubing.macroAlt':      'Macrodrip IV tubing',
    'tubing.micro':         'Microdrip',
    'tubing.microSub':      '60 gtt/mL',
    'tubing.microAlt':      'Microdrip IV tubing',
    'tubing.factorLabel':   'Drop factor',
    'tubing.factorUnit':    'gtt/mL',
    'tubing.note':          'Check the drop factor printed on the tubing package.',

    // 入力画面：投与時間
    'time.label':           'Infusion time',
    'time.hint':            'Tap to select',
    'time.hour':            'hr',
    'time.minute':          'min',

    // 入力画面：計算式サマリー
    'summary.title':        'Formula',
    'summary.dropUnit':     ' gtt/mL',
    'summary.hour':         ' hr ',
    'summary.minOpen':      ' min (',
    'summary.minClose':     ' min)',

    'calculate':            'Calculate',
    'privacy':              'Privacy Policy',
    'disclaimer':           'For educational and reference purposes only. Always verify calculations and follow your facility\'s protocols.',

    // 結果画面
    'result.rateLabel':     'Drip rate',
    'result.rateUnit':      'gtt/min',
    'result.intervalLabel': 'Drop interval',
    'result.intervalUnit':  'sec per drop',
    'result.formulaToggle': 'Formula',
    'result.back':          'Back',
    'sound.on':             'Sound on',
    'sound.off':            'Sound off',

    // 結果画面：計算式パネル
    'formula.volumeUnit':   ' mL',
    'formula.dropUnit':     ' gtt/mL',
    'formula.hour':         ' hr',
    'formula.minute':       ' min',
    'formula.parenOpen':    '(',
    'formula.parenClose':   ' min)',
    'formula.resultUnit':   ' gtt/min',

    // アラート
    'alert.invalidManual':  'Please enter a valid number.',
    'alert.volumeNotSelected': 'Please tap an image to select the volume.',
    'alert.volumeEmpty':    'Please enter and set the volume.',
    'alert.tubing':         'Please select the IV tubing.',
    'alert.dropFactor':     'Please select the drop factor (10, 15, or 20 gtt/mL).',
    'alert.time':           'Please select the infusion time.',
};
