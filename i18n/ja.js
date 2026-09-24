// ============================================================
// 日本語の文言辞書
// 地域（臨床ルール）とは別軸。地域プロファイルの locale から参照される。
// {v} などの {name} はプレースホルダ（t() の第2引数で置換）
// ============================================================
window.STRINGS = window.STRINGS || {};

STRINGS['ja'] = {
    'doc.title':            '輸液滴下計算 | 看護師・看護学生向け点滴滴下計算アプリ',
    'app.title':            '輸液滴下計算',
    'app.subtitle':         '看護師・看護学生向け点滴滴下計算アプリ',
    'common.decided':       '✓ 決定',

    // 入力画面：輸液量
    'volume.label':         '輸液量',
    'volume.hint':          '左右にスワイプ・タップで選択',
    'volume.manualLabel':   '手動で入力',
    'volume.manualPlaceholder': '例：250',
    'volume.manualConfirm': '決定',
    'volume.none':          '未選択',
    'volume.selected':      '{v} mL 選択中',
    'volume.manualEmpty':   '未入力',

    // 入力画面：輸液ルート
    'tubing.label':         '輸液ルートの種類',
    'tubing.adult':         '成人用（20滴/mL）',
    'tubing.adultAlt':      '成人用',
    'tubing.child':         '小児用（60滴/mL）',
    'tubing.childAlt':      '小児用',

    // 入力画面：投与時間
    'time.label':           '投与時間',
    'time.hint':            '数字をタップして選択',
    'time.hour':            '時間',
    'time.minute':          '分',

    // 入力画面：計算式サマリー
    'summary.title':        '計算式',
    'summary.dropUnit':     '滴/mL',
    'summary.hour':         '時間',
    'summary.minOpen':      '分（',
    'summary.minClose':     '分）',

    'calculate':            '計算する',
    'privacy':              'プライバシーポリシー',

    // 地域切替
    'region.current':       '🌐 地域：{name}',
    'region.title':         '地域を選択',
    'region.note':          '滴下係数や単位の表記が、選んだ地域の臨床に合わせて変わります。',
    'region.cancel':        'キャンセル',

    // 結果画面
    'result.rateLabel':     '滴下速度',
    'result.rateUnit':      '滴/分',
    'result.intervalLabel': '合わせ方',
    'result.intervalUnit':  '秒に1滴',
    'result.formulaToggle': '計算式',
    'result.back':          '戻る',
    'sound.on':             '音ON',
    'sound.off':            '音OFF',

    // 結果画面：計算式パネル
    'formula.volumeUnit':   'mL',
    'formula.dropUnit':     '滴/mL',
    'formula.hour':         '時間',
    'formula.minute':       '分',
    'formula.parenOpen':    '（',
    'formula.parenClose':   '分）',
    'formula.resultUnit':   ' 滴/分',

    // アラート
    'alert.invalidManual':  '正しい数値を入力してください。',
    'alert.volumeNotSelected': '輸液量を画像タップで選択してください。',
    'alert.volumeEmpty':    '輸液量を入力・決定してください。',
    'alert.tubing':         '輸液ルートの種類を選択してください。',
    'alert.dropFactor':     '滴下係数を選択してください。',
    'alert.time':           '投与時間を選択してください。',
};
