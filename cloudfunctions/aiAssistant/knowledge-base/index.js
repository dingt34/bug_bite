const guide = require('./core-records')
const manifest = require('./catalog-manifest')
const candidateRecords = require('./candidate-records')
const { COMMON_EMERGENCY_CONDITIONS, getProfile } = require('./profiles')

const LEVELS = {
  IMMEDIATE_HELP: { rank: 3, title: '立即求助' },
  CONSULT_SOON: { rank: 2, title: '尽快咨询' },
  OBSERVE: { rank: 1, title: '观察记录' }
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function stableSourceId(objectId, index) {
  return `src-${objectId}-${String(index + 1).padStart(2, '0')}`
}

function classifySource(title) {
  if (/项目名录/.test(title)) return 'INTERNAL_CATALOG'
  if (/Wikimedia Commons/i.test(title)) return 'IMAGE_TAXONOMY'
  if (/CDC|NHS|WHO|EPA|Healthdirect|GOV\.UK|中国疾控|疾控|卫健委|林草局|市场监督|农业农村|人民政府|地方标准|Department of Health|Yellow Book/i.test(title)) return 'OFFICIAL_OR_GOVERNMENT'
  if (/PubMed|Journal|Med J|StatPearls|大学|University|Extension|媒介生物学/i.test(title)) return 'ACADEMIC_OR_CLINICAL_REFERENCE'
  if (/GBIF/i.test(title)) return 'TAXONOMY_DATABASE'
  if (/Wikipedia/i.test(title)) return 'GENERAL_REFERENCE'
  return 'UNCLASSIFIED_REFERENCE'
}

function toSources(item) {
  return item.sources.map((source, index) => ({
    sourceId: stableSourceId(item.id, index),
    title: source.title,
    publisher: source.title.split(' · ')[0],
    sourceType: classifySource(source.title),
    url: source.url,
    publishedAt: '待补充',
    accessedAt: '2026-08-29',
    locator: '由现有产品名录继承；正式审核前需补充支持结论的页码、章节或段落',
    scope: index === 0 ? '图片授权与分类参考' : '物种、暴露、反应或处置参考'
  }))
}

function claim(claimId, topic, statement, sourceRefs, evidenceKind, limitations) {
  return {
    claimId,
    topic,
    statement,
    appliesTo: [],
    sourceRefs,
    evidenceLevel: evidenceKind === 'INTERACTION_DECISION' ? 'D' : 'C',
    evidenceKind,
    status: 'DRAFT',
    limitations: limitations || ['由现有产品名录结构化，需完成逐结论来源定位和医学审核。']
  }
}

function content(contentId, stage, title, body, sourceClaimIds) {
  return { contentId, stage, title, body, sourceClaimIds, offlineAvailable: true }
}

function buildKnowledgePack(entry) {
  const item = guide.getById(entry.objectId) || candidateRecords.getById(entry.objectId)
  if (!item) throw new Error(`Catalog item missing: ${entry.objectId}`)
  const safetyProfile = getProfile(entry.profileId)
  const sources = toSources(item)
  const allSourceIds = sources.map((source) => source.sourceId)
  const evidenceSourceIds = sources
    .filter((source) => !['IMAGE_TAXONOMY', 'GENERAL_REFERENCE', 'INTERNAL_CATALOG'].includes(source.sourceType))
    .map((source) => source.sourceId)
  const actionSourceIds = evidenceSourceIds.length ? evidenceSourceIds : allSourceIds
  const prefix = item.id

  const claims = [
    claim(`${prefix}-identity`, '对象身份', `${item.name}（${item.scientificName}）属于${item.commonCategory}。${item.summary}`, allSourceIds, 'MEDICAL_FACT'),
    claim(`${prefix}-appearance`, '外观线索', `${item.appearance} 辨识线索包括：${item.identificationKeys.join('；')}。`, allSourceIds, 'MEDICAL_FACT', ['典型照片和外观线索不能替代专业鉴定，个体、性别和生长阶段可能造成差异。']),
    claim(`${prefix}-ecology`, '分布与环境', `${item.distribution} 常见环境：${item.habitat}`, allSourceIds, 'MEDICAL_FACT', ['分布资料只能用于场景提示，不能计算个人接触或感染概率。']),
    claim(`${prefix}-contact`, '接触方式', item.contactPattern, actionSourceIds, 'MEDICAL_FACT'),
    claim(`${prefix}-reaction`, '常见表现', item.commonReaction, actionSourceIds, 'MEDICAL_FACT', ['皮肤表现常与其他对象重叠，不能由皮损反推物种。']),
    claim(`${prefix}-prevention`, '预防', safetyProfile.prevention.join('；'), actionSourceIds, 'PRODUCT_SAFETY_POLICY'),
    claim(`${prefix}-first-action`, '发现后行动', safetyProfile.firstActions.join('；'), actionSourceIds, 'PRODUCT_SAFETY_POLICY'),
    claim(`${prefix}-emergency`, '急症门槛', '出现呼吸困难、口咽肿胀、晕厥、意识异常、抽搐或严重异常出血时，应中断普通问答并立即求助。', actionSourceIds, 'PRODUCT_SAFETY_POLICY', ['这是通用公众急症分流，不用于诊断具体疾病；最终中文表达需临床审核。']),
    claim(`${prefix}-image-boundary`, '图片识别边界', safetyProfile.identificationBoundary, [], 'PRODUCT_SAFETY_POLICY', ['图片候选仅用于记录，不参与行动分级。']),
    claim(`${prefix}-followup`, '观察与升级', safetyProfile.followup.join('；'), actionSourceIds, 'PRODUCT_SAFETY_POLICY')
  ].map((record) => Object.assign(record, { appliesTo: [item.name, item.scientificName, safetyProfile.label] }))

  const contentBlocks = [
    content(`${prefix}-overview`, 'overview', item.name, [item.summary, item.appearance, item.compareClues], [`${prefix}-identity`, `${prefix}-appearance`]),
    content(`${prefix}-prevention-content`, 'prevention', '减少接触', safetyProfile.prevention, [`${prefix}-prevention`, `${prefix}-ecology`]),
    content(`${prefix}-discovery`, 'discovery', '发现后先做什么', ['先确认是否存在需要立即求助的危险表现。'].concat(safetyProfile.firstActions), [`${prefix}-first-action`, `${prefix}-emergency`]),
    content(`${prefix}-image`, 'image', '图片仅用于辅助记录', [safetyProfile.identificationBoundary, '没有照片或图片无法判断时，仍可继续安全处置和症状分流。'], [`${prefix}-image-boundary`]),
    content(`${prefix}-record`, 'record', '记录关键事实', ['记录发生时间、地点、身体部位、接触方式和当前表现。', '记录变化趋势、已经采取的措施和可选照片。', '图片候选与身体表现必须分开保存。'], [`${prefix}-contact`, `${prefix}-reaction`, `${prefix}-image-boundary`]),
    content(`${prefix}-immediate-help`, 'advice', '立即求助', ['立即拨打120或前往急诊。', '不要继续普通问卷或等待图片结果。', '如安全可行，可复制事件摘要。'], [`${prefix}-emergency`]),
    content(`${prefix}-consult-soon`, 'advice', '尽快咨询', ['建议尽快联系医疗机构，并携带本次事件记录。', '说明发生时间、地点、接触方式和症状变化。', '出现危险信号时立即升级求助。'], [`${prefix}-reaction`, `${prefix}-followup`]),
    content(`${prefix}-observe`, 'advice', '观察记录', ['目前未触发需要立即求助或尽快咨询的条件。', ...safetyProfile.firstActions, ...safetyProfile.followup], [`${prefix}-first-action`, `${prefix}-followup`]),
    content(`${prefix}-followup-content`, 'followup', '复查变化', ['先确认是否出现新的危险信号。', ...safetyProfile.followup, '历史最高行动等级和当前状态应分别保存。'], [`${prefix}-emergency`, `${prefix}-followup`])
  ]

  const rules = [
    {
      ruleId: `${prefix}-rule-immediate-help`,
      priority: 100,
      level: 'IMMEDIATE_HELP',
      when: { any: COMMON_EMERGENCY_CONDITIONS.concat(safetyProfile.extraEmergencyConditions) },
      reason: '出现需要中断普通问答的急症表现。',
      evidenceClaimIds: [`${prefix}-emergency`],
      contentBlockIds: [`${prefix}-immediate-help`],
      status: 'DRAFT'
    },
    {
      ruleId: `${prefix}-rule-consult-soon`,
      priority: 50,
      level: 'CONSULT_SOON',
      when: { any: safetyProfile.consultConditions },
      reason: '出现需要尽快由医疗专业人员评估的表现或处置困难。',
      evidenceClaimIds: [`${prefix}-reaction`, `${prefix}-followup`],
      contentBlockIds: [`${prefix}-consult-soon`],
      status: 'DRAFT'
    },
    {
      ruleId: `${prefix}-rule-observe`,
      priority: 0,
      level: 'OBSERVE',
      when: { always: true },
      reason: '目前未触发更高行动条件，仍需完成一般处置并观察变化。',
      evidenceClaimIds: [`${prefix}-first-action`, `${prefix}-followup`],
      contentBlockIds: [`${prefix}-observe`],
      status: 'DRAFT'
    }
  ]

  return {
    meta: {
      packId: `arthropod-${item.id}-zh-CN`,
      objectId: item.id,
      profileId: entry.profileId,
      version: entry.packVersion,
      ruleVersion: entry.ruleVersion,
      createdAt: '2026-08-29',
      status: entry.status,
      catalogStatus: entry.catalogStatus,
      mediaStatus: entry.mediaStatus || 'READY',
      reviewNote: entry.reviewNote
    },
    organism: {
      commonName: item.name,
      scientificName: item.scientificName,
      commonCategory: item.commonCategory,
      aliases: item.aliases,
      group: item.group,
      groupName: item.groupName,
      summary: item.summary,
      appearance: item.appearance,
      identificationKeys: item.identificationKeys,
      distribution: item.distribution,
      zhejiangStatus: item.zhejiangStatus || '',
      habitat: item.habitat,
      contactPattern: item.contactPattern,
      commonReaction: item.commonReaction,
      compareClues: item.compareClues,
      caution: item.caution,
      identificationBoundary: safetyProfile.identificationBoundary
    },
    media: item.images || [],
    sources,
    claims,
    rules,
    contentBlocks,
    reviewPolicy: {
      mode: entry.profileId === 'hard_tick' ? 'FOCUS_14_DAYS_PLUS_EXTENDED' : 'SYMPTOM_TRIGGERED',
      focusDays: entry.profileId === 'hard_tick' ? 14 : null,
      guidance: safetyProfile.followup,
      scheduleEvidenceKind: 'INTERACTION_DECISION'
    },
    invariants: [
      '图片候选、置信度和病原字段不得参与行动分级',
      '立即求助规则优先于普通规则',
      '观察级不得表达为安全、确诊阴性或无感染风险',
      '不得自动推荐处方药、抗生素或个体剂量',
      '行动结果必须返回知识包版本和规则版本'
    ]
  }
}

const entriesById = manifest.reduce((result, entry) => {
  result[entry.objectId] = entry
  return result
}, {})

const packsById = manifest.reduce((result, entry) => {
  result[entry.objectId] = buildKnowledgePack(entry)
  return result
}, {})

function getKnowledgePack(objectId) {
  const pack = packsById[objectId]
  if (!pack) throw new Error(`Unknown knowledge object: ${objectId}`)
  return clone(pack)
}

function listKnowledgePacks() {
  return manifest.map((entry) => {
    const pack = packsById[entry.objectId]
    return clone({
      objectId: entry.objectId,
      profileId: entry.profileId,
      name: pack.organism.commonName,
      scientificName: pack.organism.scientificName,
      group: pack.organism.group,
      version: entry.packVersion,
      ruleVersion: entry.ruleVersion,
      status: entry.status,
      sourceCount: pack.sources.length,
      claimCount: pack.claims.length
    })
  })
}

function getKnowledgeFlow(objectId, context) {
  const settings = context || {}
  const pack = packsById[objectId]
  if (!pack) throw new Error(`Unknown knowledge object: ${objectId}`)
  const blocks = settings.stage
    ? pack.contentBlocks.filter((block) => block.stage === settings.stage)
    : pack.contentBlocks
  const claimIds = new Set()
  blocks.forEach((block) => block.sourceClaimIds.forEach((id) => claimIds.add(id)))
  const claims = pack.claims.filter((record) => claimIds.has(record.claimId))
  const sourceIds = new Set()
  claims.forEach((record) => record.sourceRefs.forEach((id) => sourceIds.add(id)))
  return clone({
    objectId,
    packVersion: pack.meta.version,
    ruleVersion: pack.meta.ruleVersion,
    status: pack.meta.status,
    organism: pack.organism,
    contentBlocks: blocks,
    claims,
    sources: pack.sources.filter((source) => sourceIds.has(source.sourceId)),
    reviewPolicy: pack.reviewPolicy
  })
}

function readPath(input, path) {
  return path.split('.').reduce((value, part) => value == null ? undefined : value[part], input)
}

function conditionMatches(condition, facts) {
  const actual = readPath(facts, condition.path)
  if (condition.operator === 'equals') return actual === condition.value
  if (condition.operator === 'includes') return Array.isArray(actual) && actual.indexOf(condition.value) > -1
  return false
}

function ruleMatches(rule, facts) {
  if (rule.when.always) return true
  const any = rule.when.any || []
  const all = rule.when.all || []
  return (!any.length || any.some((condition) => conditionMatches(condition, facts))) &&
    (!all.length || all.every((condition) => conditionMatches(condition, facts)))
}

function evaluateAction(objectId, facts) {
  const pack = packsById[objectId]
  if (!pack) throw new Error(`Unknown knowledge object: ${objectId}`)
  const input = facts || {}
  const rule = pack.rules.slice().sort((a, b) => b.priority - a.priority).find((candidate) => ruleMatches(candidate, input))
  if (!rule) throw new Error(`No action rule matched for: ${objectId}`)
  return clone({
    level: rule.level,
    levelRank: LEVELS[rule.level].rank,
    title: LEVELS[rule.level].title,
    reason: rule.reason,
    triggeredRuleIds: [rule.ruleId],
    evidenceClaimIds: rule.evidenceClaimIds,
    contentBlocks: rule.contentBlockIds.map((id) => pack.contentBlocks.find((block) => block.contentId === id)).filter(Boolean),
    reviewPolicy: pack.reviewPolicy,
    packVersion: pack.meta.version,
    ruleVersion: pack.meta.ruleVersion,
    status: pack.meta.status
  })
}

function conditionsOf(rule) {
  return (rule.when.any || []).concat(rule.when.all || [])
}

function validateKnowledgePack(pack) {
  const errors = []
  if (!pack || !pack.meta || !pack.organism) return { valid: false, errors: ['知识包缺少 meta 或 organism'] }
  const sourceIds = new Set((pack.sources || []).map((record) => record.sourceId))
  const claimIds = new Set((pack.claims || []).map((record) => record.claimId))
  const contentIds = new Set((pack.contentBlocks || []).map((record) => record.contentId))

  if (!pack.sources || !pack.sources.length) errors.push(`${pack.meta.objectId} 没有来源`)
  if ((!pack.media || !pack.media.length) && pack.meta.mediaStatus !== 'PENDING_LICENSE') {
    errors.push(`${pack.meta.objectId} 没有图片授权记录，也未标记为待授权`)
  }

  ;(pack.claims || []).forEach((record) => {
    record.sourceRefs.forEach((sourceId) => {
      if (!sourceIds.has(sourceId)) errors.push(`${record.claimId} 引用了不存在的来源 ${sourceId}`)
    })
  })
  ;(pack.contentBlocks || []).forEach((block) => {
    if (!block.sourceClaimIds.length) errors.push(`${block.contentId} 没有关联结论`)
    block.sourceClaimIds.forEach((claimId) => {
      if (!claimIds.has(claimId)) errors.push(`${block.contentId} 引用了不存在的结论 ${claimId}`)
    })
  })
  ;(pack.rules || []).forEach((rule) => {
    conditionsOf(rule).forEach((condition) => {
      if (/^(image|recognition)(\.|$)/.test(condition.path)) errors.push(`${rule.ruleId} 使用了禁止的图片或识别字段`)
    })
    rule.evidenceClaimIds.forEach((claimId) => {
      if (!claimIds.has(claimId)) errors.push(`${rule.ruleId} 引用了不存在的结论 ${claimId}`)
    })
    rule.contentBlockIds.forEach((contentId) => {
      if (!contentIds.has(contentId)) errors.push(`${rule.ruleId} 引用了不存在的内容 ${contentId}`)
    })
  })

  const sortedRules = (pack.rules || []).slice().sort((a, b) => b.priority - a.priority)
  if (!sortedRules.length || sortedRules[0].level !== 'IMMEDIATE_HELP') errors.push(`${pack.meta.objectId} 最高优先级不是立即求助`)
  if (!(pack.rules || []).some((rule) => rule.level === 'OBSERVE' && rule.when.always)) errors.push(`${pack.meta.objectId} 缺少观察兜底规则`)
  return { valid: errors.length === 0, errors }
}

function validateCatalog() {
  const errors = []
  const guideIds = guide.list({}).map((item) => item.id)
    .concat(candidateRecords.RECORDS.map((item) => item.id)).sort()
  const manifestIds = manifest.map((entry) => entry.objectId).sort()
  if (guideIds.join('|') !== manifestIds.join('|')) errors.push('知识库对象与核心产品名录不一致')
  manifestIds.forEach((objectId) => {
    const result = validateKnowledgePack(packsById[objectId])
    result.errors.forEach((error) => errors.push(error))
  })
  return { valid: errors.length === 0, errors, packCount: manifest.length }
}

module.exports = {
  KNOWLEDGE_INTERFACE_VERSION: '1.0.0',
  getKnowledgePack,
  listKnowledgePacks,
  getKnowledgeFlow,
  evaluateAction,
  validateKnowledgePack,
  validateCatalog,
  _entriesById: entriesById
}


