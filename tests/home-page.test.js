const assert = require('node:assert/strict')

let pageDefinition
let navigatedUrl = ''
global.Page = definition => { pageDefinition = definition }
global.wx = { navigateTo(options) { navigatedUrl = options.url } }

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

const page = Object.assign({}, pageDefinition, { data: { plan: { id: 'plan-1' } } })
page.improvePlan()
assert.equal(navigatedUrl, '/pages/precheck/precheck?planId=plan-1')
page.createPlan()
assert.equal(navigatedUrl, '/pages/precheck/precheck')

const homeMarkup = require('node:fs').readFileSync(require('node:path').join(__dirname, '../miniprogram/pages/home/home.wxml'), 'utf8')
assert.ok(homeMarkup.includes('bindtap="createPlan">创建计划'))
assert.ok(homeMarkup.includes('wx:if="{{plan.id}}" class="mini-btn mini-btn-improve" bindtap="improvePlan">完善计划'))

console.log('home page tests passed')
