const PREFIX = 'bugtrail_v4_';

function get(key, fallback) {
  try {
    const value = wx.getStorageSync(PREFIX + key);
    return value === '' || value === undefined ? fallback : value;
  } catch (error) {
    return fallback;
  }
}

function set(key, value) {
  wx.setStorageSync(PREFIX + key, value);
  return value;
}

function remove(key) {
  wx.removeStorageSync(PREFIX + key);
}

function id(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function seed() {
  if (!get('plans', null)) {
    set('plans', [
      { id: 'trip_lishui', title: '丽水古堰画乡', date: '8月18–20日', type: '徒步露营', status: '还有 5 天', distance: '12.6 km' },
      { id: 'trip_hangzhou', title: '杭州植物园步行', date: '9月6日', type: '步行', status: '准备中 2/6' }
    ]);
  }
  if (!get('events', null)) {
    set('events', [
      { id: 'event_mosquito', type: '蚊虫叮咬', level: '观察记录', place: '公园草地', body: '右小腿', symptoms: ['红肿', '瘙痒'], trend: '基本不变', createdAt: '今天 14:30', reviewAt: '今天 16:30', status: '待复查' },
      { id: 'event_bee', type: '蜂类蜇伤', level: '尽快咨询', place: '户外', body: '左手背', symptoms: ['疼痛'], trend: '已完成复查', createdAt: '8月3日', status: '历史' }
    ]);
  }
  if (!get('posts', null)) {
    set('posts', [
      { id: 'post_1', author: '山野小路', region: '浙江丽水', type: '叮咬', stage: '观察完成', title: '草木路段后的两处红点', text: '穿过草木茂密路段后发现小腿有两处红点，先清洁并冷敷，按两小时提醒复查时没有继续扩大。', route: '古堰画乡环线 · 12.6 km', likes: 48, comments: 12, favorites: 21 },
      { id: 'post_2', author: '湖边露营者', region: '浙江杭州', type: '不确定接触', stage: '观察中', title: '夜间整理帐篷后的刺痒', text: '没有看到虫体，通过环境与症状问答完成判断，准备两小时后复查。', likes: 17, comments: 5, favorites: 4 }
    ]);
  }
}

module.exports = { get, set, remove, id, seed };
