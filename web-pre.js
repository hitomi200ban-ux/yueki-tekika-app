// ============================================================
// Web 版だけの前処理（Android 版と共通の script.js は変更しない）
// build.mjs が index.html の最初の <script> の前に読み込ませる（script.js より必ず先に動く）
//
// ?lang= による言語の指定
//   ?lang=ja → 日本（JP） / ?lang=en → English（US） / ?lang=es → Español（ES） / ?lang=pt → Português（PT）
//   - 画面下の言語切替で選んだのと同じ扱いにする（script.js と同じ保存先 localStorage の 'regionId' に保存）
//     保存の仕組みを新しく作らないので、既存の言語切替・保存と食い違わない
//   - 指定は有効・無効にかかわらず、すぐに URL から取り除く。
//     言語切替は location.reload() で読み込み直すため、URL に残っていると選んだ言語が ?lang= で上書きされてしまう
//   - ja / en / es / pt 以外（大文字・小文字は区別しない）は無視する
// ============================================================
(function () {
    'use strict';

    // script.js の REGION_STORAGE_KEY と同じ
    var REGION_STORAGE_KEY = 'regionId';
    var LANG_TO_REGION = { ja: 'JP', en: 'US', es: 'ES', pt: 'PT' };

    // 起動時の自己確認の iframe の中では何もしない（端末の保存内容に書き込まない）
    if (window.top !== window.self && String(window.name).indexOf('yueki-selfcheck:') === 0) return;

    var url;
    try {
        url = new URL(window.location.href);
    } catch (e) {
        return;
    }
    if (!url.searchParams.has('lang')) return;

    var lang = (url.searchParams.get('lang') || '').trim().toLowerCase();
    var regionId = Object.prototype.hasOwnProperty.call(LANG_TO_REGION, lang) ? LANG_TO_REGION[lang] : null;
    if (regionId) {
        try {
            window.localStorage.setItem(REGION_STORAGE_KEY, regionId);
        } catch (e) {
            // 保存できない環境（プライベートブラウズ等）では、script.js がブラウザの言語で判定する
        }
    }

    url.searchParams.delete('lang');
    try {
        window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
    } catch (e) {
        // URL を書き換えられない環境では何もしない
    }
})();

// ============================================================
// 起動時の自己確認（web-selfcheck.js）が作る iframe の中だけの準備
//   iframe の name が 'yueki-selfcheck:<地域>' のときだけ動く（script.js より前に動く）
//   - localStorage・sessionStorage をメモリ上のものに差し替える（端末の保存内容を読まない・書かない）
//     地域だけは親の画面と同じにしておく
//   - alert・confirm・prompt は画面に出さず、文言を記録する（自己確認が入力エラーの文言を確かめる）
// ============================================================
(function () {
    'use strict';
    var PREFIX = 'yueki-selfcheck:';
    if (window.top === window.self || typeof window.name !== 'string' || window.name.indexOf(PREFIX) !== 0) return;

    function MemoryStorage(seed) {
        var data = Object.create(null);
        if (seed) Object.keys(seed).forEach(function (k) { data[k] = String(seed[k]); });
        return {
            getItem: function (k) { k = String(k); return k in data ? data[k] : null; },
            setItem: function (k, v) { data[String(k)] = String(v); },
            removeItem: function (k) { delete data[String(k)]; },
            clear: function () { data = Object.create(null); },
            key: function (i) { var ks = Object.keys(data); return i < ks.length ? ks[i] : null; },
            get length() { return Object.keys(data).length; },
        };
    }
    var regionId = window.name.slice(PREFIX.length);
    try {
        Object.defineProperty(window, 'localStorage', { value: MemoryStorage({ regionId: regionId }), configurable: true });
        Object.defineProperty(window, 'sessionStorage', { value: MemoryStorage(null), configurable: true });
    } catch (e) {
        // 差し替えられない環境では自己確認を不合格にする（端末の保存内容に触れないため）
        window.__yuekiSelfCheckSetupFailed = true;
    }
    window.__yuekiSelfCheckDialogs = [];
    var record = function (type) {
        return function (message) { window.__yuekiSelfCheckDialogs.push({ type: type, message: String(message) }); return type === 'confirm' ? false : null; };
    };
    window.alert = record('alert');
    window.confirm = record('confirm');
    window.prompt = record('prompt');
    window.__yuekiSelfCheckFrame = true;
})();

// ============================================================
// Service Worker（sw.js）の登録：オフラインでも使えるようにする
//   - ページの読み込みが終わってから登録する（表示を遅らせない）
//   - 登録・保存に失敗しても、ページはこれまでどおりネットから読んで動く
//   - iframe の中（工程3の自己確認など）では登録しない
// ============================================================
(function () {
    'use strict';
    if (!('serviceWorker' in navigator) || !window.isSecureContext) return;
    if (window.top !== window.self) return;
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {
            // 登録できない環境では何もしない
        });
    });
})();
