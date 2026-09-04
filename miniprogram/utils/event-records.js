const LEVEL_META = {
  emergency: { label: '紧急求助', rank: 3, reviewMinutes: 0 },
  consult: { label: '尽快咨询', rank: 2, reviewMinutes: 30 },
  observe: { label: '观察记录', rank: 1, reviewMinutes: 120 }
};

const TYPE_LABELS = {
  bite: '蚊虫叮咬',
  sting: '蜂类蜇伤',
  attachment: '发现附着虫体',
  contact: '接触后皮疹/不适',
  unknown: '不确定接触'
};

function normalizeContactType(value) {
  const normalized = value === 'attached' ? 'attachment' : value;
  return TYPE_LABELS[normalized] ? normalized : 'unknown';
}

function inferContactType(value, type) {
  const normalized = normalizeContactType(value);
  const label = String(type || '');
  if (normalized !== 'unknown' || label.indexOf('不确定') >= 0) return normalized;
  if (label.indexOf('蜂') >= 0 || label.indexOf('蜇伤') >= 0) return 'sting';
  if (label.indexOf('附着虫体') >= 0) return 'attachment';
  if (label.indexOf('接触后皮疹') >= 0 || label.indexOf('接触或刺激') >= 0) return 'contact';
  if (label.indexOf('蚊虫') >= 0 || label.indexOf('叮咬') >= 0) return 'bite';
  return normalized;
}

function pad(value) {
  return String(value).padStart(2, '0');
}

