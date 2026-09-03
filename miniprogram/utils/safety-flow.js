const store = require('./store');
const risk = require('./risk');

const typeNames = { bite: '叮咬', sting: '蜇伤', attached: '附着虫体', contact: '接触刺激', unknown: '不确定接触' };
const levelNames = { emergency: '紧急求助', consult: '尽快咨询', observe: '观察记录' };
const branches = {
  bite: [{ key: 'bodyPart', title: '主要接触部位', options: ['手臂 / 腿部', '躯干', '眼周', '口唇/口腔', '其他 / 不确定'] }],
  sting: [{ key: 'distribution', title: '蜇伤分布', options: ['单一部位', '分散在多个部位', '不确定'] }],
  attached: [
    { key: 'attachedTime', title: '发现附着至今约多久？', options: ['刚发现', '24小时内', '超过24小时', '不确定'] },
    { key: 'bodyPart', title: '附着部位', options: ['手臂 / 腿部', '躯干', '头颈部', '眼周', '口唇/口腔', '其他 / 不确定'] },
    { key: 'removed', title: '虫体目前的状态', options: ['仍未移除', '已完整移除', '疑似有残留', '不确定'] }
  ],
  contact: [{ key: 'exposure', title: '怎样发生接触？', options: ['直接碰触', '毛刺 / 液体接触', '不确定'] }],
  unknown: [{ key: 'environment', title: '出现不适前在哪里？', options: ['室内', '草地 / 林地', '近水户外', '其他 / 不确定'] }]
};

function normalizeType(type) { return type === 'attachment' ? 'attached' : (typeNames[type] ? type : 'unknown'); }
function questions(type, answers = {}) {
  return branches[normalizeType(type)].map(q => ({ ...q, options: q.options.map(value => ({ value, selected: answers[q.key] === value })) }));
}
function newDraft() { return { sessionId: store.id('safety'), step: 1, dangerSignals: [], screened: false }; }
function evaluate(draft) {
  if ((draft.dangerSignals || []).length) return { level: 'emergency', matchedRules: [{ id: 'danger_signals', text: '报告了危险信号，应立即求助，不继续普通问答。' }], ruleVersion: risk.RULE_VERSION };
  const type = normalizeType(draft.contactType);
  const facts = draft.facts || {};
  return risk.evaluateRisk(type === 'attached' ? 'attachment' : type, {
    ...facts, bodyParts: facts.bodyPart ? [facts.bodyPart] : [],
    localSymptoms: (draft.symptoms || []).map(s => s === '出血' ? '出血/皮肤破损' : s),
    systemicSymptoms: draft.systemicSymptoms || [], trend: draft.trend,
    distribution: type === 'sting' && draft.range === '多处 / 成片' ? '分散在多个部位' : facts.distribution
  });
}
function complete(draft) {
  return draft.screened && draft.contactType && (draft.symptoms || []).length > 0 && draft.range && draft.trend
    && branches[normalizeType(draft.contactType)].every(q => (draft.facts || {})[q.key]);
}
function persist(patch) {
  try { store.set('safetyDraft', patch); return true; }
  catch (_) { wx.showToast({ title: '本地保存失败，请释放存储后重试', icon: 'none' }); return false; }
}
function stamp(time = Date.now()) {
  const date = new Date(time);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
module.exports = { typeNames, levelNames, normalizeType, questions, newDraft, evaluate, complete, persist, stamp };
