// 测试脚本：草稿跳转到行前清单并显示上一次填写的内容
// 复制到微信开发者工具控制台执行

console.log('🚀 开始测试：草稿跳转到行前清单...');

// 清空现有数据
wx.removeStorageSync('plans');
wx.removeStorageSync('precheckDraft');

// 创建测试行程数据
const testPlans = [
  // 历史行程（已完成）
  {
    id: 'history-1',
    title: '国庆杭州西湖徒步（已完成）',
    date: '2024-10-05',
    type: '徒步',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-10-05 17:30',
    checklistCount: 6,
    precheckData: {
      essentials: ['登山鞋', '水壶', '防晒霜', '地图', '急救包', '零食'],
      weatherCheck: '晴转多云，15-22°C，微风',
      safetyNotes: '路线全长15公里，注意补充水分，带好充电宝',
      emergencyContact: '张教练 13800138000',
      notes: '西湖边风景优美，适合拍照留念',
      completed: true,
      completedAt: '2024-10-05 17:30',
      rating: 4.5,
      feedback: '整体体验很好，下次还会选择这条路线'
    }
  },
  
  // 草稿行程 - 已有行前准备数据
  {
    id: 'draft-1',
    title: '春节海南度假（已有行前准备）',
    date: '2025-01-28',
    type: '度假',
    status: '已规划',
    isCompleted: false,
    isUpcoming: true,
    daysLeft: 몐ᜰ,
    checklistCount: 12,
    isDraft: true,
    precheckData: {
      destination: '海南三亚',
      dateValue: '2025-01-28',
      date: '2025年01月28日',
      activity: '亲子活动',
      environment: ['近水', '过夜'],
      essentials: ['泳衣', '防晒霜', '沙滩鞋', '太阳镜', '防晒衣', '遮阳帽'],
      weatherCheck: '热带气候，预计25-32°C，注意防晒',
      safetyNotes: '海边游玩注意安全，不要单独游泳',
      emergencyContact: '酒店前台 0898-88888888',
      notes: '已预订三亚亚龙湾酒店，包含早餐',
      route: null,
      lastUpdated: '2024-10-28 14:30',
      completed: false
    }
  },
  
  // 草稿行程 - 部分填写
  {
    id: 'draft-2',
    title: '秋季摄影之旅（部分填写）',
    date: '2024-11-10',
    type: '摄影',
    status: '已准备',
    isCompleted: false,
    isUpcoming: false,
    checklistCount: 8,
    isDraft: true,
    precheckData: {
      destination: '九寨沟',
      dateValue: '2024-11-10',
      date: '2024年11月10日',
      activity: '其他户外活动',
      environment: ['林地', '草地'],
      essentials: ['相机', '三脚架', '备用电池', '存储卡', '滤镜'],
      weatherCheck: '秋季凉爽，10-20°C，适合户外摄影',
      safetyNotes: '摄影器材贵重，注意保管',
      emergencyContact: '',
      notes: '主要拍摄秋叶和山水风光',
      route: null,
      lastUpdated: '2024-10-20 14:30',
      completed: false
    }
  },
  
  // 草稿行程 - 空白（无precheckData）
  {
    id: 'draft-3',
    title: '周末周边游（新建草稿）',
    date: '2024-11-23',
    type: '周边游',
    status: '待规划',
    isCompleted: false,
    isUpcoming: true,
    daysLeft: 15,
    checklistCount: 0,
    isDraft: true
    // 注意：没有precheckData字段
  }
];

// 存储数据
wx.setStorageSync('plans', testPlans);

console.log('✅ 测试数据设置完成！');
console.log('');
console.log('📊 包含的测试行程：');
console.log('');
console.log('1. 历史行程（已完成）');
console.log('   • 国庆杭州西湖徒步（已完成）');
console.log('   - 有完整的precheckData');
console.log('   - 应该跳转到precheck-result（只读）');
console.log('');

console.log('2. 草稿行程 - 已有行前准备数据');
console.log('   • 春节海南度假（已有行前准备）');
console.log('   - 有precheckData：目的地、日期、活动、环境等');
console.log('   - 应该跳转到precheck页面，并自动加载已有数据');
console.log('');

console.log('3. 草稿行程 - 部分填写');
console.log('   • 秋季摄影之旅（部分填写）');
console.log('   - 有部分precheckData');
console.log('   - 应该跳转到precheck页面，并自动加载已有数据');
console.log('');

console.log('4. 草稿行程 - 空白');
console.log('   • 周末周边游（新建草稿）');
console.log('   - 没有precheckData字段');
console.log('   - 应该跳转到precheck页面，显示空白表单');
console.log('');

console.log('🔄 测试步骤：');
console.log('');
console.log('1. 刷新小程序页面');
console.log('2. 进入"我的行程"页面');
console.log('3. 切换到"草稿"选项卡');
console.log('4. 点击任意草稿行程进行测试：');
console.log('');
console.log('   a) 点击"春节海南度假" → 应该：');
console.log('      - 跳转到行前清单页面');
console.log('      - 自动填充目的地"海南三亚"');
console.log('      - 自动填充日期"2025-01-28"');
console.log('      - 自动选择活动"亲子活动"');
console.log('      - 自动选择环境"近水"和"过夜"');
console.log('');
console.log('   b) 点击"秋季摄影之旅" → 应该：');
console.log('      - 跳转到行前清单页面');
console.log('      - 自动填充目的地"九寨沟"');
console.log('      - 自动填充日期"2024-11-10"');
console.log('      - 自动选择活动"其他户外活动"');
console.log('      - 自动选择环境"林地"和"草地"');
console.log('');
console.log('   c) 点击"周末周边游" → 应该：');
console.log('      - 跳转到行前清单页面');
console.log('      - 显示空白表单');
console.log('      - 可以开始填写新的行前准备');
console.log('');
console.log('5. 修改数据并保存：');
console.log('   - 修改表单内容');
console.log('   - 点击"保存草稿"按钮');
console.log('   - 返回行程页面，再次点击同一行程');
console.log('   - 应该显示上一次修改的内容');
console.log('');
console.log('💡 核心验证点：');
console.log('• 草稿全部跳转到precheck页面');
console.log('• 有数据的草稿自动加载上一次填写的内容');
console.log('• 修改后的数据能够正确保存');
console.log('• 再次进入时能够加载保存的数据');
console.log('');
console.log('🔧 技术实现验证：');
console.log('• my-plans.js修改：草稿全部跳转precheck');
console.log('• precheck.js修改：根据planId加载precheckData');
console.log('• 数据保存：保存到plan对象的precheckData字段中');