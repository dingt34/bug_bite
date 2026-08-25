// 在微信开发者工具的“云开发”控制台复制环境 ID，并填写到这里。
// 示例：cloud1-1gxxxxxx12345678
const ENV_ID = 'cloudbase-d1ggskwel61500f0e';
// 在云开发控制台“AI → Agent”创建助手后填写；留空时使用纯文字大模型。
const AI_BOT_ID = '';

module.exports = {
  ENV_ID,
  LOGIN_FUNCTION: 'login',
  SYNC_FUNCTION: 'syncData',
  COMMUNITY_FUNCTION: 'community',
  AI_BOT_ID,
  AI_MODEL: 'hy3'
};
