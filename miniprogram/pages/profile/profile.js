// pages/profile/profile.js
Page({
  data: {
    // 用户信息
    user: {
      avatar: '',
      nickname: '',
      region: ''
    },
    // 档案完整度 (0-100)
    profileComplete: 80,
    // 待复查信息
    pendingReview: {
      title: '蚊虫叮咬',
      urgency: '尽快',
      time: '还有3天'
    },
    // 近期行程
    upcomingPlan: {
      title: '丽水徒步',
      daysLeft: '还有5天'
    },
    // 统计摘要
    eventSummary: '3条记录 · 1条待复查',
    planSummary: '3个计划 · 2份离线卡',
    // 同步状态: '已同步' | '同步中' | '待同步'
    syncStatus: '已同步',
    // 社群统计开关
    communityEnabled: false
  },

  onLoad() {
    this.loadUserInfo()
    this.loadPendingData()
    this.loadSyncStatus()
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadUserInfo()
  },

  // ===== 数据加载方法 =====
  loadUserInfo() {
    try {
      const userInfo = wx.getStorageSync('userInfo')
      if (userInfo) {
        this.setData({
          user: {
            avatar: userInfo.avatar || '',
            nickname: userInfo.nickname || '未登录',
            region: userInfo.region || '请选择常住地区'
          },
          profileComplete: userInfo.profileComplete || 80
        })
      } else {
        // 未登录状态，显示占位
        this.setData({
          user: {
            avatar: '',
            nickname: '未登录',
            region: '请选择常住地区'
          },
          profileComplete: 0
        })
      }
    } catch (e) {
      console.error('读取用户信息失败', e)
    }
  },

  loadPendingData() {
    // 从本地缓存或服务器获取待复查数据
    try {
      const pending = wx.getStorageSync('pendingReview')
      if (pending) {
        this.setData({
          pendingReview: pending,
          eventSummary: `${pending.totalCount || 0}条记录 · ${pending.reviewCount || 0}条待复查`
        })
      }
    } catch (e) {
      console.error('读取待复查数据失败', e)
    }
  },

  loadSyncStatus() {
    // 获取同步状态
    try {
      const status = wx.getStorageSync('syncStatus')
      if (status) {
        this.setData({ syncStatus: status })
      }
    } catch (e) {
      console.error('读取同步状态失败', e)
    }
  },

  // ===== 页面跳转方法 =====
  // 跳转编辑档案（未登录则跳转登录）
  goToEditProfile() {
    const { user } = this.data
    if (!user.nickname || user.nickname === '未登录') {
      wx.navigateTo({
        url: '/pages/login/login'
      })
    } else {
      wx.navigateTo({
        url: '/pages/profile-edit/profile-edit'
      })
    }
  },

  // 跳转我的事件
  goToEvents() {
    wx.navigateTo({
      url: '/pages/events/events'
    })
  },

  // 跳转我的行程
  goToMyPlans() {
    wx.navigateTo({
      url: '/pages/my-plans/my-plans'
    })
  },

  // 跳转事件详情（如果有待复查事件）
  goToEventDetail(e) {
    const eventId = e.currentTarget.dataset.id
    if (eventId) {
      wx.navigateTo({
        url: `/pages/event-detail/event-detail?id=${eventId}`
      })
    } else {
      // 没有具体事件，跳转到事件列表
      this.goToEvents()
    }
  },

  // 跳转隐私设置
  goToPrivacy() {
    wx.navigateTo({
      url: '/pages/privacy/privacy'
    })
  },

  // 跳转社群统计（切换Tab）
  goToCommunity() {
    // 如果社群在底部TabBar中
    wx.switchTab({
      url: '/pages/community/community'
    })
    // 如果社群是独立页面，用 navigateTo
    // wx.navigateTo({ url: '/pages/community/community' })
  },

  // 跳转提醒设置
  goToReminder() {
    wx.navigateTo({
      url: '/pages/reminder/reminder'
    })
  },

  // 同步数据
  syncData() {
    if (this.data.syncStatus === '已同步') {
      wx.showToast({
        title: '已是最新数据',
        icon: 'success'
      })
      return
    }

    this.setData({ syncStatus: '同步中' })
    wx.showLoading({ title: '同步中...' })

    // 模拟同步请求
    setTimeout(() => {
      wx.hideLoading()
      this.setData({ syncStatus: '已同步' })
      wx.setStorageSync('syncStatus', '已同步')
      wx.showToast({
        title: '同步完成',
        icon: 'success'
      })
    }, 1500)
  },

  // 切换社群统计开关
  toggleCommunity() {
    const newStatus = !this.data.communityEnabled
    this.setData({ communityEnabled: newStatus })
    // 存储到本地或发送到服务器
    wx.setStorageSync('communityEnabled', newStatus)
    wx.showToast({
      title: newStatus ? '社群统计已开启' : '社群统计已关闭',
      icon: 'none'
    })
  }
})