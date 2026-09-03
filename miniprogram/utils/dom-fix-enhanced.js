/**
 * DOM 兼容性修复工具（增强版）
 * 彻底修复微信小程序中已弃用的 DOMNodeRemoved 等 MutationEvents
 */

const isBrowser = typeof window !== 'undefined';

// 已弃用的 MutationEvents 列表
const DEPRECATED_EVENTS = [
  'DOMNodeRemoved',
  'DOMNodeInserted', 
  'DOMAttrModified',
  'DOMCharacterDataModified',
  'DOMSubtreeModified'
];

/**
 * 深度拦截 MutationEvents 监听
 */
function deepInterceptMutationEvents() {
  if (!isBrowser) {
    return;
  }

  try {
    // 全局拦截
    interceptGlobalEventListeners();
    
    // 拦截所有可能的事件目标
    interceptEventTargets();
    
    // 提供兼容性报告
    setupCompatibilityReport();
    
    console.log('[DOM Fix Enhanced] 深度拦截已启用');
  } catch (error) {
    console.error('[DOM Fix Enhanced] 深度拦截失败:', error);
  }
}

/**
 * 拦截全局事件监听器
 */
function interceptGlobalEventListeners() {
  const originalAdd = window.addEventListener;
  const originalRemove = window.removeEventListener;
  
  window.addEventListener = function(type, listener, options) {
    if (DEPRECATED_EVENTS.includes(type)) {
      logDeprecatedEvent('window', type);
      provideAlternative(type);
      return;
    }
    return originalAdd.call(this, type, listener, options);
  };
  
  window.removeEventListener = function(type, listener, options) {
    if (DEPRECATED_EVENTS.includes(type)) {
      logDeprecatedEvent('window', type, '移除');
      return;
    }
    return originalRemove.call(this, type, listener, options);
  };
}

/**
 * 拦截各种事件目标
 */
function interceptEventTargets() {
  const targetsToIntercept = [
    'Document',
    'Element', 
    'HTMLElement',
    'SVGElement',
    'Node'
  ];
  
  targetsToIntercept.forEach(targetName => {
    const target = window[targetName];
    if (target && target.prototype) {
      interceptPrototypeMethods(targetName, target.prototype);
    }
  });
}

/**
 * 拦截原型方法
 */
function interceptPrototypeMethods(targetName, prototype) {
  if (!prototype.addEventListener || !prototype.removeEventListener) {
    return;
  }
  
  const originalAdd = prototype.addEventListener;
  const originalRemove = prototype.removeEventListener;
  
  prototype.addEventListener = function(type, listener, options) {
    if (DEPRECATED_EVENTS.includes(type)) {
      logDeprecatedEvent(targetName, type);
      provideAlternative(type);
      return;
    }
    return originalAdd.call(this, type, listener, options);
  };
  
  prototype.removeEventListener = function(type, listener, options) {
    if (DEPRECATED_EVENTS.includes(type)) {
      logDeprecatedEvent(targetName, type, '移除');
      return;
    }
    return originalRemove.call(this, type, listener, options);
  };
}

/**
 * 记录已弃用事件
 */
function logDeprecatedEvent(source, eventType, operation = '添加') {
  console.warn(`[DOM Fix Enhanced] ${operation}已弃用的 MutationEvent "${eventType}" (来源: ${source})`);
  console.warn('[DOM Fix Enhanced] 建议使用 MutationObserver 替代');
}

/**
 * 提供替代方案建议
 */
function provideAlternative(eventType) {
  console.group('[DOM Fix Enhanced] MutationObserver 替代方案');
  
  switch (eventType) {
    case 'DOMNodeRemoved':
      console.log(`
// 替代 DOMNodeRemoved
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
      mutation.removedNodes.forEach(node => {
        console.log('节点被移除:', node);
      });
    }
  });
});

observer.observe(targetElement, {
  childList: true,
  subtree: true
});
      `);
      break;
      
    case 'DOMNodeInserted':
      console.log(`
// 替代 DOMNodeInserted
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      mutation.addedNodes.forEach(node => {
        console.log('节点被插入:', node);
      });
    }
  });
});

observer.observe(targetElement, {
  childList: true,
  subtree: true
});
      `);
      break;
      
    case 'DOMAttrModified':
      console.log(`
// 替代 DOMAttrModified
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes') {
      console.log('属性修改:', {
        attributeName: mutation.attributeName,
        oldValue: mutation.oldValue,
        target: mutation.target
      });
    }
  });
});

observer.observe(targetElement, {
  attributes: true,
  attributeOldValue: true,
  subtree: false
});
      `);
      break;
  }
  
  console.groupEnd();
}

/**
 * 设置兼容性报告
 */
function setupCompatibilityReport() {
  if (!window.performance || !window.performance.mark) {
    return;
  }
  
  // 标记初始化完成
  window.performance.mark('dom-fix-enhanced-init');
  
  // 定期报告 DOM 变化统计
  if (window.MutationObserver) {
    const reportObserver = new MutationObserver((mutations) => {
      const stats = {
        totalMutations: mutations.length,
        childListMutations: mutations.filter(m => m.type === 'childList').length,
        attributesMutations: mutations.filter(m => m.type === 'attributes').length,
        characterDataMutations: mutations.filter(m => m.type === 'characterData').length
      };
      
      console.log('[DOM Fix Enhanced] DOM 变化统计:', stats);
    });
    
    // 观察 body 但限制范围
    if (document.body) {
      reportObserver.observe(document.body, {
        childList: true,
        subtree: false,
        attributes: false,
        characterData: false
      });
    }
  }
}

