const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { readableError, sanitizeMessage } = require('../cloudfunctions/routePlan/error-message.js');

const providerError = new Error('此 Key 未开启所需服务');
providerError.mapStatus = 321;
providerError.isMapProviderError = true;
assert.strictEqual(readableError(providerError, 'secret'), '腾讯地图返回（状态码 321）：此 Key 未开启所需服务');

const exposedKeyError = new Error('request failed: https://example.test/?key=secret&from=test');
exposedKeyError.mapStatus = 110;
exposedKeyError.isMapProviderError = true;
const safeMessage = readableError(exposedKeyError, 'secret');
assert.ok(safeMessage.includes('状态码 110'));
assert.ok(!safeMessage.includes('secret'));
assert.ok(safeMessage.includes('[已隐藏]'));

assert.strictEqual(sanitizeMessage('a\n\tb', ''), 'a b');
assert.ok(readableError(new Error('FUNCTIONS_EXECUTE_FAIL')).includes('FUNCTIONS_EXECUTE_FAIL'));

const functionSource = fs.readFileSync(path.join(__dirname, '../cloudfunctions/routePlan/index.js'), 'utf8');
assert.ok(functionSource.includes('if (failedRequest) throw failedRequest.reason;'));

console.log('route plan cloud error tests passed');
