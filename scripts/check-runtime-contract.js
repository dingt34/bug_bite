const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mini = path.join(root, 'miniprogram');
const app = JSON.parse(fs.readFileSync(path.join(mini, 'app.json'), 'utf8'));
const errors = [];
const allowed = new Set(['view','text','image','button','input','textarea','scroll-view','camera','picker','swiper','swiper-item','switch','checkbox','radio','form','label','navigator','block']);
const voidTags = new Set(['image','input','switch','checkbox','radio']);

if ('lazyCodeLoading' in app) errors.push('app.json 不应启用 lazyCodeLoading，避免旧基础库 wx://not-found。');
for (const nestedConfig of ['project.config.json', 'project.private.config.json']) {
  if (fs.existsSync(path.join(mini, nestedConfig))) errors.push(`miniprogram 内存在嵌套项目配置：${nestedConfig}`);
}
for (const invalidScope of ['scope.camera', 'scope.writePhotosAlbum']) {
  if (app.permission && app.permission[invalidScope]) errors.push(`app.json permission 包含无效授权项：${invalidScope}`);
}
if (!app.tabBar || app.tabBar.custom !== true || app.tabBar.list.length !== 5) errors.push('底部导航必须是五项自定义导航。');

for (const page of app.pages) {
  const base = path.join(mini, page);
  const directoryName = path.basename(path.dirname(base));
  const fileName = path.basename(base);
  if (directoryName !== fileName) errors.push(`${page}: 页面文件名必须与目录同名。`);
  for (const ext of ['.js', '.wxml', '.wxss', '.json']) if (!fs.existsSync(base + ext)) errors.push(`缺少页面文件：${page}${ext}`);
  if (!fs.existsSync(base + '.wxml') || !fs.existsSync(base + '.js')) continue;
  const wxml = fs.readFileSync(base + '.wxml', 'utf8');
  const js = fs.readFileSync(base + '.js', 'utf8');
  if (/[‹›⌕⌁]/.test(wxml) || /•••|···|class="silhouette/.test(wxml)) errors.push(`${page}: 仍存在文字或 CSS 占位图标。`);
  for (const match of wxml.matchAll(/src="(\/assets\/[^"]+)"/g)) {
    const asset = path.join(mini, match[1].slice(1));
    if (!fs.existsSync(asset) || fs.statSync(asset).size === 0) errors.push(`${page}: 图标资源不存在或为空：${match[1]}`);
  }
  if (/\.(indexOf|slice|join|filter)\s*\(/.test(wxml)) errors.push(`${page}: WXML 使用了不兼容的方法调用。`);
  if (/bind\w+="\{\{/.test(wxml)) errors.push(`${page}: 事件处理器不能使用动态表达式。`);
  const stack = [];
  for (const match of wxml.matchAll(/<\/?([\w-]+)(?:\s[^<>]*?)?\s*\/?>/g)) {
    const raw = match[0], tag = match[1];
    if (!allowed.has(tag)) errors.push(`${page}: 未注册组件标签 <${tag}>。`);
    if (raw.startsWith('</')) {
      const top = stack.pop();
      if (top !== tag) errors.push(`${page}: 标签闭合不匹配，期望 </${top}>，实际 </${tag}>。`);
    } else if (!raw.endsWith('/>') && !voidTags.has(tag)) stack.push(tag);
  }
  if (stack.length) errors.push(`${page}: 存在未闭合标签 ${stack.join(', ')}。`);
  for (const match of wxml.matchAll(/(?:bind|catch)[\w-]+="([A-Za-z_$][\w$]*)"/g)) {
    const handler = match[1];
    if (!new RegExp(`\\b${handler}\\s*\\(`).test(js)) errors.push(`${page}: 找不到事件方法 ${handler}。`);
  }
}

const tabJs = fs.readFileSync(path.join(mini, 'custom-tab-bar', 'index.js'), 'utf8');
for (const name of ['home','ai','camera','community','profile']) {
  const asset = path.join(mini, 'assets', 'nav', `${name}.svg`);
  if (!fs.existsSync(asset) || fs.statSync(asset).size < 100) errors.push(`导航 SVG 缺失或为空：${name}.svg`);
  if (!tabJs.includes(`/assets/nav/${name}.svg`)) errors.push(`导航未引用 Figma SVG：${name}.svg`);
}

const cameraWxml = fs.readFileSync(path.join(mini, 'pages', 'camera', 'camera.wxml'), 'utf8');
const cameraJs = fs.readFileSync(path.join(mini, 'pages', 'camera', 'camera.js'), 'utf8');
if (!cameraWxml.includes('<camera') || !cameraJs.includes('wx.createCameraContext')) errors.push('识别页未接入真实摄像头。');

const figmaAssetDir = path.join(mini, 'assets', 'figma', 'all');
const figmaAssets = fs.existsSync(figmaAssetDir) ? fs.readdirSync(figmaAssetDir).filter(name => name.endsWith('.svg')) : [];
if (figmaAssets.length !== 222) errors.push(`Figma 原始 SVG 数量异常：期望 222，实际 ${figmaAssets.length}。`);

const cloudRoot = path.join(root, 'cloudfunctions');
const requiredFunctions = ['login','userData','evaluateSafety','community','identifyInsect','routePlan','aiAssistant','reminder','deleteData'];
for (const name of requiredFunctions) {
  const dir = path.join(cloudRoot, name);
  for (const file of ['index.js', 'package.json', 'config.json']) {
    if (!fs.existsSync(path.join(dir, file))) errors.push(`缺少云函数文件：${name}/${file}`);
  }
}
const projectConfig = JSON.parse(fs.readFileSync(path.join(root, 'project.config.json'), 'utf8'));
if (projectConfig.cloudfunctionRoot !== 'cloudfunctions/') errors.push('project.config.json 未正确配置 cloudfunctionRoot。');
const clientCode = fs.readdirSync(path.join(mini, 'utils')).filter(name => name.endsWith('.js')).map(name => fs.readFileSync(path.join(mini, 'utils', name), 'utf8')).join('\n');
if (/BAIDU_(?:API|SECRET)_KEY\s*[:=]\s*['"][^'"]+/.test(clientCode) || /COZE_API_TOKEN\s*[:=]\s*['"][^'"]+/.test(clientCode) || /DASHSCOPE_API_KEY\s*[:=]\s*['"][^'"]+/.test(clientCode)) errors.push('小程序端不得包含服务密钥。');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(`检查通过：${app.pages.length} 个页面、222 个 Figma 原始 SVG、5 个 Figma 导航 SVG、真实摄像头接口、9 个云函数。`);
