// ============================================================
// Web 版の Service Worker（オフライン対応・更新）
// build.mjs が dist-web/ の直下にそのままコピーする。中身は版によらず同じ（版ごとの情報は build-info.json から読む）
//
// 方針（医療系の計算ツールなので「古い版や一部だけ新しい版が混ざった状態で動かない」ことを最優先にする）
//   - 版ごとに別の保存場所（Cache Storage）を使う： yueki-web-v:<版番号>
//   - 保存は build-info.json に載っている全ファイルを取得し、1つずつ SHA-256 と大きさを確かめてから行う。
//     保存後にもう一度読み直して確かめ、全部合格したときだけ「完成の印」を書き、そのあとで「使う版」を切り替える。
//     1つでも失敗したら、その版の保存場所は丸ごと消す（使う版は変えない）
//   - 画面（HTML）は「使う版」の保存場所から返す。完成の印がない保存場所は使わない
//   - 画面ごと（タブ・iframe ごと）に、表示した版を記録する。その画面の CSS・JS・画像は、記録した版の保存場所から返す。
//     そのため、別のタブで更新しても、開いたままの画面は閉じるまで前の版だけで動く（版が混ざらない）。
//     前の版の保存場所は、それを表示している画面がなくなってから消す
//   - 新しい版への切り替えは、利用者が更新を押したとき（web-post.js からの 'update' の依頼）だけ。自動ではしない
//   - 最初に開いたページ（ネットから読んだもの）は途中から保存版に切り替えない（clients.claim をしない）
//   - sw.js 自体が新しくなっても skipWaiting はしない（開いているページがすべて閉じてから入れ替わる）
// ============================================================
'use strict';

const CACHE_PREFIX = 'yueki-web-v:';
const META_CACHE = 'yueki-web-meta';
const BASE = new URL(self.registration.scope);   // 例：https://example.com/ （sw.js を置いた場所）
const metaKey = (name) => new URL('__meta/' + name, BASE).href;
const fileKey = (rel) => new URL(rel, BASE).href;
const CLIENT_PREFIX = metaKey('client/');
// 保存しないファイル（sw.js 自体と、毎回ネットから読む build-info.json・revoked.json）
const NOT_CACHED = new Set(['sw.js', 'build-info.json', 'revoked.json']);
const VERSION_RE = /^[0-9a-f]{7,40}(-dirty)?-\d{8}T\d{6}Z$/;

// ------------------------------------------------------------
// 記録の読み書き
// ------------------------------------------------------------
async function readJson(cacheName, key) {
    const cache = await caches.open(cacheName);
    const res = await cache.match(key);
    if (!res) return null;
    try { return await res.json(); } catch (e) { return null; }
}
async function writeJson(cacheName, key, value) {
    const cache = await caches.open(cacheName);
    await cache.put(key, new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } }));
}

// その版の保存場所が完成しているか（完成の印がそろっているときだけ保存場所の名前を返す）
async function completeCache(version) {
    if (typeof version !== 'string' || !VERSION_RE.test(version)) return null;
    const name = CACHE_PREFIX + version;
    if (!(await caches.has(name))) return null;
    const complete = await readJson(name, metaKey('complete'));
    return complete && complete.version === version ? name : null;
}

// 使う版（完成の印がそろっているときだけ返す）
async function activeVersion() {
    const active = await readJson(META_CACHE, metaKey('active'));
    if (!active) return null;
    const name = await completeCache(active.version);
    return name ? { version: active.version, cacheName: name } : null;
}

// 画面ごとの表示中の版（Service Worker が止まっても消えないよう保存場所にも書く）
const clientVersions = new Map();
async function recordClient(clientId, version) {
    if (!clientId) return;
    clientVersions.set(clientId, version);
    await writeJson(META_CACHE, CLIENT_PREFIX + encodeURIComponent(clientId), { version: version });
}
async function clientVersion(clientId) {
    if (!clientId) return null;
    if (clientVersions.has(clientId)) return clientVersions.get(clientId);
    const rec = await readJson(META_CACHE, CLIENT_PREFIX + encodeURIComponent(clientId));
    if (rec && typeof rec.version === 'string') { clientVersions.set(clientId, rec.version); return rec.version; }
    return null;
}

