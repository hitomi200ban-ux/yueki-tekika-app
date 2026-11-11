// ============================================================
// 起動時の自己確認（Web 版だけ。Android 版と共通の script.js は変更しない）
// build.mjs が index.html の web-post.js の直後に読み込ませる
//
// ページを開くたびに、見えない iframe で同じ画面を開き、実際のボタン操作で計算して、期待値と照らし合わせる
//   - 期待値は、段階4で承認した Android 版の正解データ（39件）から、地域ごとに選んだもの（下の CASES）
//   - 確認するのは今の地域のケースだけ（地域を切り替えると読み込み直すので、そのときにまた確認する）
//   - iframe の中では、端末の保存内容（localStorage 等）をメモリ上のものに差し替え、ダイアログも出さない（web-pre.js）
//   - 表示中の版と iframe の版が同じであることも確かめる
//   - 合格するまでに「計算する」が押されたら、少し待ってもらい、合格したらそのまま計算する
//   - 不合格・時間切れ（TIMEOUT_MS）のときは画面全体を覆って計算できないようにし、再読み込みを案内する
//   - 結果は window.__yuekiSelfCheck に置く（版情報の表示・テスト用）
// ============================================================
(function () {
    'use strict';
    if (window.top !== window.self) return;

    var TIMEOUT_MS = 20000;
    var FRAME_PREFIX = 'yueki-selfcheck:';

    // 手順： ['vol', mL] / ['manual', '入力する文字'] / ['tube', 種類] / ['factor', 滴下係数] / ['time', 時, 分] / ['calc']
    // 期待値：計算結果の表示（滴下数・小数・秒・計算式の各欄・秒の色）、または入力エラーの文言
    var CASES = {
        JP: [
            { id: 1, steps: [['vol', 500], ['tube', 'adult'], ['time', 8, 0], ['calc']],
              expect: { dropRate: '21', dropRateExact: '20.8', dropIntervalSec: '2.9', fVolume: '500', fDrop: '20', fTotalMin: '480', fExact: '20.8', fApprox: '21', secColor: 'rgb(102, 187, 106)' } },
            { id: 2, steps: [['vol', 200], ['tube', 'child'], ['time', 4, 0], ['calc']],
              expect: { dropRate: '50', dropRateExact: '50.0', dropIntervalSec: '1.2', fVolume: '200', fDrop: '60', fTotalMin: '240', fExact: '50.0', fApprox: '50', secColor: 'rgb(244, 143, 177)' } },
            { id: 24, steps: [['manual', '250'], ['tube', 'adult'], ['time', 2, 0], ['calc']],
              expect: { dropRate: '42', dropRateExact: '41.7', dropIntervalSec: '1.4', fVolume: '250', fDrop: '20', fTotalMin: '120', fExact: '41.7', fApprox: '42', secColor: 'rgb(102, 187, 106)' } },
            { id: 34, steps: [['vol', 500], ['tube', 'adult'], ['time', 0, 0], ['calc']],
              expect: { alert: '投与時間を選択してください。' } },
        ],
        US: [
            { id: 5, steps: [['vol', 1000], ['tube', 'macro'], ['factor', 15], ['time', 8, 0], ['calc']],
              expect: { dropRate: '31', dropRateExact: '31.3', dropIntervalSec: '1.9', fVolume: '1000', fDrop: '15', fTotalMin: '480', fExact: '31.3', fApprox: '31', secColor: 'rgb(102, 187, 106)' } },
            { id: 7, steps: [['vol', 100], ['tube', 'micro'], ['time', 1, 0], ['calc']],
              expect: { dropRate: '100', dropRateExact: '100.0', dropIntervalSec: '0.6', fVolume: '100', fDrop: '60', fTotalMin: '60', fExact: '100.0', fApprox: '100', secColor: 'rgb(244, 143, 177)' } },
            { id: 33, steps: [['vol', 500], ['tube', 'macro'], ['time', 8, 0], ['calc']],
              expect: { alert: 'Select the drop factor (10, 15, or 20 gtt/mL).' } },
        ],
        ES: [
            { id: 8, steps: [['vol', 500], ['tube', 'macro'], ['factor', 15], ['time', 4, 0], ['calc']],
              expect: { dropRate: '31', dropRateExact: '31.3', dropIntervalSec: '1.9', fVolume: '500', fDrop: '15', fTotalMin: '240', fExact: '31.3', fApprox: '31', secColor: 'rgb(102, 187, 106)' } },
            { id: 9, steps: [['vol', 50], ['tube', 'micro'], ['time', 0, 45], ['calc']],
              expect: { dropRate: '67', dropRateExact: '66.7', dropIntervalSec: '0.9', fVolume: '50', fDrop: '60', fTotalMin: '45', fExact: '66.7', fApprox: '67', secColor: 'rgb(244, 143, 177)' } },
        ],
        PT: [
            { id: 10, steps: [['vol', 500], ['tube', 'macro'], ['time', 6, 0], ['calc']],
              expect: { dropRate: '28', dropRateExact: '27,8', dropIntervalSec: '2,2', fVolume: '500', fDrop: '20', fTotalMin: '360', fExact: '27,8', fApprox: '28', secColor: 'rgb(102, 187, 106)' } },
            { id: 23, steps: [['manual', '250.5'], ['tube', 'macro'], ['time', 2, 0], ['calc']],
              expect: { dropRate: '42', dropRateExact: '41,8', dropIntervalSec: '1,4', fVolume: '250.5', fDrop: '20', fTotalMin: '120', fExact: '41,8', fApprox: '42', secColor: 'rgb(102, 187, 106)' } },
            { id: 38, steps: [['vol', 500], ['tube', 'macro'], ['time', 0, 0], ['calc']],
              expect: { alert: 'Selecione o tempo de infusão.' } },
        ],
    };

    var STRINGS = {
        JP: {
            wait: '起動時の確認中です。終わりしだい計算します',
            failTitle: '起動時の確認で問題が見つかりました',
            failBody: '安全のため、この画面では計算できません。再読み込みしてください。直らない場合は、時間をおいてから開き直してください。',
            reload: '再読み込み',
        },
        US: {
            wait: 'Running the startup check. The calculation will start when it finishes.',
            failTitle: 'A problem was found during the startup check',
            failBody: 'For safety, calculations are disabled on this screen. Please reload. If the problem continues, try again later.',
            reload: 'Reload',
        },
        ES: {
            wait: 'Realizando la comprobación al iniciar. El cálculo comenzará al terminar.',
            failTitle: 'Se encontró un problema en la comprobación al iniciar',
            failBody: 'Por seguridad, los cálculos están desactivados en esta pantalla. Vuelva a cargar la página. Si el problema continúa, inténtelo más tarde.',
            reload: 'Volver a cargar',
        },
        PT: {
            wait: 'Fazendo a verificação ao iniciar. O cálculo começará ao terminar.',
            failTitle: 'Foi encontrado um problema na verificação ao iniciar',
            failBody: 'Por segurança, os cálculos estão desativados nesta tela. Recarregue a página. Se o problema continuar, tente novamente mais tarde.',
            reload: 'Recarregar',
        },
    };

    // script.js の region はトップレベルの const なので名前で参照する
    var appRegion = (typeof region !== 'undefined' && region) ? region : null;
    var regionId = appRegion && CASES[appRegion.id] ? appRegion.id : null;
    var S = STRINGS[regionId] || STRINGS.US;
    var metaVersion = document.querySelector('meta[name="app-version"]');
    var pageVersion = metaVersion ? metaVersion.content : '';

    var result = window.__yuekiSelfCheck = { state: 'running', region: regionId, version: pageVersion, cases: [], error: null, ms: null };
    var listeners = [];
    function finish(state, error) {
        if (result.state !== 'running') return;
        result.state = state;
        result.error = error || null;
        result.ms = Math.round(performance.now() - startedAt);
        listeners.forEach(function (fn) { try { fn(result); } catch (e) { /* 無視 */ } });
    }
    var startedAt = performance.now();

    // ------------------------------------------------------------
    // 合格するまで「計算する」を待たせる（押した分は合格後にそのまま計算する）
    // ------------------------------------------------------------
    var calcBtn = document.getElementById('calculateBtn');
    var waitNote = null;
    var pendingCalc = false;
    var replaying = false;
    window.addEventListener('click', function (e) {
        if (replaying || result.state === 'passed') return;
        if (!calcBtn || !(e.target instanceof Element) || !calcBtn.contains(e.target)) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (result.state !== 'running') return;   // 不合格：覆いの下なので通常は押せない
        pendingCalc = true;
        if (!waitNote) {
            waitNote = document.createElement('p');
            waitNote.className = 'web-selfcheck-wait';
            waitNote.setAttribute('role', 'status');
            waitNote.textContent = S.wait;
            calcBtn.insertAdjacentElement('afterend', waitNote);
        }
    }, true);

    listeners.push(function (r) {
        if (waitNote) { waitNote.remove(); waitNote = null; }
        if (r.state === 'passed') {
            if (pendingCalc) { pendingCalc = false; replaying = true; try { calcBtn.click(); } finally { replaying = false; } }
        } else {
            showFailure();
        }
    });

    function showFailure() {
        var cover = document.createElement('div');
        cover.className = 'web-revoked web-selfcheck-failed';
        cover.setAttribute('role', 'alertdialog');
        cover.setAttribute('aria-modal', 'true');
        var panel = document.createElement('div');
        panel.className = 'web-revoked-panel';
        var title = document.createElement('p');
        title.className = 'web-revoked-title';
        title.textContent = S.failTitle;
        var body = document.createElement('p');
        body.className = 'web-revoked-body';
        body.textContent = S.failBody;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'web-update-btn';
        btn.textContent = S.reload;
        btn.addEventListener('click', function () { location.reload(); });
        panel.appendChild(title);
        panel.appendChild(body);
        panel.appendChild(btn);
        cover.appendChild(panel);
        document.body.appendChild(cover);
    }

    // ------------------------------------------------------------
    // iframe の中での操作（実際のボタンを押す）
    // ------------------------------------------------------------
    function runCases(w, cases) {
        var doc = w.document;
        var $ = function (sel) { var el = doc.querySelector(sel); if (!el) throw new Error('部品が見つかりません: ' + sel); return el; };
        var byId = function (id) { var el = doc.getElementById(id); if (!el) throw new Error('部品が見つかりません: #' + id); return el; };
        var ev = function (expr) { return w.eval(expr); };
        var swipeTo = function (index) {
            for (var i = 0; i < 20 && ev('currentIndex') !== index; i++) byId(ev('currentIndex') < index ? 'nextBtn' : 'prevBtn').click();
            if (ev('currentIndex') !== index) throw new Error('輸液量の位置を合わせられません');
        };
        var setTime = function (sel, up, down, target) {
            var s = byId(sel);
            var t = -1;
            for (var k = 0; k < s.options.length; k++) if (s.options[k].value === String(target)) t = k;
            if (t < 0) throw new Error('時間の選択肢がありません: ' + target);
            for (var i = 0; i < 60 && s.selectedIndex !== t; i++) byId(s.selectedIndex < t ? up : down).click();
            if (s.selectedIndex !== t) throw new Error('時間を合わせられません');
        };
        var read = function (id) { return byId(id).textContent.trim(); };

        cases.forEach(function (c) {
            w.__yuekiSelfCheckDialogs.length = 0;
            c.steps.forEach(function (st) {
                var op = st[0];
                if (op === 'vol') {
                    var idx = ev('region.volumes.findIndex(function (v) { return v.ml === ' + Number(st[1]) + '; })');
                    if (idx < 0) throw new Error('輸液量がありません: ' + st[1]);
                    swipeTo(idx);
                    $('.swiper-item[data-volume="' + Number(st[1]) + '"]').click();
                } else if (op === 'manual') {
                    swipeTo(ev('MANUAL_INDEX'));
                    var input = byId('manualVolume');
                    input.value = st[1];
                    input.dispatchEvent(new w.Event('input', { bubbles: true }));
                    byId('manualConfirmBtn').click();
                } else if (op === 'tube') {
                    $('.type-btn[data-type="' + st[1] + '"]').click();
                } else if (op === 'factor') {
                    var btns = doc.querySelectorAll('.factor-btn');
                    var hit = null;
                    for (var i = 0; i < btns.length; i++) if (btns[i].textContent.trim() === String(st[1])) hit = btns[i];
                    if (!hit) throw new Error('滴下係数がありません: ' + st[1]);
                    hit.click();
                } else if (op === 'time') {
                    setTime('hourSelect', 'hourUp', 'hourDown', st[1]);
                    setTime('minuteSelect', 'minuteUp', 'minuteDown', st[2]);
                } else if (op === 'calc') {
                    byId('calculateBtn').click();
                } else {
                    throw new Error('想定外の手順: ' + op);
                }
            });

            var onResult = byId('resultScreen').classList.contains('active');
            var got;
            if (c.expect.alert !== undefined) {
                var d = w.__yuekiSelfCheckDialogs;
                got = { alert: d.length === 1 ? d[0].message : JSON.stringify(d.map(function (x) { return x.message; })) };
                if (onResult) got.screen = 'result';
            } else {
                if (!onResult) throw new Error('#' + c.id + ' 結果画面になりません（' + JSON.stringify(w.__yuekiSelfCheckDialogs) + '）');
                got = {};
                Object.keys(c.expect).forEach(function (k) {
                    got[k] = k === 'secColor' ? byId('dropIntervalSec').style.color : read(k);
                });
            }
            var ok = Object.keys(c.expect).every(function (k) { return got[k] === c.expect[k]; }) && !got.screen;
            result.cases.push({ id: c.id, ok: ok, got: got });
            if (onResult) byId('backBtn').click();
            if (!ok) throw new Error('#' + c.id + ' の結果が期待値と違います: ' + JSON.stringify(got));
        });
    }

    // ------------------------------------------------------------
    // 開始
    // ------------------------------------------------------------
    function start() {
        if (!regionId) { finish('failed', '地域を判定できません'); return; }
        var frame = document.createElement('iframe');
        frame.name = FRAME_PREFIX + regionId;
        frame.setAttribute('aria-hidden', 'true');
        frame.setAttribute('tabindex', '-1');
        frame.setAttribute('sandbox', 'allow-scripts allow-same-origin');
        frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:412px;height:915px;border:0;visibility:hidden;pointer-events:none;';
        var timer = setTimeout(function () { cleanup(); finish('failed', '時間内に終わりませんでした'); }, TIMEOUT_MS);
        var cleanup = function () { clearTimeout(timer); if (frame.parentNode) frame.parentNode.removeChild(frame); };
        // 画像の読み込み完了（load）までは待たない。画面の部品と script.js の準備ができたら始める
        var poll = setInterval(function () {
            var w;
            try {
                w = frame.contentWindow;
                if (!w || !w.document || w.location.href === 'about:blank' || w.document.readyState === 'loading') return;
                if (!w.__yuekiSelfCheckFrame && !w.document.querySelector('meta[name="app-version"]')) return;
                if (w.eval('typeof region') === 'undefined') return;
            } catch (e) {
                return;   // 読み込み中
            }
            clearInterval(poll);
            runInFrame(w);
        }, 50);
        var stopPoll = cleanup;
        cleanup = function () { clearInterval(poll); stopPoll(); };
        function runInFrame(w) {
            if (result.state !== 'running') return;
            try {
                if (!w.__yuekiSelfCheckFrame || w.__yuekiSelfCheckSetupFailed) throw new Error('iframe の準備ができていません');
                // iframe の保存内容が端末のものと切り離されているか（目印を書いて、端末側に漏れていないか見る）
                var probeKey = '__yuekiSelfCheckProbe';
                w.localStorage.setItem(probeKey, '1');
                var leaked = false;
                try { leaked = window.localStorage.getItem(probeKey) !== null; } catch (e) { leaked = false; }
                if (leaked) {
                    try { window.localStorage.removeItem(probeKey); } catch (e) { /* 無視 */ }
                    throw new Error('iframe の保存内容が端末のものと切り離されていません');
                }
                var meta = w.document.querySelector('meta[name="app-version"]');
                if (!meta || meta.content !== pageVersion) throw new Error('iframe の版が表示中の版と違います');
                if (w.eval('region.id') !== regionId) throw new Error('iframe の地域が違います');
                runCases(w, CASES[regionId]);
                cleanup();
                finish('passed');
            } catch (e) {
                cleanup();
                finish('failed', String(e && e.message || e));
            }
        }
        // 表示中の画面と同じ場所の index.html を開く（保存版があれば Service Worker が「使う版」を返す。
        // 表示中の版と違えば上の確認で不合格になる：最初にネットから開いた直後に新しい版が公開された場合など）
        frame.src = new URL('index.html', location.href).href;
        document.body.appendChild(frame);
    }

    // この script は body の最後で読み込まれるので、画面の部品はそろっている。すぐに始める
    setTimeout(start, 0);
})();
