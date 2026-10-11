// ==UserScript==
// @name         163 Mail · Apple Minimal v0.8.1
// @namespace    local.163mail.apple.minimal
// @version      0.8.1
// @description  Apple Mail 浅色外观；v0.8.1 优化首页信息密度，并移除邮件行点击后的蓝色矩形焦点框。
// @match        https://mail.163.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  // ========== 配置：修改后保存并刷新邮箱 ==========
  const OPT = Object.freeze({
    hidePromotionLinks: true,  // 隐藏顶部会员、下载、调研等推广入口
    hideAiTools: true,         // 隐藏已识别的 AI 工具箱 / AI 助理 / AI 搜入口
    hideEnterpriseTab: true,   // 隐藏顶部“企业邮箱”页签，不删除邮件账户
    hideOtherTools: true,      // 隐藏左侧“其他工具”分组
    hideAccountVipBadge: true,
    softenNewMailNotice: true, // 保留新邮件通知，但改成低对比度的颜色
    accent: '#007aff',         // 系统蓝，可自行改成如 '#5b75d6'
    sidebarWidth: 224,         // 原生为 201px；同步修改 frame-nav 与 frame-main，避免挤压/错位
    // 仍不修改邮件行高；网易列表存在固定定位/虚拟滚动，改高度风险较大。
  });

  const ATTR = 'data-am6';
  const ROOT = `html[${ATTR}="list"]`;
  const CROOT = `html[${ATTR}="compose"]`;
  const HIDDEN = 'data-am6-hidden';
  const STYLE_ID = 'am6-visual-theme';
  const ENTER_ATTR = 'data-am6-compose-entering';
  const CONTACT_GUARD = 'data-am6-compose-contact-guard';
  const PAGE_ATTR = 'data-am6-page';
  const WROOT = `html[${ATTR}="list"][${PAGE_ATTR}="welcome"]`;
  const HOME_CARD_ATTR = 'data-am6-home-card';
  const HOME_SUMMARY_ATTR = 'data-am6-home-summary';
  const HOME_DASHBOARD_ATTR = 'data-am6-home-dashboard';
  const TOP_PROMOS = new Set(['手机App', '手机APP', '下载桌面端', '参与调研', '自助查询', '会员中心', '开通超级会员']);
  const OTHER_TOOLS = new Set(['其他工具','邮件追踪','简历优化','智能面试顾问','求职信息订阅','PDF转换工具','发票助手','企业邮箱']);
  const tidy = (s) => (s || '').replace(/\s+/g, '').trim();

  // 来自你提供的三组 DOM：
  // 1) 顶部标签：#dvMultiTabWrapper .nui-tabs-item / .nui-tabs-item-selected
  // 2) 左侧文件夹：#dvNavContainer #dvNavTop li[role="button"]
  // 3) 邮件列表：.frame-main-cont-body .tv0 > .rF0[role="link"]
  // 4) 操作工具栏：header.frame-main-cont-head [role="toolbar"].nui-toolbar .nui-btn
  // 避免使用 _mail_button_81_843 以及 1791543570114... 这种动态 ID。

  // 163 邮箱是 SPA：收件箱与写信页共用同一个 document。
  // v0.6 的问题是进入 ComposeModule 后主题标记仍保留，
  // 导致列表页的 .frame-main / toolbar 样式继续影响写信页和通讯录侧栏。
  function inCompose() {
    // URL 在写信页通常包含 module=compose.ComposeModule。
    if (/compose(?:%2E|\.)ComposeModule/i.test(location.href)) return true;

    // DOM 兜底：部分内部切页可能先换 DOM、后换 URL。
    const nodes = document.querySelectorAll(
      '[id*="compose.ComposeModule"], [id*="ComposeModule"]'
    );
    for (const el of nodes) {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      if (cs.display !== 'none' && cs.visibility !== 'hidden' &&
          r.width > 0 && r.height > 0) {
        return true;
      }
    }
    return false;
  }

  function inWelcome() {
    // 首页 URL：module=welcome.WelcomeModule
    if (/welcome(?:%2E|\.)WelcomeModule/i.test(location.href)) return true;

    // SPA 切页时 URL / DOM 更新顺序不固定，使用顶部选中标签兜底。
    const selected = document.querySelector(
      '#dvMultiTabWrapper li[role="tab"].nui-tabs-item-selected .nui-tabs-item-text'
    );
    return tidy(selected?.textContent) === '首页' && !inCompose();
  }

  function inMailbox() {
    if (inCompose() || inWelcome()) return false;
    return Boolean(document.querySelector('#dvNavContainer.frame-nav') &&
      document.querySelector('#dvContentContainer.frame-main-outer') &&
      document.querySelector('#dvMultiTabWrapper'));
  }

  function hide(el) {
    if (el && el.getAttribute(HIDDEN) !== '1') el.setAttribute(HIDDEN, '1');
  }

  // 只在明确的 UI 容器内隐藏目标，绝不遍历邮件正文或按坐标删除未知图标。
  function hideSmallExactLabel(scope, labels, rootSelector) {
    if (!scope) return;
    for (const el of scope.querySelectorAll('a, button, span, li, div, [role="button"], [role="tab"]')) {
      if (!labels.has(tidy(el.textContent))) continue;
      // 跳过含有相同文字的外层容器；仅选最内层入口。
      if ([...el.children].some(c => tidy(c.textContent) === tidy(el.textContent))) continue;
      let target = el;
      for (let i = 0, cur = el; i < 4 && cur && cur !== scope; ++i, cur = cur.parentElement) {
        const r = cur.getBoundingClientRect();
        if (r.width > 260 || r.height > 65 || r.height < 8) break;
        if (cur.matches(rootSelector)) { target = cur; break; }
      }
      hide(target);
    }
  }

  function cleanupEntries() {
    if (OPT.hidePromotionLinks) {
      // 顶部操作区位于 header.frame-head 中，限定作用域防止误隐藏同名邮件内容。
      hideSmallExactLabel(document.querySelector('header.frame-head'), TOP_PROMOS,
        'a, li, button, [role="button"]');
      for (const selector of ['#_mail_component_73_73','#_mail_component_35_35',
        '#_mail_component_39_39','#_mail_component_43_43',
        '#_mail_component_47_47','#_mail_component_51_51']) {
        hide(document.querySelector(selector));
      }
    }

    const tabs = document.querySelector('#dvMultiTabWrapper');
    if (tabs) {
      for (const tab of tabs.querySelectorAll('li[role="tab"].nui-tabs-item')) {
        const txt = tidy(tab.textContent);
        if (OPT.hideAiTools && txt === 'AI工具箱') hide(tab);
        if (OPT.hideEnterpriseTab && txt === '企业邮箱') hide(tab);
      }
    }
    if (OPT.hideOtherTools) {
      // 来自网页存档：<li id="dvNavFoot" class="Kz0 nui-tree"> 包含整个“其他工具”分组。
      // 使用 DOM 标记 + inline important + 专用 CSS 三级兜底，避免旧版原生样式覆盖。
      const foot = document.getElementById('dvNavFoot');
      hide(foot);
      if (foot) foot.style.setProperty('display', 'none', 'important');
      // 兜底：只在左边栏的工具分组内匹配，不误删收件箱/写信入口。
      const nav = document.querySelector('#dvNavContainer');
      if (nav) {
        const headings = [...nav.querySelectorAll('div,span,p,strong')].filter(e => tidy(e.textContent) === '其他工具');
        if (!document.querySelector('#dvNavFoot')) {
          for (const h of headings) {
            const parent = h.closest('section,aside,ul');
            if (parent && parent !== nav && parent.getBoundingClientRect().height < 450) hide(parent);
            else hide(h);
          }
          hideSmallExactLabel(nav, OTHER_TOOLS, 'a,li,[role="button"]');
        }
      }
    }
    if (OPT.hideAccountVipBadge) document.querySelectorAll('.nui-ico-newplusSmall').forEach(hide);
    if (OPT.hideAiTools) {
      for (const selector of [
        '#_mail_link_4_179', '.APP-smartAssistant-operating', '.APP-smartAssistant-btn',
        '.APP-smartAssistant-reminder', '.APP-smartAssistant-container',
        '.nui-ico-letterai', '[id$="_dvReadSAGuide"]', '[id$="_dvReadYad"]'
      ]) document.querySelectorAll(selector).forEach(hide);
      // 可访问性标注明确是 AI 的浮窗，才会隐藏；右侧设置等按钮保留。
      document.querySelectorAll('[aria-label],[title]').forEach(el => {
        const label = [el.getAttribute('aria-label'), el.getAttribute('title')].filter(Boolean).join(' ');
        if (!/(?:AI\s*助手|AI\s*助理|智能助手|智能助理|AI\s*搜)/i.test(label)) return;
        const r = el.getBoundingClientRect();
        if (r.left < window.innerWidth - 140 || r.width > 110 || r.height > 90) return;
        const target = el.closest('button,[role="button"],a') || el;
        if (target.getBoundingClientRect().width <= 110) hide(target);
      });
    }
  }

  // ========== 首页 / WelcomeModule ==========
  function visibleBox(el) {
    if (!el) return false;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' &&
           r.width > 0 && r.height > 0;
  }

  // 从命中文本向上寻找“最小且像卡片”的祖先，避免误隐藏整个首页主容器。
  function findWelcomeCardByPattern(root, pattern, {
    minW = 180, maxW = 980, minH = 70, maxH = 420
  } = {}) {
    if (!root) return null;

    const nodes = [...root.querySelectorAll('div,section,article')].filter(el => {
      if (!visibleBox(el)) return false;
      const text = tidy(el.textContent);
      if (!pattern.test(text)) return false;
      const r = el.getBoundingClientRect();
      return r.width >= minW && r.width <= maxW &&
             r.height >= minH && r.height <= maxH;
    });

    // 面积最小的候选通常就是卡片本身，而不是外层布局容器。
    nodes.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return ar.width * ar.height - br.width * br.height;
    });
    return nodes[0] || null;
  }

  function clearWelcomeMarks() {
    document.querySelectorAll(`[${HOME_CARD_ATTR}]`).forEach(el => {
      el.removeAttribute(HOME_CARD_ATTR);
    });
    document.querySelectorAll(`[${HOME_SUMMARY_ATTR}]`).forEach(el => {
      el.removeAttribute(HOME_SUMMARY_ATTR);
    });
    document.querySelectorAll('[data-am6-home-main]').forEach(el => {
      el.removeAttribute('data-am6-home-main');
    });
  }

  function commonAncestor(a, b, stop) {
    if (!a || !b) return null;
    const set = new Set();
    let cur = a;
    while (cur && cur !== stop && cur !== document.body) {
      set.add(cur);
      cur = cur.parentElement;
    }
    cur = b;
    while (cur && cur !== stop && cur !== document.body) {
      if (set.has(cur)) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  function clickUiByText(text, scope = document) {
    const candidates = [...scope.querySelectorAll(
      'a,button,[role="button"],[role="tab"],li,.nui-tree-item-label'
    )];
    const hit = candidates.find(el => {
      if (!visibleBox(el)) return false;
      const t = tidy(el.textContent);
      return t === tidy(text);
    });
    if (hit) {
      hit.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      return true;
    }
    return false;
  }

  function ensureHomeDashboard(main) {
    let dash = document.querySelector(`[${HOME_DASHBOARD_ATTR}="1"]`);
    if (!dash) {
      dash = document.createElement('section');
      dash.setAttribute(HOME_DASHBOARD_ATTR, '1');
      dash.innerHTML = `
        <div class="am8-home-dash-head">
          <div>
            <div class="am8-home-dash-title">快捷操作</div>
            <div class="am8-home-dash-subtitle">常用邮箱功能</div>
          </div>
        </div>
        <div class="am8-home-actions">
          <button type="button" data-am8-action="inbox">
            <span class="am8-action-icon">↓</span>
            <span><b>收件箱</b><small>查看最新邮件</small></span>
          </button>
          <button type="button" data-am8-action="compose">
            <span class="am8-action-icon">＋</span>
            <span><b>写邮件</b><small>新建一封邮件</small></span>
          </button>
          <button type="button" data-am8-action="draft">
            <span class="am8-action-icon">▤</span>
            <span><b>草稿箱</b><small>继续未完成邮件</small></span>
          </button>
          <button type="button" data-am8-action="sent">
            <span class="am8-action-icon">↗</span>
            <span><b>已发送</b><small>查看已发送邮件</small></span>
          </button>
        </div>
      `;
      main.appendChild(dash);

      dash.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button[data-am8-action]');
        if (!btn) return;
        const action = btn.dataset.am8Action;
        if (action === 'inbox') clickUiByText('收件箱');
        else if (action === 'compose') clickUiByText('写信', document.querySelector('#dvNavContainer') || document);
        else if (action === 'draft') clickUiByText('草稿箱', document.querySelector('#dvNavContainer') || document);
        else if (action === 'sent') clickUiByText('已发送', document.querySelector('#dvNavContainer') || document);
      });
    }

    // SPA 可能替换首页主容器；确保 dashboard 总在当前主容器内。
    if (dash.parentElement !== main) main.appendChild(dash);
  }

  function markWelcomeRegions() {
    clearWelcomeMarks();

    const main =
      document.querySelector('#dvContentContainer .frame-main[role="main"]') ||
      document.querySelector('#dvContentContainer') ||
      document.querySelector('.frame-main-outer');

    if (!main) return;
    main.setAttribute('data-am6-home-main', '1');

    // 顶部两个真正有用的概览卡片：保留并统一 Apple 风格。
    const account = findWelcomeCardByPattern(
      main,
      /未读邮件.*待办邮件.*联系人邮件/
    );
    if (account) {
      account.setAttribute(HOME_CARD_ATTR, 'account');

      // 首页账户卡里的会员 CTA 与当前“极简”目标冲突，单独隐藏。
      hideSmallExactLabel(
        account,
        new Set(['开通邮箱会员', '开通会员']),
        'a,button,[role="button"],span'
      );
    }

    const storage = findWelcomeCardByPattern(
      main,
      /会员中心.*(?:储存|存储)已使用.*邮件已存储/
    );
    if (storage) {
      storage.setAttribute(HOME_CARD_ATTR, 'storage');
      hideSmallExactLabel(
        storage,
        new Set(['查看账户资产']),
        'a,button,[role="button"],span'
      );
    }

    // 把两张概览卡的公共父容器标出来，用 CSS 做更宽的 dashboard 布局。
    if (account && storage) {
      let summary = commonAncestor(account, storage, main);
      if (summary) {
        const r = summary.getBoundingClientRect();
        // 只接受“像顶部两卡容器”的祖先，防止误标记整个 WelcomeModule。
        if (r.width >= 480 && r.width <= 1100 && r.height >= 100 && r.height <= 320) {
          summary.setAttribute(HOME_SUMMARY_ATTR, '1');
        }
      }
    }

    // 首页营销广告：除已知文案外，也覆盖当前轮换的求职 / 简历类广告。
    const adPatterns = [
      /网易外贸通/,
      /AI自动化拓客/,
      /开发耗时又低效/,
      /求职晋升/,
      /简历PPT内容轻松搞定/,
      /解锁工具包/
    ];
    for (const pattern of adPatterns) {
      const ad = findWelcomeCardByPattern(main, pattern, {
        minW: 260, maxW: 1000, minH: 100, maxH: 430
      });
      if (ad) {
        ad.setAttribute(HOME_CARD_ATTR, 'promotion');
        hide(ad);
      }
    }

    // 邮箱 AI 助理与工具助理都是首页推广区，隐藏整张卡片。
    const ai = findWelcomeCardByPattern(
      main,
      /我是邮箱AI助理|邮件读写总结.*我都可以帮您/,
      { minW: 260, maxW: 1000, minH: 90, maxH: 420 }
    );
    if (ai) {
      ai.setAttribute(HOME_CARD_ATTR, 'ai');
      hide(ai);
    }

    const tool = findWelcomeCardByPattern(
      main,
      /我是工具助理|帮您搞定工作汇报PPT/,
      { minW: 260, maxW: 1000, minH: 90, maxH: 420 }
    );
    if (tool) {
      tool.setAttribute(HOME_CARD_ATTR, 'tool');
      hide(tool);
    }

    // 广告文案会轮换；页面上若存在明确“广告”角标，向上找最小横幅卡片并隐藏。
    for (const badge of main.querySelectorAll('span,div,a')) {
      if (tidy(badge.textContent) !== '广告' || !visibleBox(badge)) continue;
      let cur = badge;
      let candidate = null;
      for (let i = 0; i < 7 && cur && cur !== main; i++, cur = cur.parentElement) {
        const r = cur.getBoundingClientRect();
        if (r.width >= 420 && r.width <= 1050 &&
            r.height >= 120 && r.height <= 360) {
          candidate = cur;
        }
      }
      if (candidate) {
        candidate.setAttribute(HOME_CARD_ATTR, 'promotion');
        hide(candidate);
      }
    }

    ensureHomeDashboard(main);
  }

  // ========== 写信页联系人防闪烁 ==========
  // 网易写信模块挂载时，联系人面板可能先短暂可见，再根据用户设置自动收起。
  // 仅在进入写信的短暂窗口内用 visibility / opacity 隐藏它；
  // 不修改 display / width / right / position，因此不影响原生展开/收起。
  let composeEnteringTimer = 0;
  let composeEntering = false;

  function findComposeContactPanel() {
    const inputs = [...document.querySelectorAll('input')].filter(el =>
      /查找联系人/.test(el.getAttribute('placeholder') || '')
    );

    for (const input of inputs) {
      let best = null;
      let cur = input;
      for (let i = 0; i < 10 && cur && cur !== document.body; i++, cur = cur.parentElement) {
        const r = cur.getBoundingClientRect();
        if (r.width >= 145 && r.width <= 360 && r.height >= 240 &&
            r.right >= window.innerWidth - 24) {
          best = cur;
        }
      }
      if (best) return best;
    }
    return null;
  }

  function guardComposeContactPanel() {
    if (!composeEntering) return;
    const panel = findComposeContactPanel();
    if (panel) panel.setAttribute(CONTACT_GUARD, '1');
  }

  function finishComposeEntering() {
    composeEntering = false;
    document.documentElement.removeAttribute(ENTER_ATTR);

    document.querySelectorAll(`[${CONTACT_GUARD}="1"]`).forEach(el => {
      el.removeAttribute(CONTACT_GUARD);
    });

    if (inCompose()) {
      document.documentElement.setAttribute(ATTR, 'compose');
      markComposeRegions();
    }
  }

  function beginComposeEntering() {
    composeEntering = true;
    ensureCss();
    document.documentElement.setAttribute(ATTR, 'compose');
    document.documentElement.setAttribute(ENTER_ATTR, '1');

    guardComposeContactPanel();

    clearTimeout(composeEnteringTimer);
    // 等网易恢复联系人“显示/隐藏”偏好后再解除保护。
    composeEnteringTimer = setTimeout(finishComposeEntering, 650);
  }

  // 写信页只做“视觉标记”，不修改联系人面板的 width/left/right/display，
  // 因此不会破坏网易原生的展开/收起逻辑。
  function markComposeRegions() {
    document.querySelectorAll(
      '[data-am6-compose-root],[data-am6-compose-contacts],[data-am6-compose-field],' +
      '[data-am6-compose-editor],[data-am6-compose-action],[data-am6-compose-primary]'
    ).forEach(el => {
      el.removeAttribute('data-am6-compose-root');
      el.removeAttribute('data-am6-compose-contacts');
      el.removeAttribute('data-am6-compose-field');
      el.removeAttribute('data-am6-compose-editor');
      el.removeAttribute('data-am6-compose-action');
      el.removeAttribute('data-am6-compose-primary');
    });

    // 1) Compose 主模块。
    const moduleCandidates = [...document.querySelectorAll(
      '[id*="compose.ComposeModule"], [id*="ComposeModule"]'
    )].filter(el => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' &&
             r.width > window.innerWidth * .45 && r.height > 300;
    });
    const composeRoot = moduleCandidates.sort(
      (a, b) => b.getBoundingClientRect().width - a.getBoundingClientRect().width
    )[0] || null;
    if (composeRoot) composeRoot.setAttribute('data-am6-compose-root', '1');

    // 2) 右侧联系人。只加视觉标记，不碰尺寸/位置/显示状态。
    const contactInput = [...document.querySelectorAll('input')].find(el =>
      /查找联系人/.test(el.getAttribute('placeholder') || '') &&
      getComputedStyle(el).display !== 'none'
    );
    if (contactInput) {
      let best = null;
      let cur = contactInput;
      for (let i = 0; i < 9 && cur && cur !== document.body; i++, cur = cur.parentElement) {
        const r = cur.getBoundingClientRect();
        if (r.width >= 145 && r.width <= 360 && r.height >= 280 &&
            r.right >= window.innerWidth - 12) {
          best = cur;
        }
      }
      if (best) best.setAttribute('data-am6-compose-contacts', '1');
    }

    // 3) 收件人 / 主题两行。
    const labels = new Set(['收件人：', '收件人:', '主题：', '主题:']);
    for (const el of document.querySelectorAll('label,span,div,p')) {
      const t = (el.textContent || '').replace(/\s+/g, '').trim();
      if (!labels.has(t)) continue;
      let cur = el;
      for (let i = 0; i < 6 && cur && cur !== document.body; i++, cur = cur.parentElement) {
        const r = cur.getBoundingClientRect();
        if (r.width > 600 && r.height >= 30 && r.height <= 72) {
          cur.setAttribute('data-am6-compose-field', '1');
          break;
        }
      }
    }

    // 4) 编辑器外框。优先找大尺寸 iframe/contenteditable，只修饰外框。
    const editorNode = [...document.querySelectorAll('iframe,[contenteditable="true"]')].find(el => {
      const r = el.getBoundingClientRect();
      return r.width > 600 && r.height > 220 && r.top > 150;
    });
    if (editorNode) {
      let best = editorNode;
      let cur = editorNode.parentElement;
      for (let i = 0; i < 5 && cur && cur !== document.body; i++, cur = cur.parentElement) {
        const r = cur.getBoundingClientRect();
        if (r.width > 700 && r.height > 280 && r.width < window.innerWidth - 40) best = cur;
      }
      best.setAttribute('data-am6-compose-editor', '1');
    }

    // 5) 写信页操作按钮。只标记按钮本身，不改变任何事件。
    const actions = new Set(['发送', '预览', '存草稿', '取消']);
    for (const el of document.querySelectorAll('button,[role="button"],.nui-btn,a')) {
      const t = (el.textContent || '').replace(/\s+/g, '').trim();
      if (!actions.has(t)) continue;
      const r = el.getBoundingClientRect();
      if (r.top < 70 || r.top > window.innerHeight - 40 || r.width > 180 || r.height > 60) continue;
      el.setAttribute('data-am6-compose-action', '1');
      if (t === '发送') el.setAttribute('data-am6-compose-primary', '1');
    }
  }

  // 仅找“宽而矮、偏黄色”的系统提醒；不会隐藏内容、关闭按钮或通知逻辑。
  function softenNotice() {
    if (!OPT.softenNewMailNotice) return;
    const main = document.querySelector('.frame-main[role="main"]');
    if (!main) return;
    const candidates = main.querySelectorAll('div');
    for (const el of candidates) {
      const r = el.getBoundingClientRect();
      if (r.top < 105 || r.top > 265 || r.width < window.innerWidth * .52 || r.height < 24 || r.height > 60) continue;
      const rgb = getComputedStyle(el).backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!rgb) continue;
      const [red, green, blue] = rgb.slice(1).map(Number);
      if (red >= 235 && green >= 220 && blue < 230 && red - blue >= 12) {
        el.setAttribute('data-am6-notice', '1');
        return;
      }
    }
  }

  // ===== 仅依赖你确认过的 class/id，避免推测网易内部邮件行的状态类 =====
  const CSS = String.raw`
${ROOT} {
  --am6-blue: #007aff;
  --am6-ink: #283242;
  --am6-secondary: #78869a;
  --am6-divider: #e7ebf2;
  --am6-sidebar: #ebf0f7;
  --am6-bg: #f7f9fc;
  --am6-row-hover: #eaf3ff;
  color-scheme: light;
}
${ROOT} body.frame-default {
  background: var(--am6-bg) !important;
  color: var(--am6-ink) !important;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased;
}
${ROOT} [${HIDDEN}="1"] { display: none !important; }

/* 确切定位“其他工具”，不会隐藏用户的邮件文件夹。 */
${OPT.hideOtherTools ? `${ROOT} #dvNavFoot { display: none !important; visibility: hidden !important; }` : ''}

