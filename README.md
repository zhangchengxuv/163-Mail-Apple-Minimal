# 163 Mail Minimal

一个面向网易 163 邮箱的 Manifest V3 浏览器扩展：以最小权限清理推广入口，并提供克制的 Apple Mail 风格界面。它不读取、保存或上传邮件内容。

> 当前版本：v1.1.1。项目仅适配 `https://mail.163.com/*` 的 JS6 页面；未在真实登录邮箱中运行的选择器均采用安全跳过策略，见“已知限制”。

## 功能

- 独立的界面净化与 Apple Mail 主题总开关。
- 清理经过限定范围识别的会员、AI、其他工具、企业邮箱推广与首页广告。
- 顶部、左栏、邮件列表、写信页和读信页分作用域主题，不重建邮箱 DOM。
- 首页可默认进入原生“收件箱”；不创建自定义 Dashboard。
- `chrome.storage.sync` 持久化设置，支持恢复默认。
- 仅申请 `storage` 和 `https://mail.163.com/*` 权限，无远程脚本、统计或广告 SDK。

## 截图

`docs/screenshots/` 预留给真实登录会话的人工截图。本仓库不使用伪造截图冒充实机效果。

## 安装

1. 运行 `npm install`、`npm run build`。
2. Edge 打开 `edge://extensions`，或 Chrome 打开 `chrome://extensions`。
3. 开启“开发者模式”。
4. 点击“加载解压缩的扩展”，选择项目的 `dist/` 目录。
5. 打开 `https://mail.163.com/`，点击浏览器工具栏中的扩展图标调整设置。

也可使用构建生成的 `release/163-mail-minimal-v1.1.1.zip` 解压后加载；ZIP 内是安装文件而非源码。

## 开发

要求：Node.js 20+、npm 10+。

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

`npm run dev` 持续构建到 `dist/`，供浏览器的“重新加载”按钮使用。`npm run build` 同时执行 Manifest 校验并生成发布 ZIP。

构建校验会额外确认内容脚本是可由 Chrome 注入的经典 IIFE，而不是带 `import` 的 ES Module。

若不下载 Playwright 自带 Chromium，可指定本机 Edge/Chrome 执行 UI 测试：`PLAYWRIGHT_BROWSER_EXECUTABLE=/path/to/browser npm run test:e2e`（PowerShell 请使用 `$env:PLAYWRIGHT_BROWSER_EXECUTABLE='…'; npm run test:e2e`）。

## 设置说明

- **界面净化**：主开关关闭时会移除所有由扩展添加的隐藏属性，恢复网页入口。
- **外观设置**：总开关和页面分项可单独控制；主题不改变邮件正文 iframe、富文本正文或联系人面板的显示/定位逻辑。
- **首页行为**：默认通过原生左栏“收件箱”入口跳转一次；找不到该入口时安全保留首页，不循环重试。
- **主题配色**：系统蓝、石墨灰或自定义 6 位 HEX 色。

## 隐私与权限

| 权限 | 用途 |
| --- | --- |
| `storage` | 保存扩展开关与配色，不保存邮件、账户或联系人数据。 |
| `https://mail.163.com/*` | 仅在网易 163 邮箱页面注入本地 CSS/脚本以调整 UI。 |

扩展不会读取邮件内容、Cookie、密码或上传附件；不会修改发送、搜索、联系人、附件或登录流程。

## 测试

Vitest 使用脱敏静态夹具覆盖：顶部/侧栏净化、主开关恢复、邮件主题中包含“AI”时不误隐藏、主题作用域和 Storage 持久化。Playwright 覆盖 Popup 渲染和主开关联动。真实邮箱兼容性不能由静态测试代替。

## 人工验证清单

- 收件箱：快速滚动、复选、Shift 多选、批量删除、打开邮件、未读与红旗状态。
- 写信：收件人自动补全、附件上传、联系人侧栏展开/收起、富文本输入和发送。
- 读信：HTML 邮件、图片、表格、签名、回复/转发与附件。
- SPA：首页→收件箱→写信→列表→读信→后退/前进；反复切换设置。
- 不同缩放与窗口宽度：确认左栏和主内容没有重叠。

## 已知限制

- 没有真实登录 163 邮箱会话时，无法声称完成实机回归；动态广告若不带稳定容器、明确属性或“广告”标识会安全跳过。
- 163 可随时更改 DOM class/结构。选择器集中在 `src/content/cleaner/` 和页面 CSS 文件，便于维护。
- 当前仅提供浅色主题与 Chromium 浏览器支持。

## 更新记录

### 1.1.1

- 极简首页强制清理欢迎页广告与 AI/营销模块，并新增文档流 Today 信息卡。

### 1.1.0

- 修复内容脚本的 SPA 同步与欢迎页 AI/推广模块清理。
- 重新设计紧凑 Popup 和完整 Options 页面，新增页面注入状态。
- 加入原创本地图标（SVG、16/32/48/128/256 PNG）与尺寸校验。

### 1.0.0

- 从 Tampermonkey 实验脚本重构为模块化 Manifest V3 扩展。
- 移除旧版自定义 Dashboard、绝对定位重排、history 覆盖和联系人延时隐藏策略。

## 许可证

[MIT](LICENSE)
