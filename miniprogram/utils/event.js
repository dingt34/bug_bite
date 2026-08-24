// 接触事件的标准化与本地保存辅助函数。

function buildEvent(draft, result, now) {
  const source = draft || {};
  const answers = source.answers || {};
  const timestamp = now || Date.now();
  const imageRecords = Array.isArray(source.imageRecords)
    ? source.imageRecords.filter(item => item && item.path).map(item => Object.assign({}, item))
    : [];
  const categorizedPaths = imageRecords.map(item => item.path);
  const imageRefs = Array.isArray(source.imageRefs) ? source.imageRefs.slice() : categorizedPaths;

  return Object.assign({}, source, {
    id: source.id || 'event_' + timestamp,
    occurredAt: source.occurredAt || answers.occurredAt || '未填写（紧急流程）',
    imageRefs: imageRefs,
    imageRecords: imageRecords,
    insectImageRef: source.insectImageRef || '',
    woundImageRef: source.woundImageRef || '',
    summary: result.summary || '',
    riskLevel: result.level,
    levelName: result.levelName,
    nextReviewAt: result.nextReviewAt,
    createdAt: source.createdAt || '刚刚',
    createdAtTimestamp: source.createdAtTimestamp || timestamp,
    updatedAtTimestamp: timestamp
  });
}

function upsertEvent(events, event) {
  const next = Array.isArray(events) ? events.slice() : [];
  const index = next.findIndex(item => item.id === event.id);
  if (index > -1) {
    next[index] = event;
  } else {
    next.unshift(event);
  }
  return next;
}

function appendReview(event, review, now) {
  const timestamp = now || Date.now();
  const reviews = Array.isArray(event.reviews) ? event.reviews.slice() : [];
  const normalizedReview = Object.assign({}, review, {
    id: review.id || 'review_' + timestamp,
    createdAt: review.createdAt || '刚刚',
    createdAtTimestamp: review.createdAtTimestamp || timestamp
  });
  reviews.push(normalizedReview);

  const imageRefs = Array.isArray(event.imageRefs) ? event.imageRefs.slice() : [];
  (normalizedReview.imageRefs || []).forEach(path => {
    if (imageRefs.indexOf(path) === -1) imageRefs.push(path);
  });

  return Object.assign({}, event, {
    answers: Object.assign({}, event.answers || {}, normalizedReview.answers || {}),
    reviews: reviews,
    imageRefs: imageRefs,
    riskLevel: normalizedReview.riskLevel,
    levelName: normalizedReview.levelName,
    nextReviewAt: normalizedReview.nextReviewAt,
    latestReviewSummary: normalizedReview.summary || '',
    latestDangerSignals: (normalizedReview.dangerSignals || []).slice(),
    updatedAtTimestamp: timestamp
  });
}

function resolveReviewLevel(previousLevel, calculatedLevel) {
  const downgradeBlocked = previousLevel === 'emergency' && calculatedLevel !== 'emergency';
  return {
    level: downgradeBlocked ? 'emergency' : calculatedLevel,
    downgradeBlocked: downgradeBlocked
  };
}

module.exports = {
  buildEvent,
  upsertEvent,
  appendReview,
  resolveReviewLevel
};
