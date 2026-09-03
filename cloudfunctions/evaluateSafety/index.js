const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const EMERGENCY = ['breathing','face_swelling','consciousness','multiple_sites','rapid_spread'];
const CONSULT = ['worsening','severe_pain','large_area','eye_or_mouth','retained_stinger','long_attachment'];

exports.main = async event => {
  const dangerSignals = Array.isArray(event.dangerSignals) ? event.dangerSignals : [];
  const facts = Array.isArray(event.facts) ? event.facts : [];
  let level = 'observe';
  const reasons = [];
  for (const signal of dangerSignals) if (EMERGENCY.includes(signal)) reasons.push(signal);
  if (reasons.length) level = 'emergency';
  else {
    for (const fact of facts) if (CONSULT.includes(fact)) reasons.push(fact);
    if (reasons.length) level = 'consult';
  }
  const reviewMinutes = level === 'observe' ? 120 : level === 'consult' ? 30 : 0;
  return {
    ok: true,
    data: {
      level,
      reasons,
      reviewMinutes,
      ruleVersion: 'p0-2026-08-31',
      disclaimer: '这是安全分流建议，不构成医疗诊断。'
    }
  };
};
