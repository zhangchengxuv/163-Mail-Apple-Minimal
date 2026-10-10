import { describe, expect, it } from 'vitest';
import { applyCleaner } from '../../src/content/cleaner';
import { DEFAULT_SETTINGS, HIDDEN_ATTRIBUTE } from '../../src/shared/constants';

const welcomeFixture = `
  <main id="_dvModuleContainer_welcome.WelcomeModule_0" class="frame-main" role="main">
    <div class="frame-main-cont-body">
      <div id="1730000000000_dvInner">
        <div class="account-and-capacity">
          <section id="1730000000000_dvInfoPanel">账户概览 <button id="1730000000000_dvPayment">开通会员</button></section>
          <section id="1730000000000_dvMemberCenter">容量信息</section>
        </div>
        <div id="1730000000000_dvheightplaceholder"></div>
        <section id="1730000000000_dvmailrecompanel"><div class="mailgg mailgg_rcmd2"></div></section>
        <section id="1730000000000_dvPrivilegesPanel">会员权益</section>
        <section id="1730000000000_dvAssistantPanel"><div class="xN2">AI 助理</div></section>
      </div>
    </div>
  </main>`;

describe('welcome cleaner', () => {
  it('hides the verified JS6 advertising and assistant module roots while retaining account modules', () => {
    document.body.innerHTML = welcomeFixture;

    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'minimal-home' }, 'welcome');

    const ad = document.querySelector('[id$="_dvmailrecompanel"]') as HTMLElement;
    const placeholder = document.querySelector('[id$="_dvheightplaceholder"]') as HTMLElement;
    const assistants = document.querySelector('[id$="_dvAssistantPanel"]') as HTMLElement;
    expect(ad.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(true);
    expect(ad.style.getPropertyValue('display')).toBe('none');
    expect(ad.style.getPropertyPriority('display')).toBe('important');
    expect(placeholder.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(true);
    expect(assistants.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(true);
    expect(document.querySelector('[id$="_dvInfoPanel"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[id$="_dvMemberCenter"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[id$="_dvPayment"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(true);
    expect(document.querySelector('[id$="_dvPrivilegesPanel"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(true);
  });

  it('places a Today card in the welcome content flow immediately after account and capacity', () => {
    document.body.innerHTML = welcomeFixture;
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'minimal-home' }, 'welcome');

    const accountBlock = document.querySelector('.account-and-capacity');
    const card = document.querySelector<HTMLElement>('[data-mail-minimal-card="today"]');
    expect(card).not.toBeNull();
    expect(card?.previousElementSibling).toBe(accountBlock);
    expect(card?.textContent).toContain('今日概览');
    expect(card?.querySelector('time')?.textContent).not.toBe('');
  });

  it('uses the native inbox item once for default homepage mode', () => {
    document.body.innerHTML = '<nav id="dvNavContainer"><button role="button">收件箱</button></nav>';
    const inbox = document.querySelector<HTMLButtonElement>('[role="button"]')!;
    let clicks = 0;
    inbox.addEventListener('click', () => { clicks += 1; });

    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'inbox' }, 'welcome');

    expect(clicks).toBe(1);
  });

  it('leaves the original welcome page untouched and removes the Today card', () => {
    document.body.innerHTML = welcomeFixture;
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'original-home' }, 'welcome');

    expect(document.querySelector('[id$="_dvmailrecompanel"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[id$="_dvAssistantPanel"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[id$="_dvPrivilegesPanel"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[id$="_dvPayment"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[data-mail-minimal-card="today"]')).toBeNull();
  });
});
