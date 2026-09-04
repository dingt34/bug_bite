const PREFIX = 'bugtrail_v4_';
const DEMO_EVENT_IDS = ['event_mosquito', 'event_bee'];
const DEMO_PLAN_IDS = ['trip_lishui', 'trip_hangzhou'];

function withoutDemoEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.filter(item => item && DEMO_EVENT_IDS.indexOf(item.id) < 0);
}

function withoutDemoPlans(plans) {
  if (!Array.isArray(plans)) return [];
  return plans.filter(item => item && DEMO_PLAN_IDS.indexOf(item.id) < 0);
}

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
  const plans = get('plans', null);
  if (!plans) set('plans', []);
  else {
    const cleanedPlans = withoutDemoPlans(plans);
    if (cleanedPlans.length !== plans.length) set('plans', cleanedPlans);
  }
  const events = get('events', null);
  if (!events) set('events', []);
  else {
    const cleanedEvents = withoutDemoEvents(events);
    if (cleanedEvents.length !== events.length) set('events', cleanedEvents);
  }
  const posts = get('posts', []);
  const withoutDemoPosts = Array.isArray(posts) ? posts.filter(item => item.id !== 'post_1' && item.id !== 'post_2') : [];
  if (!Array.isArray(posts) || withoutDemoPosts.length !== posts.length) set('posts', withoutDemoPosts);
}

module.exports = { get, set, remove, id, seed, withoutDemoEvents, withoutDemoPlans };