/* 顶部：清爽的浅银灰，与邮件区域形成层次 */
${ROOT} header.frame-head {
  background: #f3f5f9 !important;
  background-image: none !important;
  border-bottom: 1px solid #e3e8f0 !important;
  box-shadow: 0 2px 9px rgba(40, 60, 90, .045) !important;
}
${ROOT} #dvMultiTabWrapper,
${ROOT} #dvMultiTabWrapper .nui-tabs { background: transparent !important; background-image: none !important; }
${ROOT} #dvMultiTabWrapper .nui-tabs-item {
  background: transparent !important;
  background-image: none !important;
  border: 1px solid transparent !important;
  border-bottom: 0 !important;
  border-radius: 10px 10px 0 0 !important;
  box-shadow: none !important;
  transition: background-color .16s ease, color .16s ease !important;
}
${ROOT} #dvMultiTabWrapper .nui-tabs-item:hover {
  background: #e5edf7 !important;
}
${ROOT} #dvMultiTabWrapper .nui-tabs-item-selected {
  background: white !important;
  border-color: #e3e8f0 !important;
  box-shadow: 0 -1px 5px rgba(50, 66, 90, .04) !important;
}
${ROOT} #dvMultiTabWrapper .nui-tabs-item-text { color: #6d7b90 !important; font-weight: 500 !important; }
${ROOT} #dvMultiTabWrapper .nui-tabs-item-selected .nui-tabs-item-text { color: #006ee6 !important; font-weight: 650 !important; }
${ROOT} header.frame-head input[type="text"],
${ROOT} header.frame-head input[type="search"] {
  border-radius: 18px !important;
  background-color: #f8fafc !important;
  border-color: #e2e7ef !important;
}

