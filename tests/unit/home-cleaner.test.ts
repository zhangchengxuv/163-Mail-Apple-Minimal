import { describe, expect, it, vi } from 'vitest';
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

const flushWeather = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('welcome cleaner', () => {
  it('hides verified JS6 promotion roots while retaining account modules', () => {
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

  it('places Today in content flow and renders a weather summary', async () => {
    document.body.innerHTML = welcomeFixture;
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'minimal-home' }, 'welcome');
    await flushWeather();

    const accountBlock = document.querySelector('.account-and-capacity');
    const card = document.querySelector<HTMLElement>('[data-mail-minimal-card="today"]');
    expect(card).not.toBeNull();
    expect(card?.previousElementSibling).toBe(accountBlock);
    expect(card?.textContent).toContain('今日概览');
    expect(card?.querySelector('time')?.textContent).not.toBe('');
    expect(card?.querySelector('[data-weather]')?.hasAttribute('hidden')).toBe(false);
    expect(card?.querySelector('[data-weather-temperature]')?.textContent).toBe('24°C');
    expect(card?.querySelector('[data-weather-description]')?.textContent).toBe('局部多云');
  });

  it('keeps Today available but does not render weather when disabled', () => {
    document.body.innerHTML = welcomeFixture;
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'minimal-home', showWeather: false }, 'welcome');

    const card = document.querySelector<HTMLElement>('[data-mail-minimal-card="today"]');
    expect(card).not.toBeNull();
    expect(card?.querySelector('[data-weather]')?.hasAttribute('hidden')).toBe(true);
  });

  it('updates the weather view when the saved city changes', async () => {
    document.body.innerHTML = welcomeFixture;
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'minimal-home', weatherCity: 'Tokyo' }, 'welcome');
    await flushWeather();
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'minimal-home', weatherCity: 'Singapore' }, 'welcome');
    await flushWeather();

    const card = document.querySelector<HTMLElement>('[data-mail-minimal-card="today"]');
    expect(card?.querySelector('[data-weather-city]')?.textContent).toBe('Singapore');
    expect(card?.querySelector('[data-weather-temperature]')?.textContent).toBe('30°C');
  });

  it('leaves Today intact when weather is unavailable and does not request weather outside welcome', async () => {
    const sendMessage = vi.spyOn(chrome.runtime, 'sendMessage').mockRejectedValueOnce(new Error('offline'));
    document.body.innerHTML = welcomeFixture;
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'minimal-home' }, 'welcome');
    await flushWeather();
    expect(document.querySelector('[data-mail-minimal-card="today"]')).not.toBeNull();
    expect(document.querySelector('[data-weather-description]')?.textContent).toBe('天气暂不可用');
    sendMessage.mockClear();

    document.body.innerHTML = '<main id="_dvModuleContainer_welcome.WelcomeModule_0"></main>';
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'minimal-home' }, 'list');
    expect(sendMessage).not.toHaveBeenCalled();
    sendMessage.mockRestore();
  });

  it('uses the native inbox item once for default homepage mode', () => {
    document.body.innerHTML = '<nav id="dvNavContainer"><button role="button">收件箱</button></nav>';
    const inbox = document.querySelector<HTMLButtonElement>('[role="button"]')!;
    let clicks = 0;
    inbox.addEventListener('click', () => { clicks += 1; });

    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'inbox' }, 'welcome');

    expect(clicks).toBe(1);
    expect(document.querySelector('[data-mail-minimal-card="today"]')).toBeNull();
  });

  it('leaves original welcome page untouched and removes Today', () => {
    document.body.innerHTML = welcomeFixture;
    applyCleaner({ ...DEFAULT_SETTINGS, homepageMode: 'original-home' }, 'welcome');

    expect(document.querySelector('[id$="_dvmailrecompanel"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[id$="_dvAssistantPanel"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[id$="_dvPrivilegesPanel"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[id$="_dvPayment"]')?.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);
    expect(document.querySelector('[data-mail-minimal-card="today"]')).toBeNull();
  });
});
