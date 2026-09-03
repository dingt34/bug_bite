/**
 * DOM修复全集成方案
 * 整合所有修复工具，一站式解决DOMNodeRemoved警告
 */

const domFix = require('./dom-fix');
const domFixEnhanced = require('./dom-fix-enhanced');
const mutationEventCatcher = require('./mutation-event-catcher');
const wechatMutationFix = require('./wechat-mutation-fix');
const domDebugger = require('./dom-debugger');

/**
 * 修复状态跟踪
 */
const fixStatus = {
  initialized: false,
  fixesApplied: [],
  errorsCaptured: 0,
  startTime: Date.now(),
  wechatEnvironment: false
};

/**
 * 初始化所有修复方案
 */
function initAllFixes(options = {}) {
  const config = {
    enableBasicFix: true,
    enableEnhancedFix: true,
    enableCatcher: true,
    enableWechatFix: true,
    enableDebugger: false, // 调试器默认关闭，需要时手动开启
    logLevel: 'info',
    ...options
  };
  
  console.group('[DOM Fix All-in-One] 初始化集成修复方案');
  
  try {
    fixStatus.startTime = Date.now();
    fixStatus.wechatEnvironment = wechatMutationFix.isWechatMP;
    
    console.log('[DOM Fix All-in-One] 环境: ' + (fixStatus.wechatEnvironment ? '微信小程序' : '非微信环境'));
    console.log('[DOM Fix All-in-One] 配置:', config);
    
    // 1. 检查环境兼容性
    const compatibility = wechatMutationFix.checkDOMCompatibility();
    console.log('[DOM Fix All-in-One] 兼容性检查:', compatibility);
    
    // 2. 应用基本修复
    if (config.enableBasicFix) {
      try {
        domFix.initDomFix();
        fixStatus.fixesApplied.push('基本DOM修复');
        console.log('[DOM Fix All-in-One] ✓ 基本修复已应用');
      } catch (error) {
        console.error('[DOM Fix All-in-One] ✗ 基本修复失败:', error);
      }
    }
    
    // 3. 应用增强修复
    if (config.enableEnhancedFix) {
      try {
        domFixEnhanced.initEnhancedDomFix();
        fixStatus.fixesApplied.push('增强DOM修复');
        console.log('[DOM Fix All-in-One] ✓ 增强修复已应用');
      } catch (error) {
        console.error('[DOM Fix All-in-One] ✗ 增强修复失败:', error);
      }
    }
    
    // 4. 应用微信特定修复
    if (config.enableWechatFix && fixStatus.wechatEnvironment) {
      try {
        wechatMutationFix.initWechatMutationFix({
          applyFix: true,
          provideRecommendations: config.logLevel === 'info',
          logDetails: config.logLevel === 'info'
        });
        fixStatus.fixesApplied.push('微信特定修复');
        console.log('[DOM Fix All-in-One] ✓ 微信修复已应用');
      } catch (error) {
        console.error('[DOM Fix All-in-One] ✗ 微信修复失败:', error);
      }
    }
    
    // 5. 启用错误捕获
    if (config.enableCatcher) {
      try {
        mutationEventCatcher.initMutationEventCatcher({
          captureErrors: true,
          scanOnInit: true,
          createPanel: config.logLevel === 'info',
          reportInterval: 30000
        });
        fixStatus.fixesApplied.push('错误捕获器');
        console.log('[DOM Fix All-in-One] ✓ 错误捕获已启用');
      } catch (error) {
        console.error('[DOM Fix All-in-One] ✗ 错误捕获失败:', error);
      }
    }
    
    // 6. 调试器（手动开启）
    if (config.enableDebugger) {
      try {
        domDebugger.initDOMDebugger({
          enableTracking: true,
          enablePerformanceMonitor: true,
          generateReport: true
        });
        fixStatus.fixesApplied.push('调试器');
        console.log('[DOM Fix All-in-One] ✓ 调试器已启用');
      } catch (error) {
        console.error('[DOM Fix All-in-One] ✗ 调试器失败:', error);
      }
    }
    
    fixStatus.initialized = true;
    
    // 生成初始化报告
    const report = generateInitializationReport(config);
    console.log('[DOM Fix All-in-One] 初始化报告:', report);
    
    console.log('[DOM Fix All-in-One] ✓ 所有修复方案初始化完成');
    console.log('[DOM Fix All-in-One] 应用修复: ' + fixStatus.fixesApplied.length + ' 项');
    
    // 提供后续操作建议
    provideNextSteps(config);
    
    return {
      success: true,
      fixesApplied: fixStatus.fixesApplied,
      compatibility: compatibility,
      report: report
    };
    
  } catch (error) {
    console.error('[DOM Fix All-in-One] 初始化过程中出错:', error);
    return {
      success: false,
      error: error.message,
      fixesApplied: fixStatus.fixesApplied
    };
  } finally {
    console.groupEnd();
  }
}

/**
 * 生成初始化报告
 */
function generateInitializationReport(config) {
  const now = Date.now();
  const duration = now - fixStatus.startTime;
  
  return {
    timestamp: new Date().toISOString(),
    initializationTime: `${duration}ms`,
    environment: fixStatus.wechatEnvironment ? '微信小程序' : '浏览器/其他',
    fixesApplied: fixStatus.fixesApplied,
    configUsed: {
      basicFix: config.enableBasicFix,
      enhancedFix: config.enableEnhancedFix,
      wechatFix: config.enableWechatFix,
      catcher: config.enableCatcher,
      debugger: config.enableDebugger
    },
    recommendations: getRecommendations()
  };
}

