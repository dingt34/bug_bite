# 微信云开发部署说明

代码已经包含微信云登录、云数据库同步和云存储图片上传。首次运行真实云功能前，需要在微信开发者工具中完成以下配置。

## 1. 开通云开发环境

1. 使用本项目 AppID 打开微信开发者工具。
2. 点击“云开发”，创建测试或正式环境。
3. 复制环境 ID，填写到 `miniprogram/config/cloud.js` 的 `ENV_ID`。

## 2. 创建数据库集合

在云开发控制台创建以下集合：

- `users`：保存微信云身份的昵称、头像云文件 ID 和登录时间。
- `user_data`：保存每个微信用户的计划、事件和个人图片映射同步快照。
- `community_posts`：保存所有用户可见的公共帖子和互动计数。
- `community_comments`：保存公共评论。
- `community_reactions`：保存用户对帖子的点赞、收藏，以及对评论的赞踩状态。
- `community_reports`：保存社区内容举报记录。

以上集合都应设置为“不允许小程序客户端直接读写”或等价的管理员/云函数专用权限。所有身份确认与数据库操作均通过云函数完成。

## 3. 部署云函数

在开发者工具中依次右键以下目录，选择“上传并部署：云端安装依赖”：

- `cloudfunctions/login`
- `cloudfunctions/syncData`
- `cloudfunctions/community`
- `cloudfunctions/cozeAgent`
- `cloudfunctions/routePlan`

部署环境必须与 `ENV_ID` 指向的环境一致。

`routePlan` 使用腾讯位置服务 WebService API。请在该云函数的“版本与配置”中增加环境变量：

- 名称：`TENCENT_MAP_KEY`
- 值：项目管理员统一维护的腾讯位置服务 Key

该 Key 不应写入代码或提交到 GitHub。团队成员只要使用同一个小程序 AppID 和云开发环境，即可共用已部署的路线服务。

## 4. 验证

1. 重新编译小程序，进入“我的 → 登录”。
2. 页面应显示“微信云开发已连接”。
3. 选择头像、填写昵称，点击“微信云登录”。
4. 创建计划或事件后进入“我的”，点击“立即同步”。
5. 发布一条社区内容，并分别验证评论、回复、赞踩、收藏和微信分享。
6. 在云开发控制台检查 `users`、`user_data`、四个 `community_*` 集合，以及云存储的 `avatars/`、`user-content/`、`community/` 目录。

## 社区数据库索引

社区云函数部署后，按控制台提示为常用查询建立以下索引：

- `community_posts`：`status + createdAtTimestamp`，`authorOpenid + status`。
- `community_comments`：`postId + status + createdAtTimestamp`，`authorOpenid + status`。
- `community_reactions`：`authorOpenid`，`postId`，以及评论赞踩使用的 `authorOpenid + postId + targetType`、`commentId + targetType`。
- `community_reports`：`reporterOpenid`，`postId`。

四个社区集合均应设置为“不允许小程序客户端直接读写”。列表、发布、评论、互动、删除、举报和统计全部通过 `community` 云函数完成。

## 社群功能范围

社群仅保留公共经历分享：浏览与搜索动态、发布和编辑、评论与二层回复、评论赞踩、帖子点赞收藏、举报，以及微信原生分享。好友申请、好友列表和站内私信已移除，因此无需创建 `community_friendships` 或 `community_messages` 集合。

## 数据策略

- 核心业务始终先写本机，云同步失败不会阻断记录。
- 微信云身份由云函数 `getWXContext()` 提供的可信 `OPENID` 区分，客户端不会提交或指定其他用户的 `openid`。
- 本地图片同步前会上传至云存储，数据库只保存云文件 ID。
- 删除计划或离线安全卡时会同步删除标记，避免其他设备恢复已经删除的数据。
- 用户更换头像后，登录云函数会尝试清理上一张云端头像。
- 公共帖子、评论和互动不再写入个人 `user_data` 快照，避免不同用户之间的数据隔离问题。
- 旧版本保存在本机的个人帖子会在完成微信云登录后尝试迁移一次到公共社区。
- “隐私与本机数据”页面可分别清除本机数据，或删除个人云备份和本人产生的社区数据。

## AI 建议助手

`cozeAgent` 是为了不改动已部署的云函数名而保留的兼容名称；函数内部已改为调用阿里云百炼千问多模态模型。

1. 在云开发控制台为 `cozeAgent` 新增三个环境变量：
   - `DASHSCOPE_API_KEY`：百炼 API Key（只粘贴在 Value 中，不写入代码或截图）。
   - `AI_MODEL`：`qwen3.7-flash`。
   - `DASHSCOPE_BASE_URL`：百炼 API Key 页面显示的 OpenAI 兼容地址，例如 `https://<workspace-host>/compatible-mode/v1`。
2. 暂时保留旧的 `COZE_API_TOKEN`，直到新版真机验收通过。通过后在扣子平台撤销旧 Token，并从云函数移除该变量。
3. 右键 `cloudfunctions/cozeAgent`，选择“上传并部署：云端安装依赖”。
4. 确认云函数超时为 30 秒，然后重新编译小程序。
5. 进入“AI 建议助手”，先测试纯文字，再分别测试一张虫体图、一张伤口图和两张图片的顺序。

图片会先临时上传至微信云存储，由云函数换成限时 HTTPS 地址后发送至阿里云百炼，回答结束后尝试删除。发送前会弹窗告知用户。图片只用于描述可见特征和给出不确定候选，不参与医疗确诊或风险分级。

组长提供的结构化知识库已经随 `cozeAgent` 云函数部署，位于 `cloudfunctions/cozeAgent/knowledge-base`。文字会在本地规则层提取明确的危险信号；虫体图片先由千问返回最多 3 个候选 ID，再由云函数检索对应知识包并执行行动分级，最后才交给千问整理回答。图片候选和置信度不会参与风险分级。

知识库当前仍为 `DRAFT`，16 个候选条目的媒体状态为 `PENDING_LICENSE`。正式发布前仍需完成逐条来源核验、医学/疾控审核和媒体授权；部署知识库不代表这些审核已经完成。

图片识别接入步骤、请求格式、安全要求和验收清单见 `docs/AI_IMAGE_RECOGNITION_GUIDE.md`。
