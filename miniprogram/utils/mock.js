// utils/mock.js —— 本地演示数据，当前未接入云数据库或外部规则服务

// ===== 五类接触事件 =====
const CONTACT_TYPES = [
  { key: 'bite', name: '吸血或普通叮咬', desc: '如蚊、蠓、跳蚤等造成的叮咬', icon: '🦟' },
  { key: 'sting', name: '蜂、蚁等蜇伤', desc: '被蜂、蚁、蝎或带毒刺毛的虫体刺伤', icon: '🐝' },
  { key: 'attachment', name: '虫体附着', desc: '虫体仍附着在皮肤上，如蜱、蚂蟥', icon: '🕷️' },
  { key: 'contact', name: '毒毛、体液或皮肤接触', desc: '接触虫体、毒毛或体液后出现皮肤不适', icon: '🌿' },
  { key: 'unknown', name: '暂时不能确定', desc: '没有看清虫体或不清楚如何接触', icon: '❓' }
];

// ===== 危险信号（先行闸门）=====
const DANGER_SIGNALS = [
  { key: 'breath', name: '呼吸异常', desc: '呼吸困难、喘鸣、喉咙发紧' },
  { key: 'swell', name: '面部/口咽肿胀', desc: '嘴唇、眼睑、舌头明显肿胀' },
  { key: 'conscious', name: '意识异常', desc: '头晕、昏厥、意识模糊' },
  {
    key: 'multi',
    name: '大量多处叮咬/蜇伤',
    desc: '短时间内发生大量、多处叮咬或蜇伤',
    contactTypes: ['bite', 'sting']
  },
  { key: 'worsen', name: '症状快速加重', desc: '短时间内症状明显变差' }
];

// ===== 通用问答（所有事件类型共用）=====
const COMMON_QUESTIONS = [
  {
    key: 'occurredAt', label: '发生时间', type: 'picker',
    group: '接触情况', help: '选择最接近的时间范围',
    options: ['刚刚', '1小时内', '1–6小时', '6–24小时', '超过24小时', '暂时不清楚']
  },
  {
    key: 'bodyParts', label: '当前受影响部位', type: 'chips',
    group: '症状位置', help: '选择目前出现叮咬、蜇伤或不适的部位，可多选',
    options: ['头皮/耳后', '眼周', '口唇/口腔', '颈部', '上肢', '下肢', '躯干', '手足']
  },
  {
    key: 'localSymptoms', label: '当前局部表现', type: 'chips',
    group: '局部症状', help: '按现在看到或感觉到的表现选择，可多选',
    options: ['红斑/红肿', '瘙痒/风团', '疼痛/灼热', '出血/皮肤破损', '水疱', '渗液/脓液', '红肿范围扩大', '无明显']
  },
  {
    key: 'systemicSymptoms', label: '当前全身表现', type: 'chips',
    group: '全身症状', help: '指不只局限于接触部位的表现，可多选',
    options: ['全身风团/皮疹', '发热/寒战', '恶心/呕吐/腹痛', '头晕/明显乏力', '头痛/肌肉酸痛', '无明显']
  },
  {
    key: 'trend', label: '变化趋势', type: 'single',
    group: '变化情况', help: '与症状刚出现时相比，选择整体变化',
    options: ['刚发生，暂不清楚', '正在好转', '基本不变', '逐渐加重']
  },
  {
    key: 'dailyImpact', label: '对日常活动的影响', type: 'single',
    group: '影响程度', help: '包括睡眠、行走和正常活动',
    options: ['无影响', '轻微影响', '影响睡眠或活动', '无法正常活动']
  }
];

