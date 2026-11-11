// ============================================================
// Web 版だけの後処理（Android 版と共通の script.js は変更しない）
// build.mjs が index.html の最後の <script>（script.js）の直後に読み込ませる（region などが使える）
//
// 1. 更新の確認：開いたとき・しばらくして画面に戻ったときに、サーバーの版（build-info.json）と
//    使用停止の一覧（revoked.json）をネットから確かめる
//    - 新しい版があれば上部に「新しい版があります［更新する］」。押したときだけ sw.js に更新を頼み、
//      検証付きの保存が終わってから読み込み直す（失敗したら今の版のまま）
//    - 確認できない（オフライン等）ときは上部に「最新の版か確認できません」
// 2. 使用停止：表示中の版が revoked.json に載っていたら、画面全体を覆って使えないようにする。
//    一度わかった停止は端末に記録し、オフラインで開いても使えないままにする
// 3. 版情報：画面下のリンクから開いたときだけ、版番号・作成日時・状態・オフライン用の保存の有無・起動時の確認の結果を出す
// ============================================================
(function () {
    'use strict';
    if (window.top !== window.self) return;   // iframe の中（工程3の自己確認）では何もしない

    var CACHE_PREFIX = 'yueki-web-v:';
    var REVOKED_KEY = 'yuekiWebRevokedVersions';
    var RECHECK_MS = 10 * 60 * 1000;
    var FETCH_TIMEOUT_MS = 10000;
    var UPDATE_TIMEOUT_MS = 120000;

    var STRINGS = {
        JP: {
            updateAvailable: '新しい版があります', update: '更新する', updating: '更新中…',
            updateFailed: '更新できませんでした。今の版のまま使えます。',
            offline: 'オフラインのため、最新の版か確認できません',
            revokedTitle: 'この版は使用を停止しました',
            revokedBody: '安全のため、この版は使えなくなりました。最新の版に更新してください。',
            revokedOffline: 'インターネットに接続してから、もう一度開いてください。',
            info: '版情報', infoTitle: '版情報', version: '版', built: '作成日時', status: '状態',
            offlineCopy: 'オフライン用の保存', saved: '保存済み', notSaved: '未保存',
            stLatest: '最新です', stUpdate: '新しい版があります', stOffline: '確認できません（オフライン）',
            stChecking: '確認中…', stRevoked: '使用停止', close: '閉じる',
            selfCheck: '起動時の確認', scPassed: '合格', scRunning: '確認中…', scFailed: '問題あり',
        },
        US: {
            updateAvailable: 'A new version is available', update: 'Update', updating: 'Updating…',
            updateFailed: 'Update failed. You can keep using the current version.',
            offline: 'Offline: unable to check for the latest version',
            revokedTitle: 'This version has been withdrawn',
            revokedBody: 'For safety, this version can no longer be used. Please update to the latest version.',
            revokedOffline: 'Please connect to the internet and open the app again.',
            info: 'Version info', infoTitle: 'Version info', version: 'Version', built: 'Built', status: 'Status',
            offlineCopy: 'Offline copy', saved: 'Saved', notSaved: 'Not saved',
            stLatest: 'Up to date', stUpdate: 'A new version is available', stOffline: 'Unable to check (offline)',
            stChecking: 'Checking…', stRevoked: 'Withdrawn', close: 'Close',
            selfCheck: 'Startup check', scPassed: 'Passed', scRunning: 'Checking…', scFailed: 'Failed',
        },
        ES: {
            updateAvailable: 'Hay una nueva versión disponible', update: 'Actualizar', updating: 'Actualizando…',
            updateFailed: 'No se pudo actualizar. Puede seguir usando la versión actual.',
            offline: 'Sin conexión: no se puede comprobar si es la versión más reciente',
            revokedTitle: 'Esta versión ha sido retirada',
            revokedBody: 'Por seguridad, esta versión ya no se puede usar. Actualice a la versión más reciente.',
            revokedOffline: 'Conéctese a internet y vuelva a abrir la aplicación.',
            info: 'Información de la versión', infoTitle: 'Información de la versión', version: 'Versión', built: 'Fecha de creación', status: 'Estado',
            offlineCopy: 'Copia sin conexión', saved: 'Guardada', notSaved: 'No guardada',
            stLatest: 'Actualizada', stUpdate: 'Hay una nueva versión disponible', stOffline: 'No se puede comprobar (sin conexión)',
            stChecking: 'Comprobando…', stRevoked: 'Retirada', close: 'Cerrar',
            selfCheck: 'Comprobación al iniciar', scPassed: 'Correcta', scRunning: 'Comprobando…', scFailed: 'Con errores',
        },
        PT: {
            updateAvailable: 'Há uma nova versão disponível', update: 'Atualizar', updating: 'Atualizando…',
            updateFailed: 'Não foi possível atualizar. Você pode continuar usando a versão atual.',
            offline: 'Sem conexão: não é possível verificar se é a versão mais recente',
            revokedTitle: 'Esta versão foi retirada',
            revokedBody: 'Por segurança, esta versão não pode mais ser usada. Atualize para a versão mais recente.',
            revokedOffline: 'Conecte-se à internet e abra o aplicativo novamente.',
            info: 'Informações da versão', infoTitle: 'Informações da versão', version: 'Versão', built: 'Data de criação', status: 'Status',
            offlineCopy: 'Cópia offline', saved: 'Salva', notSaved: 'Não salva',
            stLatest: 'Atualizada', stUpdate: 'Há uma nova versão disponível', stOffline: 'Não é possível verificar (sem conexão)',
            stChecking: 'Verificando…', stRevoked: 'Retirada', close: 'Fechar',
            selfCheck: 'Verificação ao iniciar', scPassed: 'Aprovada', scRunning: 'Verificando…', scFailed: 'Com falha',
        },
    };
    // script.js の region はトップレベルの const なので window.region ではなく名前で参照する
    var appRegion = (typeof region !== 'undefined' && region) ? region : null;
    var regionId = (appRegion && STRINGS[appRegion.id]) ? appRegion.id : 'US';
    var S = STRINGS[regionId];
    var locale = (appRegion && appRegion.locale) || 'en-US';

    // ------------------------------------------------------------
    // ホーム画面に追加するための情報（manifest・アイコン・アプリ名）を <head> に入れる
    //   manifest は地域の言語ごと（アプリ名・説明が違う）。id は共通なので、どの言語でも同じ1つのアプリ
    // ------------------------------------------------------------
    var MANIFEST = { JP: 'manifest-ja.webmanifest', US: 'manifest-en.webmanifest', ES: 'manifest-es.webmanifest', PT: 'manifest-pt.webmanifest' };
    function addHead(tag, attrs) {
        var el = document.createElement(tag);
        Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
        document.head.appendChild(el);
    }
    if (!document.querySelector('link[rel="manifest"]')) {
        addHead('link', { rel: 'manifest', href: MANIFEST[regionId] });
        addHead('link', { rel: 'icon', type: 'image/png', sizes: '32x32', href: 'icons/favicon-32.png' });
        addHead('link', { rel: 'icon', type: 'image/png', sizes: '192x192', href: 'icons/icon-192.png' });
        addHead('link', { rel: 'apple-touch-icon', href: 'icons/apple-touch-icon.png' });
        addHead('meta', { name: 'theme-color', content: '#ffffff' });
        addHead('meta', { name: 'mobile-web-app-capable', content: 'yes' });
        addHead('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
        addHead('meta', { name: 'apple-mobile-web-app-title', content: appRegion ? t('app.title').replace(/ /g, ' ') : '' });
    }

    var metaVersion = document.querySelector('meta[name="app-version"]');
    var pageVersion = metaVersion ? metaVersion.content : '';
    if (!pageVersion) return;

    // 状態： 'checking' | 'latest' | 'update' | 'offline' | 'revoked'
    var status = 'checking';
    var latestVersion = null;
    var lastCheck = 0;
    var checking = false;

    // ------------------------------------------------------------
    // 端末に記録した使用停止
    // ------------------------------------------------------------
    function readRevokedLocal() {
        try { var v = JSON.parse(localStorage.getItem(REVOKED_KEY) || '[]'); return Array.isArray(v) ? v : []; }
        catch (e) { return []; }
    }
    function writeRevokedLocal(list) {
        try { localStorage.setItem(REVOKED_KEY, JSON.stringify(list)); } catch (e) { /* 保存できない環境 */ }
    }

    // ------------------------------------------------------------
    // 画面の部品
    // ------------------------------------------------------------
    var container = document.querySelector('.container') || document.body;
    var bar = document.createElement('div');
    bar.className = 'web-status-bar';
    bar.hidden = true;
    bar.setAttribute('role', 'status');
    container.insertBefore(bar, container.firstChild);

    function renderBar(message, withButton, isError) {
        bar.textContent = '';
        bar.className = 'web-status-bar' + (isError ? ' is-error' : '') + (withButton ? ' has-action' : '');
        var text = document.createElement('span');
        text.className = 'web-status-text';
        text.textContent = message;
        bar.appendChild(text);
        if (withButton) bar.appendChild(makeUpdateButton());
        bar.hidden = false;
    }

    function makeUpdateButton() {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'web-update-btn';
        btn.textContent = S.update;
        btn.addEventListener('click', function () { runUpdate(btn); });
        return btn;
    }

    var blocker = null;
    function showRevoked(online) {
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.className = 'web-revoked';
            blocker.setAttribute('role', 'alertdialog');
            blocker.setAttribute('aria-modal', 'true');
            document.body.appendChild(blocker);
        }
        blocker.textContent = '';
        var panel = document.createElement('div');
        panel.className = 'web-revoked-panel';
        var title = document.createElement('p');
        title.className = 'web-revoked-title';
        title.textContent = S.revokedTitle;
        var body = document.createElement('p');
        body.className = 'web-revoked-body';
        body.textContent = S.revokedBody + (online && latestVersion && latestVersion !== pageVersion ? '' : '\n' + S.revokedOffline);
        panel.appendChild(title);
        panel.appendChild(body);
        if (online && latestVersion && latestVersion !== pageVersion) panel.appendChild(makeUpdateButton());
        blocker.appendChild(panel);
        bar.hidden = true;
    }

    function render() {
        if (status === 'revoked') return;
        if (status === 'update') renderBar(S.updateAvailable, true, false);
        else if (status === 'offline') renderBar(S.offline, false, false);
        else bar.hidden = true;
    }

    // ------------------------------------------------------------
    // 確認
    // ------------------------------------------------------------
    function fetchJson(name) {
        var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, FETCH_TIMEOUT_MS);
        return fetch(name + '?t=' + Date.now(), { cache: 'no-store', signal: ctrl ? ctrl.signal : undefined })
            .then(function (res) {
                clearTimeout(timer);
                if (!res.ok) throw new Error(name + ' ' + res.status);
                return res.json();
            }, function (e) { clearTimeout(timer); throw e; });
    }

    function revokedSet(json) {
        var set = {};
        if (!json || !Array.isArray(json.revoked)) throw new Error('revoked.json の形式');
        json.revoked.forEach(function (r) { if (r && typeof r.version === 'string') set[r.version] = true; });
        return set;
    }

    function check() {
        if (checking) return;
        checking = true;
        lastCheck = Date.now();
        Promise.all([fetchJson('build-info.json'), fetchJson('revoked.json')]).then(function (res) {
            var info = res[0];
            var revoked = revokedSet(res[1]);
            if (!info || typeof info.version !== 'string') throw new Error('build-info.json の形式');
            latestVersion = revoked[info.version] ? null : info.version;   // 停止された版には更新しない
            // 端末の記録を、サーバーの一覧に合わせる
            var local = readRevokedLocal().filter(function (v) { return revoked[v]; });
            if (revoked[pageVersion] && local.indexOf(pageVersion) < 0) local.push(pageVersion);
            writeRevokedLocal(local);
            if (revoked[pageVersion]) { status = 'revoked'; showRevoked(true); return; }
            // 使用停止が取り消されていたら覆いを外す
            if (blocker) { blocker.remove(); blocker = null; }
            status = (latestVersion && latestVersion !== pageVersion) ? 'update' : 'latest';
            render();
        }).catch(function () {
            if (status !== 'revoked') { status = 'offline'; render(); }
        }).then(function () { checking = false; });
    }

    // ------------------------------------------------------------
    // 更新（利用者が押したときだけ）
    // ------------------------------------------------------------
    var updating = false;
    function runUpdate(btn) {
        if (updating || !latestVersion) return;
        updating = true;
        btn.disabled = true;
        btn.textContent = S.updating;
        var target = latestVersion;
        var done = function (ok) {
            if (ok) { location.reload(); return; }
            updating = false;
            if (status === 'revoked') { showRevoked(true); return; }
            renderBar(S.updateFailed, true, true);
        };
        if (!('serviceWorker' in navigator)) { location.reload(); return; }
        navigator.serviceWorker.getRegistration().then(function (reg) {
            var worker = reg && reg.active;
            // オフライン用の保存がまだない環境では、読み込み直せばネットから新しい版になる
            if (!worker) { location.reload(); return; }
            var channel = new MessageChannel();
            var timer = setTimeout(function () { done(false); }, UPDATE_TIMEOUT_MS);
            channel.port1.onmessage = function (ev) {
                clearTimeout(timer);
                done(!!(ev.data && ev.data.ok && ev.data.version === target));
            };
            worker.postMessage({ type: 'update', version: target }, [channel.port2]);
        }).catch(function () { done(false); });
    }

    // ------------------------------------------------------------
    // 版情報
    // ------------------------------------------------------------
    function builtAtText() {
        var m = /-(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(pageVersion);
        if (!m) return '-';
        var d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]));
        try { return d.toLocaleString(locale); } catch (e) { return d.toISOString(); }
    }
    function savedForOffline() {
        if (!window.caches) return Promise.resolve(false);
        return caches.open(CACHE_PREFIX + pageVersion).then(function (c) {
            return c.match(new URL('__meta/complete', document.baseURI).href);
        }).then(function (r) { return !!r; }).catch(function () { return false; });
    }
    // 起動時の自己確認（web-selfcheck.js）の結果
    function selfCheckText() {
        var r = window.__yuekiSelfCheck;
        if (!r) return '-';
        if (r.state === 'passed') return S.scPassed + '（' + r.cases.length + '）';
        return r.state === 'running' ? S.scRunning : S.scFailed;
    }
    function statusText() {
        return { checking: S.stChecking, latest: S.stLatest, update: S.stUpdate, offline: S.stOffline, revoked: S.stRevoked }[status];
    }

    function openInfo() {
        var overlay = document.createElement('div');
        overlay.className = 'region-sheet';
        var panel = document.createElement('div');
        panel.className = 'region-sheet-panel web-info-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-modal', 'true');
        var title = document.createElement('p');
        title.className = 'region-sheet-title';
        title.textContent = S.infoTitle;
        panel.appendChild(title);
        var dl = document.createElement('dl');
        dl.className = 'web-info-list';
        var rows = [[S.version, pageVersion, 'webInfoVersion'], [S.built, builtAtText(), 'webInfoBuilt'],
            [S.status, statusText(), 'webInfoStatus'], [S.offlineCopy, '…', 'webInfoSaved'], [S.selfCheck, selfCheckText(), 'webInfoSelfCheck']];
        rows.forEach(function (r) {
            var dt = document.createElement('dt'); dt.textContent = r[0];
            var dd = document.createElement('dd'); dd.textContent = r[1]; dd.id = r[2];
            dl.appendChild(dt); dl.appendChild(dd);
        });
        panel.appendChild(dl);
        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'region-sheet-cancel';
        close.textContent = S.close;
        close.addEventListener('click', function () { overlay.remove(); });
        panel.appendChild(close);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        savedForOffline().then(function (ok) { var el = document.getElementById('webInfoSaved'); if (el) el.textContent = ok ? S.saved : S.notSaved; });
    }

    var footer = document.getElementById('footerLinks');
    if (footer) {
        var link = document.createElement('button');
        link.type = 'button';
        link.id = 'webInfoLink';
        link.className = 'region-link web-info-link';
        link.textContent = S.info;
        link.addEventListener('click', openInfo);
        footer.appendChild(link);
    }

    // ------------------------------------------------------------
    // 開始
    // ------------------------------------------------------------
    // 以前に使用停止とわかった版は、確認の結果を待たずに（オフラインでも）使えなくする
    if (readRevokedLocal().indexOf(pageVersion) >= 0) { status = 'revoked'; showRevoked(false); }
    check();
    window.addEventListener('online', check);
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible' && Date.now() - lastCheck > RECHECK_MS) check();
    });
})();
