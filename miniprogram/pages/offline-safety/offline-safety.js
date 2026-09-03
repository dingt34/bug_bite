// pages/offline-safety/offline-safety.js
const store = require('../../utils/store.js');

Page({
  data: {
    // 安全卡数据
    safetyCard: {
      emergencyContacts: [
        { name: '急救中心', phone: '120' },
        { name: '警察', phone: '110' },
        { name: '火警', phone: '119' }
      ],
      firstAid: [
        { title: '止血', content: '用干净布料直接按压伤口，保持压力' },
        { title: '扭伤', content: '休息、冰敷、抬高患处、适当加压' },
        { title: '中暑', content: '转移到阴凉处，补充水分，降温' },
        { title: '失温', content: '进入温暖环境，更换干燥衣物，提供热饮' }
      ],
      safetyTips: [
        '保持通讯设备充足电量',
        '告知亲友行程安排和预计返回时间',
        '携带足够的水和食物',
        '注意天气预报，避免恶劣天气出行',
        '携带基本急救用品'
      ],
      // 可以绑定到特定行程
      boundPlanId: null,
      boundPlanTitle: null
    },
    
    // 当前行程信息（如果绑定）
    currentPlan: null,
    
    // 是否正在生成离线安全卡
    generating: false,
    
    // 可用份数
    availableCards: 2
  },

  onLoad(options) {
    // 如果有行程ID，加载行程信息
    const planId = options.id;
    if (planId) {
      this.loadPlanInfo(planId);
    }
    
    // 从缓存加载用户自定义的安全卡数据
    this.loadCustomSafetyCard();
  },

  // 加载行程信息
  loadPlanInfo(planId) {
    const plans = store.get('plans', []);
    const plan = plans.find(p => p.id === planId);
    
    if (plan) {
      this.setData({
        currentPlan: plan,
        'safetyCard.boundPlanId': planId,
        'safetyCard.boundPlanTitle': plan.title
      });
    }
  },

  // 加载用户自定义的安全卡数据
  loadCustomSafetyCard() {
    const customCard = store.get('safetyCard', null);
    if (customCard) {
      // 合并用户自定义数据
      this.setData({
        'safetyCard.emergencyContacts': customCard.emergencyContacts || this.data.safetyCard.emergencyContacts,
        'safetyCard.firstAid': customCard.firstAid || this.data.safetyCard.firstAid,
        'safetyCard.safetyTips': customCard.safetyTips || this.data.safetyCard.safetyTips
      });
    }
  },

  // 保存用户自定义的安全卡数据
  saveCustomSafetyCard() {
    const safetyCard = {
      emergencyContacts: this.data.safetyCard.emergencyContacts,
      firstAid: this.data.safetyCard.firstAid,
      safetyTips: this.data.safetyCard.safetyTips
    };
    
    store.set('safetyCard', safetyCard);
    
    wx.showToast({
      title: '已保存',
      icon: 'success',
      duration:淹没
    });
  },

  // 生成离线安全卡
  generateOfflineCard() {
    this.setData({ generating: true });
    
    // 模拟生成过程
    setTimeout(() => {
      // 保存生成的离线安全卡
      const offlineCard = {
        ...this.data.safetyCard,
        generatedAt: new Date().toISOString(),
        planId: this.data.currentPlan?.id
      };
      
      // 保存到缓存
      store.set('lastGeneratedCard', offlineCard);
      
      // 更新可用份数
      const newCount = this.data.availableCards - 1;
      this.setData({ 
        generating: false,
        availableCards: newCount
      });
      
      wx.showModal({
        title: '生成成功',
        content: '离线安全卡已生成，可在无网络时查看。',
        showCancel: false,
        success: () => {
          // 可以跳转到查看页面
        }
      });
    }, 1500);
  },

  // 添加紧急联系人
  addEmergencyContact() {
    const contacts = this.data.safetyCard.emergencyContacts;
    
    wx.showModal({
      title: '添加紧急联系人',
      editable: true,
      placeholderText: '请输入联系人姓名和电话，格式：姓名,电话',
      success: (res) => {
        if (res.confirm && res.content) {
          const input = res.content.split(',');
          if (input.length >= 2) {
            const name = input[0].trim();
            const phone = input[1].trim();
            
            contacts.push({ name, phone });
            
            this.setData({
              'safetyCard.emergencyContacts': contacts
            });
            
            this.saveCustomSafetyCard();
          }
        }
      }
    });
  },

  // 删除紧急联系人
  removeContact(e) {
    const index = e.currentTarget.dataset.index;
    const contacts = this.data.safetyCard.emergencyContacts;
    
    contacts.splice(index, 1);
    
    this.setData({
      'safetyCard.emergencyContacts': contacts
    });
    
    this.saveCustomSafetyCard();
  },

  // 查看最近生成的安全卡
  viewGeneratedCard() {
    const card = store.get('lastGeneratedCard', null);
    if (card) {
      wx.navigateTo({
        url: `/pages/offline-safety-view/offline-safety-view?id=${card.generatedAt}`
      });
    } else {
      wx.showToast({
        title: '没有可查看的安全卡',
        icon: 'none'
      });
    }
  },

  // 绑定到当前行程
  bindToCurrentPlan() {
    if (!this.data.currentPlan) {
      wx.showToast({
        title: '请先选择行程',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      'safetyCard.boundPlanId': this.data.currentPlan.id,
      'safetyCard.boundPlanTitle': this.data.currentPlan.title
    });
    
    wx.showToast({
      title: '已绑定到行程',
      icon: 'success'
    });
  },

  // 解除绑定
  unbindPlan() {
    this.setData({
      'safetyCard.boundPlanId': null,
      'safetyCard.boundPlanTitle': null
    });
    
    wx.showToast({
      title: '已解除绑定',
      icon: 'success'
    });
  },

  // 返回上一页
  back() {
    wx.navigateBack();
  }
});