// ===== 条件追问（按事件类型）=====
const SPECIFIC_QUESTIONS = {
  bite: [
    { key: 'count', label: '叮咬数量', type: 'single', group: '接触范围', help: '大量、多处叮咬应在危险筛查中选择', options: ['单处', '少数几处'] }
  ],
  sting: [
    { key: 'count', label: '蜇伤数量', type: 'single', group: '接触范围', help: '大量、多处蜇伤应在危险筛查中选择', options: ['单处', '少数几处'] },
    { key: 'distribution', label: '蜇伤分布', type: 'single', group: '接触范围', help: '选择蜇伤是否集中在同一区域', options: ['局部集中', '分散在多个部位'] }
  ],
  attachment: [
    { key: 'attachedTime', label: '估计附着时间', type: 'single', group: '虫体状态', help: '不知道准确时间时请选择“不清楚”', options: ['不足1小时', '1–24小时', '超过24小时', '不清楚'] },
    { key: 'removed', label: '虫体当前状态', type: 'single', group: '虫体状态', help: '不要强挖难以移除的疑似残留部分', options: ['已完整移除', '疑似有残留', '仍未移除'] }
  ],
  contact: [
    { key: 'contactMode', label: '可能的接触方式', type: 'single', group: '接触方式', help: '选择最接近的一项', options: ['直接碰到虫体', '接触毒毛/虫茧', '接触虫体体液', '接触衣物或物品', '可能吸入飘散毒毛', '不清楚'] }
  ],
  unknown: [
    { key: 'environment', label: '当时所处环境', type: 'chips', group: '接触线索', help: '用于保留环境线索，可多选', options: ['草丛/灌木', '林地/落叶层', '水域边', '室内住宿', '接触动物', '夜间户外'] }
  ]
};

// ===== 症状复查问答 =====
// 复查只记录当前可观察状态，不重复询问首次事件中的发生时间、数量和接触环境。
const REVIEW_QUESTIONS = {
  common: [
    {
      key: 'bodyParts', label: '当前受影响部位', type: 'chips',
      help: '选择目前仍有症状的部位，可多选',
      options: ['头皮/耳后', '眼周', '口唇/口腔', '颈部', '上肢', '下肢', '躯干', '手足']
    },
    {
      key: 'localSymptoms', label: '当前局部表现', type: 'chips',
      help: '按现在看到或感觉到的表现选择，可多选',
      options: ['红斑/红肿', '瘙痒', '疼痛/灼热', '局部发热', '水疱', '渗液/脓液', '红肿范围扩大', '无明显']
    },
    {
      key: 'systemicSymptoms', label: '当前全身表现', type: 'chips',
      help: '指不只局限于叮咬或接触部位的表现，可多选',
      options: ['全身风团/皮疹', '发热/寒战', '恶心/呕吐', '明显乏力', '头痛/肌肉酸痛', '无明显']
    },
    {
      key: 'trend', label: '与上次记录相比', type: 'single',
      help: '选择最符合整体变化的一项',
      options: ['明显好转', '略有好转', '基本不变', '逐渐加重', '出现新症状或新部位']
    },
    {
      key: 'dailyImpact', label: '对日常活动的影响', type: 'single',
      help: '用于记录症状对睡眠、行走或日常活动的影响',
      options: ['无影响', '轻微影响', '影响睡眠或活动', '无法正常活动']
    }
  ],
  attachment: [
    {
      key: 'removed', label: '附着虫体当前状态', type: 'single',
      help: '不要强行挖取疑似残留部分，可保留照片并咨询专业人员',
      options: ['已完整移除', '疑似有残留', '仍未移除']
    }
  ]
};

// ===== 三级风险定义 =====
const RISK_LEVELS = {
  emergency: { key: 'emergency', name: '紧急求助', color: '#E53935', icon: '🚨' },
  consult: { key: 'consult', name: '尽快咨询', color: '#F57C00', icon: '🏥' },
  observe: { key: 'observe', name: '观察记录', color: '#2E7D5B', icon: '📋' }
};

