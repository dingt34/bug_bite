/**
 * 微信小程序特定的 MutationEvent 修复
 * 针对微信环境下的 DOMNodeRemoved 警告
 */

// 检查是否在微信小程序环境
const isWechatMP = typeof wx !== 'undefined' && wx.getSystemInfoSync;

/**
 * 微信小程序专属修复方案
 */
function wechatSpecificFix() {
  if (!isWechatMP) {
    console.warn('[Wechat Fix] 不在微信小程序环境，跳过修复');
    return;
  }
  
  console.group('[Wechat Fix] 微信小程序特定修复');
  
  try {
    // 1. 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    console.log('[Wechat Fix] 系统信息:', systemInfo);
    
    // 2. 检查基础库版本
    checkSDKVersion(systemInfo);
    
    // 3. 应用微信特定的修复
    applyWechatDOMFix();
    
    // 4. 优化小程序配置建议
    provideConfigRecommendations();
    
    console.log('[Wechat Fix] 微信特定修复完成');
    
  } catch (error) {
    console.error('[Wechat Fix] 修复过程中出错:', error);
  } finally {
    console.groupEnd();
  }
}

/**
 * 检查SDK版本
 */
function checkSDKVersion(systemInfo) {
  const sdkVersion = systemInfo.SDKVersion;
  
  console.log(`[Wechat Fix] 当前基础库版本: ${sdkVersion || '未知'}`);
  
  if (!sdkVersion) {
    console.warn('[Wechat Fix] 无法获取基础库版本');
    return;
  }
  
  // 版本比较
  const versionParts = sdkVersion.split('.').map(Number);
  const majorVersion = versionParts[0];
  
  if (majorVersion < 2) {
    console.warn('[Wechat Fix] 基础库版本过低 (<2.0.0)，建议更新');
  } else if (majorVersion >= 3) {
    console.log('[Wechat Fix] 基础库版本良好 (>=3.0.0)');
  } else {
    console.warn('[Wechat Fix] 基础库版本为2.x，可能存在兼容性问题');
  }
  
  // 针对特定版本的问题
  if (sdkVersion === '2.02.2608040' || sdkVersion.includes('2.02')) {
    console.warn('[Wechat Fix] 检测到特定版本 2.02，可能存在DOMNodeRemoved警告');
    console.log('建议：在微信开发者工具中更新基础库到3.0.0以上版本');
  }
}

/**
 * 应用微信特定的DOM修复
 */
function applyWechatDOMFix() {
  console.log('[Wechat Fix] 应用微信特定DOM修复...');
  
  try {
    // 1. 尝试修复小程序WebView的EventListener
    if (typeof window !== 'undefined' && window.addEventListener) {
      patchWechatEventListener();
    }
    
    // 2. 提供替代的MutationObserver方案
    provideWechatMutationObserver();
    
    // 3. 优化小程序渲染性能
    optimizeWechatRendering();
    
    console.log('[Wechat Fix] DOM修复已应用');
  } catch (error) {
    console.error('[Wechat Fix] 应用DOM修复失败:', error);
  }
}

/**
 * 修补微信环境的EventListener
 */
function patchWechatEventListener() {
  console.log('[Wechat Fix] 修补EventListener...');
  
  const originalAdd = window.addEventListener;
  const originalRemove = window.removeEventListener;
  
  // 已弃用的事件列表
  const deprecatedEvents = [
    'DOMNodeRemoved',
    'DOMNodeInserted',
    'DOMAttrModified',
    'DOMCharacterDataModified',
    'DOMSubtreeModified'
  ];
  
  // 统计信息
  let blockedCount = 0;
  
  window.addEventListener = function(type, listener, options) {
    if (deprecatedEvents.includes(type)) {
      blockedCount++;
      
      console.warn(`[Wechat Fix] 阻止添加已弃用事件: ${type}`);
      console.warn(`[Wechat Fix] 来源: ${getCallerInfo()}`);
      
      // 提供替代方案
      if (type === 'DOMNodeRemoved') {
        console.info(`[Wechat Fix] 替代方案: 使用小程序页面生命周期或自定义组件detached`);
      }
      
      return;
    }
    
    return originalAdd.call(this, type, listener, options);
  };
  
  window.removeEventListener = function(type, listener, options) {
    if (deprecatedEvents.includes(type)) {
      console.warn(`[Wechat Fix] 尝试移除已弃用事件: ${type}`);
      return;
    }
    
    return originalRemove.call(this, type, listener, options);
  };
  
  console.log(`[Wechat Fix] 已准备拦截 ${deprecatedEvents.length} 种已弃用事件`);
}

/**
 * 提供微信环境的MutationObserver替代方案
 */
function provideWechatMutationObserver() {
  console.log('[Wechat Fix] 提供MutationObserver方案...');
  
  if (typeof MutationObserver === 'undefined') {
    console.warn('[Wechat Fix] MutationObserver不可用');
    return;
  }
  
  // 创建微信小程序友好的Observer工厂
  window.$wxObserver = function(selector, callback, options = {}) {
    return new Promise((resolve) => {
      // 等待元素出现
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          const observer = new MutationObserver(callback);
          
          const obsOptions = {
            childList: true,
            subtree: options.subtree || false,
            attributes: options.attributes || false,
            characterData: options.characterData || false,
            ...options
          };
          
          observer.observe(element, obsOptions);
          resolve(observer);
        } else {
          setTimeout(checkElement, 100);
        }
      };
      
      checkElement();
    });
  };
  
  console.log('[Wechat Fix] $wxObserver 已注册，用法: $wxObserver("#id", callback)');
}

/**
 * 优化小程序渲染性能
 */