/* 左侧导航：Apple Mail 常见的灰蓝侧栏、低对比度分组 */
${ROOT} #dvNavContainer.frame-nav,
${ROOT} #dvNavContainer #dvNavTop,
${ROOT} #dvNavContainer #dvNavTop > ul {
  background: var(--am6-sidebar) !important;
  background-image: none !important;
}
${ROOT} #dvNavContainer.frame-nav {
  border-right: 1px solid #dce4ef !important;
  box-shadow: inset -1px 0 rgba(255,255,255,.6) !important;
}
/* 网页存档确认：原生 frame-nav=201px，frame-main left=201px。
   v0.6 同步改宽，不只拉伸侧栏，避免主内容被覆盖。 */
${ROOT} #dvNavContainer.frame-nav { width: ${OPT.sidebarWidth}px !important; }
${ROOT} body.frame-default .frame-main:not(.frame-main-noNav) { left: ${OPT.sidebarWidth}px !important; }
${ROOT} body.frame-float .frame-main:not(.frame-main-noNav) { margin-left: ${OPT.sidebarWidth}px !important; }
${ROOT} .frame-tips:not(.frame-tips-center) { left: ${OPT.sidebarWidth}px !important; }
${ROOT} .frame-main-sptln-tb { left: ${OPT.sidebarWidth}px !important; }
${ROOT} #dvNavTop li[role="button"] {
  border-radius: 8px !important;
  transition: background-color .15s ease, color .15s ease !important;
}
${ROOT} #dvNavTop li[role="button"]:hover {
  background-color: rgba(255,255,255,.62) !important;
}
${ROOT} #dvNavTop li[role="button"]:is([aria-current="page"],[aria-selected="true"]),
${ROOT} #dvNavTop li[role="button"]:has(> [aria-selected="true"]) {
  background-color: #dceaff !important;
  color: #0868c9 !important;
  font-weight: 600 !important;
}
${ROOT} #dvNavContainer :is(a, .nui-tree-item-label) {
  color: #445268 !important;
}

