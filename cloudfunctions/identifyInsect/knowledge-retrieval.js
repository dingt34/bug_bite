const knowledgeBase = require('./knowledge-base');

const VERSION = 'team-lead-draft-2026-08-full-v1';
const MAX_CANDIDATES = 3;
const FACT_PATHS = [
  'redFlags.breathingDifficulty', 'redFlags.airwaySwelling', 'redFlags.faintingOrUnconscious',
  'redFlags.seizure', 'redFlags.severeBleeding', 'redFlags.progressiveAscendingWeakness',
  'symptoms.fever', 'symptoms.markedSystemicUnwell', 'symptoms.severePain', 'symptoms.neurologic',
  'symptoms.rash', 'symptoms.headache', 'symptoms.muscleAches', 'symptoms.nightItching',
  'symptoms.vomitingOrPalpitations', 'local.infectionSigns', 'local.tissueBreakdown',
  'local.widespreadBlistering', 'local.widespreadRash', 'local.bleedingNotStopping',
  'local.dischargeOrUlceration', 'local.escharLikeLesion', 'local.scalpDischarge',
  'exposure.eyeOrMucosa', 'exposure.mouthOrEyeArea', 'exposure.multipleStings',
  'exposure.householdCluster', 'exposure.inRelevantTravelRegion', 'exposure.internalAttachmentSuspected',
  'exposure.suspectedInfestation', 'person.isChild', 'removal.canRemoveSafely', 'removal.hardToReach'
];

const catalog = knowledgeBase.listKnowledgePacks().map(summary => {
  const pack = knowledgeBase.getKnowledgePack(summary.objectId);
  return {
    objectId: summary.objectId,
    name: summary.name,
    scientificName: summary.scientificName,
    aliases: pack.organism.aliases || [],
    commonCategory: pack.organism.commonCategory,
    groupName: pack.organism.groupName
  };
});
const catalogById = catalog.reduce((result, item) => {
  result[item.objectId] = item;
  return result;
}, {});
const GENERIC_MATCHES = [
  { pattern: /蚊子|蚊虫/, objectIds: ['mosquito'] },
  { pattern: /跳蚤/, objectIds: ['flea'] },
  { pattern: /臭虫|床虱/, objectIds: ['bedbug'] },
  { pattern: /蜱虫|硬蜱|蜱叮咬/, objectIds: ['tick'] },
  { pattern: /黄蜂|胡蜂|蜜蜂|蜂蜇|蜂群/, objectIds: ['bee_wasp'] },
  { pattern: /蚂蚁/, objectIds: ['ant'] },
  { pattern: /蜈蚣/, objectIds: ['scolopendra_subspinipes_mutilans'] },
  { pattern: /隐翅虫/, objectIds: ['rove_beetle'] },
  { pattern: /毛毛虫|毛虫/, objectIds: ['caterpillar'] },
  { pattern: /蜘蛛/, objectIds: ['spider'] },
  { pattern: /水蛭|蚂蟥/, objectIds: ['leech'] }
];

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function catalogPromptText() {
  return catalog.map(item => {
    const aliases = item.aliases.length ? '；别名：' + item.aliases.join('、') : '';
    return item.objectId + '｜' + item.name + '｜' + item.scientificName + aliases;
  }).join('\n');
}

function candidateTerms(item) {
  return [item.name, item.scientificName, item.commonCategory]
    .concat(item.aliases || [])
    .map(normalizeText)
    .filter(term => term && (/[\u3400-\u9fff]/.test(term) ? term.length >= 2 : term.length >= 4));
}

