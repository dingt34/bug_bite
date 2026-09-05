const assert = require('assert');
let definition;
global.Page = page => { definition = page; };
global.getApp = () => ({ globalData: { cloudReady: true } });
global.wx = { cloud: { init() {}, callFunction: option => Promise.resolve({ result: { ok: true, data: { post: { _id: option.data.postId, author: '测试用户', text: '真实经历内容', imageFileIds: [], comments: 0, status: 'published' }, comments: [] } } }) }, showToast() {}, showModal() {}, navigateBack() {}, navigateTo() {} };
require('../miniprogram/pages/post-detail/post-detail.js');
const page = Object.assign({}, definition, { data: Object.assign({}, definition.data), setData(update) { this.data = Object.assign({}, this.data, update); } });
(async () => { page.onLoad({ id: 'cloud_post_1' }); await page.loadThread(); assert.strictEqual(page.data.post.id, 'cloud_post_1'); assert.strictEqual(page.data.post.displayName, '测试用户'); assert.strictEqual(page.data.loadError, ''); console.log('post detail current community tests passed'); })().catch(error => { console.error(error); process.exitCode = 1; });
