// ============================================================
// 英語（米国）の文言辞書
// 米国の看護・臨床教育で一般的な表記（gtt/mL, gtt/min, hr, min）に合わせる
// 単位の前のスペースは表示上必要なもの（flex 内は \u00a0 を使う）
// ============================================================
window.STRINGS = window.STRINGS || {};

STRINGS['en-US'] = {
    'doc.title':            'IV Drip Rate Calculator | Gravity Drip Calculator for Nurses',
    'app.title':            'IV Drip Rate Calculator',
    'app.subtitle':         'Gravity infusion calculator for nurses & nursing students',
    'common.decided':       '✓ Selected',

    // 入力画面：輸液量
    'volume.label':         'Volume to infuse',
    'volume.hint':          'Swipe or tap to select',
    'volume.manualLabel':   'Custom volume',
    'volume.manualPlaceholder': 'e.g., 250',
    'volume.manualConfirm': 'Set',
    'volume.none':          'Not selected',
    'volume.selected':      '{v} mL selected',
    'volume.manualEmpty':   'Not entered',

    // 入力画面：輸液ルート
    'tubing.label':         'IV tubing',
    'tubing.hint':          'Select drop factor',
    'tubing.macro':         'Macrodrip',
    'tubing.macroSub':      '10 / 15 / 20 gtt/mL',
    'tubing.macroAlt':      'Macrodrip IV tubing',
    'tubing.micro':         'Microdrip',
    'tubing.microSub':      '60 gtt/mL',
    'tubing.microAlt':      'Microdrip IV tubing',
    'tubing.factorLabel':   'Drop factor',
    'tubing.factorUnit':    'gtt/mL',
    'tubing.note':          'Verify the drop factor on the IV tubing package.',

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
    'disclaimer':           'For educational and reference use only. Always verify calculations and follow your facility\'s policies and procedures.',

    // 結果画面
    'result.rateLabel':     'Drip rate',
    'result.rateUnit':      'gtt/min',
    'result.intervalLabel': '1 drop every',
    'result.intervalUnit':  'seconds',
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
    'formula.resultUnit':   '\u00a0gtt/min',

    // アラート
    'alert.invalidManual':  'Enter a valid number.',
    'alert.volumeNotSelected': 'Tap a bag to select the volume.',
    'alert.volumeEmpty':    'Enter a custom volume, then tap Set.',
    'alert.tubing':         'Select the IV tubing.',
    'alert.dropFactor':     'Select the drop factor (10, 15, or 20 gtt/mL).',
    'alert.time':           'Select the infusion time.',
};
