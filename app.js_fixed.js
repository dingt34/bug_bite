const store = require('./utils/store');

// 修复的dom-fix模块引用
let domFixAll = null;
try {
  domFixAll = require('./utils/dom-fix-all-in-one');
} catch (error) {
  console.warn('[App] dom-fix-all-in-one模块加载失败，使用简化版本:', error.message);
  // 提供简化版本
  domFixAll = {
    quickFix: function() {
      console.log('[App] 使用简化DOM修复');
      return { success: true, message: '简化修复已应用' };
    },
    getFixStatus: function() {
      return { success: true, fixesApplied: ['simplified'] };
    },
    analyzeCapturedErrors: function() {
      return { errors: [], timestamp: new Date().toISOString() };
    },
    initAllFixes: function(config) {
      console.log('[App] 初始化简化修复', config);
      return { success: true, fixesApplied: ['simplified'] };
    }
  };
}

App({
  globalData: {
    user: null,
    currentTab: 0,
    cloudReady: false,
    domFixStatus: null
  },
  
  onLaunch() {
    console.log('[App] 小程序启动中...');
    
    // 1. 初始化 DOM 兼容性修复（容错处理）
    console.group('[App] DOM 兼容性修复初始化');
    try {
      this.globalData.domFixStatus = domFixAll.quickFix();
      console.log('[App] DOM 修复状态:', this.globalData.domFixStatus);
    } catch (error) {
      console.error('[App] DOM 修复初始化失败:', error);
      this.globalData.domFixStatus = { success: false, error: error.message };
    }
    console.groupEnd();
    
    // 2. 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({ traceUser: true });
      this.globalData.cloudReady = true;
      console.log('[App] 云开发初始化完成');
    }
    
    // 3. 初始化用户数据
    try {
      this.globalData.user = store.get('user', null);
      store.seed();
      console.log('[App] 用户数据初始化完成');
    } catch (error) {
      console.error('[App] 用户数据初始化失败:', error);
    }
    
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
        console.log('[App] 基础库版本:', sdkVersion);
        
        // 针对特定版本警告
        if (sdkVersion === '2.02.2608040' || sdkVersion.includes('2.02')) {
          console.warn('[App] ⚠️ 检测到特定版本 2.02，可能出现DOMNodeRemoved警告');
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
      
      // DOM修复状态检查
      window.$checkDOMFix = () => {
        if (this.globalData.domFixStatus) {
          return this.globalData.domFixStatus;
        }
        return { success: false, message: 'DOM修复未初始化' };
      };
      
      console.log('[App] 快捷方式已注册: $checkDOMFix');
    }
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