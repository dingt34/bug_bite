// 最终方案：已有的行程跳转到行前清单，新增行程跳转到行前准备
// 复制到微信开发者工具控制台执行

console.log('🚀 开始设置最终方案：行前清单与行前准备系统...');

// 清空现有数据
wx.removeStorageSync('plans');
wx.removeStorageSync('planDetails');

// 创建测试计划数据
const testPlans = [
  // ==== 历史行程（已完成）====
  {
    id: 'history-1',
    title: '国庆杭州西湖徒步（已完成）',
    date: '2024-10-05',
    type: '徒步',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-10-05 17:30',
    checklistCount: aning
  },
  {
    id: 'history-2',
    title: '中秋黄山露营（已完成）',
    date: '2024-09-15',
    type: '露营',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-09-16 11:20',
    checklistCount: aning
  },

  // ==== 已有的行程（有行前准备数据）====
  {
    id: 'existing-1',
    title: '春节海南度假（已有行程）',
    date: '2025-01-28',
    type: '度假',
    status: '已规划',
    isCompleted: false,
    isUpcoming: true,
    hasRoutePlan: true, // 关键：已有行前准备数据
    daysLeft: 90,
    checklistCount: 12,
    isDraft: true
  },
  {
    id: 'existing-2',
    title: '秋季摄影之旅（已有行程）',
    date: '2024-11-10',
    type: '摄影',
    status: '已准备',
    isCompleted: false,
    isUpcoming: false,
    hasRoutePlan: true, // 关键：已有行前准备数据
    checklistCount: 8,
    isDraft: true
  },

  // ==== 新增的行程（无行前准备数据）====
  {
    id: 'new-1',
    title: '新建：周末周边游',
    date: '2024-11-23',
    type: '周边游',
    status: '待规划',
    isCompleted: false,
    isUpcoming: true,
    hasRoutePlan: false, // 关键：无行前准备数据
    daysLeft: 15,
    checklistCount: 0,
    isDraft: true
  },
  {
    id: 'new-2',
    title: '新建：寒假滑雪计划',
    date: '2025-01-15',
    type: '滑雪',
    status: '构思中',
    isCompleted: false,
    isUpcoming: false,
    hasRoutePlan: false, // 关键：无行前准备数据
    checklistCount: 0,
    isDraft: true
  }
];

