const assert = require('assert');
const fs = require('fs');
const path = require('path');

const read = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
const globalStyle = read('miniprogram/app.wxss');

assert.ok(globalStyle.includes('.topbar > .back'));
assert.ok(globalStyle.includes('width:80rpx'));
assert.ok(globalStyle.includes('.topbar > .top-title'));
assert.ok(globalStyle.includes('margin-left:24rpx'));
assert.ok(globalStyle.includes('.page > .safe-top + .topbar-plain'));
assert.ok(globalStyle.includes('.topbar > .top-title > .top-title-sub'));
assert.ok(globalStyle.includes('.topbar-plain > .topbar-copy > .top-title-sub'));
assert.ok(globalStyle.includes('text-align:left'));
assert.ok(globalStyle.includes('font-size:var(--font-page-title)'));
assert.ok(globalStyle.includes('font-size:var(--font-caption)'));

['community/community', 'profile/profile', 'ai/ai'].forEach(page => {
  assert.ok(read('miniprogram/pages/' + page + '.wxml').includes('topbar-plain'));
});

assert.ok(read('miniprogram/pages/profile/profile.wxss').includes('padding: 24rpx 36rpx 190rpx'));
assert.ok(read('miniprogram/pages/ai/ai.wxss').includes('padding:32rpx 36rpx 132rpx'));
assert.ok(read('miniprogram/pages/ai/ai.wxss').includes('right:calc(100% + 10rpx)'));
assert.ok(!read('miniprogram/pages/precheck/precheck.wxss').includes('min-height:104rpx'));
assert.ok(read('miniprogram/pages/precheck/precheck.wxml').includes('<picker mode="selector"'));
assert.ok(read('miniprogram/pages/precheck-result/precheck-result.wxml').includes('<view class="safe-top"></view>'));
assert.ok(read('miniprogram/pages/guide/guide.wxss').includes('.guide-page .progress { margin-top:30rpx; }'));
assert.ok(read('miniprogram/pages/contact/contact.wxss').includes('.contact-page .progress { margin-top:30rpx; }'));
assert.ok(read('miniprogram/pages/result/result.wxss').includes('.result-page .safe-top { min-height:16rpx; }'));

const routeStyle = read('miniprogram/pages/route-plan/route-plan.wxss');
assert.ok(routeStyle.includes('.map-back { font-size:var(--font-caption); line-height:1; font-weight:600; }'));
assert.ok(routeStyle.includes('align-items:center; justify-content:center'));

console.log('header alignment tests passed');
