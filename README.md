# 163 Mail Minimal

[![CI](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/ci.yml)
[![Release](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/release.yml/badge.svg)](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/release.yml)
[![Latest Release](https://img.shields.io/github/v/release/zhangchengxuv/163-Mail-Apple-Minimal?display_name=tag)](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/releases/latest)

一个面向网易 163 邮箱的 Manifest V3 浏览器扩展：以最小权限清理推广入口，并提供克制的 Apple Mail 风格界面。它不读取、保存或上传邮件内容。

> 当前版本：v1.3.5。项目仅适配 `https://mail.163.com/*` 的 JS6 页面；未在真实登录邮箱中运行的选择器均采用安全跳过策略，见“已知限制”。

## 功能

- 独立的界面净化与 Apple Mail 主题总开关。
- 清理经过限定范围识别的会员、AI、其他工具、企业邮箱推广与首页广告。
- 顶部、左栏、邮件列表、写信页和读信页分作用域主题，不重建邮箱 DOM。
- 浅色、深色和跟随系统三种外观模式；深色仅作用于邮箱外围 UI，不反色邮件正文、图片或 iframe。
- Options 提供 13px、14px、15px、16px 四档外围 UI 字号；不使用页面缩放，也不改变邮件正文与虚拟列表行高。
- 首页可默认进入原生“收件箱”；不创建自定义 Dashboard。
- `chrome.storage.sync` 持久化设置，支持恢复默认。
- 仅申请 `storage`、用户主动使用当前位置时所需的 `geolocation`，以及天气功能所需的两项精确 Open-Meteo 域名权限；无远程脚本、统计或广告 SDK。

## 截图

`docs/screenshots/` 预留给真实登录会话的人工截图。本仓库不使用伪造截图冒充实机效果。

## 安装

1. 运行 `npm install`、`npm run build`。
2. Edge 打开 `edge://extensions`，或 Chrome 打开 `chrome://extensions`。
3. 开启“开发者模式”。
4. 点击“加载解压缩的扩展”，选择项目的 `dist/` 目录。
5. 打开 `https://mail.163.com/`，点击浏览器工具栏中的扩展图标调整设置。

也可使用构建生成的 `release/163-mail-minimal-v1.3.5.zip` 解压后加载；ZIP 内是安装文件而非源码。

最新正式版本与下载地址见 [GitHub Releases](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/releases/latest)。Release ZIP 是开发者模式下的“加载解压缩的扩展”安装包，不是 Chrome 或 Edge 商店的一键安装程序。

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

## CI/CD 自动化

- [CI 工作流](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/ci.yml) 在 `main` 的 Push、Pull Request 和 Actions 页面手动运行时执行 `npm ci`、类型检查、Lint、单元测试、生产构建、Manifest/版本/ZIP 结构校验；只上传短期构建产物，绝不创建 Release。
- [Release 工作流](https://github.com/zhangchengxuv/163-Mail-Apple-Minimal/actions/workflows/release.yml) 仅在推送稳定版 `vX.Y.Z` Tag 时运行。它重新执行质量检查、校验 Tag 与 `package.json`、源码 Manifest、构建 Manifest 版本一致，生成 ZIP 与 SHA256 文件，并创建公开 GitHub Release。
- 手动构建：进入 GitHub 的 **Actions → CI → Run workflow**。该入口只构建和测试，不发布 Release。

### 发布下一个版本

1. 同步修改 `package.json` 和 `public/manifest.json` 的版本号，例如 `1.1.3`；不要修改工作流来绕过版本校验。
2. 运行 `npm install` 后执行 `npm run typecheck`、`npm run lint`、`npm run test`、`npm run build`、`npm run validate:version`、`npm run validate:release`。
3. 提交并推送版本代码到 `main`。
4. 创建并推送已存在提交的注释 Tag：`git tag -a v1.1.3 -m "163 Mail Minimal v1.1.3"`，然后 `git push 163-Mail-·-Apple-Minimal v1.1.3`。
5. Release 工作流会拒绝已有 Release、缺失 Tag、非稳定 Tag、版本不一致或任一质量检查失败的情况；修复后请使用新的版本号，不要覆盖 Tag 或资产。

### 常见 CI 失败

- `npm ci` 失败：在本地执行 `npm install` 更新并提交 `package-lock.json`。
- 版本校验失败：确认 Tag 去掉 `v` 后与 `package.json`、`public/manifest.json`、`dist/manifest.json` 完全一致。
- ZIP 校验失败：运行 `npm run build` 后再执行 `npm run validate:release`，不要手工压缩源码目录。
- Release 403：检查仓库 **Settings → Actions → General → Workflow permissions** 是否允许 `GITHUB_TOKEN` 以读写权限创建 Release；工作流不使用私人 PAT。

## 设置说明

- **界面净化**：主开关关闭时会移除所有由扩展添加的隐藏属性，恢复网页入口。
- **外观设置**：总开关和页面分项可单独控制；可选浅色、深色或跟随系统。系统外观变化会即时更新，不会重新请求天气、重载邮件列表或改变联系人面板状态。
- **界面字号**：在 Options 的“首页与配色”中选择 13–16px。该设置通过 CSS Variable 即时应用于顶部、侧栏、列表、工具栏、Today 卡及写信外围 UI；不会缩放页面、改变邮件行高度或重写邮件正文。
- **首页行为**：默认通过原生左栏“收件箱”入口跳转一次；找不到该入口时安全保留首页，不循环重试。
- **主题配色**：系统蓝、石墨灰或自定义 6 位 HEX 色。

## 隐私与权限

| 权限 | 用途 |
| --- | --- |
| `storage` | 保存扩展开关与配色，不保存邮件、账户或联系人数据。 |
| `geolocation` | 仅当用户在 Options 页点击“使用当前位置 / 更新当前位置”时，由浏览器请求当前位置；坐标仅保存到本机 `chrome.storage.local`，不参与同步。 |
| `https://mail.163.com/*` | 仅在网易 163 邮箱页面注入本地 CSS/脚本以调整 UI。 |
| `https://geocoding-api.open-meteo.com/*` | 仅将用户在设置中填写的城市名称转换为经纬度。 |
| `https://api.open-meteo.com/*` | 仅请求上述城市的当前天气；不发送邮件或账户数据。 |

扩展不会读取邮件内容、Cookie、密码或上传附件；不会修改发送、搜索、联系人、附件或登录流程。

## 测试

Vitest 使用脱敏静态夹具覆盖：顶部/侧栏净化、主开关恢复、邮件主题中包含“AI”时不误隐藏、主题作用域和 Storage 持久化。Playwright 覆盖 Popup 渲染和主开关联动。真实邮箱兼容性不能由静态测试代替。

附加发布校验命令：`npm run validate:workflows`、`npm run validate:version`、`npm run validate:release` 和 `npm run checksum:release`。最后一条会在 `release/` 写入对应 ZIP 的 SHA256 校验文件。

## 人工验证清单

- 收件箱：快速滚动、复选、Shift 多选、批量删除、打开邮件、未读与红旗状态。
- 写信：收件人自动补全、附件上传、联系人侧栏展开/收起、富文本输入和发送。
- 读信：HTML 邮件、图片、表格、签名、回复/转发与附件。
- SPA：首页→收件箱→写信→列表→读信→后退/前进；反复切换设置。
- 不同缩放与窗口宽度：确认左栏和主内容没有重叠。

## 已知限制

- 没有真实登录 163 邮箱会话时，无法声称完成实机回归；动态广告若不带稳定容器、明确属性或“广告”标识会安全跳过。
- 163 可随时更改 DOM class/结构。选择器集中在 `src/content/cleaner/` 和页面 CSS 文件，便于维护。
- 静态 Fixture 已覆盖主题属性、设置持久化和 Popup/Options 的深色解析；真实登录邮箱下的下拉菜单、复杂 HTML 邮件及 100%/125%/150% 缩放仍需人工验证。

## 更新记录

### 1.3.5

- 调整深色模式收信／写信操作区，移除原生按钮文字层残留的浅色表面。
- 收敛 Popup 深色面板的色阶与圆角；重新实现开关滑块的尺寸和圆点定位，使其严格居中。

### 1.3.4

- 统一浅色与深色模式的顶部搜索框：移除原生半透明外壳和内层输入框的重复背景，修复占位文字贴边/越界观感，并保留键盘聚焦反馈。

### 1.3.3

- 修复深色模式搜索框的双层灰黑背景：仅由原生搜索外壳绘制圆角与边框，输入层保持透明。

### 1.3.2

- 提升深色顶部账户栏、设置入口与搜索框的前景对比度，并清除工具栏按钮内层残留的白色背景。

### 1.3.1

- 修复 SPA 返回列表时隐藏的读信模块被误判为当前页面，导致列表深色主题丢失的问题。
- 扩展读信页的深色外围容器与工具栏按钮覆盖范围；HTML 邮件正文仍保持原始渲染。

### 1.3.0

- 重建深色配色系统：欢迎页 canvas、账户概览、容量概览与 Today 卡统一为低饱和深蓝灰层级。
- 重新适配邮件列表多层行背景、低对比分隔线、工具栏与分页按钮，消除白色控件和日期列断层。
- 新增持久化的 13px–16px 界面字号选择，并保持邮件正文、联系人面板与虚拟列表行高不受影响。

### 1.2.0

- 新增浅色、深色与跟随系统三种主题模式，并在 Popup、Options 与邮箱外围界面保持一致。
- 使用统一设计 Token 适配顶部、侧栏、邮件列表、工具栏、Today 卡、写信页和读信页外围 UI。
- 深色模式不会反色或改写 HTML 邮件正文、图片、iframe、富文本编辑区内容，也不会改变联系人面板的几何与显示逻辑。

### 1.1.2

- 按当前 JS6 欢迎页已验证的模块根清理推荐广告、广告占位及 AI / 工具 / 求职助理卡片。
- 将 Today 信息卡放入账户与容量概览之后的正常内容流，并使用可逆的直接隐藏防止 SPA 重绘恢复推广入口。
- 为极简首页 Today 卡加入可关闭的城市天气、30 分钟本地缓存及网络失败回退。
- 现在可在 Options 中选择手动城市或在明确点击后使用当前位置；当前位置不自动获取，也不会通过设置同步。

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

## 天气功能

当首页行为设为「极简首页」时，Today 卡可显示当前天气。默认是手动城市 `Tokyo`，可在扩展「高级设置」的「天气」分组中关闭功能、改为北京/上海/Singapore 等城市，或主动选择“使用当前位置”。

- 手动城市模式不会请求定位，也不根据 IP 推测位置。当前位置模式必须由用户在 Options 页点击按钮触发，浏览器会显示位置权限提示；扩展不会在打开邮箱、切换 SPA 页面或后台刷新时请求位置。
- 手动城市模式仅将城市名称发送给 Open-Meteo 的地理编码与天气预报接口；当前位置模式只将本机保存的经纬度发送给天气预报接口。两种模式均绝不读取、上传或发送邮件、联系人、账号或附件内容。
- 坐标、温度、体感温度、湿度、天气代码和更新时间仅缓存在本机 `chrome.storage.local`；天气缓存有效期为 30 分钟。缓存过期时异步刷新，网络失败时优先显示同一来源的旧缓存，否则 Today 卡仅提示天气暂不可用。
- 为此新增两项精确 Host 权限：`https://geocoding-api.open-meteo.com/*` 与 `https://api.open-meteo.com/*`。数据来源为 [Open-Meteo 地理编码 API](https://open-meteo.com/en/docs/geocoding-api) 和 [天气预报 API](https://open-meteo.com/en/docs)。
