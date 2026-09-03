// pages/login/login.js - 最小化版本
Page({
  data: {
    userInfo: null,
    loading: false,
    canIUseGetUserProfile: false,
    loginError: null
  },
  
  onLoad: function(options) {
    console.log('[Login] 页面加载', options);
    
    // 检查是否支持 getUserProfile
    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      });
    }
    
    // 检查本地存储的用户信息
    const user = wx.getStorageSync('user');
    if (user) {
      console.log('[Login] 发现本地用户信息:', user);
      this.setData({ userInfo: user });
      
      // 自动跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1000);
    }
  },
  
  onShow: function() {
    console.log('[Login] 页面显示');
  },
  
  getUserProfile: function() {
    const that = this;
    
    if (!wx.getUserProfile) {
      this.setData({
        loginError: '当前版本不支持获取用户信息，请升级微信版本'
      });
      return;
    }
    
    this.setData({ loading: true });
    
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: function(res) {
        console.log('[Login] 获取用户信息成功:', res.userInfo);
        
        // 保存用户信息
        wx.setStorageSync('user', res.userInfo);
        
        that.setData({
          userInfo: res.userInfo,
          loading: false
        });
        
        // 跳转到首页
        wx.switchTab({
          url: '/pages/index/index'
        });
      },
      fail: function(err) {
        console.error('[Login] 获取用户信息失败:', err);
        that.setData({
          loading: false,
          loginError: '获取用户信息失败: ' + (err.errMsg || '未知错误')
        });
      }
    });
  },
  
  login: function() {
    console.log('[Login] 开始登录');
    this.getUserProfile();
  },
  
  // 快速登录（测试用）
  quickLogin: function() {
    const mockUser = {
      nickName: '测试用户',
      avatarUrl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0FeM5Rh5d2A8pYb3C6Y3sJ7NiaUwibWA1MjG0KhpW7ibE7icH6UcM5Gq8l2piaw/132',
      gender: 0,
      country: 'China',
      province: 'Beijing',
      city: 'Beijing'
    };
    
    wx.setStorageSync('user', mockUser);
    this.setData({ userInfo: mockUser });
    
    wx.showToast({
      title: '登录成功',
      icon: 'success',
      duration: ad
    });
    
    setTimeout(() => {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }, 1000);
  },
  
  // 清除登录错误
  clearError: function() {
    this.setData({ loginError: null });
  }
});