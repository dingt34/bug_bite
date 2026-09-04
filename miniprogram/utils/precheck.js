// 行前建议规则（浙江省课程演示版）。
// 所有输入只用于生成场景化防护提示，不用于疾病概率预测或诊断。

const knowledge = require('./precheck-knowledge');

const RULE_VERSION = 'precheck-kb-1.2.0';
const WARM_MONTHS = ['5月', '6月', '7月', '8月', '9月', '10月'];

const CITY_PROFILES = {
  杭州: { tag: '城市近郊', tip: '城市近郊与山地路线差异较大，出发前再次确认具体路线生境。' },
  宁波: { tag: '沿海水域', tip: '如活动靠近海岸、河湖或湿地，注意水边和潮湿环境防护。' },
  温州: { tag: '沿海山地', tip: '沿海与山地场景并存，应按实际路线补充水域边或林地防护。' },
  嘉兴: { tag: '平原水网', tip: '如经过河网、农田或潮湿草地，减少裸露皮肤并及时检查。' },
  湖州: { tag: '山林水域', tip: '山林与水域场景可能同时出现，应结合具体生境准备防护用品。' },
  绍兴: { tag: '丘陵水网', tip: '丘陵、河网与近郊路线差异较大，应按实际生境调整装备。' },
  金华: { tag: '丘陵山地', tip: '山地或林地路线应减少进入灌木和高草区域。' },
  衢州: { tag: '山地林地', tip: '山地林地活动应优先做好衣物遮挡和返程全身检查。' },
  舟山: { tag: '海岛水域', tip: '海岛、水边和潮湿环境活动应准备基础防虫用品。' },
  台州: { tag: '沿海山地', tip: '根据实际路线在沿海水域与山地林地提示之间组合防护。' },
  丽水: { tag: '山地林地', tip: '山地林地路线应优先做好衣物遮挡和返程全身检查。' }
};

const ACTIVITY_RULES = {
  徒步登山: { tag: '步道暴露', tip: '尽量走步道中央，避免身体擦过高草和灌木。' },
  露营: { tag: '驻留暴露', tip: '营地避开高草、灌木和积水处，进入帐篷前检查衣物。' },
  骑行: { tag: '沿途暴露', tip: '休息时避开草丛和灌木，返程后检查鞋袜与裤脚。' },
  '野餐/草地活动': { tag: '草地停留', tip: '使用完整野餐垫，避免直接坐卧在草地或落叶层。' },
  '垂钓/水边活动': { tag: '水域停留', tip: '水边长时间停留时减少裸露皮肤，并注意潮湿草丛。' },
  '农事/采摘': { tag: '植被接触', tip: '穿长袖长裤和手套，避免徒手接触不明虫体。' },
  '其他户外活动': { tag: '一般户外', tip: '根据实际路线选择衣物遮挡，并在活动后检查皮肤和衣物。' }
};

const HABITAT_RULES = {
  '高草/灌木': { tag: '高草灌木', tip: '避免在高草中久坐或躺卧，离开后检查裤脚和鞋袜。' },
  '林地/落叶层': { tag: '林地落叶', tip: '不翻动枯叶和朽木，减少穿行灌木密集区域。' },
  '水边/湿地': { tag: '水边湿地', tip: '水边活动减少裸露皮肤，避免长时间停留在潮湿草丛。' },
  '农田/果园': { tag: '农田果园', tip: '进入农田或果园时穿包脚鞋和长裤，避免徒手接触不明虫体。' },
  城市公园: { tag: '城市绿地', tip: '在草地和灌木附近停留后，检查衣物、鞋袜和裸露皮肤。' },
  室内住宿: { tag: '室内住宿', tip: '入住后检查纱窗、床铺和墙角，并避免房间内长时间积水。' }
};

function addUnique(list, value) {
  if (value && list.indexOf(value) === -1) {
    list.push(value);
  }
}