/* 网页存档确认：文件夹使用 #dvNavTree .nui-tree-item-label(-selected)。
   上一版主要修饰了 #dvNavTop，未覆盖文件夹的真实选中态。 */
${ROOT} #dvNavTree .nui-tree-item-label {
  border-radius: 8px !important;
  transition: background-color .14s ease, color .14s ease !important;
}
${ROOT} #dvNavTree .nui-tree-item-label:hover {
  background-color: rgba(255, 255, 255, .75) !important;
}
${ROOT} #dvNavTree .nui-tree-item-label-selected,
${ROOT} #dvNavTree .nui-tree-item-label-selected:hover {
  background-color: #dceaff !important;
  color: #1263ba !important;
  font-weight: 600 !important;
}
${ROOT} #dvNavTree .nui-tree-item-label-selected .nui-tree-item-text {
  color: #1263ba !important;
}

/* 中间操作栏：确定存在的 .nui-toolbar / .nui-roundBtn */
${ROOT} header.frame-main-cont-head,
${ROOT} header.frame-main-cont-head .nui-toolbar,
${ROOT} header.frame-main-cont-head .nui-toolbar-ext {
  background: white !important;
  background-image: none !important;
  border-color: #e9edf3 !important;
}
${ROOT} header.frame-main-cont-head {
  box-shadow: 0 1px 3px rgba(40, 60, 90, .035) !important;
  border-bottom: 1px solid #e8edf4 !important;
}
${ROOT} header.frame-main-cont-head .nui-toolbar > .nui-toolbar-item > .nui-btn {
  border: 1px solid #e8edf4 !important;
  background: #f7f9fc !important;
  background-image: none !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  color: #4b5c72 !important;
  transition: background-color .14s ease, border-color .14s ease !important;
}
${ROOT} header.frame-main-cont-head .nui-toolbar > .nui-toolbar-item > .nui-btn:hover {
  background: #eaf3ff !important;
  border-color: #aecdf3 !important;
}
${ROOT} header.frame-main-cont-head .nui-btn-text {
  font-weight: 500 !important;
}

