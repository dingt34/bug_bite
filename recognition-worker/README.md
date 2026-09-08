# 自动虫体识别工作端

该工作端从 CloudBase 的 `recognition_jobs` 集合主动领取图片任务，调用本机 BioCLIP 2，并把结构化结果写回云端。云端不需要访问本机端口。

## 准备

1. 云数据库创建 `recognition_jobs`，禁止小程序客户端直接读写。
2. 云开发控制台创建服务端 API Key。
3. 部署最新版 `identifyInsect` 云函数。
4. Python 3.11、CUDA 驱动与项目 `.venv-bioclip` 已准备好。

## 启动

```powershell
.\start-auto-recognition.ps1
```

脚本会隐藏输入内容并提示粘贴 CloudBase 服务端 API Key。不要复制 Markdown 代码块的反引号，也不要单独执行参数行。

看到“自动识别工作端已启动”后，小程序上传的任务会自动处理。服务端 API Key 拥有后台访问能力，不要提交到 Git、截图或发送给其他人。

监督进程会统一维护 BioCLIP 与 worker：模型退出后自动重启；worker 每 10 秒写入一次心跳；页面在心跳超过 45 秒时立即判定离线。任务使用两分钟租约，中断后自动重新排队。每项任务最多处理三次；完成或最终失败后，工作端会删除云存储中的原图。

## 状态判断

- `BioCLIP 进程已退出……将在下一轮自动重启`：自动恢复中，无需重开窗口。
- `[done] 任务编号 候选名称`：识别完成并已写回云端。
- `[failed]`：单项任务失败，将按重试次数处理。
- `[queue]`：CloudBase 权限、密钥或网络异常，需要检查当前窗口中的完整错误。

## Windows 登录自动运行

执行以下脚本并隐藏输入一次 CloudBase 服务端 API Key：

```powershell
.\recognition-worker\install-autostart.ps1
```

密钥使用当前 Windows 账户的 DPAPI 加密，保存到 `%LOCALAPPDATA%\BugBiteRecognition`，不会写入项目。任务会在登录后后台启动，异常退出后一分钟自动重启，日志位于同一目录的 `recognition.log`。

需要撤销时执行：

```powershell
.\recognition-worker\uninstall-autostart.ps1
```
