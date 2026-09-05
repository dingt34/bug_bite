const assert = require('node:assert/strict')

global.Page = () => {}
global.wx = {}

const home = require('../miniprogram/pages/home/home.js')

const now = new Date(2026, 8, 5)
assert.equal(home.getPlanStart({ startDate: '2026-10-05' }, now.getFullYear()), new Date(2026, 9, 5).getTime())
assert.equal(home.formatPlanDate({ date: '2026-10-05' }, now), '2026年10月05日')
assert.equal(home.formatCompactPlanDate({ date: '2026-10-05' }, now), '10月05日')
assert.equal(home.formatPlanDate({ date: 'not-a-date' }, now), '')

const normalized = home.normalizeHomePlan({ id: 'plan-1', destinationName: '浙江省杭州市', startDate: '2026-10-05' }, now)
assert.equal(normalized.displayTitle, '浙江省杭州市')
assert.equal(normalized.displayDate, '2026年10月05日')
assert.equal(normalized.compactDate, '10月05日')
assert.equal(home.normalizeHomePlan({}, now).displayTitle, '')

const nearest = home.getNearestUpcomingPlan([
  { id: 'past', startDate: '2026-09-01' },
  { id: 'next', startDate: '2026-10-05', destinationName: '杭州' }
], now)
assert.equal(nearest.id, 'next')

console.log('home page tests passed')
