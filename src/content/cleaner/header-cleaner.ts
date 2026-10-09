import type { Settings } from '../../shared/types';
import { hideExactLabels, setHidden } from './dom';

const MEMBERSHIP = new Set(['手机App', '手机APP', '下载桌面端', '参与调研', '自助查询', '会员中心', '开通超级会员']);
const AI_TABS = new Set(['AI工具箱']);

export function cleanHeader(settings: Settings, documentRef: Document = document): void {
  const header = documentRef.querySelector('header.frame-head');
  if (settings.hideMembership && header) hideExactLabels(header, MEMBERSHIP);
  const tabs = documentRef.querySelector('#dvMultiTabWrapper');
  if (!tabs) return;
  for (const tab of tabs.querySelectorAll('li[role="tab"].nui-tabs-item')) {
    const text = tab.textContent?.replace(/\s/g, '');
    if (settings.hideAi && text && AI_TABS.has(text)) setHidden(tab, true);
    if (settings.hideEnterprisePromotion && text === '企业邮箱') setHidden(tab, true);
  }
}
