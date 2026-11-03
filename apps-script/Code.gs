/**
 * NEON 11/14 원데이 클래스 신청 백엔드 (Google Apps Script 웹앱)
 * - 이 스크립트가 붙은 구글 시트의 'signups' 시트에 1행 1신청으로 저장한다.
 * - GET  ?action=list                    → 공개 명단 (취소 열쇠 해시 제외)
 * - POST {action:'add', rec:{...}, token} → 신청. token은 신청한 기기가 만든 무작위 열쇠
 * - POST {action:'cancel', id, token}    → 본인 취소 (마감 전까지, 같은 기기에서만)
 * 배포: 배포 > 새 배포 > 웹 앱, 실행 사용자 '나', 액세스 '모든 사용자'
 */
const SHEET = 'signups';
const HEAD = ['id', 'name', 'level', 'meal', 'pair', 'memo', 'tokHash', 'ts'];
const DEADLINE = new Date('2026-11-06T23:59:59+09:00').getTime();
const CHOICES = {
  level: ['처음이에요', '조금 해봤어요', '자신 있어요'],
  meal: ['참석', '미정', '불참'],
  pair: ['좋아요', '상관없음', '하이라이트만'],
};
const CLOSED_MSG = '신청이 마감됐어요. 변경이 필요하면 @rorarion 으로 DM 주세요!';

function doGet(e) {
  return json({ ok: true, list: readAll().map(publicRec) });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: '잘못된 요청이에요.' }); }
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (body.action === 'add') return json(add(body.rec || {}, String(body.token || '')));
    if (body.action === 'cancel') return json(cancel(String(body.id || ''), String(body.token || '')));
    return json({ ok: false, error: '알 수 없는 요청이에요.' });
  } finally {
    lock.releaseLock();
  }
}

function add(rec, token) {
  if (Date.now() > DEADLINE) return { ok: false, error: CLOSED_MSG };
  if (!/^[a-f0-9]{16,64}$/.test(token)) return { ok: false, error: '잘못된 요청이에요. 새로고침 후 다시 시도해 주세요.' };
  const name = clean(rec.name, 20);
  if (!name) return { ok: false, error: '이름을 입력해 주세요.' };
  for (const k in CHOICES) if (CHOICES[k].indexOf(rec[k]) < 0) return { ok: false, error: '선택 항목을 다시 확인해 주세요.' };
  if (readAll().some(r => String(r.name).trim().toLowerCase() === name.trim().toLowerCase())) {
    return { ok: false, error: '같은 이름으로 이미 신청돼 있어요. 다른 분이라면 성이나 이니셜을 붙여 주세요.' };
  }
  const id = Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  const row = { id, name, level: rec.level, meal: rec.meal, pair: rec.pair,
                memo: clean(rec.memo, 120), tokHash: hash(id + token), ts: Date.now() };
  sheet().appendRow(HEAD.map(h => row[h]));
  return { ok: true, id };
}

function cancel(id, token) {
  if (Date.now() > DEADLINE) return { ok: false, error: CLOSED_MSG };
  const sh = sheet();
  const values = sh.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][0]) !== id) continue;
    if (values[i][HEAD.indexOf('tokHash')] !== hash(id + token)) {
      return { ok: false, error: '신청한 기기에서만 취소할 수 있어요. 다른 기기라면 @rorarion 으로 DM 주세요.' };
    }
    sh.deleteRow(i + 1);
    return { ok: true };
  }
  return { ok: false, error: '이미 취소됐거나 찾을 수 없는 신청이에요.' };
}

/* ===== 유틸 ===== */
function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) { sh = ss.insertSheet(SHEET); sh.appendRow(HEAD); sh.setFrozenRows(1); }
  return sh;
}

function readAll() {
  const values = sheet().getDataRange().getValues();
  return values.slice(1).filter(v => v[0]).map(v => {
    const o = {}; HEAD.forEach((h, i) => { o[h] = v[i]; }); return o;
  });
}

function publicRec(r) {
  return { id: String(r.id), name: String(r.name), level: r.level, meal: r.meal,
           pair: r.pair, memo: String(r.memo || ''), ts: Number(r.ts) };
}

// 시트 수식 주입 방지(=, +, -, @로 시작하면 앞에 공백) + 길이 제한
function clean(s, max) {
  const t = String(s || '').trim().slice(0, max);
  return /^[=+\-@]/.test(t) ? ' ' + t : t;
}

function hash(s) {
  const salt = PropertiesService.getScriptProperties().getProperty('SALT') || initSalt();
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + s)
    .map(b => ((b + 256) % 256).toString(16).padStart(2, '0')).join('');
}

function initSalt() {
  const salt = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty('SALT', salt);
  return salt;
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