// ------------------------------------------------------------
// 版の取得と検証
// ------------------------------------------------------------
async function sha256Hex(buf) {
    const d = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('');
}

async function fetchJsonNoStore(rel) {
    const res = await fetch(fileKey(rel) + '?t=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error(rel + ' を取得できません（' + res.status + '）');
    return res.json();
}

async function fetchBuildInfo() {
    const info = await fetchJsonNoStore('build-info.json');
    if (!info || info.app !== 'yueki-tekika-web' || !VERSION_RE.test(info.version || '') || !info.files || !info.files['index.html']) {
        throw new Error('build-info.json の形式が想定と違います');
    }
    return info;
}

async function isRevoked(version) {
    const json = await fetchJsonNoStore('revoked.json');
    if (!json || !Array.isArray(json.revoked)) throw new Error('revoked.json の形式が想定と違います');
    return json.revoked.some((r) => r && r.version === version);
}

// 取得中の保存場所（片付けで消さないため）
const downloading = new Set();

// 版をまるごと取得・検証して保存する。成功したら完成の印を書く（使う版の切り替えはしない）
async function downloadVersion(info) {
    const name = CACHE_PREFIX + info.version;
    downloading.add(name);
    // 前に途中まで保存したものが残っていれば消してからやり直す
    await caches.delete(name);
    try {
        const cache = await caches.open(name);
        const files = Object.keys(info.files).filter((rel) => !NOT_CACHED.has(rel));
        for (const rel of files) {
            if (rel.includes('..') || rel.startsWith('/') || /^[a-z]+:/i.test(rel) || rel.startsWith('__meta/')) throw new Error('想定外のファイル名: ' + rel);
            // ?v=版番号 を付けて取得する（途中の中継・ブラウザの保存分を使わないため no-store も付ける）
            const res = await fetch(fileKey(rel) + '?v=' + encodeURIComponent(info.version), { cache: 'no-store' });
            if (!res.ok) throw new Error(rel + ' を取得できません（' + res.status + '）');
            const buf = await res.arrayBuffer();
            const expect = info.files[rel];
            if (buf.byteLength !== expect.size) throw new Error(rel + ' の大きさが違います');
            if ((await sha256Hex(buf)) !== expect.sha256) throw new Error(rel + ' のハッシュが違います');
            const type = res.headers.get('Content-Type') || 'application/octet-stream';
            await cache.put(fileKey(rel), new Response(buf, { headers: { 'Content-Type': type } }));
        }
        // 保存した中身を読み直して、もう一度すべて確かめてから完成の印を書く
        for (const rel of files) {
            const res = await cache.match(fileKey(rel));
            if (!res) throw new Error(rel + ' が保存されていません');
            if ((await sha256Hex(await res.arrayBuffer())) !== info.files[rel].sha256) throw new Error(rel + ' の保存内容が違います');
        }
        await writeJson(name, metaKey('complete'), {
            version: info.version, sourceCommit: info.sourceCommit, builtAt: info.builtAt,
            fileCount: files.length, verifiedAt: new Date().toISOString(),
        });
        return name;
    } catch (e) {
        await caches.delete(name);
        throw e;
    } finally {
        downloading.delete(name);
    }
}

async function setActive(version) {
    await writeJson(META_CACHE, metaKey('active'), { version: version, activatedAt: new Date().toISOString() });
}

// 使わなくなった保存場所と記録を片付ける
//   残すもの：使う版・開いている画面が表示中の版・取得中の版
async function cleanup() {
    const active = await activeVersion();
    const keep = new Set(downloading);
    if (active) keep.add(active.cacheName);
    const live = new Set((await self.clients.matchAll({ includeUncontrolled: true, type: 'all' })).map((c) => c.id));
    const meta = await caches.open(META_CACHE);
    for (const req of await meta.keys()) {
        if (!req.url.startsWith(CLIENT_PREFIX)) continue;
        const id = decodeURIComponent(req.url.slice(CLIENT_PREFIX.length));
        if (!live.has(id)) { await meta.delete(req); clientVersions.delete(id); continue; }
        const rec = await readJson(META_CACHE, req.url);
        if (rec && typeof rec.version === 'string') keep.add(CACHE_PREFIX + rec.version);
    }
    for (const name of await caches.keys()) {
        if (name.startsWith(CACHE_PREFIX) && !keep.has(name)) await caches.delete(name);
    }
}

// まだ使える版がないときだけ、最新版を取得して使う版にする（ある場合は何もしない＝自動更新しない）
async function prepareFirstVersion() {
    if (await activeVersion()) return;
    const info = await fetchBuildInfo();
    await downloadVersion(info);
    await setActive(info.version);
}

// 利用者が更新を押したとき：指定の版（web-post.js が確認した最新版）を取得・検証し、使う版にする
let updateInFlight = null;
async function updateTo(expected) {
    const info = await fetchBuildInfo();
    if (info.version !== expected) throw new Error('サーバーの版が変わりました');
    if (await isRevoked(info.version)) throw new Error('使用停止の版です');
    const active = await activeVersion();
    if (!active || active.version !== info.version) {
        await downloadVersion(info);
        await setActive(info.version);
    }
    await cleanup();
    return info.version;
}

// ------------------------------------------------------------
// ライフサイクル
// ------------------------------------------------------------
self.addEventListener('install', (event) => {
    // 失敗したら install も失敗させる（この Service Worker は使われず、ページはこれまでどおりネットから読む）
    event.waitUntil(prepareFirstVersion());
});

self.addEventListener('activate', (event) => {
    event.waitUntil(cleanup());
});

self.addEventListener('message', (event) => {
    const data = event.data || {};
    const port = event.ports && event.ports[0];
    if (data.type !== 'update' || !port) return;
    if (!updateInFlight) updateInFlight = updateTo(data.version).finally(() => { updateInFlight = null; });
    const job = updateInFlight.then(
        (version) => port.postMessage({ ok: version === data.version, version: version }),
        (e) => port.postMessage({ ok: false, error: String(e && e.message || e) }));
    event.waitUntil(job);
});

// ------------------------------------------------------------
// 表示：保存場所から返す
// ------------------------------------------------------------
// リクエストを保存場所のキーに直す。保存版で扱わないものは null（ネットへ）
function keyFor(request) {
    if (request.method !== 'GET') return null;
    const url = new URL(request.url);
    if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE.pathname)) return null;
    let rel;
    try { rel = decodeURIComponent(url.pathname.slice(BASE.pathname.length)); } catch (e) { return null; }
    if (request.mode === 'navigate') {
        // 画面そのもの（/ と /index.html）。?lang= などの付いたものも同じ画面
        if (rel === '' || rel === 'index.html') return { key: fileKey('index.html'), navigate: true };
        return null;
    }
    if (rel === '' || NOT_CACHED.has(rel) || rel.startsWith('__meta/')) return null;
    // 付いてよいのは ?v=版番号 だけ
    for (const k of url.searchParams.keys()) if (k !== 'v') return null;
    return { key: fileKey(rel), navigate: false };
}

self.addEventListener('fetch', (event) => {
    const target = keyFor(event.request);
    if (!target) return;   // ブラウザの通常の処理に任せる
    event.respondWith((async () => {
        if (target.navigate) {
            const active = await activeVersion();
            if (active) {
                const hit = await (await caches.open(active.cacheName)).match(target.key);
                if (hit) {
                    // 片付け（cleanup）はここではしない。開いた直後の画面はまだ一覧に出ないことがあり、記録を消してしまうため
                    event.waitUntil(recordClient(event.resultingClientId, active.version).catch(() => {}));
                    return hit;
                }
            }
            return fetch(event.request);
        }
        // 画面が表示中の版の保存場所から返す（記録がなければ使う版）
        const version = await clientVersion(event.clientId);
        let name = version ? await completeCache(version) : null;
        if (!name && !version) { const active = await activeVersion(); name = active && active.cacheName; }
        if (name) {
            const hit = await (await caches.open(name)).match(target.key);
            if (hit) return hit;
        }
        return fetch(event.request);
    })());
});