function evaluatePlan(form) {
  const input = form || {};
  const regions = input.regionCodes && input.regionCodes.length
    ? input.regionCodes
    : (input.regionCode ? [input.regionCode] : []);
  const habitats = input.habitatTags || [];
  const companions = input.companionTags || [];
  const selectedGears = (input.gearTags || []).filter(item => item !== '暂未准备');
  const hasNoGear = (input.gearTags || []).indexOf('暂未准备') > -1;
  const warm = WARM_MONTHS.indexOf(input.month) > -1;
  const riskTags = [];
  const checklist = [];
  const activityTips = [];
  const returnCheck = [];
  const matchedRules = [];

  function matched(id, text) {
    matchedRules.push({ id, text });
  }

  regions.forEach(regionName => {
    const city = CITY_PROFILES[regionName];
    if (city) {
      addUnique(riskTags, city.tag);
      addUnique(activityTips, city.tip);
      matched('region_' + regionName, '目的地：' + regionName + '（' + city.tag + '场景）');
    }
  });

  if (warm) {
    addUnique(riskTags, '暖季活动');
    matched('season_warm', '出行月份处于5—10月暖季');
  } else {
    addUnique(riskTags, '低温季节');
    matched('season_cool', '出行月份处于11—4月');
  }

  const activity = ACTIVITY_RULES[input.activityType];
  if (activity) {
    addUnique(riskTags, activity.tag);
    addUnique(activityTips, activity.tip);
    matched('activity_' + input.activityType, '活动类型：' + input.activityType);
  }

  habitats.forEach(name => {
    const habitat = HABITAT_RULES[name];
    if (habitat) {
      addUnique(riskTags, habitat.tag);
      addUnique(activityTips, habitat.tip);
    }
  });
  if (habitats.length) {
    matched('habitats', '可能经过：' + habitats.join('、'));
  }

  if (input.overnight === '户外过夜') {
    addUnique(riskTags, '夜间过夜');
    addUnique(activityTips, '夜间减少长时间开灯暴露，睡前检查帐篷与寝具。');
    matched('overnight', '计划包含户外过夜');
  } else if (input.overnight === '室内住宿') {
    addUnique(riskTags, '室内住宿');
    addUnique(activityTips, '入住后检查纱窗、床铺和墙角，行李尽量不要直接放在地面。');
    matched('indoor_stay', '住宿方式：室内住宿');
  } else if (input.overnight === '当日往返') {
    matched('day_trip', '住宿方式：当日往返');
  }

  if (companions.indexOf('独自出行') > -1) {
    addUnique(activityTips, '独自出行前将路线和预计返回时间告知联系人。');
  }
  if (companions.indexOf('儿童') > -1) {
    addUnique(activityTips, '由成人协助儿童做好衣物遮挡，并在返程后检查皮肤。');
  }
  if (companions.indexOf('老年人') > -1) {
    addUnique(activityTips, '为老人预留休息与返程检查时间，出现明显不适及时结束活动。');
  }
  if (companions.indexOf('宠物') > -1) {
    addUnique(activityTips, '返程前检查宠物毛发、项圈和随身垫具，避免把虫体带入室内。');
    addUnique(returnCheck, '检查宠物毛发、项圈和垫具');
  }
  if (companions.length) {
    matched('companions', '同行情况：' + companions.join('、'));
  }

  const needsRepellent = warm || habitats.some(item => ['高草/灌木', '林地/落叶层', '水边/湿地', '农田/果园', '城市公园'].indexOf(item) > -1) || input.overnight === '户外过夜';
  const recommendedGear = ['长袖长裤', '包脚鞋袜'];
  if (needsRepellent) recommendedGear.push('驱虫剂');
  if (habitats.some(item => ['高草/灌木', '林地/落叶层'].indexOf(item) > -1)) recommendedGear.push('尖头镊子');
  if (habitats.some(item => ['林地/落叶层', '农田/果园'].indexOf(item) > -1) || input.activityType === '农事/采摘') recommendedGear.push('手套');
  if (input.overnight === '户外过夜') recommendedGear.push('帐篷/蚊帐');
  recommendedGear.push('基础急救包');

  recommendedGear.forEach(gear => {
    if (selectedGears.indexOf(gear) === -1) {
      addUnique(checklist, '准备' + gear);
    }
  });
  if (selectedGears.length) {
    addUnique(checklist, '检查已有防护用品的数量、有效期和可用状态');
    matched('available_gears', '已有用品：' + selectedGears.join('、'));
  } else if (hasNoGear) {
    matched('no_gears', '当前未准备防护用品');
  }
  addUnique(checklist, '携带充电设备和应急联系人信息');

  const knowledgeMatches = knowledge.matchKnowledge({
    month: input.month,
    activityType: input.activityType,
    habitatTags: habitats,
    overnight: input.overnight,
    companionTags: companions
  });
  knowledgeMatches.forEach(entry => {
    addUnique(riskTags, entry.tag);
    entry.prevention.forEach(tip => addUnique(activityTips, tip));
    matched('knowledge_' + entry.objectId, '知识包场景：' + entry.name);
  });

  addUnique(returnCheck, '回家后更换衣物并检查鞋袜、裤脚和随身物品');
  addUnique(returnCheck, '检查头皮、耳后、腋下、腰部和膝后等不易察觉部位');
  if (habitats.indexOf('高草/灌木') > -1 || habitats.indexOf('林地/落叶层') > -1 || habitats.indexOf('农田/果园') > -1) {
    addUnique(returnCheck, '对照出发前状态，记录新出现的叮咬、红肿或附着虫体');
  }

  const contextParts = [regions.join('、'), input.month, input.activityType].filter(Boolean);
  if (habitats.length) contextParts.push(habitats.join('、'));
  if (input.overnight) contextParts.push(input.overnight);

  return {
    id: 'rule_dynamic_zhejiang',
    ruleVersion: RULE_VERSION,
    riskTags: riskTags,
    riskSummary: '已根据“' + contextParts.join(' · ') + '”生成场景化建议。重点关注：' + riskTags.join('、') + '。',
    checklist: checklist,
    activityTips: activityTips,
    returnCheck: returnCheck,
    matchedRules: matchedRules,
    knowledgeMatches: knowledgeMatches.map(entry => ({
      objectId: entry.objectId,
      name: entry.name,
      reason: entry.reason,
      possiblePlaces: entry.possiblePlaces,
      packVersion: entry.packVersion,
      ruleVersion: entry.ruleVersion,
      status: entry.status
    })),
    knowledgeMeta: {
      interfaceVersion: knowledge.KNOWLEDGE_INTERFACE_VERSION,
      reviewStatus: knowledge.REVIEW_STATUS,
      catalogSize: knowledge.CATALOG_SIZE,
      matchedCount: knowledgeMatches.length
    }
  };
}

module.exports = {
  RULE_VERSION,
  evaluatePlan
};
