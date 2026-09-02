const cloud = require('wx-server-sdk');
const https = require('https');
const querystring = require('querystring');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

function request(url, options = {}, body = '') {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, res => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (_) { reject(new Error('INVALID_REMOTE_RESPONSE')); }
      });
    });
    req.setTimeout(12000, () => req.destroy(new Error('REMOTE_TIMEOUT')));
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

exports.main = async event => {
  const apiKey = process.env.BAIDU_API_KEY;
  const secretKey = process.env.BAIDU_SECRET_KEY;
  if (!apiKey || !secretKey) return { ok: false, code: 'NOT_CONFIGURED', message: '请先在云函数环境变量配置百度识别密钥' };
  try {
    let imageBase64 = String(event.imageBase64 || '').replace(/^data:image\/[\w+.-]+;base64,/, '');
    if (!imageBase64 && event.fileId) {
      const file = await cloud.downloadFile({ fileID: String(event.fileId) });
      imageBase64 = file.fileContent.toString('base64');
    }
    if (!imageBase64) return { ok: false, code: 'NO_IMAGE', message: '请先拍摄或选择图片' };
    if (imageBase64.length > 8 * 1024 * 1024) return { ok: false, code: 'IMAGE_TOO_LARGE', message: '图片过大，请重新拍摄' };
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${encodeURIComponent(apiKey)}&client_secret=${encodeURIComponent(secretKey)}`;
    const token = await request(tokenUrl, { method: 'POST' });
    if (!token.access_token) throw new Error(token.error_description || 'TOKEN_FAILED');
    const body = querystring.stringify({ image: imageBase64, top_num: 3, baike_num: 0 });
    const result = await request(`https://aip.baidubce.com/rest/2.0/image-classify/v1/animal?access_token=${encodeURIComponent(token.access_token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, body);
    if (result.error_code) throw new Error(result.error_msg || 'RECOGNITION_FAILED');
    const candidates = (result.result || []).slice(0, 3).map(item => ({
      name: String(item.name || '未知'), score: Math.round(Number(item.score || 0) * 10000) / 100
    }));
    return { ok: true, data: { candidates, disclaimer: '图像识别仅作为线索，不用于确诊或替代安全问答。' } };
  } catch (error) {
    console.error('identifyInsect', error);
    return { ok: false, code: 'RECOGNITION_FAILED', message: '暂时无法识别，请继续使用环境与症状问答' };
  }
};
