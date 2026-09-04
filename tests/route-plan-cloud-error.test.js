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

const signatureError = new Error('request failed: https://example.test/?sig=generated-signature');
assert.ok(sanitizeMessage(signatureError.message, '').includes('sig=[已隐藏]'));

assert.strictEqual(sanitizeMessage('a\n\tb', ''), 'a b');
assert.ok(readableError(new Error('FUNCTIONS_EXECUTE_FAIL')).includes('FUNCTIONS_EXECUTE_FAIL'));

const functionSource = fs.readFileSync(path.join(__dirname, '../cloudfunctions/routePlan/index.js'), 'utf8');
assert.ok(functionSource.includes("const { readableError } = require('./error-message');"));
assert.ok(functionSource.includes("const { inferEnvironmentTags } = require('./environment-tags');"));
assert.ok(!functionSource.includes("require('crypto')"));
assert.ok(!functionSource.includes('TENCENT_MAP_SK'));
assert.ok(!functionSource.includes("'sig'"));
assert.ok(functionSource.includes("params.toString()"));
assert.ok(functionSource.includes("event.action === 'suggest'"));
assert.ok(functionSource.includes("params.set('get_mp', '1')"));
assert.ok(functionSource.includes("params.set('waypoints'"));
assert.ok(functionSource.includes('const start = await resolvePlace(startText, event.startPlace, mapKey);'));
assert.ok(functionSource.includes('await getRouteThroughWaypoints(start, waypoints, end, mode, mapKey)'));
assert.ok(functionSource.includes("/ws/place/v1/suggestion/"));
assert.ok(functionSource.includes("/ws/direction/v1/"));
assert.ok(functionSource.includes('decodePolyline(route.polyline)'));
assert.ok(functionSource.includes('environmentTags: inferEnvironmentTags(route'));

console.log('route plan cloud error tests passed');
