# AI 助手图片识别接入指南
## 当前状态

小程序已经具备图片选择、临时上传和回复结束后删除云文件的流程，但 `ai-service.js` 当前主动关闭了图片发送。扣子 AI 编程项目的 `/stream_run` 接口支持图片，要求在 `content.query.prompt` 中使用 `upload_file`，并传入可访问的 HTTPS URL。

官方接口说明：<https://docs.coze.cn/dev_how_to_guides_qeesmmos>

## 一、先在扣子侧确认视觉能力

1. 打开当前项目 `7678279631425994762`，确认智能体使用的模型支持图片理解。
2. 在智能体提示词中明确图片任务边界：只描述可见特征和可能类别，不做虫种、疾病或严重程度确诊。
3. 要求回复固定包含：可见特征、不确定性、建议补拍角度、危险信号和下一步行动。
4. 重新部署 API 服务，在部署详情中核对 `/stream_run` 的项目 ID、域名和请求示例。
5. 先用官方示例中的公开 HTTPS 图片进行测试，确认智能体能收到图片后再修改小程序。

## 二、把微信云文件转换为 HTTPS URL

小程序上传后得到的是 `cloud://` 文件 ID，扣子不能直接读取。推荐在 `cozeAgent` 云函数内完成转换，避免由客户端提交任意外部 URL：

```js
async function resolveImages(fileIds) {
  const safeIds = (fileIds || [])
    .filter(id => typeof id === 'string' && id.indexOf('cloud://') === 0)
    .slice(0, 2);
  if (!safeIds.length) return [];
  const result = await cloud.getTempFileURL({ fileList: safeIds });
  return (result.fileList || [])
    .filter(item => item.tempFileURL)
    .map((item, index) => ({
      url: item.tempFileURL,
      fileName: 'image-' + (index + 1) + '.jpg'
    }));
}
```

云函数应只接受本环境产生的云文件 ID，每次最多两张。正式上线前还应检查扩展名、文件大小，并接入微信图片内容安全检查。

## 三、构造扣子多模态请求

在 `cloudfunctions/cozeAgent/domain.js` 的 `buildAgentRequest` 中，将文本和图片放进同一个 `prompt` 数组：

```js
const promptItems = [{
  type: 'text',
  content: { text: prompt }
}].concat(images.map(image => ({
  type: 'upload_file',
  content: {
    upload_file: {
      url: image.url,
      file_name: image.fileName
    }
  }
})));
```

最终请求结构：

```json
{
  "content": {
    "query": {
      "prompt": [
        {
          "type": "text",
          "content": { "text": "请描述图片中的可见特征" }
        },
        {
          "type": "upload_file",
          "content": {
            "upload_file": {
              "url": "https://临时可访问地址/image.jpg",
              "file_name": "image.jpg"
            }
          }
        }
      ]
    }
  },
  "type": "query",
  "session_id": "本轮会话ID",
  "project_id": "7678279631425994762"
}
```

AI 编程项目的 `upload_file` 与低代码 OpenAPI 的文件上传接口不是同一套协议，不要混用低代码 API 的 `file_id` 格式。

## 四、小程序端启用开关

完成云函数真机验证后再修改 `miniprogram/utils/ai-service.js`：

1. 将 `getStatus()` 中的 `imageAvailable` 改为由云函数能力配置决定。
2. 删除 `streamReply()` 中“尚未启用图片输入”的主动拦截。
3. 调用 `cozeAgent` 时一并发送 `fileIds`。
4. 保留现有 `deleteTemporaryImages()` 清理逻辑，并确保成功、失败和超时都执行清理。

建议使用云函数环境变量 `COZE_IMAGE_ENABLED=true` 控制开关。未完成真机验收时保持关闭，避免页面声称支持图片但后端无法识别。

## 五、医疗安全与隐私要求

- 图片仅用于辅助描述可见特征，不能作为疾病或虫种确诊依据。
- 伤口图片可能包含敏感身体信息，发送前应再次明确告知会交由第三方 AI 服务处理。
- 默认不保存图片；请求完成后删除微信云存储临时文件。
- 不把图片 URL、API Token 或完整个人记录写入日志。
- 命中呼吸困难、意识异常、口唇舌喉肿胀、症状快速加重等危险信号时，直接引导急诊或呼叫 120，不等待图像分析。
- AI 无法判断时必须明确返回“不确定”，并提示用户补拍整体、局部、带比例参照和自然光图片。

## 六、验收清单

1. 单张虫体图片加文字能够返回可见特征描述。
2. 单张伤口图片不会输出确定性疾病诊断。
3. 两张图片的顺序和标签不会混淆。
4. 不支持的格式、超大文件和损坏图片会得到明确提示。
5. 扣子超时或失败时，小程序显示安全兜底信息。
6. 成功、失败、退出页面三种路径都能删除临时云文件。
7. 不选图片时，原有纯文字多轮对话保持正常。
8. 真机检查云函数日志、调用耗时、错误率和扣子费用。