/* 右侧翻页区域：真实 DOM 为 .nui-toolbar-ext，不套用左侧普通按钮的方角外框。
   原生 .nui-roundBtn 与子元素 .nui-btn-text 都可能绘制边框/背景，
   只保留外层一层外框，修复截图中的“双层边框”。 */
${ROOT} header.frame-main-cont-head .nui-toolbar-ext > .nui-toolbar-item {
  margin-left: 9px !important;
  margin-right: 0 !important;
}
${ROOT} header.frame-main-cont-head .nui-toolbar-ext .nui-roundBtn {
  border: 1px solid #dce4ee !important;
  border-radius: 14px !important;
  background: #f8fafc !important;
  background-image: none !important;
  box-shadow: none !important;
  margin-right: 0 !important;
}
${ROOT} header.frame-main-cont-head .nui-toolbar-ext .nui-roundBtn .nui-btn-text {
  border: 0 !important;
  border-radius: 13px !important;
  background: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
}
${ROOT} header.frame-main-cont-head .nui-toolbar-ext .nui-roundBtn:hover:not(.nui-btn-disabled) {
  background: #eaf2ff !important;
  border-color: #b6cdee !important;
}
${ROOT} header.frame-main-cont-head .nui-toolbar-ext .nui-roundBtn.nui-btn-disabled {
  opacity: .48 !important;
}
/* 同组“上一页/下一页”保持各自点击热区，不压叠边框。 */
${ROOT} header.frame-main-cont-head .nui-toolbar-ext > .nui-toolbar-item > .nui-roundBtn + .nui-roundBtn {
  margin-left: 4px !important;
}
${ROOT} header.frame-main-cont-head .nui-toolbar-ext .nui-simpleSelect {
  border-radius: 9px !important;
  background-image: none !important;
}

/* 邮件区域：使用实际确认的邮件列表容器和单行元素 */
${ROOT} #dvContentContainer.frame-main-outer,
${ROOT} #dvContentContainer .frame-main[role="main"],
${ROOT} #dvContentContainer .frame-main-cont-body {
  background: #fff !important;
  background-image: none !important;
}
${ROOT} #dvContentContainer .frame-main-cont-body .tc0 {
  background: #fff !important;
}
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"] {
  background-color: #fff !important;
  background-image: none !important;
  box-shadow: inset 0 -1px 0 var(--am6-divider) !important;
  border-radius: 0 !important; /* 邮件列表仍保持连续行，非卡片逐封浮起 */
  transition: background-color .13s ease !important;
}
/* 163 一封邮件由 nl0 / hV0 / im0 多个覆盖层组成。
   三层统一透明，修复选中后右侧出现浅色竖线/白块。 */
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"] > .nl0,
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"] .hV0,
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"] .im0 {
  background-color: transparent !important;
  background-image: none !important;
}
/* 层次清晰的发件人和日期，不改行高以避免虚拟滚动错位。 */
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"] .dP0,
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"] .il0 {
  color: #27364a;
}
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"] .hV0 {
  color: #8390a2;
}
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"]:hover {
  background-color: var(--am6-row-hover) !important;
  box-shadow: inset 3px 0 0 #91bbfa, inset 0 -1px 0 #d8e8fb !important;
}
/* 网页存档真实状态：ij0 为原生选中态，kw0 为未读粗体态，gv0 为原生浅黄状态。 */
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0.ij0[role="link"],
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"]:is([aria-selected="true"], [aria-current="true"]),
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"]:has([role="checkbox"][aria-checked="true"]) {
  background-color: #deecff !important;
  box-shadow: inset 3px 0 0 var(--am6-blue), inset 0 -1px 0 #d2e3fc !important;
}
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0.gv0[role="link"] {
  background-color: #fff9ea !important;
}
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0.kw0[role="link"] .ci0,
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0.kw0[role="link"] .da0 {
  font-weight: 650 !important;
  color: #1f2f43 !important;
}
/* 昨日 / 更早等分组：保留原高度，仅降低“网页表格感”。 */
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .tb0[aria-label] {
  background: #fafbfd !important;
  background-image: none !important;
  border-bottom-color: #e6ebf2 !important;
  color: #7a8798 !important;
}
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .tb0[aria-label] .jM0 {
  color: #667589 !important;
  font-weight: 600 !important;
}
/* 点击/键盘聚焦邮件时不再绘制整行蓝色矩形框。
   选中状态已经由浅蓝背景 + 左侧 3px 系统蓝提示，因此无需重复 outline。 */
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"]:focus,
${ROOT} #dvContentContainer .frame-main-cont-body .tv0 > .rF0[role="link"]:focus-visible {
  outline: none !important;
  border-color: transparent !important;
}

