// 接触后分级规则（课程演示版）
// 规则只使用危险信号、症状、趋势和受伤范围；图片识别结果不参与分级。

const RULE_VERSION = 'contact-demo-1.3.0';

function hasAnswer(question, answers) {
  const value = answers[question.key];
  if (question.type === 'chips') {
    return Array.isArray(value) && value.length > 0;
  }
  return value !== undefined && value !== null && value !== '';
}

function validateRequiredAnswers(questions, answers) {
  return questions.filter(question => !hasAnswer(question, answers));
}

function evaluateRisk(contactType, answers) {
  const matchedRules = [];

  function match(id, text) {
    if (!matchedRules.some(rule => rule.id === id)) {
      matchedRules.push({ id, text });
    }
  }

  const systemic = answers.systemicSymptoms || [];
  const meaningfulSystemic = systemic.filter(item => item !== '无明显' && item !== '无明显全身不适');
  if (meaningfulSystemic.length) {
    match('systemic_symptoms', '出现全身不适：' + meaningfulSystemic.join('、'));
  }

  const local = answers.localSymptoms || [];
  const notableLocal = local.filter(item => [
    '水疱', '出血点', '出血/皮肤破损', '渗液/脓液', '红肿范围扩大'
  ].indexOf(item) > -1);
  if (notableLocal.length) {
    match('notable_local_symptoms', '局部出现需要关注的表现：' + notableLocal.join('、'));
  }

  if (answers.trend === '逐渐加重' || answers.trend === '出现新症状或新部位') {
    match('symptoms_worsening', '症状较上次记录加重或出现新的表现');
  }

  const bodyParts = answers.bodyParts || [];
  const sensitiveParts = bodyParts.filter(item => item === '眼周' || item === '口唇/口腔');
  if (sensitiveParts.length) {
    match('sensitive_area', '症状涉及需要特别关注的部位：' + sensitiveParts.join('、'));
  }

  if (answers.dailyImpact === '无法正常活动') {
    match('daily_activity_limited', '症状已导致无法正常活动');
  }

  if (contactType === 'sting' && (
    answers.distribution === '分散全身' || answers.distribution === '分散在多个部位'
  )) {
    match('widespread_sting', '蜇伤分散在多个身体部位');
  }

  if (contactType === 'attachment' && [
    '部分残留', '未移除', '疑似有残留', '仍未移除'
  ].indexOf(answers.removed) > -1) {
    match('attachment_not_removed', '附着虫体未完整移除');
  }

  if (contactType === 'attachment' && answers.attachedTime === '超过24小时') {
    match('long_attachment', '报告虫体附着时间超过24小时');
  }

  return {
    level: matchedRules.length ? 'consult' : 'observe',
    matchedRules,
    ruleVersion: RULE_VERSION
  };
}

module.exports = {
  RULE_VERSION,
  validateRequiredAnswers,
  evaluateRisk
};
