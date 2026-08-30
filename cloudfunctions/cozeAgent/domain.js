const MAX_MESSAGE_LENGTH = 6000;
const MAX_HISTORY_ITEMS = 10;
const MAX_HISTORY_ITEM_LENGTH = 2000;
const MAX_IMAGES = 2;

function normalizeMessage(value) {
  return String(value || '').trim().slice(0, MAX_MESSAGE_LENGTH);
}

function normalizeHistory(history) {
  return (Array.isArray(history) ? history : [])
    .filter(item => item && (item.role === 'user' || item.role === 'assistant'))
    .slice(-MAX_HISTORY_ITEMS)
    .map(item => ({ role: item.role, content: String(item.content || '').trim().slice(0, MAX_HISTORY_ITEM_LENGTH) }))
    .filter(item => item.content);
}

function normalizeCloudFileIds(fileIds) {
  const values = Array.isArray(fileIds) ? fileIds : [];
  if (values.length > MAX_IMAGES) throw new Error('一次最多发送2张图片');
  const unique = [];
  values.forEach(value => {
    const fileId = String(value || '').trim();
    if (!fileId.startsWith('cloud://')) throw new Error('图片必须来自当前微信云开发环境');
    if (!unique.includes(fileId)) unique.push(fileId);
  });
  return unique;
}

function normalizeImageKinds(imageKinds, count) {
  return Array.from({ length: count }, (_, index) => {
    const kind = String((imageKinds || [])[index] || '').trim();
    if (kind === 'insect') return { kind, label: '虫体图片' };
    if (kind === 'wound') return { kind, label: '伤口图片' };
    return { kind: 'other', label: '参考图片' };
  });
}

function normalizeResolvedImages(images) {
  const values = Array.isArray(images) ? images : [];
  if (values.length > MAX_IMAGES) throw new Error('一次最多发送2张图片');
  return values.map(image => {
    const url = String(image && image.url || '').trim();
    if (!/^https:\/\//i.test(url)) throw new Error('图片临时地址无效');
    const normalized = normalizeImageKinds([image && image.kind], 1)[0];
    return { url, kind: normalized.kind, label: String(image && image.label || normalized.label) };
  });
}

function buildSystemPrompt(catalogText, catalogVersion) {
  return [
    '你是“虫咬识途”的多模态安全建议助手。你不是医生，不做疾病、虫种或严重程度确诊。',
    '发现呼吸困难、意识异常、口唇/舌/喉肿胀、症状快速加重等危险信号时，先建议立即呼叫120或就近急诊。',
    '对虫体图片：只描述可见外形、足/翅/体节、颜色、大致尺寸和环境；最多给出1—3个候选类群并说明不确定性。',
    '对伤口/皮损图片：只描述可见的红、肿、水泡、破损、渗出及范围；不根据皮损反推具体虫种或病原体。',
    '图片候选、置信度和病原体推测不得参与风险分级；“建议观察”不等于“安全”。',
    '不自动推荐处方药、抗生素或具体剂量；只给通用低风险建议。',
    '看不清时直说无法判断，并建议补拍整体、局部、尺度参照和自然光角度；不要猜测。',
    '回答优先按“可见特征—可能类别与不确定性—现在怎么做—观察与何时求助—建议补拍”组织。',
    '下列是项目组知识库的候选名录（版本 ' + String(catalogVersion || 'draft') + '）。它仍为DRAFT，只能约束候选范围，不能作为医疗证据：',
    String(catalogText || '暂无名录')
  ].join('\n');
}

function buildQwenMessages(message, history, images, catalog) {
  const safeMessage = normalizeMessage(message);
  if (!safeMessage) throw new Error('请输入要咨询的内容');
  const safeImages = normalizeResolvedImages(images);
  const messages = [{ role: 'system', content: buildSystemPrompt(catalog && catalog.text, catalog && catalog.version) }]
    .concat(normalizeHistory(history));
  if (!safeImages.length) {
    messages.push({ role: 'user', content: safeMessage });
    return messages;
  }
  const labels = safeImages.map((image, index) => '图片' + (index + 1) + '：' + image.label).join('；');
  const content = [{ type: 'text', text: safeMessage + '\n\n图片顺序：' + labels }];
  safeImages.forEach(image => content.push({ type: 'image_url', image_url: { url: image.url } }));
  messages.push({ role: 'user', content });
  return messages;
}

function buildQwenRequest(options) {
  return {
    model: String(options.model || 'qwen3.7-flash'),
    messages: buildQwenMessages(options.message, options.history, options.images, options.catalog),
    stream: false,
    temperature: 0.2,
    max_tokens: 1600
  };
}

function parseQwenResponse(body) {
  let payload;
  try { payload = JSON.parse(String(body || '')); } catch (error) { throw new Error('千问服务返回了无效数据'); }
  if (payload.error) throw new Error(String(payload.error.message || payload.error.code || '千问服务返回错误'));
  const content = payload.choices && payload.choices[0] && payload.choices[0].message && payload.choices[0].message.content;
  const text = Array.isArray(content)
    ? content.map(item => typeof item === 'string' ? item : item && (item.text || item.content) || '').join('')
    : String(content || '');
  if (!text.trim()) throw new Error('千问没有返回有效内容');
  return text.trim();
}

module.exports = {
  MAX_MESSAGE_LENGTH, MAX_IMAGES, normalizeMessage, normalizeHistory, normalizeCloudFileIds,
  normalizeImageKinds, normalizeResolvedImages, buildSystemPrompt, buildQwenMessages,
  buildQwenRequest, parseQwenResponse
};
