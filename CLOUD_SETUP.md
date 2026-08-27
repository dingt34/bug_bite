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

部署环境必须与 `ENV_ID` 指向的环境一致。

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

1. 在云开发控制台为 `cozeAgent` 云函数添加环境变量 `COZE_API_TOKEN`，值为扣子 API Token。不要把 Token 写入小程序代码、Git 或截图。
2. 右键 `cloudfunctions/cozeAgent`，选择“上传并部署：云端安装依赖”。
3. 云函数默认调用项目 `7678279631425994762` 的 HTTPS 接口。如需迁移，可通过云函数环境变量 `COZE_API_ENDPOINT` 和 `COZE_PROJECT_ID` 覆盖。
4. 重新编译后进入“AI 建议助手”，发送不含个人信息的测试问题，确认页面显示“扣子 Agent”并正常回复。
5. Agent 已设置为：不做虫种或疾病确诊，优先识别危险信号，严重情况建议立即呼叫 120 或就近急诊。

目前已部署的扣子 API 输入定义只确认支持文字，因此图片按钮暂不向 Agent 发送内容。发送个人记录时由用户勾选计划或事件，只发送所选记录及复查的文字摘要，不发送未选记录，也不自动发送历史图片。
