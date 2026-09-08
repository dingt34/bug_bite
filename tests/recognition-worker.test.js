const assert = require('assert');
const worker = require('../recognition-worker/worker');

assert.strictEqual(worker.endpoint('http://127.0.0.1:8000/'), 'http://127.0.0.1:8000/v1/identify');
assert.throws(() => worker.required('MISSING', {}), /MISSING/);

(async () => {
  let request;
  const analysis = await worker.identifyImage(async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ candidates: [{ objectId: 'mosquito' }] }) };
  }, { baseUrl: 'http://127.0.0.1:8000', apiKey: 'secret', fileContent: Buffer.from('image') });
  assert.strictEqual(request.url, 'http://127.0.0.1:8000/v1/identify');
  assert.strictEqual(request.options.headers.Authorization, 'Bearer secret');
  assert.strictEqual(JSON.parse(request.options.body).imageBase64, Buffer.from('image').toString('base64'));
  assert.strictEqual(analysis.candidates[0].objectId, 'mosquito');

  assert.strictEqual(await worker.modelReady(async () => ({
    ok: true, json: async () => ({ ready: true })
  }), 'http://127.0.0.1:8000'), true);
  assert.strictEqual(await worker.modelReady(async () => { throw new Error('offline'); }, 'http://127.0.0.1:8000'), false);

  let runtimePayload;
  await worker.writeRuntimeStatus({
    serverDate: () => 'server-time',
    collection: () => ({ doc: () => ({ set: async value => { runtimePayload = value.data; } }) })
  }, { ready: true, model: 'BioCLIP 2', device: 'cuda', catalogSize: 45, prototypeCount: 45, workerId: 'worker-test' });
  assert.strictEqual(runtimePayload.status, 'online');
  assert.strictEqual(runtimePayload.prototypeCount, 45);
  assert.strictEqual(runtimePayload.workerId, 'worker-test');

  await assert.rejects(() => worker.identifyImage(async () => ({
    ok: false,
    status: 503,
    json: async () => ({ detail: '模型未就绪' })
  }), { baseUrl: 'http://127.0.0.1:8000', apiKey: 'secret', fileContent: Buffer.from('image') }), /模型未就绪/);
  console.log('recognition worker tests passed');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
