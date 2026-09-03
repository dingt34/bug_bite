/**
 * DOM 错误调试工具
 * 帮助识别 DOMNodeRemoved 等 MutationEvents 错误的来源
 */

const isBrowser = typeof window !== 'undefined';

/**
 * 启用详细的事件监听器追踪
 */
function enableEventListenerTracking() {
  if (!isBrowser) {
    return;
  }

  console.group('[DOM Debugger] 启用事件监听器追踪');
  
  try {
    // 追踪 addEventListener 调用
    const originalAddEventListener = window.addEventListener;
    window.addEventListener = function(type, listener, options) {
      // 记录所有事件监听器添加
      console.log('[DOM Debugger] addEventListener 调用:', {
        type,
        listenerName: listener?.name || '匿名函数',
        listenerType: typeof listener,
        source: getCallerInfo()
      });
      
      return originalAddEventListener.call(this, type, listener, options);
    };
    
    // 追踪 MutationObserver 创建
    if (window.MutationObserver) {
      const OriginalMutationObserver = window.MutationObserver;
      window.MutationObserver = function(callback) {
        console.log('[DOM Debugger] MutationObserver 创建:', {
          callbackName: callback?.name || '匿名函数',
          source: getCallerInfo()
        });
        
        // 包装回调以追踪
        const wrappedCallback = function(mutations, observer) {
          console.log('[DOM Debugger] MutationObserver 回调触发:', {
            mutationsCount: mutations.length,
            mutationTypes: mutations.map(m => m.type),
            observer: observer
          });
          
          return callback.call(this, mutations, observer);
        };
        
        return new OriginalMutationObserver(wrappedCallback);
      };
      
      // 恢复原始构造函数
      window.MutationObserver.prototype = OriginalMutationObserver.prototype;
    }
    
    console.log('[DOM Debugger] 事件监听器追踪已启用');
  } catch (error) {
    console.error('[DOM Debugger] 启用追踪失败:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * 获取调用者信息
 */
function getCallerInfo() {
  try {
    const stack = new Error().stack;
    const lines = stack.split('\n');
    
    // 跳过前几行（错误创建本身）
    if (lines.length > Dj3) {
      // 获取调用栈的第三行（我们的工具调用位置）
      const callerLine = lines[3] || lines[lines.length - 1];
      
      // 提取文件名和行号
      const match = callerLine.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1],
          file: match[2],
          line: match[3],
          column: match[4]
        };
      }
    }
  } catch (e) {
    // 忽略错误
  }
  
  return '未知来源';
}

/**
 * 扫描可能的 MutationEvents 使用
 */