function startOfDay(timestamp) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function formatClock(timestamp, now = Date.now()) {
  if (!timestamp) return '时间待补充';
  const date = new Date(timestamp);
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const dayGap = Math.round((startOfDay(now) - startOfDay(timestamp)) / 86400000);
  if (dayGap === 0) return `今天 ${time}`;
  if (dayGap === 1) return `昨天 ${time}`;
  if (date.getFullYear() === new Date(now).getFullYear()) {
    return `${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
  }
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${time}`;
}

function parseLegacyTime(value, now = Date.now()) {
  const text = String(value || '').trim();
  if (!text || text === '刚刚') return now;
  const today = text.match(/^今天\s*(\d{1,2}):(\d{2})$/);
  if (today) {
    const date = new Date(now);
    date.setHours(Number(today[1]), Number(today[2]), 0, 0);
    return date.getTime();
  }
  const monthDay = text.match(/^(\d{1,2})月(\d{1,2})日(?:\s*(\d{1,2}):(\d{2}))?$/);
  if (monthDay) {
    const date = new Date(now);
    date.setMonth(Number(monthDay[1]) - 1, Number(monthDay[2]));
    date.setHours(Number(monthDay[3] || 12), Number(monthDay[4] || 0), 0, 0);
    return date.getTime();
  }
  return now;
}

function normalizeLevel(value) {
  if (LEVEL_META[value]) return value;
  if (value === '紧急求助') return 'emergency';
  if (value === '尽快咨询') return 'consult';
  return 'observe';
}

function formatElapsed(createdAtTimestamp, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - createdAtTimestamp) / 60000));
  if (minutes < 60) return minutes < 1 ? '不足 1 分钟' : `${minutes} 分钟`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时`;
  return `${Math.floor(hours / 24)} 天`;
}

function normalizeTimelineItem(item, now) {
  const recordedAtTimestamp = Number(item.recordedAtTimestamp) || parseLegacyTime(item.timeText, now);
  const riskLevel = normalizeLevel(item.riskLevel || item.level);
  return Object.assign({}, item, {
    recordedAtTimestamp,
    timeText: formatClock(recordedAtTimestamp, now),
    riskLevel,
    riskLabel: LEVEL_META[riskLevel].label,
    symptomsText: (item.symptoms || []).join('、') || '未记录新的局部表现',
    systemicText: (item.systemicSymptoms || []).join('、') || '无新增全身不适',
    measuresText: (item.measures || []).join('、') || '未补充处理措施'
  });
}

function normalizeEvent(source, now = Date.now()) {
  const event = source || {};
  const contactType = inferContactType(event.contactType, event.type);
  const type = TYPE_LABELS[contactType] || event.type || TYPE_LABELS.unknown;
  const createdAtTimestamp = Number(event.createdAtTimestamp || event.createdAtMs) || parseLegacyTime(event.createdAt, now);
  const riskLevel = normalizeLevel(event.riskLevel || event.level);
  const highestRiskLevel = normalizeLevel(event.highestRiskLevel || riskLevel);
  const terminalStatuses = ['已恢复', '历史', '已完成'];
  const status = terminalStatuses.indexOf(event.status) >= 0
    ? event.status
    : (riskLevel === 'emergency' ? '待求助' : '待复查');
  let nextReviewAtTimestamp = Number(event.nextReviewAtTimestamp || event.nextReviewAt) || 0;
  if (!nextReviewAtTimestamp && status === '待复查') {
    nextReviewAtTimestamp = createdAtTimestamp + Math.max(LEVEL_META[riskLevel].reviewMinutes, 1) * 60000;
  }
  let timeline = Array.isArray(event.timeline) ? event.timeline.slice() : [];
  if (!timeline.length) {
    timeline.push({
      id: `initial_${event.id || createdAtTimestamp}`,
      kind: 'initial',
      title: '首次安全判断',
      recordedAtTimestamp: createdAtTimestamp,
      riskLevel,
      symptoms: event.symptoms || [],
      trend: event.initialTrend || event.trend || '待观察',
      range: event.initialRange || ''
    });
  }
  if (timeline.length === 1 && Array.isArray(event.reviews) && event.reviews.length) {
    event.reviews.forEach((review, index) => {
      timeline.push({
        id: review.id || `legacy_review_${index}_${createdAtTimestamp}`,
        kind: 'review',
        title: `第 ${index + 1} 次复查`,
        recordedAtTimestamp: Number(review.createdAtTimestamp) || parseLegacyTime(review.createdAt, now),
        riskLevel: review.riskLevel || review.level,
        symptoms: review.symptoms || (review.answers && review.answers.localSymptoms) || [],
        systemicSymptoms: review.systemicSymptoms || (review.answers && review.answers.systemicSymptoms) || [],
        trend: review.trend || (review.answers && review.answers.trend) || '',
        range: review.range || '',
        measures: review.measures || review.actionsTaken || []
      });
    });
  }
  timeline = timeline.map(item => normalizeTimelineItem(item, now)).sort((a, b) => a.recordedAtTimestamp - b.recordedAtTimestamp);
  return Object.assign({}, event, {
    id: event.id || `event_${createdAtTimestamp}`,
    type,
    contactType,
    place: event.place === '待补充' ? '' : (event.place || ''),
    riskLevel,
    highestRiskLevel,
    highestRiskLabel: LEVEL_META[highestRiskLevel].label,
    level: LEVEL_META[riskLevel].label,
    createdAtTimestamp,
    createdAt: formatClock(createdAtTimestamp, now),
    nextReviewAtTimestamp,
    reviewAt: status === '待复查' && nextReviewAtTimestamp ? formatClock(nextReviewAtTimestamp, now) : '已完成',
    status,
    symptoms: event.symptoms || [],
    symptomsText: (event.symptoms || []).join('、') || '暂无明显局部表现',
    systemicSymptoms: event.systemicSymptoms || [],
    systemicText: (event.systemicSymptoms || []).join('、') || '暂无全身不适',
    measures: event.measures || [],
    measuresText: (event.measures || []).join('、') || '暂未记录',
    imageRefs: event.imageRefs && event.imageRefs.length ? event.imageRefs : event.imageFileIds || [],
    imageFileIds: event.imageFileIds || [],
    timeline,
    recoveryLogs: event.recoveryLogs || timeline.filter(item => item.kind === 'review'),
    elapsedText: formatElapsed(createdAtTimestamp, now),
    syncStatus: event.syncStatus || '待同步'
  });
}

function createEvent(input, now = Date.now()) {
  const source = input || {};
  const contactType = normalizeContactType(source.contactType);
  const riskLevel = normalizeLevel(source.riskLevel || source.level);
  const reviewMinutes = LEVEL_META[riskLevel].reviewMinutes;
  const event = {
    id: source.id,
    type: source.type || TYPE_LABELS[contactType],
    contactType,
    riskLevel,
    highestRiskLevel: riskLevel,
    level: LEVEL_META[riskLevel].label,
    place: source.place || '',
    body: source.body || '待补充',
    symptoms: source.symptoms || [],
    systemicSymptoms: source.systemicSymptoms || [],
    trend: source.trend || '待观察',
    initialTrend: source.trend || '待观察',
    measures: source.measures || [],
    imageRefs: source.imageRefs || [],
    imageFileIds: source.imageFileIds || [],
    createdAtTimestamp: now,
    nextReviewAtTimestamp: reviewMinutes ? now + reviewMinutes * 60000 : 0,
    status: riskLevel === 'emergency' ? '待求助' : '待复查',
    ruleVersion: source.ruleVersion || 'p0-local-v5',
    syncStatus: '待同步'
  };
  return normalizeEvent(event, now);
}

function applyReview(source, review, now = Date.now()) {
  const event = normalizeEvent(source, now);
  const input = review || {};
  const systemicSymptoms = input.systemicSymptoms || [];
  const derivedLevel = input.dangerSignals && input.dangerSignals.length ? 'emergency' :
    (input.trend === '逐渐加重' || input.range === '扩大' || systemicSymptoms.length ? 'consult' : 'observe');
  const highestRiskLevel = LEVEL_META[event.highestRiskLevel].rank > LEVEL_META[derivedLevel].rank
    ? event.highestRiskLevel : derivedLevel;
  const symptoms = input.symptoms || [];
  const completed = derivedLevel === 'observe' && input.trend === '明显减轻' && symptoms.length === 0 && systemicSymptoms.length === 0;
  const count = (event.recoveryLogs || []).length + 1;
  const log = {
    id: input.id || `review_${now}`,
    kind: 'review',
    title: `第 ${count} 次复查`,
    recordedAtTimestamp: now,
    riskLevel: derivedLevel,
    symptoms,
    systemicSymptoms,
    trend: input.trend || '基本不变',
    range: input.range || '不变',
    measures: input.measures || [],
    imageRefs: input.imageRefs || [],
    imageFileIds: input.imageFileIds || []
  };
  const reviewMinutes = LEVEL_META[derivedLevel].reviewMinutes;
  return normalizeEvent(Object.assign({}, event, {
    riskLevel: derivedLevel,
    highestRiskLevel,
    level: LEVEL_META[derivedLevel].label,
    symptoms,
    systemicSymptoms: log.systemicSymptoms,
    trend: log.trend,
    range: log.range,
    measures: log.measures,
    status: completed ? '已恢复' : '待复查',
    nextReviewAtTimestamp: completed ? 0 : now + reviewMinutes * 60000,
    imageRefs: event.imageRefs.concat(log.imageRefs),
    imageFileIds: event.imageFileIds.concat(log.imageFileIds),
    recoveryLogs: (event.recoveryLogs || []).concat(log),
    timeline: event.timeline.concat(log),
    syncStatus: '待同步'
  }), now);
}

function toCloudRecord(source) {
  const event = normalizeEvent(source);
  return {
    type: event.type,
    contactType: event.contactType,
    level: event.level,
    riskLevel: event.riskLevel,
    highestRiskLevel: event.highestRiskLevel,
    place: event.place,
    body: event.body,
    symptoms: event.symptoms,
    systemicSymptoms: event.systemicSymptoms,
    trend: event.trend,
    createdAtText: event.createdAt,
    createdAtTimestamp: event.createdAtTimestamp,
    reviewAt: event.reviewAt,
    nextReviewAtTimestamp: event.nextReviewAtTimestamp,
    status: event.status,
    reminderId: event.reminderId || '',
    reminderStatus: event.reminderStatus || '',
    measures: event.measures,
    imageFileIds: event.imageFileIds,
    timeline: event.timeline.map(item => ({
      id: item.id, kind: item.kind, title: item.title, recordedAtTimestamp: item.recordedAtTimestamp,
      riskLevel: item.riskLevel, symptoms: item.symptoms || [], systemicSymptoms: item.systemicSymptoms || [],
      trend: item.trend || '', range: item.range || '', measures: item.measures || [], imageFileIds: item.imageFileIds || []
    })),
    recoveryLogs: (event.recoveryLogs || []).map(item => ({
      id: item.id, recordedAtTimestamp: item.recordedAtTimestamp, riskLevel: item.riskLevel,
      symptoms: item.symptoms || [], systemicSymptoms: item.systemicSymptoms || [], trend: item.trend || '',
      range: item.range || '', measures: item.measures || [], imageFileIds: item.imageFileIds || []
    })),
    notes: event.notes || [],
    ruleVersion: event.ruleVersion,
    syncStatus: event.syncStatus
  };
}

function matches(event, query) {
  const keyword = String(query || '').trim().toLowerCase();
  if (!keyword) return true;
  return [event.type, event.place, event.body, event.level, event.createdAt, event.symptomsText]
    .some(value => String(value || '').toLowerCase().indexOf(keyword) >= 0);
}

module.exports = {
  LEVEL_META,
  TYPE_LABELS,
  formatClock,
  formatElapsed,
  normalizeLevel,
  normalizeContactType,
  normalizeEvent,
  createEvent,
  applyReview,
  toCloudRecord,
  matches
};
