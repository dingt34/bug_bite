// 虫种数据模块（图鉴 18 / 详情 19 / 对比 20 三页共用）
//
// 新增虫种：在 SPECIES 数组里追加一条即可，三个页面会自动生效，
// 不需要再改页面代码。字段说明见下方第一条注释。

const CATEGORIES = ['全部', '叮咬', '蜇伤', '附着', '接触'];

// 对比表的行顺序与表头文案
const COMPARE_ROWS = [
  { key: 'size', label: '体型' },
  { key: 'action', label: '活动' },
  { key: 'habitat', label: '环境' },
  { key: 'contact', label: '接触' },
  { key: 'tip', label: '提示' }
];

const MAX_COMPARE = 3;

const SPECIES = [
  {
    id: 'tick',
    name: '长角血蜱',
    latin: 'Haemaphysalis longicornis',
    category: '附着',          // 必须是 CATEGORIES 里的一项（不含"全部"）
    typeLabel: '附着类',        // 对比页卡片下方的小字
    meta: '草地 · 灌木 · 附着', // 图鉴卡片下方的小字
    aliases: ['蜱虫', '硬蜱', '草爬子'], // 搜索关键词
    photo: '/images/insect-guide/haemaphysalis-longicornis/01-overview.webp',
    photoCredit: 'James Gathany, CDC · Public domain',
    guideIcon: '/assets/figma/all/s18-imgEllipse1.svg',
    compareIcon: '/assets/figma/all/s20-imgEllipse1.svg',
    features: [
      { n: '1', t: '盾形背板', d: '身体扁平，附着吸血后明显膨大' },
      { n: '2', t: '八足成虫', d: '若虫与成虫足数和体型不同' },
      { n: '3', t: '缓慢爬行', d: '通常不会跳跃或飞行' }
    ],
    environments: [
      { name: '草地', active: true },
      { name: '灌木', active: true },
      { name: '动物活动区', active: false },
      { name: '春夏秋', active: true }
    ],
    compare: {
      size: '芝麻至豆粒',
      action: '缓慢爬行',
      habitat: '草地灌木',
      contact: '可持续附着',
      tip: '检查附着时间'
    },
    detailNote: '不要仅依据图片自行移除附着物'
  },
  {
    id: 'mosquito',
    name: '白纹伊蚊',
    latin: 'Aedes albopictus',
    category: '叮咬',
    typeLabel: '叮咬类',
    meta: '近水 · 夏季 · 叮咬',
    aliases: ['伊蚊', '花蚊子', '亚洲虎蚊', '蚊子'],
    photo: '/images/insect-guide/aedes-albopictus/01-overview.webp',
    photoCredit: 'Sixto E. Picones Puebla · CC BY-SA 4.0',
    guideIcon: '/assets/figma/all/s18-imgEllipse4.svg',
    compareIcon: '/assets/figma/all/s20-imgEllipse4.svg',
    features: [
      { n: '1', t: '胸背白线', d: '胸部背面有一条明显的纵向白色条纹' },
      { n: '2', t: '腿部白环', d: '足上有黑白相间的环状斑纹' },
      { n: '3', t: '白天活动', d: '与夜间活动的家蚊不同，白天也会叮咬' }
    ],
    environments: [
      { name: '积水容器', active: true },
      { name: '居民区', active: true },
      { name: '草地', active: false },
      { name: '夏秋', active: true }
    ],
    compare: {
      size: '细长、小型',
      action: '飞行、叮咬',
      habitat: '近水、居住区',
      contact: '短暂吸血',
      tip: '关注肿痒变化'
    },
    detailNote: '叮咬包的形状不能用来判断蚊种'
  },
  {
    id: 'rove_beetle',
    name: '隐翅虫',
    latin: 'Paederus fuscipes',
    category: '接触',
    typeLabel: '接触类',
    meta: '灯光 · 夏秋 · 接触',
    aliases: ['毒隐翅虫', '青腰虫', '梭毒隐翅虫'],
    photo: '/images/insect-guide/paederus-fuscipes/01-overview.webp',
    photoCredit: 'Kyu3a · CC BY-SA 4.0',
    guideIcon: '/assets/figma/all/s18-imgEllipse5.svg',
    compareIcon: '/assets/figma/all/s20-imgEllipse5.svg',
    features: [
      { n: '1', t: '黑橙相间', d: '细长虫体，头尾偏黑、腹部橙红' },
      { n: '2', t: '短鞘翅', d: '鞘翅很短，腹部大部分露在外面' },
      { n: '3', t: '不叮咬', d: '不靠叮咬致伤，拍碎后体液接触皮肤才是风险' }
    ],
    environments: [
      { name: '灯光下', active: true },
      { name: '农田草地', active: true },
      { name: '室内', active: false },
      { name: '夏秋', active: true }
    ],
    compare: {
      size: '细长、小型',
      action: '爬行、趋光',
      habitat: '灯光、农田',
      contact: '体液接触',
      tip: '不要拍打或揉压'
    },
    detailNote: '发现停在皮肤上时轻轻吹走，不要拍打'
  },
  {
    id: 'bee',
    name: '胡蜂',
    latin: 'Vespa velutina',
    category: '蜇伤',
    typeLabel: '蜇伤类',
    meta: '林缘 · 蜂区 · 蜇伤',
    aliases: ['马蜂', '黄脚胡蜂', '虎头蜂', '蜂'],
    photo: '/images/insect-guide/vespa-velutina/01-overview.webp',
    photoCredit: 'Charles J. Sharp · CC BY-SA 4.0',
    guideIcon: '/assets/figma/all/s18-imgEllipse3.svg',
    compareIcon: '/assets/figma/all/s20-imgEllipse5.svg',
    features: [
      { n: '1', t: '体色偏深', d: '整体颜色较深，足端偏黄' },
      { n: '2', t: '体表近无毛', d: '与多毛的蜜蜂不同，可反复蜇刺' },
      { n: '3', t: '护巢攻击', d: '接近巢穴时可能成群防御攻击' }
    ],
    environments: [
      { name: '林缘', active: true },
      { name: '屋檐', active: true },
      { name: '草地', active: false },
      { name: '夏秋', active: true }
    ],
    compare: {
      size: '较粗壮',
      action: '飞行、护巢',
      habitat: '林缘、屋檐',
      contact: '刺蜇疼痛',
      tip: '远离蜂巢'
    },
    detailNote: '被多处蜇伤或出现全身症状时立即就医'
  }
];

