# 虫咬识途 V6 云函数

本目录已在 `project.config.json` 中配置为 `cloudfunctionRoot`。

## 部署

1. 在微信开发者工具中开通云开发环境。
2. 右键每个云函数目录，选择“上传并部署：云端安装依赖”。
3. 在云数据库中创建下方集合，客户端权限建议设为“所有用户不可读写”，统一通过云函数访问。
4. 将 `identifyInsect` 和 `aiAssistant` 的执行超时设为 30 秒，再分别配置下方千问环境变量。

## 数据库集合

`users`、`plans`、`events`、`reviews`、`safety_rules`、`species`、
`community_posts`、`community_comments`、`community_reactions`、`community_reports`、
`reminders`、`ai_audits`、`recognition_results`。

## 环境变量

- `DASHSCOPE_API_KEY`：阿里云百炼 API Key，`identifyInsect` 和 `aiAssistant` 均需配置。
- `DASHSCOPE_BASE_URL`：可选，默认为 `https://dashscope.aliyuncs.com/compatible-mode/v1`；Token Plan 用户填对应的 OpenAI 兼容地址。
- `AI_MODEL`：可选，默认为 `qwen3.7-flash`。
- `TENCENT_MAP_KEY`：腾讯地图路线规划 WebService Key。
- `TENCENT_MAP_SK`：该 Key 使用“签名校验”时生成的 Secret Key，仅配置在 `routePlan` 云函数环境变量中。
- `SUBSCRIBE_TEMPLATE_ID`：复查订阅消息模板 ID。
- `MINIPROGRAM_STATE`：可选，`developer` / `trial` / `formal`。

密钥只能配置在云函数环境变量中，不要写入小程序代码或上传到仓库。

## 函数职责

- `login`：微信身份与用户资料。
- `userData`：行程、事件、复查记录的同步。
- `evaluateSafety`：可审计的安全分级规则。
- `community`：社群发布、评论、举报与内容安全检查。
- `identifyInsect`：调用千问多模态描述可见特征，候选限定在项目组 45 项知识库内，不参与医疗结论或安全分级。
- `routePlan`：服务端代理腾讯路线规划。
- `aiAssistant`：调用千问对话，在云函数内检索结构化知识包，并保存最小化审计记录。

`identifyInsect` 和 `aiAssistant` 都包含同一版本的内置知识库快照。更新知识库时必须同步两个目录，并重新上传部署这两个云函数。
- `reminder`：复查提醒与定时触发。
- `deleteData`：事件、社群内容和账号的级联删除。

`reminder/config.json` 已包含每 5 分钟执行一次的云触发器；它只处理已获得用户订阅授权且已到期的提醒。