/* 新邮件提醒保留通知本身，只弱化颜色 */
${ROOT} [data-am6-notice="1"] {
  background: #f3f7fc !important;
  background-image: none !important;
  border: 1px solid #e4edf9 !important;
  border-left: 3px solid #99c1f5 !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  color: #667790 !important;
}
${ROOT} ::-webkit-scrollbar { width: 8px; height: 8px; }
${ROOT} ::-webkit-scrollbar-track { background: transparent; }
${ROOT} ::-webkit-scrollbar-thumb {
  background: #b9c5d5; border-radius: 16px;
  border: 2px solid transparent; background-clip: padding-box;
}

/* ==================== 首页：Apple Minimal Dashboard ====================
   首页继续复用 list 模式的顶栏与左侧栏，只精简 WelcomeModule 中央内容。 */
${WROOT} body.frame-default,
${WROOT} #dvContentContainer.frame-main-outer,
${WROOT} #dvContentContainer .frame-main[role="main"],
${WROOT} #dvContentContainer .frame-main-cont-body,
${WROOT} [data-am6-home-main="1"] {
  background: #f6f8fb !important;
  background-image: none !important;
}

${WROOT} [data-am6-home-main="1"] {
  color: #27364a !important;
}

/* 顶部概览区更宽，减少 v0.8 中央区域“只有两张小卡”的空旷感。 */
${WROOT} [${HOME_SUMMARY_ATTR}="1"] {
  width: min(860px, calc(100% - 72px)) !important;
  max-width: 860px !important;
  margin-left: auto !important;
  margin-right: auto !important;
  display: grid !important;
  grid-template-columns: minmax(0, 1.55fr) minmax(240px, .9fr) !important;
  gap: 16px !important;
  align-items: stretch !important;
}

${WROOT} [${HOME_SUMMARY_ATTR}="1"] > [${HOME_CARD_ATTR}="account"],
${WROOT} [${HOME_SUMMARY_ATTR}="1"] > [${HOME_CARD_ATTR}="storage"] {
  width: auto !important;
  min-width: 0 !important;
  max-width: none !important;
}

/* 首页新增的轻量快捷区，替代被移除的广告/AI 卡片所占空间。 */
${WROOT} [${HOME_DASHBOARD_ATTR}="1"] {
  position: absolute !important;
  z-index: 2 !important;
  top: 305px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  width: min(860px, calc(100% - 72px)) !important;
  box-sizing: border-box !important;
  padding: 18px !important;
  background: rgba(255,255,255,.94) !important;
  border: 1px solid #e5eaf1 !important;
  border-radius: 16px !important;
  box-shadow:
    0 1px 2px rgba(31,45,61,.025),
    0 8px 28px rgba(45,61,82,.05) !important;
}

${WROOT} [${HOME_DASHBOARD_ATTR}="1"] .am8-home-dash-head {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  margin-bottom: 14px !important;
}

${WROOT} [${HOME_DASHBOARD_ATTR}="1"] .am8-home-dash-title {
  font-size: 14px !important;
  line-height: 20px !important;
  font-weight: 650 !important;
  color: #27364a !important;
}

${WROOT} [${HOME_DASHBOARD_ATTR}="1"] .am8-home-dash-subtitle {
  margin-top: 2px !important;
  font-size: 11px !important;
  color: #8a96a7 !important;
}

${WROOT} [${HOME_DASHBOARD_ATTR}="1"] .am8-home-actions {
  display: grid !important;
  grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
  gap: 10px !important;
}

${WROOT} [${HOME_DASHBOARD_ATTR}="1"] button {
  min-width: 0 !important;
  height: 66px !important;
  padding: 10px 12px !important;
  border: 1px solid #e6ebf2 !important;
  border-radius: 12px !important;
  background: #fafbfd !important;
  color: #33445a !important;
  display: flex !important;
  align-items: center !important;
  gap: 10px !important;
  text-align: left !important;
  cursor: pointer !important;
  box-shadow: none !important;
  transition: background-color .14s ease, border-color .14s ease,
              transform .14s ease !important;
}

${WROOT} [${HOME_DASHBOARD_ATTR}="1"] button:hover {
  background: #eef5fe !important;
  border-color: #bfd5f2 !important;
  transform: translateY(-1px) !important;
}

${WROOT} [${HOME_DASHBOARD_ATTR}="1"] .am8-action-icon {
  flex: 0 0 30px !important;
  width: 30px !important;
  height: 30px !important;
  border-radius: 9px !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: #e8f2ff !important;
  color: #0874e8 !important;
  font-size: 17px !important;
  font-weight: 600 !important;
}

${WROOT} [${HOME_DASHBOARD_ATTR}="1"] button span:last-child {
  min-width: 0 !important;
  display: flex !important;
  flex-direction: column !important;
}

${WROOT} [${HOME_DASHBOARD_ATTR}="1"] b {
  font-size: 12px !important;
  line-height: 18px !important;
  font-weight: 600 !important;
  color: #314158 !important;
}

${WROOT} [${HOME_DASHBOARD_ATTR}="1"] small {
  margin-top: 1px !important;
  font-size: 10px !important;
  line-height: 15px !important;
  color: #8995a6 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

@media (max-width: 1100px) {
  ${WROOT} [${HOME_SUMMARY_ATTR}="1"],
  ${WROOT} [${HOME_DASHBOARD_ATTR}="1"] {
    width: calc(100% - 36px) !important;
  }
  ${WROOT} [${HOME_DASHBOARD_ATTR}="1"] .am8-home-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }
  ${WROOT} [${HOME_DASHBOARD_ATTR}="1"] {
    top: 300px !important;
  }
}

/* 首页保留的“账户概览 / 容量概览”卡片。 */
${WROOT} [${HOME_CARD_ATTR}="account"],
${WROOT} [${HOME_CARD_ATTR}="storage"] {
  background: rgba(255,255,255,.94) !important;
  background-image: none !important;
  border: 1px solid #e5eaf1 !important;
  border-radius: 16px !important;
  box-shadow:
    0 1px 2px rgba(31,45,61,.025),
    0 8px 28px rgba(45,61,82,.055) !important;
}

/* 卡片内部：弱化旧网页按钮 / 分隔线，不动真实功能布局。 */
${WROOT} [${HOME_CARD_ATTR}="account"] a,
${WROOT} [${HOME_CARD_ATTR}="account"] [role="button"],
${WROOT} [${HOME_CARD_ATTR}="storage"] a,
${WROOT} [${HOME_CARD_ATTR}="storage"] [role="button"] {
  border-radius: 8px !important;
}

