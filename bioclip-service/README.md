# BioCLIP 2 虫体识别服务

本服务将项目知识库中的 45 项分类映射为 BioCLIP 2 自定义标签，并结合每项图鉴的真实参考照片构建视觉原型，向本机识别工作端返回最多 3 个结构化候选。模型只负责图像相似度候选，不参与医疗诊断、安全分级或病原体判断。

## 本机启动

首次部署或环境损坏时，在项目根目录执行干净安装：

```powershell
.\bioclip-service\install-local.ps1
```

本地演示时，在项目根目录运行：

```powershell
.\start-local-demo.ps1
```

脚本只启动本机 BioCLIP 服务，不需要 CloudBase API Key。保持该窗口开启，然后在微信开发者工具中选择真实虫体图片。健康检查：

```text
GET http://127.0.0.1:8000/health
```

就绪检查应返回 `ready=true`、`device=cuda`、`prototypeCount=45`。`/health/live` 仅表示进程存活，不能替代就绪检查。

## 同步 45 项标签

修改虫种知识库后，在项目根目录执行：

```powershell
node scripts/export-bioclip-catalog.js
```

提交前确认 `bioclip-service/species.json` 仍为 45 项。

## 阈值校准

默认阈值只是保守起点。正式上线前应使用项目真实拍摄条件下的已知45类、目录外虫种、皮损照片和模糊照片校准 `BIOCLIP_MIN_SCORE` 与 `BIOCLIP_MIN_MARGIN`。

## 本机演示

运行一键入口。编译小程序后进入“识别”，选择真实虫体图片并点击“虫体识别”。页面直接读取微信临时图片并请求 `127.0.0.1:8000`，图片不会上传云端。该模式仅支持与 BioCLIP 服务运行在同一台电脑上的微信开发者工具，不支持真机。
