// pages/login/login.js
const store = require('../../utils/store');

Page({
  data: {
    // 用户信息
    userInfo: {
      avatarUrl: '',
      nickName: '',
      ageGroup: '',
      region: ''
    },
    // 年龄段选项
    ageRange: ['18岁以下', '18-25岁', '26-35岁', '36-45岁', '46-55岁', '56岁以上'],
    // 隐私同意
    privacyAgreed: false,
    // 是否首次进入
    isFirstTime: true,
    // 来源页面（用于登录后返回）
    fromPage: '',
    fromData: null,
    // 表单是否有效
    formValid: false
  },

  onLoad(options) {
    // 记录来源页面
    const from = options.from || '';
    const fromData = options.data ? JSON.parse(decodeURIComponent(options.data)) : null;
    
    // 判断是否首次进入（无来源且无缓存档案）
    const hasProfile = store.get('profileComplete', false);
    const isFirst = !from && !hasProfile;

    this.setData({
      isFirstTime: isFirst,
      fromPage: from,
      fromData: fromData
    });

    // 如果有缓存用户信息，回填
    const cachedUser = store.get('userInfo', null);
    if (cachedUser) {
      this.setData({
        userInfo: {
          ...this.data.userInfo,
          ...cachedUser
        }
      });
    }

    // 检查是否有草稿
    const draft = store.get('draftData', null);
    if (draft && from) {
      this.showDraftTip(draft);
    }
  },

  // ===== 表单交互 =====
  // 选择头像
  chooseAvatar() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0];
        this.setData({
          'userInfo.avatarUrl': tempFilePath
        });
        this.validateForm();
      }
    });
  },

  // 昵称输入
  onNicknameInput(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    });
    this.validateForm();
  },

  // 年龄段选择
  onAgeChange(e) {
    const index = e.detail.value;
    this.setData({
      'userInfo.ageGroup': this.data.ageRange[index]
    });
    this.validateForm();
  },

  // 地区选择
  onRegionChange(e) {
    const region = e.detail.value;
    this.setData({
      'userInfo.region': region.join(' · ')
    });
    this.validateForm();
  },

  // 隐私同意切换
  togglePrivacyAgree() {
    this.setData({
      privacyAgreed: !this.data.privacyAgreed
    });
    this.validateForm();
  },

  // 表单验证
  validateForm() {
    const { userInfo, privacyAgreed } = this.data;
    const valid = !!(
      privacyAgreed &&
      userInfo.nickName &&
      userInfo.nickName.trim() &&
      userInfo.ageGroup &&
      userInfo.region
    );
    this.setData({ formValid: valid });
    return valid;
  },

  // ===== 核心操作 =====
  // 登录/建档
  handleLogin() {
    if (!this.validateForm()) {
      wx.showToast({
        title: '请完整填写档案并同意隐私协议',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({ title: '登录中...' });

    // 保存用户信息到本地
    const { userInfo } = this.data;
    store.set('userInfo', userInfo);
    store.set('wechatAuthorized', true);
    store.set('profileComplete', true);

    // 模拟登录请求
    setTimeout(() => {
      wx.hideLoading();

      // 判断跳转目标
      const { fromPage, fromData, isFirstTime } = this.data;

      if (fromPage) {
        // 有来源：回到原页面，带草稿数据
        const pages = getCurrentPages();
        const targetPage = pages.find(p => p.route === fromPage);
        if (targetPage) {
          // 如果页面实例存在，直接传递数据
          targetPage.setData({ draftData: fromData || null });
          wx.navigateBack();
        } else {
          // 否则重新跳转
          const url = `/${fromPage}${fromData ? '?data=' + encodeURIComponent(JSON.stringify(fromData)) : ''}`;
          wx.redirectTo({ url });
        }
      } else if (isFirstTime) {
        // 首次进入且无来源：回首页
        wx.reLaunch({ url: '/pages/home/home' });
      } else {
        // 非首次无来源：回到上一页或首页
        wx.navigateBack({
          fail: () => wx.reLaunch({ url: '/pages/home/home' })
        });
      }

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
    }, 800);
  },

  // ===== 紧急/特殊入口 =====
  // 紧急安全判断（不阻塞，无需登录）
  goToEmergency() {
    wx.navigateTo({
      url: '/pages/safety-check/safety-check?mode=emergency'
    });
  },

  // 首次进入：先进行安全判断
  goToSafetyFirst() {
    wx.navigateTo({
      url: '/pages/safety-check/safety-check?mode=quick'
    });
  },

  // 补全档案（过敏史、既往反应等）
  goToSupplement(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/profile-edit/profile-edit?step=${type}`
    });
  },

  // 稍后补全（跳过）
  skipSupplement() {
    // 标记已登录但不完整，后续再提醒
    store.set('profileComplete', false);
    store.set('profileSkipped', true);
    
    wx.navigateBack({
      fail: () => wx.reLaunch({ url: '/pages/home/home' })
    });
  },

  // 打开隐私协议
  openPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    });
  },

  // ===== 草稿提示 =====
  showDraftTip(draft) {
    wx.showModal({
      title: '检测到草稿',
      content: `您有未完成的${draft.type || '内容'}草稿，登录后继续编辑？`,
      confirmText: '继续编辑',
      cancelText: '放弃',
      success: (res) => {
        if (!res.confirm) {
          store.remove('draftData');
        }
      }
    });
  }
});