/**
 * 获取推荐操作
 */
function getRecommendations() {
  const recommendations = [];
  
  if (fixStatus.wechatEnvironment) {
    recommendations.push(
      '检查微信开发者工具版本',
      '调整基础库版本设置',
      '清除编译缓存并重新编译'
    );
  } else {
    recommendations.push(
      '更新浏览器到最新版本',
      '检查第三方库的兼容性',
      '使用现代API替代已弃用API'
    );
  }
  
  if (fixStatus.fixesApplied.length < 3) {
    recommendations.push('部分修复可能未生效，检查控制台错误');
  }
  
  return recommendations;
}

/**
 * 提供后续步骤
 */
function provideNextSteps(config) {
  console.group('[DOM Fix All-in-One] 后续操作建议');
  
  console.log(`
## 立即操作：

1. **重新编译项目**
   - 在微信开发者工具中点击"编译"
   - 清除缓存后重新编译

2. **检查控制台**
   - 查看是否还有DOMNodeRemoved警告
   - 检查修复工具的日志输出

3. **性能测试**
   - 测试页面加载和渲染性能
   - 检查是否有明显性能下降

## 如果需要进一步调试：

1. **启用详细调试**
\`\`\`javascript
// 在app.js中添加
const domFixAll = require('./utils/dom-fix-all-in-one');
domFixAll.initAllFixes({
  enableDebugger: true,  // 启用调试器
  logLevel: 'debug'      // 详细日志
});
\`\`\`

2. **手动捕获错误**
\`\`\`javascript
const catcher = require('./mutation-event-catcher');
// 获取已捕获的错误
const events = catcher.getAllCapturedEvents();
console.log('捕获到的事件:', events);
\`\`\`

3. **环境检查**
\`\`\`javascript
const wechatFix = require('./utils/wechat-mutation-fix');
const compatibility = wechatFix.checkDOMCompatibility();
\`\`\`
`);
  
  if (config.logLevel === 'info') {
    console.log('💡 提示：如果需要更详细的日志，请设置 logLevel: "debug"');
  }
  
  console.groupEnd();
}

/**
 * 获取修复状态
 */
function getFixStatus() {
  const now = Date.now();
  return {
    ...fixStatus,
    uptime: now - fixStatus.startTime,
    currentTime: new Date().toISOString()
  };
}

/**
 * 手动触发错误分析
 */
function analyzeCapturedErrors() {
  try {
    const catcher = require('./mutation-event-catcher');
    const events = catcher.getAllCapturedEvents();
    
    console.group('[DOM Fix All-in-One] 错误分析');
    
    if (events.length === 0) {
      console.log('✓ 未捕获到任何错误');
    } else {
      console.log('⚠️ 捕获到 ' + events.length + ' 个错误事件');
      
      // 分析最近的错误
      const recentErrors = events.slice(-3);
      recentErrors.forEach((error, index) => {
        console.log('\n错误 #' + (index + 1) + ':');
        console.log('  时间: ' + new Date(error.timestamp).toLocaleString());
        console.log('  信息: ' + (error.message || '').substring(0, 100) + '...');
        if (error.stack) {
          console.log('  调用栈: ' + error.stack.split('\n')[0]);
        }
      });
      
      // 提供解决方案
      console.log('\n💡 建议解决方案:');
      console.log('1. 检查错误来源的代码位置');
      console.log('2. 使用MutationObserver替代MutationEvents');
      console.log('3. 更新相关第三方库');
      console.log('4. 调整微信基础库版本');
    }
    
    console.groupEnd();
    
    return events;
  } catch (error) {
    console.error('[DOM Fix All-in-One] 错误分析失败:', error);
    return [];
  }
}

/**
 * 清理所有修复
 */
function cleanupAll() {
  console.group('[DOM Fix All-in-One] 清理所有修复');
  
  try {
    // 清理各模块
    if (typeof domFix.cleanup === 'function') domFix.cleanup();
    if (typeof domFixEnhanced.cleanup === 'function') domFixEnhanced.cleanup();
    if (typeof mutationEventCatcher.cleanup === 'function') mutationEventCatcher.cleanup();
    
    // 重置状态
    fixStatus.initialized = false;
    fixStatus.fixesApplied = [];
    fixStatus.errorsCaptured = 0;
    
    console.log('[DOM Fix All-in-One] ✓ 所有修复已清理');
    console.log('[注意] 清理后可能需要重新加载页面');
    
  } catch (error) {
    console.error('[DOM Fix All-in-One] 清理过程中出错:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * 快速修复模式（最小配置）
 */
function quickFix() {
  console.log('[DOM Fix All-in-One] 启用快速修复模式...');
  
  return initAllFixes({
    enableBasicFix: true,
    enableEnhancedFix: true,
    enableWechatFix: true,
    enableCatcher: true,
    enableDebugger: false,
    logLevel: 'warn' // 只显示警告和错误
  });
}

// 导出模块
module.exports = {
  // 主要功能
  initAllFixes,
  quickFix,
  getFixStatus,
  analyzeCapturedErrors,
  cleanupAll,
  
  // 工具引用（方便直接调用）
  domFix,
  domFixEnhanced,
  mutationEventCatcher,
  wechatMutationFix,
  domDebugger,
  
  // 状态
  fixStatus
};