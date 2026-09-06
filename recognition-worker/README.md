# 自动虫体识别工作端

该工作端从 CloudBase 的 `recognition_jobs` 集合主动领取图片任务，调用本机 BioCLIP 2，并把结构化结果写回云端。云端不需要访问本机端口。

## 准备

1. 云数据库创建 `recognition_jobs`，禁止小程序客户端直接读写。
2. 云开发控制台创建服务端 API Key。
3. 部署最新版 `identifyInsect` 云函数。
4. 保持本机 BioCLIP 服务运行且 `/health` 返回 `ready=true`。

## 启动

```powershell
.\recognition-worker\run-local.ps1
```

脚本会隐藏输入内容并提示粘贴新创建的 CloudBase 服务端 API Key。不要复制 Markdown 代码块的反引号，也不要单独执行参数行。

看到“自动识别工作端已启动”后，小程序上传的任务会自动处理。服务端 API Key 拥有后台访问能力，不要提交到 Git、截图或发送给其他人。

任务处理中断超过两分钟会自动重新排队。每项任务最多处理三次；完成或最终失败后，工作端会删除云存储中的原图。