/**
 * 创建安全的 MutationObserver（带错误处理）
 */
function createEnhancedObserver(callback, options = {}) {
  if (!isBrowser || !window.MutationObserver) {
    console.warn('[DOM Fix Enhanced] MutationObserver 不可用');
    return null;
  }
  
  try {
    // 包装回调函数以处理错误
    const wrappedCallback = (mutations, observer) => {
      try {
        return callback(mutations, observer);
      } catch (error) {
        console.error('[DOM Fix Enhanced] MutationObserver 回调错误:', error);
      }
    };
    
    return new MutationObserver(wrappedCallback);
  } catch (error) {
    console.error('[DOM Fix Enhanced] 创建 MutationObserver 失败:', error);
    return null;
  }
}

/**
 * 监听元素移除的增强版本
 */
function watchElementRemovalEnhanced(target, onRemoved, options = {}) {
  if (!target || !isBrowser || !window.MutationObserver) {
    return null;
  }
  
  const defaultOptions = {
    childList: true,
    subtree: true,
    onMutation: null,
    timeout: 5000
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  const observer = createEnhancedObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
        // 调用可选的通用回调
        if (typeof mergedOptions.onMutation === 'function') {
          mergedOptions.onMutation(mutation);
        }
        
        // 检查目标元素是否被移除
        const removedNodes = Array.from(mutation.removedNodes);
        if (removedNodes.some(node => node === target)) {
          onRemoved(target, mutation);
          return;
        }
        
        // 检查子节点移除
        removedNodes.forEach((removedNode) => {
          if (removedNode.nodeType === 1) { // ELEMENT_NODE
            onRemoved(removedNode, mutation);
          }
        });
      }
    });
  });
  
  if (observer) {
    const parentNode = target.parentNode || document.body;
    if (parentNode) {
      observer.observe(parentNode, {
        childList: mergedOptions.childList,
        subtree: mergedOptions.subtree
      });
      
      // 设置超时自动断开
      if (mergedOptions.timeout > 0) {
        setTimeout(() => {
          console.log(`[DOM Fix Enhanced] 观察器超时断开 (${mergedOptions.timeout}ms)`);
          observer.disconnect();
        }, mergedOptions.timeout);
      }
    }
  }
  
  return observer;
}

/**
 * 初始化增强版 DOM 修复
 */
function initEnhancedDomFix() {
  if (!isBrowser) {
    return;
  }
  
  console.group('[DOM Fix Enhanced] 初始化');
  
  try {
    // 1. 深度拦截 MutationEvents
    deepInterceptMutationEvents();
    
    // 2. 检测当前环境
    detectEnvironment();
    
    // 3. 提供全局帮助函数
    provideGlobalHelpers();
    
    console.log('[DOM Fix Enhanced] 初始化完成');
  } catch (error) {
    console.error('[DOM Fix Enhanced] 初始化过程中出错:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * 检测当前环境
 */
function detectEnvironment() {
  const info = {
    hasWindow: typeof window !== 'undefined',
    hasDocument: typeof document !== 'undefined',
    hasMutationObserver: typeof MutationObserver !== 'undefined',
    userAgent: navigator?.userAgent || 'N/A'
  };
  
  console.log('[DOM Fix Enhanced] 环境检测:', info);
  
  // 检查是否在微信小程序环境中
  if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
    try {
      const systemInfo = wx.getSystemInfoSync();
      console.log('[DOM Fix Enhanced] 小程序环境:', {
        platform: systemInfo.platform,
        SDKVersion: systemInfo.SDKVersion,
        version: systemInfo.version
      });
    } catch (e) {
      console.warn('[DOM Fix Enhanced] 无法获取小程序系统信息:', e);
    }
  }
}

/**
 * 提供全局帮助函数
 */
function provideGlobalHelpers() {
  if (!isBrowser) return;
  
  // 安全的 MutationObserver 创建函数
  window.$createObserver = createEnhancedObserver;
  
  // 元素移除监听
  window.$watchElementRemoval = watchElementRemovalEnhanced;
  
  // 兼容性检查
  window.$checkDOMCompatibility = function() {
    const checks = {
      mutationEventsSupported: DEPRECATED_EVENTS.every(event => 
        !(event in window && typeof window[event] === 'function')
      ),
      mutationObserverSupported: typeof MutationObserver !== 'undefined',
      performanceSupported: typeof performance !== 'undefined'
    };
    
    console.log('[DOM Fix Enhanced] 兼容性检查:', checks);
    return checks;
  };
}

/**
 * 清理函数
 */
function cleanup() {
  if (!isBrowser) return;
  
  // 清理全局函数
  delete window.$createObserver;
  delete window.$watchElementRemoval;
  delete window.$checkDOMCompatibility;
  
  console.log('[DOM Fix Enhanced] 清理完成');
}

// 导出模块
module.exports = {
  initEnhancedDomFix,
  deepInterceptMutationEvents,
  createEnhancedObserver,
  watchElementRemovalEnhanced,
  cleanup,
  
  // 常量
  DEPRECATED_EVENTS
};