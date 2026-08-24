// utils/mock.js —— 初稿用本地模拟数据，替代云数据库与规则引擎

// ===== 五类接触事件 =====
const CONTACT_TYPES = [
  { key: 'bite', name: '叮咬', desc: '被咬了一口，如蚊、蠓、蜱等', icon: '🦟' },
  { key: 'sting', name: '蜇伤', desc: '被刺/蜇到，如蜂、蝎、刺毛虫', icon: '🐝' },
  { key: 'attachment', name: '发现附着虫体', desc: '虫体仍在皮肤或衣物上，如蜱、蚂蟥', icon: '🕷️' },
  { key: 'contact', name: '接触后皮疹/不适', desc: '接触后局部红、痒、痛等反应', icon: '🌿' },
  { key: 'unknown', name: '不确定', desc: '不清楚发生了什么', icon: '❓' }
];

// ===== 危险信号（先行闸门）=====
const DANGER_SIGNALS = [
  { key: 'breath', name: '呼吸异常', desc: '呼吸困难、喘鸣、喉咙发紧' },
  { key: 'swell', name: '面部/口咽肿胀', desc: '嘴唇、眼睑、舌头明显肿胀' },
  { key: 'conscious', name: '意识异常', desc: '头晕、昏厥、意识模糊' },
  { key: 'multi', name: '多个部位受伤', desc: '多处叮咬/蜇伤、范围广泛' },
  { key: 'worsen', name: '症状快速加重', desc: '短时间内明显变差' }
];

// ===== 通用问答（所有事件类型共用）=====
const COMMON_QUESTIONS = [
  {
    key: 'occurredAt', label: '发生时间', type: 'picker',
    options: ['刚刚', '1小时内', '1–6小时', '6–24小时', '超过24小时']
  },
  {
    key: 'bodyParts', label: '身体部位', type: 'chips',
    options: ['头面部', '颈部', '上肢', '下肢', '躯干', '手足']
  },
  {
    key: 'localSymptoms', label: '局部表现', type: 'chips',
    options: ['红肿', '疼痛', '瘙痒', '出血点', '水疱', '无明显']
  },
  {
    key: 'systemicSymptoms', label: '全身不适', type: 'chips',
    options: ['发热', '恶心呕吐', '乏力', '皮疹扩散', '无明显']
  },
  {
    key: 'trend', label: '变化趋势', type: 'single',
    options: ['正在好转', '保持不变', '逐渐加重', '快速加重']
  }
];

// ===== 条件追问（按事件类型）=====
const SPECIFIC_QUESTIONS = {
  bite: [
    { key: 'count', label: '叮咬数量', type: 'single', options: ['单处', '少数几处', '大量多处'] }
  ],
  sting: [
    { key: 'count', label: '蜇伤数量', type: 'single', options: ['单处', '少数几处', '大量多处'] },
    { key: 'distribution', label: '分布', type: 'single', options: ['局部集中', '分散全身'] }
  ],
  attachment: [
    { key: 'attachedTime', label: '附着时间', type: 'single', options: ['不清楚', '数小时', '超过24小时'] },
    { key: 'removed', label: '是否已移除', type: 'single', options: ['已完整移除', '部分残留', '未移除'] }
  ],
  contact: [
    { key: 'contactMode', label: '接触方式', type: 'single', options: ['皮肤直接接触', '草地/植物', '动物接触', '室内', '不清楚'] }
  ],
  unknown: [
    { key: 'environment', label: '所处环境', type: 'chips', options: ['草丛', '林地', '水域边', '室内', '夜间'] }
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
    match: { months: ['5月', '6月', '7月', '8月', '9月', '10月'], activities: ['徒步', '露营', '徒步露营'] },
    riskTags: ['草丛', '林地', '夜间活动'],
    riskSummary: '浙江山区夏秋季蜱、蠓、蚊、蜂类活动频繁，草丛与林地暴露风险较高。',
    checklist: [
      '穿浅色长袖长裤，裤脚扎入袜子',
      '使用含避蚊胺（DEET）的驱虫剂',
      '避免在草丛、灌木中久坐或躺卧',
      '备好镊子、冰袋、抗组胺药',
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

const ACTIVITIES = ['徒步', '露营', '徒步露营', '骑行', '野餐', '垂钓', '亲子游'];

const HABITATS = ['草丛', '林地', '水域边', '山地', '农田', '室内'];

const COMPANIONS = ['独自', '成人同伴', '儿童', '老人', '宠物'];

const GEARS = ['长袖长裤', '驱虫剂', '蚊帐', '手套', '镊子', '冰袋', '抗组胺药', '无'];

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

// ===== 识别 mock（真实接入需云函数代理百度动物识别 API，前端不保存密钥）=====
const RECOGNITION_MOCK = {
  provider: 'baidu_animal',
  apiVersion: 'v1',
  candidates: [
    { name: '中华按蚊', score: 0.87 },
    { name: '白纹伊蚊', score: 0.65 },
    { name: '致倦库蚊', score: 0.42 }
  ],
  uncertain: true,
  note: '疑似候选，仅供参考；安全判断以症状和危险信号为准。'
};

module.exports = {
  CONTACT_TYPES,
  DANGER_SIGNALS,
  COMMON_QUESTIONS,
  SPECIFIC_QUESTIONS,
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