function scanForMutationEvents() {
  if (!isBrowser) {
    return;
  }

  console.group('[DOM Debugger] 扫描可能的 MutationEvents 使用');
  
  try {
    // 检查全局事件监听器
    console.log('[DOM Debugger] 检查事件监听器...');
    
    // 检查常见的 MutationEvents
    const mutationEvents = [
      'DOMNodeRemoved',
      'DOMNodeInserted',
      'DOMAttrModified',
      'DOMCharacterDataModified',
      'DOMSubtreeModified'
    ];
    
    // 这里我们无法直接获取已添加的事件监听器列表
    // 但我们可以检查代码模式
    
    // 检查常见的问题模式
    scanCodePatterns();
    
    // 检查第三方库
    checkThirdPartyLibraries();
    
    console.log('[DOM Debugger] 扫描完成');
  } catch (error) {
    console.error('[DOM Debugger] 扫描失败:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * 扫描代码模式
 */
function scanCodePatterns() {
  console.log('[DOM Debugger] 扫描代码模式...');
  
  // 在真实环境中，我们需要检查实际代码
  // 这里我们只能提供建议
  
  const suspiciousPatterns = [
    {
      pattern: /\.addEventListener\(['"]DOMNodeRemoved['"]/g,
      description: '直接使用 DOMNodeRemoved 事件监听'
    },
    {
      pattern: /\.on\(['"]remove['"]/g,
      description: 'jQuery 的 .on("remove") 方法'
    },
    {
      pattern: /MutationEvent/g,
      description: '使用 MutationEvent 相关代码'
    }
  ];
  
  console.log('[DOM Debugger] 可疑模式:', suspiciousPatterns);
}

/**
 * 检查第三方库
 */
function checkThirdPartyLibraries() {
  console.log('[DOM Debugger] 检查第三方库...');
  
  // 检查已知可能使用 MutationEvents 的库
  const suspiciousLibraries = [
    'jQuery',
    'old_jquery',
    'prototype.js',
    'mootools',
    'dojo',
    'yui'
  ];
  
  // 检查是否加载了这些库
  suspiciousLibraries.forEach(lib => {
    if (window[lib]) {
      console.warn(`[DOM Debugger] 检测到可能使用 MutationEvents 的库: ${lib}`);
    }
  });
}

/**
 * 创建 DOM 操作性能监控
 */
function createDOMPerformanceMonitor() {
  if (!isBrowser || !window.performance || !window.performance.mark) {
    return;
  }

  console.group('[DOM Debugger] 启用 DOM 性能监控');
  
  try {
    // 监控 DOM 操作
    if (window.MutationObserver) {
      const performanceObserver = new MutationObserver((mutations) => {
        window.performance.mark('dom-mutation-batch');
        
        const stats = {
          timestamp: Date.now(),
          totalMutations: mutations.length,
          mutationTypes: [...new Set(mutations.map(m => m.type))]
        };
        
        console.log('[DOM Debugger] DOM 操作性能:', stats);
        
        // 标记性能测量结束
        window.performance.measure('dom-mutation-duration', 'dom-mutation-batch');
      });
      
      // 观察整个文档但限制深度
      if (document.body) {
        performanceObserver.observe(document.body, {
          childList: true,
          subtree: false,
          attributes: true,
          characterData: true
        });
        
        console.log('[DOM Debugger] DOM 性能监控已启用');
      }
    }
  } catch (error) {
    console.error('[DOM Debugger] 启用性能监控失败:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * 生成诊断报告
 */
function generateDiagnosticReport() {
  if (!isBrowser) {
    return {};
  }

  console.group('[DOM Debugger] 生成诊断报告');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: {},
    compatibility: {},
    warnings: [],
    recommendations: []
  };
  
  try {
    // 环境信息
    report.environment = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      windowDefined: typeof window !== 'undefined',
      documentDefined: typeof document !== 'undefined',
      MutationObserverSupported: typeof MutationObserver !== 'undefined',
      MutationEventsSupported: 'MutationEvent' in window
    };
    
    // 兼容性检查
    report.compatibility = {
      mutationEventsSupported: false, // 假设不支持
      mutationObserverSupported: typeof MutationObserver !== 'undefined',
      performanceAPI: typeof performance !== 'undefined'
    };
    
    // 检查已知问题
    if (typeof jQuery !== 'undefined') {
      report.warnings.push('检测到 jQuery，可能使用已弃用的 MutationEvents');
      report.recommendations.push('更新 jQuery 到最新版本');
    }
    
    // 基础建议
    report.recommendations.push(
      '使用 MutationObserver 替代 MutationEvents',
      '避免使用 DOMNodeRemoved、DOMNodeInserted 等事件',
      '使用小程序原生 API 进行 DOM 操作'
    );
    
    console.log('[DOM Debugger] 诊断报告:', report);
    
  } catch (error) {
    console.error('[DOM Debugger] 生成报告失败:', error);
    report.error = error.message;
  } finally {
    console.groupEnd();
    return report;
  }
}

/**
 * 初始化 DOM 调试工具
 */
function initDOMDebugger(options = {}) {
  if (!isBrowser) {
    return;
  }
  
  const config = {
    enableTracking: true,
    enablePerformanceMonitor: true,
    generateReport: true,
    ...options
  };
  
  console.group('[DOM Debugger] 初始化');
  
  try {
    if (config.enableTracking) {
      enableEventListenerTracking();
    }
    
    if (config.enablePerformanceMonitor) {
      createDOMPerformanceMonitor();
    }
    
    scanForMutationEvents();
    
    if (config.generateReport) {
      const report = generateDiagnosticReport();
      console.log('[DOM Debugger] 初始化完成，报告已生成');
      return report;
    }
    
    console.log('[DOM Debugger] 初始化完成');
  } catch (error) {
    console.error('[DOM Debugger] 初始化失败:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * 清理调试工具
 */
function cleanup() {
  if (!isBrowser) return;
  
  // 注意：这里不能完全清理，因为我们已经覆盖了原始方法
  console.warn('[DOM Debugger] 无法完全清理，建议重新加载页面');
}

// 导出模块
module.exports = {
  initDOMDebugger,
  enableEventListenerTracking,
  scanForMutationEvents,
  createDOMPerformanceMonitor,
  generateDiagnosticReport,
  cleanup
};