${WROOT} [${HOME_CARD_ATTR}="account"] :is(.nui-btn,[role="button"]):hover,
${WROOT} [${HOME_CARD_ATTR}="storage"] :is(.nui-btn,[role="button"]):hover {
  background-color: #eef5fe !important;
}

${WROOT} [${HOME_CARD_ATTR}="account"] hr,
${WROOT} [${HOME_CARD_ATTR}="storage"] hr {
  border-color: #e8edf4 !important;
}

/* 容量进度条颜色更接近 macOS 系统蓝。 */
${WROOT} [${HOME_CARD_ATTR}="storage"] [class*="progress"] *,
${WROOT} [${HOME_CARD_ATTR}="storage"] [class*="Progress"] * {
  border-radius: 999px !important;
}

/* 明确识别的首页推广区永不占布局空间。 */
${WROOT} [${HOME_CARD_ATTR}="promotion"],
${WROOT} [${HOME_CARD_ATTR}="ai"],
${WROOT} [${HOME_CARD_ATTR}="tool"] {
  display: none !important;
}

/* 首页滚动区域更克制。 */
${WROOT} ::-webkit-scrollbar { width: 8px; height: 8px; }
${WROOT} ::-webkit-scrollbar-track { background: transparent; }
${WROOT} ::-webkit-scrollbar-thumb {
  background: #bac6d5;
  border-radius: 16px;
  border: 2px solid transparent;
  background-clip: padding-box;
}

/* ==================== 写信页：独立 Compose 主题 ====================
   不修改联系人侧栏的 width / right / display / position，
   只统一背景、边框、圆角和按钮语言，保证原生收起功能不受影响。 */
${CROOT} {
  --am6-blue: #007aff;
  --am6-ink: #283242;
  --am6-secondary: #78869a;
  --am6-divider: #e4e9f1;
  --am6-bg: #f5f7fb;
  color-scheme: light;
}
${CROOT} body.frame-default {
  background: var(--am6-bg) !important;
  color: var(--am6-ink) !important;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI',
               'PingFang SC', 'Microsoft YaHei', Arial, sans-serif !important;
  -webkit-font-smoothing: antialiased;
}
${CROOT} [${HIDDEN}="1"] { display: none !important; }

/* 和收件箱保持同一套顶栏。 */
${CROOT} header.frame-head {
  background: #f3f5f9 !important;
  background-image: none !important;
  border-bottom: 1px solid #e3e8f0 !important;
  box-shadow: 0 2px 9px rgba(40,60,90,.045) !important;
}
${CROOT} #dvMultiTabWrapper,
${CROOT} #dvMultiTabWrapper .nui-tabs {
  background: transparent !important;
  background-image: none !important;
}
${CROOT} #dvMultiTabWrapper .nui-tabs-item {
  background: transparent !important;
  background-image: none !important;
  border: 1px solid transparent !important;
  border-bottom: 0 !important;
  border-radius: 10px 10px 0 0 !important;
  box-shadow: none !important;
}
${CROOT} #dvMultiTabWrapper .nui-tabs-item:hover {
  background: #e5edf7 !important;
}
${CROOT} #dvMultiTabWrapper .nui-tabs-item-selected {
  background: #fff !important;
  border-color: #e3e8f0 !important;
  box-shadow: 0 -1px 5px rgba(50,66,90,.04) !important;
}
${CROOT} #dvMultiTabWrapper .nui-tabs-item-text {
  color: #6d7b90 !important;
  font-weight: 500 !important;
}
${CROOT} #dvMultiTabWrapper .nui-tabs-item-selected .nui-tabs-item-text {
  color: #006ee6 !important;
  font-weight: 650 !important;
}
${CROOT} header.frame-head input[type="text"],
${CROOT} header.frame-head input[type="search"] {
  border-radius: 18px !important;
  background: #f8fafc !important;
  border-color: #e2e7ef !important;
}

/* 写信主区域：不改变网易自己的几何布局，只统一底色。 */
${CROOT} [data-am6-compose-root="1"] {
  background: var(--am6-bg) !important;
  background-image: none !important;
}

/* 收件人 / 主题：Apple Mail 式白色输入行。 */
${CROOT} [data-am6-compose-field="1"] {
  background: #fff !important;
  background-image: none !important;
  border-bottom: 1px solid var(--am6-divider) !important;
  box-shadow: none !important;
}
${CROOT} [data-am6-compose-field="1"] input,
${CROOT} [data-am6-compose-field="1"] textarea {
  background: transparent !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: #26364b !important;
}
${CROOT} [data-am6-compose-field="1"]:focus-within {
  border-bottom-color: #9fc5f7 !important;
  box-shadow: inset 0 -1px 0 #9fc5f7 !important;
}

/* 写信操作按钮。 */
${CROOT} [data-am6-compose-action="1"] {
  border: 1px solid #dce4ee !important;
  background: #f8fafc !important;
  background-image: none !important;
  border-radius: 8px !important;
  box-shadow: none !important;
  color: #46566c !important;
  transition: background-color .14s ease, border-color .14s ease !important;
}
${CROOT} [data-am6-compose-action="1"]:hover {
  background: #edf4fd !important;
  border-color: #b8d0ee !important;
}
${CROOT} [data-am6-compose-primary="1"] {
  background: var(--am6-blue) !important;
  border-color: var(--am6-blue) !important;
  color: #fff !important;
}
${CROOT} [data-am6-compose-primary="1"] * {
  color: #fff !important;
}
${CROOT} [data-am6-compose-primary="1"]:hover {
  background: #0875df !important;
  border-color: #0875df !important;
}

/* 编辑器：白色纸张感，但不改变高度/宽度。 */
${CROOT} [data-am6-compose-editor="1"] {
  background: #fff !important;
  background-image: none !important;
  border: 1px solid #e1e7ef !important;
  border-radius: 10px !important;
  box-shadow: 0 1px 3px rgba(34,54,78,.035) !important;
}
${CROOT} [data-am6-compose-editor="1"] iframe,
${CROOT} [data-am6-compose-editor="1"] [contenteditable="true"] {
  background: #fff !important;
}

/* 编辑器工具栏：弱化原网页的密集方框感。
   不设 position/width/height，避免干扰下拉菜单和编辑器布局。 */
${CROOT} [data-am6-compose-root="1"] [role="toolbar"] {
  background: #fafbfd !important;
  background-image: none !important;
  border-color: #e5eaf1 !important;
  box-shadow: none !important;
}
${CROOT} [data-am6-compose-root="1"] [role="toolbar"] .nui-btn {
  background: transparent !important;
  background-image: none !important;
  border-color: transparent !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}
${CROOT} [data-am6-compose-root="1"] [role="toolbar"] .nui-btn:hover {
  background: #eaf2fd !important;
  border-color: #d9e6f6 !important;
}

