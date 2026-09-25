// ============================================================
// スペイン語の文言辞書（スペイン＋中南米で共通の1版）
// 命令文は usted 形で統一（tú / vos の地域差を避ける）
// 単位は gotas/mL, gotas/min。Microgotero 選択時だけ microgotas/mL, microgotas/min（…Micro のキー）
// mcgts は microgramos（mcg）と紛らわしいため使わない
// 単位の前のスペースは表示上必要なもの（flex 内は   を使う）
// ============================================================
window.STRINGS = window.STRINGS || {};

STRINGS['es'] = {
    'doc.title':            'Calculadora de Goteo IV | Cálculo de goteo para enfermería',
    'app.title':            'Calculadora de Goteo IV',
    'app.subtitle':         'Cálculo de goteo IV para enfermería',
    'common.decided':       '✓ Seleccionado',

    // 入力画面：輸液量
    'volume.label':         'Volumen a infundir',
    'volume.hint':          'Deslice o toque',
    'volume.manualLabel':   'Otro volumen',
    'volume.manualPlaceholder': 'Ej.: 250',
    'volume.manualConfirm': 'Aceptar',
    'volume.none':          'Sin seleccionar',
    'volume.selected':      '{v} mL seleccionados',
    'volume.manualEmpty':   'Sin valor',

    // 入力画面：輸液ルート
    'tubing.label':         'Equipo de infusión',
    'tubing.hint':          'Elija el factor de goteo',
    'tubing.macro':         'Macrogotero',
    'tubing.macroSub':      '10 / 15 / 20 gotas/mL',
    'tubing.macroAlt':      'Equipo macrogotero',
    'tubing.micro':         'Microgotero',
    'tubing.microSub':      '60 microgotas/mL',
    'tubing.microAlt':      'Equipo microgotero',
    'tubing.factorLabel':   'Factor de goteo',
    'tubing.factorUnit':    'gotas/mL',
    'tubing.note':          'Verifique el factor de goteo en el envase del equipo.',

    // 入力画面：投与時間
    'time.label':           'Tiempo de infusión',
    'time.hint':            'Toque para seleccionar',
    'time.hour':            'h',
    'time.minute':          'min',

    // 入力画面：計算式サマリー
    'summary.title':        'Fórmula',
    'summary.dropUnit':     ' gotas/mL',
    'summary.dropUnitMicro': ' microgotas/mL',
    'summary.hour':         ' h ',
    'summary.minOpen':      ' min (',
    'summary.minClose':     ' min)',

    'calculate':            'Calcular',
    'privacy':              'Política de privacidad',

    // 言語切替
    'region.current':       '🌐 Idioma: {name}',
    'region.title':         'Elija su idioma',
    'region.note':          'Los factores de goteo y las unidades se muestran según el uso habitual en este idioma.',
    'region.cancel':        'Cancelar',
    'disclaimer':           'Solo para fines educativos y de referencia. Verifique siempre los cálculos y siga los protocolos de su institución.',

    // 結果画面
    'result.rateLabel':     'Velocidad de goteo',
    'result.rateUnit':      'gotas/min',
    'result.rateUnitMicro': 'microgotas/min',
    'result.intervalLabel': '1 gota cada',
    'result.intervalLabelMicro': '1 microgota cada',
    'result.intervalUnit':  'segundos',
    'result.formulaToggle': 'Fórmula',
    'result.back':          'Volver',
    'sound.on':             'Con sonido',
    'sound.off':            'Sin sonido',

    // 結果画面：計算式パネル
    'formula.volumeUnit':   ' mL',
    'formula.dropUnit':     ' gotas/mL',
    'formula.dropUnitMicro': ' microgotas/mL',
    'formula.hour':         ' h',
    'formula.minute':       ' min',
    'formula.parenOpen':    '(',
    'formula.parenClose':   ' min)',
    'formula.resultUnit':   ' gotas/min',
    'formula.resultUnitMicro': ' microgotas/min',

    // アラート
    'alert.invalidManual':  'Ingrese un número válido.',
    'alert.volumeNotSelected': 'Toque una bolsa para seleccionar el volumen.',
    'alert.volumeEmpty':    'Ingrese un volumen y toque Aceptar.',
    'alert.tubing':         'Seleccione el equipo de infusión.',
    'alert.dropFactor':     'Seleccione el factor de goteo (10, 15 o 20 gotas/mL).',
    'alert.time':           'Seleccione el tiempo de infusión.',
};
