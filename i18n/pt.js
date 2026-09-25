// ============================================================
// ポルトガル語の文言辞書（ブラジル式 pt-BR を基準にした1版）
// 命令文は você に対する形（Selecione / Toque / Digite）で統一
// 単位は gotas/mL, gotas/min。Microgotas 選択時だけ microgotas/mL, microgotas/min（…Micro のキー）
// 輸液セットはブラジルの呼び方「equipo」（macrogotas / microgotas）
// 単位の前のスペースは表示上必要なもの（flex 内は   を使う）
// ============================================================
window.STRINGS = window.STRINGS || {};

STRINGS['pt-BR'] = {
    'doc.title':            'Calculadora de Gotejamento IV | Cálculo de gotejamento para enfermagem',
    // 折り返すとき「IV」だけが2行目に残らないよう、Gotejamento と IV の間は改行しないスペース
    'app.title':            'Calculadora de Gotejamento\u00a0IV',
    'app.subtitle':         'Cálculo de gotejamento para enfermagem',
    'common.decided':       '✓ Selecionado',

    // 入力画面：輸液量
    'volume.label':         'Volume a infundir',
    'volume.hint':          'Deslize ou toque',
    'volume.manualLabel':   'Outro volume',
    'volume.manualPlaceholder': 'Ex.: 250',
    'volume.manualConfirm': 'OK',
    'volume.none':          'Nenhum selecionado',
    'volume.selected':      '{v} mL selecionados',
    'volume.manualEmpty':   'Não informado',

    // 入力画面：輸液ルート
    'tubing.label':         'Equipo',
    'tubing.hint':          'Escolha o tipo de equipo',
    'tubing.macro':         'Macrogotas',
    'tubing.macroSub':      '10 / 15 / 20 gotas/mL',
    'tubing.macroAlt':      'Equipo macrogotas',
    'tubing.micro':         'Microgotas',
    'tubing.microSub':      '60 microgotas/mL',
    'tubing.microAlt':      'Equipo microgotas',
    'tubing.factorLabel':   'Gotas por mL',
    'tubing.factorUnit':    'gotas/mL',
    'tubing.note':          'Confira o número de gotas/mL na embalagem do equipo.',

    // 入力画面：投与時間
    'time.label':           'Tempo de infusão',
    'time.hint':            'Toque para selecionar',
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
    'privacy':              'Política de Privacidade',

    // 言語切替
    'region.current':       '🌐 Idioma: {name}',
    'region.title':         'Escolha o idioma',
    'region.note':          'Os equipos e as unidades seguem o padrão habitual da prática clínica.',
    'region.cancel':        'Cancelar',
    'disclaimer':           'Apenas para fins educacionais e de consulta. Sempre confira os cálculos e siga os protocolos da sua instituição.',

    // 結果画面
    'result.rateLabel':     'Gotejamento',
    'result.rateUnit':      'gotas/min',
    'result.rateUnitMicro': 'microgotas/min',
    'result.intervalLabel': '1 gota a cada',
    'result.intervalLabelMicro': '1 microgota a cada',
    'result.intervalUnit':  'segundos',
    'result.formulaToggle': 'Fórmula',
    'result.back':          'Voltar',
    'sound.on':             'Com som',
    'sound.off':            'Sem som',

    // 結果画面：計算式パネル
    'formula.volumeUnit':   ' mL',
    'formula.dropUnit':     ' gotas/mL',
    'formula.dropUnitMicro': ' microgotas/mL',
    'formula.hour':         ' h',
    'formula.minute':       ' min',
    'formula.parenOpen':    '(',
    'formula.parenClose':   ' min)',
    'formula.resultUnit':   ' gotas/min',
    'formula.resultUnitMicro': ' microgotas/min',

    // アラート
    'alert.invalidManual':  'Digite um número válido.',
    'alert.volumeNotSelected': 'Toque em uma bolsa para selecionar o volume.',
    'alert.volumeEmpty':    'Digite o volume e toque em OK.',
    'alert.tubing':         'Selecione o equipo.',
    'alert.dropFactor':     'Selecione quantas gotas/mL tem o equipo (10, 15 ou 20).',
    'alert.time':           'Selecione o tempo de infusão.',
};
