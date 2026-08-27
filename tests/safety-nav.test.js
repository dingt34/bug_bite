const assert = require('assert');

let componentDefinition = null;
let switchedUrl = '';
let toastTitle = '';
let emittedStep = null;
let backDelta = 0;
let redirectedUrl = '';
const app = { globalData: { draftEvent: { id: 'draft_001' } } };

global.Component = definition => { componentDefinition = definition; };
global.getApp = () => app;
global.getCurrentPages = () => [
  { route: 'pages/post-detail/post-detail' },
  { route: 'pages/contact/contact' },
  { route: 'pages/guide/guide' }
];
global.wx = {
  getWindowInfo() { return { statusBarHeight: 24 }; },
  switchTab(options) { switchedUrl = options.url; },
  navigateBack(options) { backDelta = options.delta; },
  redirectTo(options) { redirectedUrl = options.url; },
  showToast(options) { toastTitle = options.title; }
};

require('../miniprogram/components/safety-nav/safety-nav.js');

function createComponent(current, allowBack) {
  const component = {
    data: Object.assign({}, componentDefinition.data, { current, allowBack }),
    setData(update) { this.data = Object.assign({}, this.data, update); },
    triggerEvent(name, detail) {
      if (name === 'stepchange') emittedStep = detail.step;
    }
  };
  Object.keys(componentDefinition.methods).forEach(key => {
    component[key] = componentDefinition.methods[key];
  });
  return component;
}

const component = createComponent(3, true);
componentDefinition.lifetimes.attached.call(component);
assert.strictEqual(component.data.statusBarHeight, 24);

component.onStepTap({ currentTarget: { dataset: { step: 4 } } });
assert.strictEqual(toastTitle, '请完成当前步骤后继续');
assert.strictEqual(emittedStep, null);

component.onStepTap({ currentTarget: { dataset: { step: 1 } } });
assert.strictEqual(emittedStep, 1);

const locked = createComponent(4, false);
locked.onStepTap({ currentTarget: { dataset: { step: 2 } } });
assert.strictEqual(toastTitle, '紧急结果不可返回修改');

component.goHome();
assert.strictEqual(switchedUrl, '/pages/index/index');
assert.strictEqual(app.globalData.draftEvent, null);

app.globalData.draftEvent = { id: 'draft_from_post' };
app.globalData.safetyReturnPostId = 'cloud_post_1';
const fromPost = createComponent(3, true);
componentDefinition.lifetimes.attached.call(fromPost);
assert.strictEqual(fromPost.data.returnLabel, '原帖子');
fromPost.goHome();
assert.strictEqual(backDelta, 2);
assert.strictEqual(redirectedUrl, '');
assert.strictEqual(app.globalData.safetyReturnPostId, '');
assert.strictEqual(app.globalData.draftEvent, null);

console.log('safety nav tests passed');