/* 进入写信页的短暂阶段：防止联系人面板“先出现、再自动收起”的闪烁。 */
html[${ENTER_ATTR}="1"] [${CONTACT_GUARD}="1"] {
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* 右侧联系人：只美化，不改展开/收起机制。 */
${CROOT} [data-am6-compose-contacts="1"] {
  background: #f8fafc !important;
  background-image: none !important;
  border-left: 1px solid #e1e7ef !important;
  box-shadow: -4px 0 18px rgba(45,65,90,.035) !important;
}
${CROOT} [data-am6-compose-contacts="1"] input {
  background: #fff !important;
  border: 1px solid #e0e6ef !important;
  border-radius: 9px !important;
  box-shadow: none !important;
}
${CROOT} [data-am6-compose-contacts="1"] input:focus {
  border-color: #9fc4f4 !important;
  box-shadow: 0 0 0 2px rgba(0,122,255,.08) !important;
  outline: none !important;
}
${CROOT} [data-am6-compose-contacts="1"] a,
${CROOT} [data-am6-compose-contacts="1"] [role="button"] {
  border-radius: 6px !important;
}

/* 写信页滚动条与列表页一致。 */
${CROOT} ::-webkit-scrollbar { width: 8px; height: 8px; }
${CROOT} ::-webkit-scrollbar-track { background: transparent; }
${CROOT} ::-webkit-scrollbar-thumb {
  background: #b9c5d5; border-radius: 16px;
  border: 2px solid transparent; background-clip: padding-box;
}

@media (prefers-reduced-motion: reduce) {
  ${ROOT} *, ${ROOT} *::before, ${ROOT} *::after,
  ${CROOT} *, ${CROOT} *::before, ${CROOT} *::after { transition-duration: 0ms !important; }
}
`;

  function ensureCss() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  function refresh() {
    ensureCss();
    document.documentElement.style.setProperty('--am6-blue', OPT.accent);

    if (inCompose()) {
      document.documentElement.removeAttribute(PAGE_ATTR);
      document.documentElement.setAttribute(ATTR, 'compose');
      cleanupEntries();
      if (composeEntering) guardComposeContactPanel();
      else markComposeRegions();
      return;
    }

    if (inWelcome()) {
      // 首页复用 list 的整体框架（顶部 + 左侧栏），只给中央 WelcomeModule 加专用样式。
      document.documentElement.setAttribute(ATTR, 'list');
      document.documentElement.setAttribute(PAGE_ATTR, 'welcome');
      cleanupEntries();
      markWelcomeRegions();
      return;
    }

    if (inMailbox()) {
      composeEntering = false;
      clearTimeout(composeEnteringTimer);
      document.documentElement.removeAttribute(ENTER_ATTR);
      document.querySelectorAll(`[${CONTACT_GUARD}="1"]`).forEach(el => {
        el.removeAttribute(CONTACT_GUARD);
      });

      document.documentElement.removeAttribute(PAGE_ATTR);
      document.documentElement.setAttribute(ATTR, 'list');
      cleanupEntries();
      softenNotice();
      return;
    }

    document.documentElement.removeAttribute(ATTR);
    document.documentElement.removeAttribute(PAGE_ATTR);
    document.documentElement.removeAttribute(ENTER_ATTR);
  }

  // 异步切页时重新处理入口；不监听样式或 data 属性，避免无限循环。
  let pending = false;
  function scheduleRefresh() {
    if (pending) return;
    pending = true;
    setTimeout(() => { pending = false; refresh(); }, 300);
  }
  // 控制台自检：只返回样式状态、元素数量；不会读取邮件正文或邮件地址。
  window.__appleMailThemeCheck = () => {
    const foot = document.getElementById('dvNavFoot');
    return {
      version: '0.8.1',
      active: Boolean(document.documentElement.getAttribute(ATTR)),
      mode: document.documentElement.getAttribute(ATTR) || 'off',
      welcomePage: inWelcome(),
      homeAccountCard: document.querySelectorAll(`[${HOME_CARD_ATTR}="account"]`).length,
      homeStorageCard: document.querySelectorAll(`[${HOME_CARD_ATTR}="storage"]`).length,
      homeHiddenCards: document.querySelectorAll(
        `[${HOME_CARD_ATTR}="promotion"],[${HOME_CARD_ATTR}="ai"],[${HOME_CARD_ATTR}="tool"]`
      ).length,
      homeDashboard: document.querySelectorAll(`[${HOME_DASHBOARD_ATTR}="1"]`).length,
      homeSummary: document.querySelectorAll(`[${HOME_SUMMARY_ATTR}="1"]`).length,
      composePage: inCompose(),
      composeEntering,
      contactGuardCount: document.querySelectorAll(`[${CONTACT_GUARD}="1"]`).length,
      styleInstalled: Boolean(document.getElementById(STYLE_ID)),
      otherToolsHidden: foot ? getComputedStyle(foot).display === 'none' : 'not-mounted',
      folderSelectionCount: document.querySelectorAll('#dvNavTree .nui-tree-item-label-selected').length,
      mailRowCount: document.querySelectorAll('.frame-main-cont-body .tv0 > .rF0[role="link"]').length,
      paginationButtonCount: document.querySelectorAll('.nui-toolbar-ext .nui-roundBtn').length,
      composeContactPanel: document.querySelectorAll('[data-am6-compose-contacts="1"]').length,
      composeEditor: document.querySelectorAll('[data-am6-compose-editor="1"]').length,
      sidebarWidth: Math.round(document.querySelector('#dvNavContainer')?.getBoundingClientRect().width || 0)
    };
  };
  // 在网易自己的 click handler 执行前进入过渡保护。
  document.addEventListener('click', (ev) => {
    const target = ev.target && ev.target.closest
      ? ev.target.closest('a,button,[role="button"],li,div')
      : null;
    if (!target) return;

    const label = tidy(target.textContent);
    if (label === '写信') beginComposeEntering();
  }, true);

  // SPA 路由也可能由内部 history API 触发，而不是点击“写信”。
  const _pushState = history.pushState;
  const _replaceState = history.replaceState;

  function afterRouteChange() {
    queueMicrotask(() => {
      if (inCompose() && !composeEntering) beginComposeEntering();
      scheduleRefresh();
    });
  }

  history.pushState = function(...args) {
    const result = _pushState.apply(this, args);
    afterRouteChange();
    return result;
  };

  history.replaceState = function(...args) {
    const result = _replaceState.apply(this, args);
    afterRouteChange();
    return result;
  };

  window.addEventListener('popstate', afterRouteChange);
  window.addEventListener('hashchange', afterRouteChange);

  const observer = new MutationObserver(() => {
    // MutationObserver 通常会在下一次绘制前运行。
    if (composeEntering) guardComposeContactPanel();

    // 首页广告 / AI 卡片异步挂载时立即再次识别，降低短暂闪现。
    if (inWelcome()) {
      document.documentElement.setAttribute(ATTR, 'list');
      document.documentElement.setAttribute(PAGE_ATTR, 'welcome');
      markWelcomeRegions();
    }

    scheduleRefresh();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  if (inCompose()) beginComposeEntering();
  refresh();
  setTimeout(refresh, 900);
  setTimeout(refresh, 2200);
})();
