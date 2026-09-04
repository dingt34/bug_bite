const assert = require('assert');

let definition;
let initOptions;
const storage = {};

global.App = app => { definition = app; };
global.wx = {
  cloud: { init(options) { initOptions = options; } },
  getStorageSync(key) { return storage[key]; },
  setStorageSync(key, value) { storage[key] = value; }
};

require('../miniprogram/app.js');
definition.onLaunch();

const { ENV_ID } = require('../miniprogram/config/cloud.js');
assert.deepStrictEqual(initOptions, { env: ENV_ID, traceUser: true });
assert.strictEqual(definition.globalData.cloudReady, true);

console.log('app cloud initialization test passed');
