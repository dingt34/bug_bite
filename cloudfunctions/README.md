# 虫咬识途 V4 云函数

本目录已在 `project.config.json` 中配置为 `cloudfunctionRoot`。

## 部署

1. 在微信开发者工具中开通云开发环境。
2. 右键每个云函数目录，选择“上传并部署：云端安装依赖”。
3. 在云数据库中创建下方集合，客户端权限建议设为“所有用户不可读写”，统一通过云函数访问。

## 数据库集合

`users`、`plans`、`events`、`reviews`、`safety_rules`、`species`、
`community_posts`、`community_comments`、`community_reactions`、`community_reports`、
`reminders`、`ai_audits`、`recognition_results`。

## 环境变量

- `BAIDU_API_KEY`、`BAIDU_SECRET_KEY`：百度动物图像识别。
- `TENCENT_MAP_KEY`：腾讯地图路线规划 WebService Key，需配置云函数出口 IP/配额策略。
- `COZE_API_TOKEN`、`COZE_BOT_ID`：AI 助手。
- `COZE_API_URL`：可选，默认为扣子国内 v2 对话地址。
- `SUBSCRIBE_TEMPLATE_ID`：复查订阅消息模板 ID。
- `MINIPROGRAM_STATE`：可选，`developer` / `trial` / `formal`。

密钥只能配置在云函数环境变量中，不要写入小程序代码或上传到仓库。

## 函数职责

- `login`：微信身份与用户资料。
- `userData`：行程、事件、复查记录的同步。
- `evaluateSafety`：可审计的安全分级规则。
- `community`：社群发布、评论、举报与内容安全检查。
- `identifyInsect`：服务端代理图像识别，不参与医疗结论。
- `routePlan`：服务端代理腾讯路线规划。
- `aiAssistant`：AI 对话与最小化审计记录。
- `reminder`：复查提醒与定时触发。
- `deleteData`：事件、社群内容和账号的级联删除。

`reminder/config.json` 已包含每 5 分钟执行一次的云触发器；它只处理已获得用户订阅授权且已到期的提醒。
