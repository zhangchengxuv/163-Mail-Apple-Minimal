import type { Settings } from '../../shared/types';
import { hideExactLabels, setHidden } from './dom';

const OTHER_TOOLS = new Set(['其他工具', '邮件追踪', '简历优化', '智能面试顾问', '求职信息订阅', 'PDF转换工具', '发票助手']);

export function cleanSidebar(settings: Settings, documentRef: Document = document): void {
  const nav = documentRef.querySelector('#dvNavContainer');
  if (!nav) return;
  if (settings.hideOtherTools) {
    const stableGroup = documentRef.querySelector('#dvNavFoot');
    if (stableGroup) setHidden(stableGroup, true);
    else hideExactLabels(nav, OTHER_TOOLS);
  }
  if (settings.hideEnterprisePromotion) {
    hideExactLabels(nav, new Set(['企业邮箱']));
  }
}
