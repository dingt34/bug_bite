const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const scripts = [
  path.join(root, 'recognition-worker', 'run-local.ps1'),
  path.join(root, 'bioclip-service', 'run-local.ps1')
];

scripts.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  assert.ok(!/[^\x00-\x7F]/.test(content), `${path.basename(file)} 应保持纯 ASCII，兼容 Windows PowerShell 5.1`);
});

const oneClickLauncher = fs.readFileSync(path.join(root, 'recognition-worker', 'run-local.ps1'), 'utf8');
assert.ok(oneClickLauncher.includes("Read-SecretText 'Paste the CloudBase server API key'"), '启动脚本应自行隐藏读取密钥');
assert.ok(oneClickLauncher.includes("$BioClipApiKey = 'local-bioclip-deployment-key'"), '演示版应自动使用一致的本机 BioCLIP 密钥');

console.log('PowerShell launcher encoding tests passed');
