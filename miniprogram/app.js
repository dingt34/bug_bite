const store = require('./utils/store');
const domFixAll = require('./utils/dom-fix-all-in-one');

App({
  globalData: {
    user: null,
    currentTab: 0,
    cloudReady: false,
    domFixStatus: null
  },
  
  onLaunch() {
    console.log('[App] 小程序启动中...');
    
    // 1. 初始化 DOM 兼容性修复（全集成方案）
    console.group('[App] DOM 兼容性修复初始化');
    try {
      this.globalData.domFixStatus = domFixAll.quickFix();
      console.log('[App] DOM 修复状态:', this.globalData.domFixStatus);
    } catch (error) {
      console.error('[App] DOM 修复初始化失败:', error);
    }
    console.groupEnd();
    
    // 2. 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true });
      this.globalData.cloudReady = true;
      console.log('[App] 云开发初始化完成');
    }
    
    // 3. 初始化用户数据
    this.globalData.user = store.get('user', null);
    store.seed();
    console.log('[App] 用户数据初始化完成');
    
    // 4. 运行时检查
    this.checkRuntimeCompatibility();
    
    // 5. 添加全局快捷方式
    this.setupGlobalShortcuts();
    
    console.log('[App] 启动完成');
  },
  
  /**
   * 检查运行时兼容性
   */
  checkRuntimeCompatibility() {
    console.group('[App] 运行时兼容性检查');
    
    try {
      const systemInfo = wx.getSystemInfoSync();
      console.log('[App] 系统信息:', {
        SDKVersion: systemInfo.SDKVersion,
        version: systemInfo.version,
        platform: systemInfo.platform,
        system: systemInfo.system
      });
      
      // 基础库版本检查
      const sdkVersion = systemInfo.SDKVersion;
      if (sdkVersion) {
        const versionParts = sdkVersion.split('.').map(Number);
        const majorVersion = versionParts[0];
        
        if (majorVersion < 2) {
          console.warn('[App] [警告] 基础库版本过低 (<2.0.0)，建议更新');
        } else if (majorVersion >= 3) {
          console.log('[App] ✓ 基础库版本良好 (>=3.0.0)');
        } else {
          console.warn('[App] [警告] 基础库版本为2.x，可能存在兼容性问题');
        }
        
        // 针对特定版本警告
        if (sdkVersion === '2.02.2608040' || sdkVersion.includes('2.02')) {
          console.warn('[App] [警告] 检测到特定版本 2.02，可能出现DOMNodeRemoved警告');
          console.warn('[App] 建议在微信开发者工具中更新基础库到3.0.0以上');
        }
      }
      
    } catch (e) {
      console.error('[App] 获取系统信息失败:', e);
    } finally {
      console.groupEnd();
    }
  },
  
  /**
   * 设置全局快捷方式
   */
  setupGlobalShortcuts() {
    // 只在开发环境下添加调试快捷方式
    if (typeof __wxConfig !== 'undefined' && __wxConfig.envVersion === 'develop') {
      console.log('[App] 设置开发环境快捷方式...');
      
      // 微信小程序中使用全局对象，window可能不存在
      const globalObj = typeof global !== 'undefined' ? global : 
                        (typeof wx !== 'undefined' ? wx.getApp() || {} : 
                        (typeof window !== 'undefined' ? window : null));
      
      if (!globalObj) {
        console.warn('[App] 无法找到全局对象，跳过快捷方式注册');
        return;
      }
      
      // DOM修复状态检查
      globalObj.$checkDOMFix = () => {
        const status = domFixAll.getFixStatus();
        console.log('[App] DOM修复状态:', status);
        return status;
      };
      
      // 错误分析
      globalObj.$analyzeDOMErrors = () => {
        return domFixAll.analyzeCapturedErrors();
      };
      
      // 重新初始化修复
      globalObj.$reinitDOMFix = (config) => {
        console.log('[App] 重新初始化DOM修复...');
        this.globalData.domFixStatus = domFixAll.initAllFixes(config || {
          enableDebugger: true,
          logLevel: 'debug'
        });
        return this.globalData.domFixStatus;
      };
      
      console.log('[App] 快捷方式已注册: $checkDOMFix, $analyzeDOMErrors, $reinitDOMFix');
    }
  },
  
  /**
   * 比较版本号
   * @param {string} v1 版本1
   * @param {string} v2 版本2
   * @returns {number} -1: v1 < v2, 0: v1 = v2, 1: v1 > v2
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;
      
      if (num1 < num2) return -1;
      if (num1 > num2) return 1;
    }
    
    return 0;
  },
  
  /**
   * 显示DOM修复状态（供页面调用）
   */
  showDOMFixStatus() {
    if (this.globalData.domFixStatus) {
      return {
        success: this.globalData.domFixStatus.success,
        fixes: this.globalData.domFixStatus.fixesApplied || [],
        timestamp: new Date().toLocaleString()
      };
    }
    return { success: false, message: 'DOM修复未初始化' };
  }
});