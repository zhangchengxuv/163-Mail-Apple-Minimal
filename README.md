# 163 Mail Minimal

[![CI](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/ci.yml)
[![Latest Release](https://img.shields.io/github/v/release/zhangchengxuv/163-Mail-Apple-Minimal?display_name=tag)](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/releases/latest)

为网易 163 邮箱 JS6 页面提供界面净化、Apple Mail 风格外观、极简首页与可选天气的 Manifest V3 扩展。

## 预览

![脱敏后的浅色与深色界面预览](docs/screenshots/preview-anonymized.png)

> 预览中的账号、头像、联系人、邮件主题、时间、容量和天气数据均为脱敏示例，不包含真实邮箱数据。

## 功能

- 清理首页广告、AI 与非必要推广入口。
- 浅色、深色、跟随系统三种外观，以及 13–16px UI 字号。
- 极简首页 Today 卡：日期、邮件摘要、快捷操作与可选天气。
- 保持邮件正文、图片、iframe 和富文本编辑区的原始渲染。

## 安装

1. 从 [Releases](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/releases/latest) 下载 ZIP 并解压，或本地执行 `npm run build`。
2. 打开 `edge://extensions` 或 `chrome://extensions`，开启开发者模式。
3. 选择“加载解压缩的扩展程序”，并选择解压后的目录或项目的 `dist/`。

Release ZIP 是开发者模式加载包，不是浏览器商店的一键安装程序。

## 隐私

扩展不会上传邮件内容、附件、Cookie 或密码。天气功能仅在用户启用后请求用户填写的城市，或在用户主动确认后使用当前位置；天气数据本地缓存 30 分钟。

## 开发

```bash
npm install
npm run typecheck
npm run lint
npm run test
npm run build
```

推送稳定版 `vX.Y.Z` 标签会触发 GitHub Actions：校验、构建、生成 ZIP 与 SHA256，并创建对应 Release。手动运行 CI 只构建和测试，不发布。

## 许可

[MIT](LICENSE)