// 为每个计划创建独立的详情数据
const planDetails = {
  // 历史行程（已完成）
  'history-1': {
    id: 'history-1',
    title: '国庆杭州西湖徒步（已完成）',
    status: '已完成',
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
  'history-2': {
    id: 'history-2',
    title: '中秋黄山露营（已完成）',
    status: '已完成',
    precheckData: {
      essentials: ['帐篷', '睡袋', '炉具', '食物', '头灯', '保暖衣物', '防潮垫'],
      weatherCheck: '晴朗，5-15°C，夜间温度较低需注意保暖',
      safetyNotes: '营地有野生动物出没，食物需妥善保管',
      emergencyContact: '营地管理 13900139000',
      notes: '山顶日出非常壮观，值得早起',
      completed: true,
      completedAt: '2024-09-16 11:20',
      rating: 4.8,
      feedback: '夜晚星空很美，但温度较低需做好保暖'
    }
  },

  // 已有的行程（有行前准备数据）
  'existing-1': {
    id: 'existing-1',
    title: '春节海南度假（已有行程）',
    status: '已规划',
    precheckData: {
      essentials: ['泳衣', '防晒霜', '沙滩鞋', '太阳镜', '防晒衣', '遮阳帽'],
      weatherCheck: '热带气候，预计25-32°C，注意防晒',
      safetyNotes: '海边游玩注意安全，不要单独游泳',
      emergencyContact: '酒店前台 0898-88888888',
      notes: '已预订三亚亚龙湾酒店，包含早餐',
      routePlan: {
        name: '海南七日度假行程',
        days: 7,
        schedule: [
          { day: 1, title: '抵达三亚', activities: ['入住酒店', '海边散步', '海鲜晚餐'] },
          { day: 2, title: '亚龙湾海滩', activities: ['沙滩活动', '游泳', '水上项目'] },
          { day: 3, title: '蜈支洲岛', activities: ['渡轮前往', '海岛探险', '潜水体验'] },
          { day: 4, title: '热带雨林', activities: ['呀诺达雨林', '徒步', '观赏热带植物'] },
          { day: 5, title: '免税购物', activities: ['三亚免税店', '购物', '美食体验'] },
          { day: 6, title: '自由活动', activities: ['酒店休息', 'SPA体验', '海边日落'] },
          { day: 7, title: '返程', activities: ['收拾行李', '机场送机', '返程'] }
        ]
      },
      lastUpdated: '2024-10-28 III}
    }
  },
  'existing-2': {
    id: 'existing-2',
    title: '秋季摄影之旅（已有行程）',
    status: '已准备',
    precheckData: {
      essentials: ['相机', '三脚架', '备用电池', '存储卡', '滤镜', '清洁工具'],
      weatherCheck: '秋季凉爽，10-20°C，适合户外摄影',
      safetyNotes: '摄影器材贵重，注意保管，避免长时间曝晒',
      emergencyContact: '摄影指导 13600136000',
      notes: '主要拍摄秋叶和山水风光',
      routePlan: {
        name: '秋色摄影五日路线',
        days: 5,
        schedule: [
          { day: 1, title: '出发', activities: ['集合', '设备检查', '前往拍摄地'] },
          { day: 2, title: '日出拍摄', activities: ['凌晨出发', '日出拍摄', '后期处理'] },
          { day: 3, title: '秋色捕捉', activities: ['森林拍摄', '人物摄影', '夜景尝试'] },
          { day: 4, title: '人文摄影', activities: ['村落拍摄', '人物肖像', '民俗记录'] },
          { day: 5, title: '返程', activities: ['总结分享', '整理作品', '返程'] }
        ]
      },
      lastUpdated: '2024-10-20 14:30',
      completed: false
    }
  },

  // 新增的行程（无行前准备数据）
  'new-1': {
    id: 'new-1',
    title: '新建：周末周边游',
    status: '待规划',
    precheckData: null // 关键：没有行前准备数据
  },
  'new-2': {
    id: 'new-2',
    title: '新建：寒假滑雪计划',
    status: '构思中',
    precheckData: null // 关键：没有行前准备数据
  }
};

// 存储数据
wx.setStorageSync('plans', testPlans);
wx.setStorageSync('planDetails', planDetails);

console.log('✅ 最终方案设置完成！');
console.log('');
console.log('📊 计划分类（6个计划）：');
console.log('');

console.log('1. 历史行程（已完成）→ 行前清单（只读）');
console.log('   • 国庆杭州西湖徒步（已完成）');
console.log('   • 中秋黄山露营（已完成）');
console.log('');

console.log('2. 已有的行程（有数据）→ 行前清单（可编辑）');
console.log('   • 春节海南度假（已有行程）');
console.log('   • 秋季摄影之旅（已有行程）');
console.log('');

console.log('3. 新增的行程（无数据）→ 行前准备（空白表单）');
console.log('   • 新建：周末周边游');
console.log('   • 新建：寒假滑雪计划');
console.log('');

console.log('🔄 最终跳转逻辑：');
console.log('├─ 历史行程 → precheck-result（行前清单 - 只读查看）');
console.log('├─ 已有的行程 → precheck-result（行前清单 - 可编辑）');
console.log('└─ 新增的行程 → precheck（行前准备 - 空白表单）');
console.log('');

console.log('🔧 技术实现：');
console.log('• precheck-result页面现在支持两种模式：');
console.log('  - 查看模式（历史行程）：只读，展示历史记录');
console.log('  - 编辑模式（已有的行程）：可编辑，提供"编辑行前准备"按钮');
console.log('• precheck页面：纯粹的空白表单，用于新增行程');
console.log('');

console.log('📱 测试步骤：');
console.log('1. 复制此代码到开发者工具控制台执行');
console.log('2. 刷新页面查看所有计划');
console.log('3. 分别测试三种跳转：');
console.log('   a) 点击历史行程 → 查看行前清单（只读）');
console.log('   b) 点击已有的行程 → 查看行前清单（可编辑）');
console.log('   c) 点击新增的行程 → 填写行前准备（空白表单）');
console.log('');

console.log('💡 核心优势：');
console.log('• 功能明确：行前清单 vs 行前准备');
console.log('• 用户体验：用户清楚知道每个按钮的功能');
console.log('• 逻辑清晰：已有的看清单，新增的做准备');
console.log('• 独立数据：每个行程都有自己独立的数据存储');