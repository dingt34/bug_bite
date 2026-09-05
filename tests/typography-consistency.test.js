const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'miniprogram');
const appStyle = fs.readFileSync(path.join(root, 'app.wxss'), 'utf8');
const tokens = {
  micro: 20,
  caption: 22,
  body: 26,
  'card-title': 30,
  'section-title': 34,
  'page-title': 44,
  display: 56
};

Object.entries(tokens).forEach(([name, size]) => {
  assert.ok(appStyle.includes(`--font-${name}: ${size}rpx;`), `缺少字体层级 --font-${name}`);
});

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}

const styleFiles = [path.join(root, 'pages'), path.join(root, 'components'), path.join(root, 'custom-tab-bar')]
  .flatMap(walk)
  .filter(file => file.endsWith('.wxss'));

styleFiles.forEach(file => {
  const style = fs.readFileSync(file, 'utf8');
  const rawTextSizes = Array.from(style.matchAll(/font-size\s*:\s*(\d+)rpx/g), match => Number(match[1]))
    .filter(size => size < 70);
  assert.deepStrictEqual(rawTextSizes, [], `${path.relative(root, file)} 仍含未归一的正文文字字号`);
  Array.from(style.matchAll(/font-size\s*:\s*var\(--font-([a-z-]+)\)/g), match => match[1])
    .forEach(name => assert.ok(Object.prototype.hasOwnProperty.call(tokens, name), `${file} 使用了未知字体层级 ${name}`));
});

const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'), 'utf8'));
app.pages.forEach(page => {
  const markup = fs.readFileSync(path.join(root, page + '.wxml'), 'utf8');
  assert.strictEqual(/font-size\s*:\s*\d+rpx/.test(markup), false, `${page} 仍含内联字号`);
});

['.top-title-main', '.top-title-sub', '.section-title', '.card-title', '.prose', '.safe-note', '.primary-btn']
  .forEach(selector => assert.ok(appStyle.includes(selector), `全局字体契约缺少 ${selector}`));

console.log(`typography consistency tests passed: ${styleFiles.length} stylesheets, ${app.pages.length} pages`);