function optimizeWechatRendering() {
  console.log('[Wechat Fix] 优化渲染性能...');
  
  const recommendations = [
    '1. 使用wx:key优化列表渲染',
    '2. 避免频繁setData，合并数据更新',
    '3. 使用hidden替代wx:if进行条件渲染（如果需要频繁切换）',
    '4. 使用虚拟列表处理长列表',
    '5. 图片使用lazy-loading',
    '6. 减少不必要的节点层级'
  ];
  
  console.log('[Wechat Fix] 渲染优化建议:');
  recommendations.forEach(rec => console.log(`  ${rec}`));
  
  // 添加性能监控
  if (typeof wx !== 'undefined' && wx.reportPerformance) {
    try {
      wx.reportPerformance(1001, 'DOM优化已应用', 1);
      console.log('[Wechat Fix] 性能报告已提交');
    } catch (e) {
      // 忽略报告错误
    }
  }
}

/**
 * 获取调用者信息
 */
function getCallerInfo() {
  try {
    const stack = new Error().stack;
    const lines = stack.split('\n');
    
    // 查找非工具本身的调用栈
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      if (line && !line.includes('wechat-mutation-fix')) {
        // 提取简洁信息
        const match = line.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
        if (match) {
          return `${match[1]} (${match[2]}:${match[3]})`;
        }
        return line.trim();
      }
    }
  } catch (e) {
    // 忽略错误
  }
  
  return '未知来源';
}

/**
 * 提供配置建议
 */
function provideConfigRecommendations() {
  console.log('[Wechat Fix] 小程序配置建议:');
  
  const configRecommendations = {
    'app.json': {
      '推荐设置': {
        'renderer': 'webview',
        'style': 'v2',
        'lazyCodeLoading': 'requiredComponents',
        'componentFramework': 'glass-easel'
      },
      'window配置': {
        'renderingMode': 'seperated',
        'enablePullDownRefresh': false, // 如不需要
        'backgroundTextStyle': 'dark'
      }
    },
    '页面配置': {
      'usingComponents': '明确声明使用的组件',
      'navigationBarTitleText': '设置页面标题',
      'disableScroll': '如不需要滚动则禁用'
    },
    '性能优化': {
      '使用分包加载': '减少首包大小',
      '图片优化': '使用webp格式，适当压缩',
      '代码分割': '按需加载组件和页面'
    }
  };
  
  console.log(JSON.stringify(configRecommendations, null, 2));
}

/**
 * 创建微信开发者工具调试命令
 */
function createWechatDebugCommands() {
  if (!isWechatMP) return;
  
  console.log('[Wechat Fix] 微信开发者工具调试命令:');
  
  const commands = [
    '1. 清空缓存并重新编译: 项目 -> 清除缓存 -> 重新编译',
    '2. 切换基础库版本: 详情 -> 本地设置 -> 基础库版本',
    '3. 启用调试模式: 详情 -> 本地设置 -> 开启调试',
    '4. 查看性能面板: 调试器 -> Audits',
    '5. 检查代码依赖: 调试器 -> Sources -> Page'
  ];
  
  commands.forEach(cmd => console.log(`  ${cmd}`));
  
  // 添加快捷操作
  try {
    // 存储到全局，方便在控制台调用
    window.$wxCommands = {
      clearCache: function() {
        console.log('请在微信开发者工具中执行: 项目 -> 清除缓存');
      },
      checkVersion: function() {
        const sysInfo = wx.getSystemInfoSync();
        console.log('当前基础库:', sysInfo.SDKVersion);
      },
      performanceReport: function() {
        if (wx.reportPerformance) {
          wx.reportPerformance(1002, '手动性能检查', 1);
          console.log('性能报告已提交');
        }
      }
    };
    
    console.log('[Wechat Fix] 快捷命令已注册: $wxCommands');
  } catch (e) {
    // 忽略
  }
}

/**
 * 初始化微信小程序修复
 */
function initWechatMutationFix(options = {}) {
  if (!isWechatMP) {
    console.warn('[Wechat Fix] 不在微信小程序环境');
    return false;
  }
  
  const config = {
    applyFix: true,
    provideRecommendations: true,
    createDebugCommands: true,
    logDetails: true,
    ...options
  };
  
  try {
    if (config.logDetails) {
      console.group('[Wechat Fix] 初始化');
    }
    
    console.log('[Wechat Fix] 启动微信特定修复...');
    
    if (config.applyFix) {
      wechatSpecificFix();
    }
    
    if (config.provideRecommendations) {
      provideConfigRecommendations();
    }
    
    if (config.createDebugCommands) {
      createWechatDebugCommands();
    }
    
    console.log('[Wechat Fix] 初始化完成');
    
    return true;
  } catch (error) {
    console.error('[Wechat Fix] 初始化失败:', error);
    return false;
  } finally {
    if (config.logDetails) {
      console.groupEnd();
    }
  }
}

/**
 * 检查当前环境的DOM兼容性
 */
function checkDOMCompatibility() {
  if (!isWechatMP) {
    return { supported: false, reason: '不在微信环境' };
  }
  
  const checks = {
    timestamp: new Date().toISOString(),
    mutationObserver: typeof MutationObserver !== 'undefined',
    performanceAPI: typeof performance !== 'undefined',
    eventListenerAPI: typeof window !== 'undefined' && window.addEventListener,
    wechatAPIs: {
      getSystemInfo: typeof wx.getSystemInfoSync === 'function',
      reportPerformance: typeof wx.reportPerformance === 'function',
      createSelectorQuery: typeof wx.createSelectorQuery === 'function'
    }
  };
  
  console.log('[Wechat Fix] DOM兼容性检查:', checks);
  
  return checks;
}

// 导出模块
module.exports = {
  initWechatMutationFix,
  wechatSpecificFix,
  checkDOMCompatibility,
  isWechatMP
};