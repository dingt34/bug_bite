/**
 * DOM 兼容性修复工具
 * 修复微信小程序中已弃用的 DOMNodeRemoved 等 MutationEvents
 */

// 检测是否为浏览器环境
const isBrowser = typeof window !== 'undefined';

/**
 * 修复已弃用的 MutationEvents
 * 防止 DOMNodeRemoved 等事件的监听
 */
function fixMutationEvents() {
  if (!isBrowser || !window.addEventListener) {
    return;
  }

  try {
    const originalAddEventListener = window.addEventListener;
    const originalRemoveEventListener = window.removeEventListener;

    // 已弃用的 MutationEvents 列表
    const deprecatedEvents = [
      'DOMNodeRemoved',
      'DOMNodeInserted',
      'DOMAttrModified',
      'DOMCharacterDataModified',
      'DOMSubtreeModified'
    ];

    window.addEventListener = function(type, listener, options) {
      if (deprecatedEvents.includes(type)) {
        console.warn(`[DOM Fix] 已阻止添加已弃用的 MutationEvent: "${type}"`);
        console.warn(`[DOM Fix] 请使用 MutationObserver 替代 ${type} 事件监听`);
        return;
      }
      return originalAddEventListener.call(this, type, listener, options);
    };

    window.removeEventListener = function(type, listener, options) {
      if (deprecatedEvents.includes(type)) {
        console.warn(`[DOM Fix] 尝试移除已弃用的 MutationEvent: "${type}"`);
        return;
      }
      return originalRemoveEventListener.call(this, type, listener, options);
    };

    // 修复 Element.prototype 上的事件监听
    if (Element && Element.prototype) {
      const originalElementAdd = Element.prototype.addEventListener;
      const originalElementRemove = Element.prototype.removeEventListener;

      if (originalElementAdd) {
        Element.prototype.addEventListener = function(type, listener, options) {
          if (deprecatedEvents.includes(type)) {
            console.warn(`[DOM Fix] 已阻止元素添加已弃用的 MutationEvent: "${type}"`);
            return;
          }
          return originalElementAdd.call(this, type, listener, options);
        };
      }

      if (originalElementRemove) {
        Element.prototype.removeEventListener = function(type, listener, options) {
          if (deprecatedEvents.includes(type)) {
            console.warn(`[DOM Fix] 尝试从元素移除已弃用的 MutationEvent: "${type}"`);
            return;
          }
          return originalElementRemove.call(this, type, listener, options);
        };
      }
    }

    console.log('[DOM Fix] MutationEvents 修复已应用');
  } catch (error) {
    console.error('[DOM Fix] 修复过程中出错:', error);
  }
}

/**
 * 创建安全的 MutationObserver
 * @param {Function} callback - 变化回调函数
 * @param {Object} options - 观察选项
 * @returns {MutationObserver|null} 观察器实例
 */
function createSafeObserver(callback, options = { childList: true, subtree: true }) {
  if (!isBrowser || !window.MutationObserver) {
    console.warn('[DOM Fix] MutationObserver 不可用');
    return null;
  }

  try {
    return new MutationObserver(callback);
  } catch (error) {
    console.error('[DOM Fix] 创建 MutationObserver 失败:', error);
    return null;
  }
}

/**
 * 监听元素移除的替代方案
 * @param {HTMLElement} target - 目标元素
 * @param {Function} onRemoved - 移除回调
 * @param {Object} observerOptions - 观察选项
 * @returns {MutationObserver|null} 观察器实例
 */
function watchElementRemoval(target, onRemoved, observerOptions = {}) {
  if (!target || !isBrowser || !window.MutationObserver) {
    return null;
  }

  const options = {
    childList: true,
    subtree: true,
    ...observerOptions
  };

  const observer = createSafeObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // 检查目标元素是否被移除
        const removedNodes = Array.from(mutation.removedNodes);
        if (removedNodes.some(node => node === target || node.contains(target))) {
          onRemoved(target, mutation);
        }
        
        // 检查子节点移除
        removedNodes.forEach((removedNode) => {
          if (removedNode.nodeType === 1) { // ELEMENT_NODE
            onRemoved(removedNode, mutation);
          }
        });
      }
    });
  }, options);

  if (observer) {
    observer.observe(target.parentNode || document.body, options);
  }

  return observer;
}

/**
 * 初始化 DOM 修复
 * 应该在应用启动时调用
 */
function initDomFix() {
  if (!isBrowser) {
    return;
  }

  // 修复 MutationEvents
  fixMutationEvents();

  // 添加全局 MutationObserver 备用方案
  if (window.MutationObserver && document.body) {
    // 可选的全局观察器，用于调试
    const globalObserver = createSafeObserver((mutations) => {
      // 调试用：记录 DOM 变化
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          console.log('[DOM Fix] 检测到 DOM 节点移除:', {
            removedNodes: mutation.removedNodes.length,
            target: mutation.target.nodeName
          });
        }
      });
    }, { childList: true, subtree: false });
    
    if (globalObserver) {
      globalObserver.observe(document.body, { childList: true, subtree: false });
    }
  }

  console.log('[DOM Fix] DOM 兼容性修复初始化完成');
}

// 导出工具函数
module.exports = {
  initDomFix,
  fixMutationEvents,
  createSafeObserver,
  watchElementRemoval,
  isBrowser
};