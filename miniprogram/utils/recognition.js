function clampScore(score) {
  const number = Number(score);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function buildDemoResult(source) {
  if (!source || !Array.isArray(source.candidates)) {
    throw new Error('invalid demo recognition data');
  }
  return {
    provider: 'local_demo',
    providerName: source.providerName || '本地模拟识别',
    versionName: source.versionName || '演示版',
    candidates: source.candidates.map(candidate => ({
      name: candidate.name || '未知候选',
      percent: Math.round(clampScore(candidate.score) * 100)
    })),
    uncertain: true,
    note: source.note || '仅为演示候选，不代表真实识别结论。'
  };
}

module.exports = {
  clampScore,
  buildDemoResult
};
