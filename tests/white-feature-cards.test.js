const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const root = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function getRule(css, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))
  assert.ok(match, `missing style rule: ${selector}`)
  return match[1]
}

test('guidebook overview card uses a white, readable surface', () => {
  const css = read('miniprogram/pages/guidebook/guidebook.wxss')
  const card = getRule(css, '.catalog-overview')

  assert.match(card, /background:\s*#fff/)
  assert.match(card, /color:\s*#1e2923/)
  assert.doesNotMatch(card, /linear-gradient/)
  assert.match(getRule(css, '.catalog-description'), /color:\s*#68756f/)
})

test('profile hero card uses a white, readable surface', () => {
  const css = read('miniprogram/pages/profile/profile.wxss')
  const card = getRule(css, '.profile-hero')

  assert.match(card, /background:\s*#fff/)
  assert.match(card, /color:\s*#1e2923/)
  assert.doesNotMatch(card, /linear-gradient/)
  assert.match(getRule(css, '.user-sub'), /color:\s*#718078/)
  assert.match(getRule(css, '.sync-button'), /background:\s*#2f7d5b/)
})
