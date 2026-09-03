// 最终完善的独立计划系统
// 实现：已有的计划展示已填写信息，新建行程跳转空白行前准备
// 复制到微信开发者工具控制台执行

console.log('🚀 开始设置最终完善的独立计划系统...');

// 清空现有数据
wx.removeStorageSync('plans');
wx.removeStorageSync('planDetails');

// 创建测试计划数据
const testPlans = [
  // ==== 历史行程（已完成）====
  {
    id: 'history-1',
    title: '杭州西湖徒步（已完成）',
    date: '2024-10-15',
    type: '徒步',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-10-15 18:30',
    checklistCount: 8
  },
  {
    id: 'history-2',
    title: '黄山露营（已完成）',
    date: '2024-09-20',
    type: '露营',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-09-22 10:15',
    checklistCount:",

  // ==== 已有的计划（有行程单，已填写信息）====
  {
    id: 'existing-plan-1',
    title: '夏季海边露营（已有计划）',
    date: '2024-07-20',
    type: '露营',
    status: '已规划',
    isCompleted: false,
    isUpcoming: false,
    hasRoutePlan: true, // 关键：有行程单
    checklistCount: 9,
    // 其他标识字段
    isDraft: true,
    hasPrecheckData: true
  },
  {
    id: 'existing-plan-2',
    title: '秋季摄影之旅（已有计划）',
    date: '2024-11-10',
    type: '摄影',
    status: '已规划',
    isCompleted: false,
    isUpcoming: false,
    hasRoutePlan: true, // 关键：有行程单
    checklistCount: 7,
    isDraft: true,
    hasPrecheckData: true
  },

  // ==== 新建的草稿（无行程单，无填写信息）====
  {
    id: 'new-draft-1',
    title: '新建的川西之旅（空白草稿）',
    date: '2024-12-01',
    type: '自驾游',
    status: '草稿',
    isCompleted: false,
    isUpcoming: true,
    hasRoutePlan: false, // 关键：无行程单
    daysLeft: 15,
    checklistCount: 0,
    isDraft: true,
    hasPrecheckData: false
  },
  {
    id: 'new-draft-2',
    title: '春节云南行计划（空白草稿）',
    date: '2025-01-28',
    type: '家庭旅行',
    status: '计划中',
    isCompleted: false,
    isUpcoming: false,
    hasRoutePlan: false, // 关键：无行程单
    checklistCount: 0,
    isDraft: true,
    hasPrecheckData: false
  }
];

// 为每个计划创建独立的详情数据
const planDetails = {
  // 历史行程（已完成）
  'history-1': {
    id: 'history-1',
    title: '杭州西湖徒步（已完成）',
    status: '已完成',
    precheckData: {
      essentials: ['登山鞋', '水壶', '防晒霜', '地图', '急救包'],
      weatherCheck: '晴转多云，15-22°C',
      safetyNotes: '路线较长，注意休息和补水',
      emergencyContact: '13800138000',
      completed: true,
      completedAt: '2024-10-15 18:30'
    }
  },
  'history-2': {
    id: 'history-2',
    title: '黄山露营（已完成）',
    status: '已完成',
    precheckData: {
      essentials: ['帐篷', '睡袋', '炉具', '食物', '头灯', '保暖衣物'],
      weatherCheck: '晴，5-15°C，夜间温度较低',
      safetyNotes: '注意防寒和野生动物',
      emergencyContact: '13900139000',
      completed: true,
      completedAt: '2024-09-22 10:15'
    }
  },

  // 已有的计划（已填写信息）
  'existing-plan-1': {
    id: 'existing-plan-1',
    title: '夏季海边露营（已有计划）',
    status: '已规划',
    precheckData: {
      essentials: ['帐篷', '防晒霜', '泳衣', '沙滩椅', '烧烤架'],
      weatherCheck: '夏季炎热，注意防晒，预计28-35°C',
      safetyNotes: '注意海浪和潮汐时间',
      emergencyContact: '13700137000',
      routePlan: {
        name: '海边露营三日行程',
        days: 3,
        schedule: [
          { day: 1, title: '抵达海边', activities: ['搭建营地', '海边游泳', '日落烧烤'] },
          { day: 2, title: '海岛探险', activities: ['乘坐渡轮', '海岛徒步', '海鲜大餐'] },
          { day: 3, title: '返程', activities: ['收拾营地', '购买特产', '返程'] }
        ]
      },
      lastUpdated: '2024-06-15 14:30',
      completed: false
    }
  },
  'existing-plan-2': {
    id: 'existing-plan-2',
    title: '秋季摄影之旅（已有计划）',
    status: '已规划',
    precheckData: {
      essentials: ['相机', '三脚架', '备用电池', '存储卡', '滤镜'],
      weatherCheck: '秋季凉爽，适合摄影，预计10-20°C',
      safetyNotes: '注意摄影器材安全，避免长时间曝晒',
      emergencyContact: '13600136000',
      routePlan: {
        name: '秋色摄影五日路线',
        days: 5,
        schedule: [
          { day: 1, title: '出发', activities: ['集合', '前往拍摄地', '设备检查'] },
          { day: 2, title: '日出拍摄', activities: ['凌晨出发', '日出拍摄', '后期处理'] },
          { day: 3, title: '秋色捕捉', activities: ['森林拍摄', '人物摄影', '夜景尝试'] },
          { day: 4, title: '人文摄影', activities: ['村落拍摄', '人物肖像', '民俗记录'] },
          { day: 5, title: '返程', activities: ['总结分享', '整理作品', '返程'] }
        ]
      },
      lastUpdated: '2024-10-08 09:45',
      completed: false
    }
  },

  // 新建的草稿（无填写信息）
  'new-draft-1': {
    id: 'new-draft-1',
    title: '新建的川西之旅（空白草稿）',
    status: '草稿',
    precheckData: null // 关键：没有填写信息
  },
  'new-draft-2': {
    id: 'new-draft-2',
    title: '春节云南行计划（空白草稿）',
    status: '计划中',
    precheckData: null // 关键：没有填写信息
  }
};

// 存储数据
wx.setStorageSync('plans', testPlans);
wx.setStorageSync('planDetails', planDetails);

console.log('✅ 最终完善的独立计划系统设置完成！');
console.log('');
console.log('📊 计划分类：');
console.log('1. 历史行程（2个）');
console.log('   - 杭州西湖徒步（已完成）');
console.log('   - 黄山露营（已完成）');
console.log('');
console.log('2. 已有的计划（有行程单，已填写信息）（2个）');
console.log('   - 夏季海边露营（已有计划）');
console.log('   - 秋季摄影之旅（已有计划）');
console.log('');
console.log('3. 新建的草稿（无行程单，无填写信息）（2个）');
console.log('   - 新建的川西之旅（空白草稿）');
console.log('   - 春节云南行计划（空白草稿）');
console.log('');
console.log('🔄 最终跳转逻辑：');
console.log('├─ 历史行程 → precheck-result（查看历史记录）');
console.log('├─ 已有的计划 → precheck（查看模式，展示已填写信息）');
console.log('└─ 新建的草稿 → precheck（编辑模式，空白行前准备）');
console.log('');
console.log('🔧 技术实现：');
console.log('• precheck页面通过mode参数区分模式：');
console.log('  - mode=view: 查看模式（展示已填写信息）');
console.log('  - mode=edit: 编辑模式（空白行前准备）');
console.log('• 跳转逻辑根据计划类型自动设置正确的mode');
console.log('');
console.log('📱 测试步骤：');
console.log('1. 复制此代码到开发者工具控制台执行');
console.log('2. 刷新页面查看所有计划');
console.log('3. 分别测试三种计划类型：');
console.log('   a) 历史行程 → 查看已完成记录');
console.log('   b) 已有的计划 → 查看已填写信息');
console.log('   c) 新建的草稿 → 空白行前准备');
console.log('');
console.log('💡 核心改进：');
console.log('• 已有的计划：展示在制定这个行程时填写的信息');
console.log('• 新建行程：跳转到纯粹、空白的行前准备');
console.log('• 完全实现计划间互相独立的状态');