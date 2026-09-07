# BioCLIP 2 虫体识别服务

本服务将项目知识库中的 45 项分类映射为 BioCLIP 2 自定义标签，并结合每项图鉴的真实参考照片构建视觉原型，向本机识别工作端返回最多 3 个结构化候选。模型只负责图像相似度候选，不参与医疗诊断、安全分级或病原体判断。

## 本机启动

项目根目录已经使用 `.venv-bioclip` 隔离 Python 依赖。启动时传入一个足够长的随机密钥：

```powershell
.\bioclip-service\run-local.ps1 -ApiKey 'replace-with-a-long-random-secret'
```

首次识别会下载并加载 `imageomics/bioclip-2` 权重。健康检查：

```text
GET http://127.0.0.1:8000/health
```

服务会在开始接受请求前完成模型与45项视觉原型加载；健康检查应返回 `ready=true`、`prototypeCount=45`。

## 同步 45 项标签

修改虫种知识库后，在项目根目录执行：

```powershell
node scripts/export-bioclip-catalog.js
```

提交前确认 `bioclip-service/species.json` 仍为 45 项。

## Linux GPU 容器

服务器需先安装 NVIDIA 驱动、Docker 和 NVIDIA Container Toolkit，然后在项目根目录执行：

```bash
docker build -f bioclip-service/Dockerfile -t bug-bite-bioclip .
docker run -d --restart unless-stopped --gpus all \
  -p 127.0.0.1:8000:8000 \
  -e BIOCLIP_API_KEY='replace-with-a-long-random-secret' \
  -v bioclip-cache:/root/.cache/huggingface \
  --name bug-bite-bioclip bug-bite-bioclip
```

使用 Nginx 或 Caddy 将公开 HTTPS 域名反向代理到 `127.0.0.1:8000`。不要直接公开 8000 端口。

公网部署时，只有 `recognition-worker` 需要设置服务地址与密钥；微信小程序和 `identifyInsect` 云函数均不直接访问该端口。

## 阈值校准

默认阈值只是保守起点。正式上线前应使用项目真实拍摄条件下的已知45类、目录外虫种、皮损照片和模糊照片校准 `BIOCLIP_MIN_SCORE` 与 `BIOCLIP_MIN_MARGIN`。

## 本机演示

使用本仓库默认的本机工作端配置启动服务：

```powershell
.\bioclip-service\run-local.ps1 -ApiKey 'local-bioclip-deployment-key'
```

随后启动 `recognition-worker`。编译小程序后进入“识别”，通过拍照或相册选择真实虫体图片，再点击“虫体识别”。真机和开发者工具采用完全相同的排队与结果刷新流程。
