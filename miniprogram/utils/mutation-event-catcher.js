/**
 * Mutation Event 捕获与修复工具 - 简化版本
 * 专门捕获 DOMNodeRemoved 等已弃用事件的来源
 */

const isBrowser = typeof window !== 'undefined';

// 存储捕获到的错误信息
let capturedEvents = [];
let lastReportTime = 0;
const REPORT_INTERVAL = 30000; // 30秒报告一次

/**
 * 捕获 MutationEvent 相关的错误
 */
function captureMutationEventErrors() {
  if (!isBrowser) return;
  
  // 捕获控制台错误
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = function(...args) {
    checkForMutationEventErrors(args);
    return originalConsoleError.apply(this, args);
  };
  
  console.warn = function(...args) {
    checkForMutationEventErrors(args);
    return originalConsoleWarn.apply(this, args);
  };
  
  console.log('[MutationEvent Catcher] 错误捕获已启用');
}

/**
 * 检查是否包含 MutationEvent 错误
 */
function checkForMutationEventErrors(args) {
  try {
    const message = args.join(' ');
    
    // 检查是否包含 DOMNodeRemoved 相关错误
    if (message.includes('DOMNodeRemoved') || 
        message.includes('DOMNodeInserted') ||
        message.includes('Mutation event') ||
        message.includes('mutation event')) {
      
      const eventInfo = {
        timestamp: Date.now(),
        message: message,
        stack: getStackTrace(),
        args: args
      };
      
      capturedEvents.push(eventInfo);
      
      // 限制存储数量
      if (capturedEvents.length > 50) {
        capturedEvents.shift();
      }
      
      // 定期报告
      const now = Date.now();
      if (now - lastReportTime > REPORT_INTERVAL) {
        reportCapturedEvents();
        lastReportTime = now;
      }
      
      // 立即报告关键错误
      if (message.includes('DOMNodeRemoved') && message.includes('Listener added')) {
        console.warn('[MutationEvent Catcher] 捕获到关键 DOMNodeRemoved 错误');
        analyzeErrorSource(eventInfo);
      }
    }
  } catch (e) {
    // 避免干扰原始错误处理
  }
}

/**
 * 获取调用栈信息
 */
function getStackTrace() {
  try {
    throw new Error();
  } catch (e) {
    return e.stack || '';
  }
}

/**
 * 分析错误来源
 */
function analyzeErrorSource(eventInfo) {
  console.log('[MutationEvent Catcher] 分析错误来源...');
  
  const stack = eventInfo.stack || '';
  const lines = stack.split('\n');
  
  // 过滤掉框架内部调用
  const suspiciousLines = lines.filter(line => 
    !line.includes('mutation-event-catcher.js') &&
    !line.includes('WAService') &&
    !line.includes('WASubContext')
  );
  
  if (suspiciousLines.length > 0) {
    console.log('可疑的调用栈行:', suspiciousLines);
  }
}

/**
 * 报告捕获到的事件
 */
function reportCapturedEvents() {
  if (capturedEvents.length === 0) return;
  
  console.group('[MutationEvent Catcher] 定期报告');
  
  const summary = {
    total: capturedEvents.length,
    eventTypes: {}
  };
  
  capturedEvents.forEach(event => {
    let type = 'unknown';
    if (event.message.includes('DOMNodeRemoved')) type = 'DOMNodeRemoved';
    else if (event.message.includes('DOMNodeInserted')) type = 'DOMNodeInserted';
    else if (event.message.includes('MutationEvent')) type = 'MutationEvent';
    
    summary.eventTypes[type] = (summary.eventTypes[type] || 0) + 1;
  });
  
  console.log('事件统计摘要:', summary);
  
  if (summary.eventTypes['DOMNodeRemoved'] > 0) {
    console.warn('[警告] 检测到 ' + summary.eventTypes['DOMNodeRemoved'] + ' 次 DOMNodeRemoved 错误');
  }
  
  console.groupEnd();
}

/**
 * 初始化MutationEvent捕获器
 */
function initMutationEventCatcher(options = {}) {
  if (!isBrowser) {
    console.warn('MutationEvent Catcher 只能在浏览器环境运行');
    return;
  }
  
  const config = {
    captureErrors: true,
    scanOnInit: false,
    createPanel: false,
    reportInterval: REPORT_INTERVAL,
    ...options
  };
  
  console.group('[MutationEvent Catcher] 初始化');
  
  try {
    console.log('配置:', config);
    
    if (config.captureErrors) {
      captureMutationEventErrors();
    }
    
    console.log('[MutationEvent Catcher] 初始化完成');
    
  } catch (error) {
    console.error('[MutationEvent Catcher] 初始化失败:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * 获取捕获到的所有事件
 */
function getAllCapturedEvents() {
  return [...capturedEvents];
}

/**
 * 清理捕获器
 */
function cleanup() {
  if (!isBrowser) return;
  
  capturedEvents = [];
  lastReportTime = 0;
  
  console.log('[MutationEvent Catcher] 已清理');
}

// 导出模块
module.exports = {
  initMutationEventCatcher,
  captureMutationEventErrors,
  getAllCapturedEvents,
  analyzeErrorSource,
  cleanup
};