function all() {
  return SPECIES;
}

function getById(id) {
  return SPECIES.find(item => item.id === id) || SPECIES[0];
}

// 图鉴页的筛选：分类 + 关键词（名称 / 学名 / 别名 / 环境描述）
function filter({ category = '全部', keyword = '' } = {}) {
  const word = String(keyword).trim().toLowerCase();
  return SPECIES.filter(item => {
    if (category !== '全部' && item.category !== category) return false;
    if (!word) return true;
    const haystack = [item.name, item.latin, item.meta, item.typeLabel]
      .concat(item.aliases || [])
      .join(' ')
      .toLowerCase();
    return haystack.indexOf(word) >= 0;
  });
}

// 把 id 列表整理成合法的对比选择：去重、去掉不存在的 id、最多 MAX_COMPARE 个
function sanitize(ids) {
  const result = [];
  (ids || []).forEach(id => {
    if (result.length >= MAX_COMPARE) return;
    if (result.indexOf(id) >= 0) return;
    if (SPECIES.some(item => item.id === id)) result.push(id);
  });
  return result;
}

function toggle(ids, id) {
  const list = (ids || []).slice();
  const index = list.indexOf(id);
  if (index >= 0) {
    list.splice(index, 1);
    return { ids: list, ok: true };
  }
  if (list.length >= MAX_COMPARE) {
    return { ids: list, ok: false, reason: `最多选择 ${MAX_COMPARE} 种` };
  }
  list.push(id);
  return { ids: list, ok: true };
}

// 对比页的表格数据：列 = 虫种，行 = COMPARE_ROWS
function buildCompare(ids) {
  const picked = sanitize(ids).map(getById);
  const rows = COMPARE_ROWS.map(row => ({
    label: row.label,
    cells: picked.map(item => (item.compare && item.compare[row.key]) || '—')
  }));
  return { species: picked, rows };
}

module.exports = {
  CATEGORIES,
  COMPARE_ROWS,
  MAX_COMPARE,
  all,
  getById,
  filter,
  sanitize,
  toggle,
  buildCompare
};
