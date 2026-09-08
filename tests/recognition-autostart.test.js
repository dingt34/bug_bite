const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'recognition-worker');
const install = fs.readFileSync(path.join(root, 'install-autostart.ps1'), 'utf8');
const runner = fs.readFileSync(path.join(root, 'autostart-recognition.ps1'), 'utf8');
const uninstall = fs.readFileSync(path.join(root, 'uninstall-autostart.ps1'), 'utf8');

assert.ok(install.includes('ProtectedData]::Protect'), '密钥必须直接使用当前 Windows 用户的 DPAPI 加密');
assert.ok(!install.includes('ConvertFrom-SecureString'), '安装脚本不得依赖可能无法加载的 PowerShell Security 模块');
assert.ok(install.includes('New-ScheduledTaskTrigger -AtLogOn'), '任务必须在用户登录时启动');
assert.ok(install.includes('-RestartCount 999'), '计划任务必须配置异常退出重启');
assert.ok(install.includes('-MultipleInstances IgnoreNew'), '计划任务不得重复启动');
assert.ok(install.includes('autostart-bootstrap.ps1'), '计划任务必须通过纯 ASCII 用户目录入口启动');
assert.ok(install.includes("$env:SystemRoot 'System32'"), '计划任务必须使用稳定的系统工作目录');
assert.ok(install.includes("System32\\WindowsPowerShell\\v1.0\\powershell.exe"), '计划任务必须使用 PowerShell 完整路径');
assert.ok(install.includes('[switch]$ReuseCredential'), '修复计划任务时必须能够复用已有加密密钥');
assert.ok(runner.includes('ProtectedData]::Unprotect'), '后台入口必须通过 Windows DPAPI 在内存中解密密钥');
assert.ok(!runner.includes('ConvertTo-SecureString'), '后台入口不得依赖可能无法加载的 PowerShell Security 模块');
assert.ok(runner.includes('AppendAllText'), '后台运行必须使用非交互式文件日志');
assert.ok(!runner.includes('Start-Transcript'), '计划任务不得依赖交互式 PowerShell 转录宿主');
assert.ok(uninstall.includes('Unregister-ScheduledTask'), '必须提供完整撤销入口');
assert.ok(uninstall.includes('cloudbase-key.dpapi'), '撤销时必须删除持久化密钥');

console.log('recognition autostart tests passed');
