// 行前准备使用的知识库适配层。
// 文案取自 cloudfunctions/aiAssistant/knowledge-base 的 prevention 内容块；
// tests/precheck-knowledge.test.js 会校验两端内容一致，避免离线副本静默漂移。

const KNOWLEDGE_INTERFACE_VERSION = '1.1.0';
const REVIEW_STATUS = 'DRAFT';
const CATALOG_SIZE = 45;

const ENTRIES = [
  {
    objectId: 'mosquito', name: '蚊虫活动场景', tag: '蚊虫防护', packVersion: '1.0.0', ruleVersion: '1.0.0',
    habitats: ['水边/湿地', '城市公园'], activities: ['露营', '野餐/草地活动', '垂钓/水边活动'], overnight: ['户外过夜'], warm: true,
    reason: '暖季、积水周边、绿地或户外过夜可能增加蚊虫接触机会。',
    possiblePlaces: '居民区、公园、林缘及花盆托盘、废旧容器等小型积水周边。',
    prevention: ['穿着覆盖皮肤的衣物，并按合法产品标签使用驱避剂。', '清除或遮盖小型积水容器，住宿时使用纱窗、蚊帐等物理防护。']
  },
  {
    objectId: 'tick', name: '硬蜱接触场景', tag: '蜱类防护', packVersion: '1.0.0', ruleVersion: '1.0.0',
    habitats: ['高草/灌木', '林地/落叶层', '农田/果园'], activities: ['徒步登山', '露营', '农事/采摘'], companions: ['宠物'],
    reason: '高草、灌木、林地和动物活动区域需要做好蜱类接触防护。',
    possiblePlaces: '高草、灌木、林地、落叶层以及牲畜或野生动物可能经过的区域。',
    prevention: ['在草地、灌木和林地穿浅色长袖长裤并扎紧裤脚。', '回家后检查身体、衣物、装备和宠物。']
  },
  {
    objectId: 'chigger', name: '恙螨接触场景', tag: '草地防护', packVersion: '1.0.0', ruleVersion: '1.0.0',
    habitats: ['高草/灌木', '林地/落叶层', '农田/果园'], activities: ['农事/采摘'],
    reason: '草丛、灌丛、田野和潮湿林缘活动需要减少皮肤与植被直接接触。',
    possiblePlaces: '草丛、灌木、田埂、河岸、林地边缘等潮湿环境，幼虫爬到草叶顶端等待宿主经过。',
    prevention: ['在草地、灌丛、田野活动时使用衣物遮挡并避免直接坐卧。', '活动后尽快更换和清洗衣物，并检查皮肤褶皱和衣物收紧处。']
  },
  {
    objectId: 'biting_midge', name: '蠓及吸血飞虫场景', tag: '水边飞虫', packVersion: '1.0.0', ruleVersion: '1.0.0',
    habitats: ['水边/湿地'], activities: ['垂钓/水边活动'],
    reason: '水边、湿地和植被茂盛处可能有蠓等小型吸血飞虫活动。',
    possiblePlaces: '水边、池塘、湖边、草地、树荫等阴凉潮湿、植被茂盛处；幼虫孳生于水体边缘淤泥、湿润沙土等。',
    prevention: ['在水边、溪流、牧区或湿地活动时增加衣物遮挡。', '按合法产品标签使用驱避剂，并减少在虫群密集区域停留。']
  },
  {
    objectId: 'bee_wasp', name: '蜂类活动场景', tag: '蜂类避让', packVersion: '1.0.0', ruleVersion: '1.0.0',
    habitats: ['林地/落叶层', '农田/果园', '城市公园'], activities: ['野餐/草地活动', '农事/采摘'],
    reason: '林地、果园、花丛和户外食物附近应留意蜂巢与蜂群。',
    possiblePlaces: '林地、果园、花丛、屋檐及高处或隐蔽处的巢穴周边。',
    prevention: ['不要靠近、触碰或震动蜂巢，发现蜂群时缓慢远离。', '户外食物和含糖饮料及时封闭，穿鞋并避免徒手拍打蜂类。']
  },
  {
    objectId: 'caterpillar', name: '刺激性毛虫场景', tag: '毛虫接触', packVersion: '1.0.0', ruleVersion: '1.0.0',
    habitats: ['林地/落叶层', '农田/果园'], activities: ['徒步登山', '农事/采摘'],
    reason: '林地、茶园、园林和枝叶作业需要避免毛虫、虫茧及脱落毒毛。',
    possiblePlaces: '林地、园林和多种阔叶植物叶片上，幼虫可能混在枝叶或掉落物中。',
    prevention: ['不要徒手触摸毛虫、虫茧或沾有毒毛的枝叶和衣物。', '林地、茶园或绿化作业时使用长袖衣物、手套和眼部防护。']
  },
  {
    objectId: 'rove_beetle', name: '隐翅虫接触场景', tag: '灯光诱虫', packVersion: '1.0.0', ruleVersion: '1.0.0',
    habitats: ['水边/湿地', '农田/果园'], activities: ['露营'], overnight: ['户外过夜'],
    reason: '潮湿植被附近和夜间灯光环境需要避免在皮肤上拍打虫体。',
    possiblePlaces: '农田、水边、草地和潮湿植被附近，夜间可能被灯光吸引进入室内。',
    prevention: ['夜间减少强光诱虫，发现虫体时轻吹或用纸片移走。', '不要在皮肤上拍打、碾压或揉擦虫体。']
  },
  {
    objectId: 'bedbug', name: '住宿环境场景', tag: '住宿检查', packVersion: '1.0.0', ruleVersion: '1.0.0',
    habitats: ['室内住宿'], overnight: ['室内住宿'],
    reason: '旅行住宿时可主动检查床具、家具缝隙和行李放置区域。',
    possiblePlaces: '床垫包边、床架、家具缝隙、行李和住宿环境。',
    prevention: ['旅行住宿时检查床垫包边、床架和行李放置区域。', '避免把来源不明的床具或家具直接带入居住空间。']
  },
  {
    objectId: 'flea', name: '宠物及寝具场景', tag: '宠物环境', packVersion: '1.0.0', ruleVersion: '1.0.0',
    companions: ['宠物'],
    reason: '携带宠物出行时应同时检查宠物、垫具和休息区域。',
    possiblePlaces: '宠物休息区、地毯、软垫、动物巢穴及相关室内环境。',
    prevention: ['检查宠物及其休息区域，定期清洁寝具和软装环境。', '持续发现跳蚤或新叮咬时寻求规范的宠物诊疗和虫害控制。']
  },
  {
    objectId: 'leech', name: '水蛭附着场景', tag: '涉水防护', packVersion: '0.1.0', ruleVersion: '0.1.0',
    habitats: ['水边/湿地'], activities: ['垂钓/水边活动'],
    reason: '进入淡水、湿地或潮湿植被区域时需要做好覆盖和离水检查。',
    possiblePlaces: '淡水、湿地、溪流或潮湿植被环境。',
    prevention: ['在已知有水蛭的水域或湿地使用覆盖皮肤的衣物和鞋袜。', '离开水域后检查皮肤和衣物。']
  }
];

function intersects(selected, expected) {
  return (selected || []).some(value => (expected || []).indexOf(value) >= 0);
}

function matchEntry(entry, input) {
  return (entry.warm && ['5月', '6月', '7月', '8月', '9月', '10月'].indexOf(input.month) >= 0) ||
    intersects(input.habitatTags, entry.habitats) ||
    (entry.activities || []).indexOf(input.activityType) >= 0 ||
    (entry.overnight || []).indexOf(input.overnight) >= 0 ||
    intersects(input.companionTags, entry.companions);
}

function matchKnowledge(input) {
  return ENTRIES.filter(entry => matchEntry(entry, input || {})).map(entry => Object.assign({}, entry, {
    status: REVIEW_STATUS,
    prevention: entry.prevention.slice()
  }));
}

module.exports = { KNOWLEDGE_INTERFACE_VERSION, REVIEW_STATUS, CATALOG_SIZE, ENTRIES, matchKnowledge };
