const assert = require('node:assert/strict');
const path = require('node:path');
const test = require('node:test');
const root = path.resolve(__dirname, '..');
const store = require('../miniprogram/utils/store');
const flow = require('../miniprogram/utils/safety-flow');
let memory, calls, pages, failKey, sheetIndex;
function reset() {
  memory = {}; calls = []; pages = []; failKey = ''; sheetIndex = 1;
  global.getCurrentPages = () => pages;
  global.wx = {
    getStorageSync: key => memory[key],
    setStorageSync(key, value) { if (key === failKey) throw Error('quota'); memory[key] = structuredClone(value); },
    removeStorageSync: key => { delete memory[key]; },
    showToast: options => calls.push(['toast', options.title]),
    navigateTo: options => calls.push(['navigate', options.url]),
    redirectTo: options => calls.push(['redirect', options.url]),
    navigateBack: () => calls.push(['back']),
    switchTab: options => calls.push(['tab', options.url]),
    makePhoneCall: options => calls.push(['call', options.phoneNumber]),
    setClipboardData: options => calls.push(['copy', options.data]),
    showActionSheet: options => options.success({ tapIndex: sheetIndex }),
    chooseLocation: options => options.fail({ errMsg: 'auth deny' }),
    chooseMedia: options => options.fail({ errMsg: 'auth deny' })
  };
}
function page(name, query = {}) {
  const file = path.join(root, 'miniprogram/pages', name, name + '.js');
  let definition;
  global.Page = d => { definition = d; };
  delete require.cache[require.resolve(file)]; require(file);
  const p = { ...definition, data: structuredClone(definition.data),
    setData(update, cb) { Object.assign(this.data, update); if (cb) cb(); } };
  if (p.onLoad) p.onLoad(query);
  return p;
}
const tap = value => ({ currentTarget: { dataset: { value } } });
function draft(extra = {}) {
  const d = { ...flow.newDraft(), screened: true, contactType: 'bite', symptoms: ['瘙痒'], range: '1 处',
    trend: '基本不变', facts: { bodyPart: '手臂 / 腿部' }, ...extra };
  store.set('safetyDraft', d); return d;
}
test('contact: new session after completed event, keep in-progress answers on back', () => {
  reset(); draft({ completedAt: 123, eventId: 'old' });
  pages = [{ route: 'pages/danger/danger', data: { selected: [] } }, {}];
  let p = page('contact');
  assert.equal(p.data.selected, ''); assert.equal(store.get('safetyDraft').eventId, undefined);
  const saved = draft({ step: 4 }); p = page('contact');
  p.persist(false);
  assert.equal(store.get('safetyDraft').step, 4);
  assert.deepEqual(store.get('safetyDraft').facts, saved.facts);
});
test('contact: cannot bypass selected danger signals, without editing danger page', () => {
  reset(); pages = [{ route: 'pages/danger/danger', data: { selected: ['breathing'] } }, {}];
  page('contact');
  assert.equal(calls.at(-1)[1], '/pages/result/result');
  assert.equal(flow.evaluate(store.get('safetyDraft')).level, 'emergency');
});
test('contact: direct entry requires screening; changing type clears only branch answers', () => {
  reset(); page('contact'); assert.equal(calls.at(-1)[1], '/pages/danger/danger');
  draft({ step: 4, eventId: 'same' }); const p = page('contact');
  p.select({ currentTarget: { dataset: { id: 'attached' } } });
  const d = store.get('safetyDraft');
  assert.deepEqual(d.facts, {}); assert.equal(d.eventId, 'same'); assert.deepEqual(d.symptoms, ['瘙痒']);
});
test('guide: restore answers independently of step, no silent default range/trend', () => {
  reset(); draft({ step: 2 }); let p = page('guide');
  assert.deepEqual(p.data.symptoms, ['瘙痒']);
  draft({ symptoms: [], range: '', trend: '' }); p = page('guide');
  p.next(); assert.equal(calls.at(-1)[0], 'toast'); assert.equal(p.data.range, '');
});
test('guide: no-symptom choice mutually exclusive; complete without photo', () => {
  reset(); draft(); const p = page('guide');
  p.toggle(tap('暂无明显表现')); assert.deepEqual(p.data.symptoms, ['暂无明显表现']);
  p.toggle(tap('红肿')); assert.deepEqual(p.data.symptoms, ['红肿']);
  p.addPhoto(); p.next();
  assert.equal(calls.at(-1)[1], '/pages/result/result');
  p.next(); assert.equal(calls.filter(c => c[0] === 'navigate').length, 1);
});
test('guide: attached requires branch facts; incomplete answers cannot generate result', () => {
  reset(); draft({ contactType: 'attached', facts: {} }); const p = page('guide');
  p.next(); assert.equal(calls.at(-1)[0], 'toast');
  for (const [key, value] of Object.entries({ attachedTime: '刚发现', bodyPart: '躯干', removed: '仍未移除' })) {
    p.answer({ currentTarget: { dataset: { key, value } } });
  }
  p.next(); assert.equal(store.get('safetyDraft').level, 'consult');
});
test('guide: leaving does not reduce progress or overwrite a different session', () => {
  reset(); draft({ step: 4, completedAt: 123 }); const p = page('guide');
  p.onUnload(); assert.equal(store.get('safetyDraft').step, 4); assert.equal(store.get('safetyDraft').completedAt, 123);
  const next = draft({ sessionId: 'new', symptoms: ['疼痛'] }); p.onUnload();
  assert.deepEqual(store.get('safetyDraft'), next);
});
test('result: modified answers update same event and retain creation time', () => {
  reset(); draft(); const first = page('result'); const id = first.data.eventId;
  const before = store.get('events')[0];
  draft({ ...store.get('safetyDraft'), symptoms: ['水疱'], trend: '逐渐加重' });
  const updated = page('result', { level: 'observe' });
  assert.equal(updated.data.level, 'consult'); assert.equal(updated.data.eventId, id);
  assert.equal(store.get('events').length, 1);
  assert.deepEqual(store.get('events')[0].symptoms, ['水疱']);
  assert.equal(store.get('events')[0].createdAt, before.createdAt);
  assert.ok(store.get('events')[0].nextReviewAt > Date.now());
  assert.equal(store.get('events')[0].status, '待复查');
});
test('result: emergency never shows routine care, and call survives storage failure', () => {
  reset(); draft({ dangerSignals: ['breathing'] }); failKey = 'bugtrail_v4_events';
  const p = page('result', { level: 'observe' });
  assert.equal(p.data.level, 'emergency'); assert.deepEqual(p.data.steps, []); assert.equal(p.data.saved, false);
  p.primaryAction(); assert.deepEqual(calls.at(-1), ['call', '120']);
});
test('result: fresh emergency from upstream cannot overwrite previous event', () => {
  reset(); draft(); const old = page('result').data.eventId;
  const p = page('result', { level: 'emergency' });
  assert.notEqual(p.data.eventId, old); assert.equal(store.get('events').length, 2);
});
test('result: missing facts redirect; details use event ID; copy includes branch facts', () => {
  reset(); page('result'); assert.equal(calls.at(-1)[1], '/pages/danger/danger');
  draft(); const p = page('result'); p.events(); assert.ok(calls.at(-1)[1].endsWith(p.data.eventId));
  p.copySummary(); assert.ok(calls.at(-1)[1].includes('手臂 / 腿部'));
  p.modifyAnswers(); assert.ok(calls.at(-1)[1].startsWith('/pages/guide/guide'));
});
test('result: review adjustment persists an actual local timestamp', () => {
  reset(); draft(); const p = page('result'); sheetIndex = 2; const now = Date.now();
  p.adjustReview();
  assert.ok(store.get('events')[0].nextReviewAt >= now + 4 * 3600000);
  assert.equal(p.data.reviewLabel, store.get('events')[0].reviewAt);
});
function filledPlan() {
  const p = page('precheck');
  p.inputDestination({ detail: { value: '杭州植物园' } });
  p.chooseDate({ detail: { value: '2099-10-01' } });
  p.chooseActivity({ detail: { value: '1' } }); return p;
}
test('precheck: no demonstration defaults; manual destination works without location permission', () => {
  reset(); const p = page('precheck');
  assert.equal(p.data.destination, ''); assert.equal(p.data.activity, ''); assert.deepEqual(p.data.habitats, []);
  p.chooseDestination(); assert.ok(calls.at(-1)[1].includes('手动输入'));
  const filled = filledPlan(); filled.generate(); assert.equal(store.get('plans').length, 1);
});
test('precheck: past and impossible dates rejected, whitespace destination rejected', () => {
  reset(); const p = filledPlan();
  for (const value of ['2020-01-01', '2099-02-30']) {
    p.chooseDate({ detail: { value } }); p.generate(); assert.equal(store.get('plans', []).length, 0);
  }
  p.chooseDate({ detail: { value: '2099-10-01' } }); p.inputDestination({ detail: { value: '   ' } }); p.generate();
  assert.equal(store.get('plans', []).length, 0);
});
test('precheck: generate is idempotent, draft not recreated on unload', () => {
  reset(); const p = filledPlan(); p.generate(); p.generate(); p.onUnload();
  assert.equal(store.get('plans').length, 1); assert.equal(store.get('precheckDraft', null), null);
  p.onShow(); p.generate(); assert.equal(store.get('plans').length, 1);
});
test('precheck: environment saved, old route ignored, demo distance excluded', () => {
  reset(); store.set('routeDraft', { distance: '12.6 km' });
  const p = filledPlan(); p.onShow(); assert.equal(p.data.route, null);
  p.toggleHabitat(tap('高草/灌木'));
  p.route(); store.set('routeDraft', { summary: '演示', distance: '12.6 km' }); p.onShow();
  assert.equal(p.data.route.summary, '演示'); p.generate();
  assert.equal(store.get('plans')[0].distance, ''); assert.deepEqual(store.get('plans')[0].environment, ['高草/灌木']);
});
test('precheck: storage error does not claim completion; retry reuses plan ID', () => {
  reset(); const p = filledPlan(); failKey = 'bugtrail_v4_currentPlan'; p.generate();
  assert.equal(p.completed, false); assert.equal(p.data.submitting, false);
  failKey = ''; p.generate(); assert.equal(store.get('plans').length, 1); assert.equal(p.completed, true);
});
test('guide: photo is persisted only after durable local save succeeds', () => {
  reset(); draft(); const p = page('guide');
  wx.chooseMedia = options => options.success({ tempFiles: [{ tempFilePath: 'temporary.jpg' }] });
  wx.saveFile = options => { options.success({ savedFilePath: 'saved.jpg' }); options.complete(); };
  p.addPhoto(); assert.equal(store.get('safetyDraft').photo, 'saved.jpg');
  p.removePhoto(); assert.equal(store.get('safetyDraft').photo, '');
  wx.saveFile = options => { options.fail(); options.complete(); };
  p.addPhoto(); p.next(); assert.equal(calls.at(-1)[1], '/pages/result/result');
});
test('guide: result completion survives later guide unload', () => {
  reset(); draft(); const p = page('guide'); p.toggle(tap('红肿')); p.next();
  const result = page('result'); p.onUnload();
  assert.ok(store.get('safetyDraft').completedAt);
  assert.equal(store.get('safetyDraft').eventId, result.data.eventId);
});
test('contact: repeated continue taps navigate only once', () => {
  reset(); draft(); const p = page('contact'); p.next(); p.next();
  assert.equal(calls.filter(c => c[0] === 'navigate').length, 1);
});