function findCandidateIds(text, maxCount) {
  const query = normalizeText(text);
  if (!query) return [];
  const limit = Number(maxCount) || MAX_CANDIDATES;
  const matches = catalog.map(item => {
    const score = candidateTerms(item).reduce((total, term) => query.includes(term) ? total + term.length : total, 0);
    return { objectId: item.objectId, score };
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.objectId.localeCompare(b.objectId))
    .map(item => item.objectId);
  GENERIC_MATCHES.forEach(match => {
    if (match.pattern.test(query)) match.objectIds.forEach(objectId => {
      if (!matches.includes(objectId)) matches.push(objectId);
    });
  });
  return matches.slice(0, limit);
}

function resolveCandidateIds(values, fallbackText, maxCount) {
  const limit = Number(maxCount) || MAX_CANDIDATES;
  const unique = [];
  (Array.isArray(values) ? values : []).forEach(value => {
    const normalized = normalizeText(value);
    const direct = catalogById[normalized] && normalized;
    const byLabel = !direct && catalog.find(item => candidateTerms(item).includes(normalized));
    const objectId = direct || (byLabel && byLabel.objectId);
    if (objectId && !unique.includes(objectId) && unique.length < limit) unique.push(objectId);
  });
  findCandidateIds(fallbackText, limit).forEach(objectId => {
    if (!unique.includes(objectId) && unique.length < limit) unique.push(objectId);
  });
  return unique;
}

function termIsAffirmed(text, pattern) {
  const source = String(text || '');
  const regex = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g');
  let match;
  while ((match = regex.exec(source))) {
    const prefix = source.slice(Math.max(0, match.index - 7), match.index);
    if (!/(?:没有|无|未见|未出现|否认|不伴|并无|不是)\s*$/.test(prefix)) return true;
    if (!match[0].length) regex.lastIndex += 1;
  }
  return false;
}

function setPath(target, path, value) {
  const parts = path.split('.');
  let cursor = target;
  parts.slice(0, -1).forEach(part => {
    cursor[part] = cursor[part] || {};
    cursor = cursor[part];
  });
  cursor[parts[parts.length - 1]] = value;
}

function extractSafetyFacts(text) {
  const facts = {};
  const patterns = {
    'redFlags.breathingDifficulty': /呼吸困难|喘不上气|喘鸣|气促|窒息/,
    'redFlags.airwaySwelling': /(?:口唇|嘴唇).*肿|舌(?:头)?.*肿|喉(?:咙|头)?.*肿|咽喉.*肿|喉咙发紧/,
    'redFlags.faintingOrUnconscious': /昏厥|晕厥|失去意识|意识不清|昏迷/,
    'redFlags.seizure': /抽搐|癫痫发作/,
    'redFlags.severeBleeding': /大量出血|严重出血|血流不止/,
    'redFlags.progressiveAscendingWeakness': /进行性无力|无力向上蔓延|上行性无力/,
    'symptoms.fever': /发热|发烧|高烧/,
    'symptoms.markedSystemicUnwell': /全身明显不适|全身乏力|精神很差/,
    'symptoms.severePain': /剧烈疼痛|疼痛难忍|严重疼痛/,
    'symptoms.neurologic': /神经异常|肢体麻木|意识异常|视物不清/,
    'symptoms.rash': /皮疹|红疹/,
    'symptoms.headache': /头痛/,
    'symptoms.muscleAches': /肌肉酸痛|全身酸痛/,
    'symptoms.nightItching': /夜间瘙痒|晚上更痒/,
    'symptoms.vomitingOrPalpitations': /呕吐|心慌|心悸/,
    'local.infectionSigns': /流脓|化脓|红肿热痛|感染迹象/,
    'local.tissueBreakdown': /组织坏死|皮肤坏死/,
    'local.widespreadBlistering': /大面积水疱|广泛水疱/,
    'local.widespreadRash': /大面积皮疹|全身皮疹|皮疹扩散/,
    'local.bleedingNotStopping': /止不住血|持续出血|一直渗血/,
    'local.dischargeOrUlceration': /渗出|溃疡|破溃/,
    'local.escharLikeLesion': /焦痂|黑色痂皮/,
    'local.scalpDischarge': /头皮流脓|头皮渗出/,
    'exposure.eyeOrMucosa': /眼睛|眼内|口腔|鼻腔|黏膜/,
    'exposure.mouthOrEyeArea': /眼周|嘴边|口周|口唇附近/,
    'exposure.multipleStings': /多处蜇伤|多次蜇伤|大量蜇伤|蜂群蜇伤/,
    'exposure.householdCluster': /家里多人|同住者也|家庭成员也/,
    'exposure.inRelevantTravelRegion': /境外旅行|国外旅行|非洲旅行|美洲旅行|热带旅行/,
    'exposure.internalAttachmentSuspected': /体内附着|鼻腔附着|咽喉附着/,
    'exposure.suspectedInfestation': /反复发现虫体|持续出现新叮咬|疑似虫害/,
    'person.isChild': /儿童|孩子|婴儿|幼儿/,
    'removal.hardToReach': /无法取出|取不下来|位置难以操作/
  };
  Object.keys(patterns).forEach(path => {
    if (termIsAffirmed(text, patterns[path])) setPath(facts, path, true);
  });
  if (termIsAffirmed(text, /持续加重|越来越(?:红|肿|痛|痒)|范围扩大|迅速扩散/)) setPath(facts, 'local.trend', 'worsening');
  if (termIsAffirmed(text, /可以安全取出|已经完整取出/)) setPath(facts, 'removal.canRemoveSafely', true);
  return facts;
}

function compactSources(sources) {
  return (sources || []).filter(source => source.sourceType !== 'IMAGE_TAXONOMY')
    .slice(0, 4)
    .map(source => ({ title: source.title, url: source.url, sourceType: source.sourceType }));
}

function retrieve(candidateIds, facts, fallbackText) {
  const ids = resolveCandidateIds(candidateIds, fallbackText, MAX_CANDIDATES);
  return ids.map(objectId => {
    const pack = knowledgeBase.getKnowledgePack(objectId);
    const action = knowledgeBase.evaluateAction(objectId, facts || {});
    return {
      objectId,
      packVersion: pack.meta.version,
      ruleVersion: pack.meta.ruleVersion,
      status: pack.meta.status,
      organism: {
        commonName: pack.organism.commonName,
        scientificName: pack.organism.scientificName,
        commonCategory: pack.organism.commonCategory,
        summary: pack.organism.summary,
        appearance: pack.organism.appearance,
        identificationKeys: pack.organism.identificationKeys,
        distribution: pack.organism.distribution,
        habitat: pack.organism.habitat,
        contactPattern: pack.organism.contactPattern,
        commonReaction: pack.organism.commonReaction,
        compareClues: pack.organism.compareClues,
        caution: pack.organism.caution,
        identificationBoundary: pack.organism.identificationBoundary
      },
      action: {
        level: action.level,
        title: action.title,
        reason: action.reason,
        steps: action.contentBlocks.reduce((steps, block) => steps.concat(block.body || []), [])
      },
      sources: compactSources(pack.sources)
    };
  });
}

function formatContext(entries) {
  if (!entries || !entries.length) return '未匹配到可用知识包。不得据此猜测虫种；只描述可见特征并给出通用安全建议。';
  return JSON.stringify({
    knowledgeVersion: VERSION,
    reviewStatus: 'DRAFT',
    warning: '知识包仍待医学/疾控审核；图片候选不参与风险分级。',
    entries
  });
}

function validate() {
  return knowledgeBase.validateCatalog();
}

module.exports = {
  VERSION, MAX_CANDIDATES, FACT_PATHS, catalogPromptText, findCandidateIds, resolveCandidateIds,
  extractSafetyFacts, retrieve, formatContext, validate
};