// ===== 行前规则（浙江 + 月份 + 活动 + 环境标签，简化演示）=====
const PRE_RULES = [
  {
    id: 'rule_ls',
    region: '浙江',
    match: { months: ['5月', '6月', '7月', '8月', '9月', '10月'], activities: ['徒步登山', '露营'] },
    riskTags: ['山地林地', '暖季活动', '步道暴露'],
    riskSummary: '浙江山区夏秋季蜱、蠓、蚊、蜂类活动频繁，草丛与林地暴露风险较高。',
    checklist: [
      '穿浅色长袖长裤，裤脚扎入袜子',
      '按产品说明准备并使用适合自己的驱虫剂',
      '避免在草丛、灌木中久坐或躺卧',
      '备好尖头镊子和基础急救包',
      '携带充电宝与应急联系人信息'
    ],
    activityTips: ['远离蜂巢与开花密集区', '夜间减少强光吸引蚊虫', '定时相互检查衣物与暴露皮肤'],
    returnCheck: ['回家后立即淋浴并更换衣物', '全身检查皮肤褶皱、头皮、腹股沟等部位', '检查随身物品与宠物是否带入虫体']
  },
  {
    id: 'rule_default',
    region: '浙江',
    match: { months: ['1月', '2月', '3月', '4月', '11月', '12月'], activities: [] },
    riskTags: ['低温季节', '常规防护'],
    riskSummary: '当前月份气温较低，节肢动物活动相对减弱，但仍需基础防护。',
    checklist: ['长袖长裤与合脚鞋袜', '基础驱虫剂', '随身小药包'],
    activityTips: ['避免翻动枯叶与朽木', '注意室内角落'],
    returnCheck: ['回家后简单检查衣物与皮肤']
  }
];

// ===== 浙江地区（省/市/区县 简化）=====
const REGIONS = [
  '杭州', '宁波', '温州', '嘉兴', '湖州',
  '绍兴', '金华', '衢州', '舟山', '台州', '丽水'
];

const MONTHS = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

const ACTIVITIES = [
  '徒步登山', '露营', '骑行', '野餐/草地活动',
  '垂钓/水边活动', '农事/采摘', '其他户外活动'
];

const HABITATS = [
  '高草/灌木', '林地/落叶层', '水边/湿地',
  '农田/果园', '城市公园', '室内住宿'
];

const COMPANIONS = ['独自出行', '同行成人', '儿童', '老年人', '宠物'];

const GEARS = [
  '长袖长裤', '包脚鞋袜', '驱虫剂', '帐篷/蚊帐',
  '手套', '尖头镊子', '基础急救包', '暂未准备'
];

// ===== 演示帖子 =====
const POSTS = [
  {
    id: 'post_001', displayName: '山野观察员', time: '2小时前',
    text: '丽水白云山徒步，草丛路段记得把裤脚扎进袜子，回来检查发现有蜱，已经处理。大家户外务必仔细检查。',
    imageRefs: [],
    tags: ['丽水', '附着虫体', '已处理'],
    likeCount: 12,
    collectCount: 5
  },
  {
    id: 'post_002', displayName: '露营新手', time: '昨天',
    text: '第一次露营，被蠓虫咬了好多包，比蚊子咬痒太多了，涂了止痒膏。求问有什么好办法防蠓？',
    imageRefs: [],
    tags: ['叮咬', '露营', '观察中'],
    likeCount: 8,
    collectCount: 3
  }
];

// ===== 演示事件 =====
const DEMO_EVENTS = [
  {
    id: 'event_001',
    contactType: 'attachment',
    contactTypeName: '发现附着虫体',
    occurredAt: '今天 14:20',
    riskLevel: 'observe',
    nextReviewAt: '24小时后',
    summary: '左小腿发现蜱，已完整移除，局部无红肿，建议持续观察。'
  }
];

// ===== 本地识别演示数据（固定候选，不请求外部识别服务）=====
const RECOGNITION_MOCK = {
  provider: 'local_demo',
  providerName: '本地模拟识别',
  versionName: '演示版',
  candidates: [
    { name: '中华按蚊', score: 0.87 },
    { name: '白纹伊蚊', score: 0.65 },
    { name: '致倦库蚊', score: 0.42 }
  ],
  uncertain: true,
  note: '这是固定演示候选，不代表照片的真实识别结果；安全判断以症状和危险信号为准。'
};

module.exports = {
  CONTACT_TYPES,
  DANGER_SIGNALS,
  COMMON_QUESTIONS,
  SPECIFIC_QUESTIONS,
  REVIEW_QUESTIONS,
  RISK_LEVELS,
  PRE_RULES,
  REGIONS,
  MONTHS,
  ACTIVITIES,
  HABITATS,
  COMPANIONS,
  GEARS,
  POSTS,
  DEMO_EVENTS,
  RECOGNITION_MOCK
};
