const assert = require('assert');
const fs = require('fs');
const path = require('path');

const appConfig = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../miniprogram/app.json'),
  'utf8'
));

assert.strictEqual(appConfig.tabBar.custom, true, '底部导航应使用可显式同步选中项的自定义 tabBar');

const tabBar = require('../miniprogram/utils/tab-bar.js');
let selected = -1;
const page = {
  getTabBar() {
    return {
      setData(update) {
        selected = update.selected;
      }
    };
  }
};

tabBar.syncSelected(page, 1);
assert.strictEqual(selected, 1, '进入社群时应高亮社群');
tabBar.syncSelected(page, 0);
assert.strictEqual(selected, 0, '从社群切换到首页时应改为高亮首页');
tabBar.syncSelected(page, 2);
assert.strictEqual(selected, 2, '从社群切换到我的页面时应改为高亮我的');

['index', 'community', 'profile'].forEach(pageName => {
  const source = fs.readFileSync(
    path.join(__dirname, '../miniprogram/pages', pageName, pageName + '.js'),
    'utf8'
  );
  assert.ok(source.includes('tabBar.syncSelected'), pageName + ' 页面显示时应同步底部导航选中项');
});

console.log('tab bar tests passed');
