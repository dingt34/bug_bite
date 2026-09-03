// 最终方案：草稿页的所有行程都跳转到行前清单
// 无论填写是否完整，都跳转到 precheck-result
// 复制到微信开发者工具控制台执行

console.log('🚀 开始设置最终方案：草稿全部跳转行前清单...');

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
    checklistCount: 6
  },
  {
    id: 'history-2',
    title: '中秋黄山露营（已完成）',
    date: '2024-09-15',
    type: '露营',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-09-16 11:20',
    checklistCount: 7
  },

  // ==== 草稿计划（各种状态）====
  {
    id: 'draft-1',
    title: '已填写完整的草稿',
    date: '2024-12-01',
    type: '城市游',
    status: '已准备',
    isCompleted: false,
    isUpcoming: true,
    daysLeft: 35,
    checklistCount:第十三8,
    isDraft: true
  },
  {
    id: 'draft-2',
    title: '已部分填写的草稿',
    date: '2024-12-15',
    type: '自驾游',
    status: '进行中',
    isCompleted: false,
    isUpcoming: false,
    checklistCount: 5,
    isDraft: true
  },
  {
    id: 'draft-3',
    title: '空白的草稿',
    date: '2025-01-10',
    type: '滑雪',
    status: '待规划',
    isCompleted: false,
    isUpcoming: true,
    daysLeft: 85,
    checklistCount: 0,
    isDraft: true
  },
  {
    id: 'draft-4',
    title: '构思中的草稿',
    date: '2025-02-14',
    type: '情人节旅行',
    status: '构思中',
    isCompleted: false,
    isUpcoming: false,
    checklistCount: 2,
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

  // 草稿计划
  'draft-1': {
    id: 'draft-1',
    title: '已填写完整的草稿',
    status: '已准备',
    precheckData: {
      essentials: ['相机', '三脚架', '充电宝', '身份证', '信用卡', '洗漱用品', '换洗衣物', '药品'],
      weatherCheck: '预计12-20°C，可能有阵雨，建议带伞',
      safetyNotes: '贵重物品随身携带，注意保管证件',
      emergencyContact: '酒店前台 028-88888888',
      notes: '已预订成都市区酒店，靠近春熙路',
      routePlan: {
        name: '成都三日游行程',
        days: 3,
        schedule: [
          { day: 1, title: '抵达成都', activities: ['入住酒店', '宽窄巷子', '火锅晚餐'] },
          { day: 2, title: '熊猫基地', activities: ['看熊猫', '武侯祠', '锦里古街'] },
          { day: 3, title: '青城山', activities: ['登山', '道观参观', '返程'] }
        ]
      },
      lastUpdated: '2024-10-30 10:15',
      completed: false
    }
  },
  'draft-2': {
    id: 'draft-2',
    title: '已部分填写的草稿',
    status: '进行中',
    precheckData: {
      essentials: ['驾照', '行车证', '地图', '零食', '水'],
      weatherCheck: '尚未查看天气',
      safetyNotes: '长途驾驶注意休息，每2小时休息一次',
      emergencyContact: '',
      notes: '计划从上海到南京自驾',
      completed: false
    }
  },
  'draft-3': {
    id: 'draft-3',
    title: '空白的草稿',
    status: '待规划',
    precheckData: null // 空白草稿
  },
  'draft-4': {
    id: 'draft-4',
    title: '构思中的草稿',
    status: '构思中',
    precheckData: {
      essentials: ['礼物', '惊喜道具'],
      weatherCheck: '',
      safetyNotes: '',
      emergencyContact: '',
      notes: '情人节特别行程，需要保密',
      completed: false
    }
  }
};

// 存储数据
wx.setStorageSync('plans', testPlans);
wx.setStorageSync('planDetails', planDetails);

console.log('✅ 最终方案设置完成！');
console.log('');
console.log('📊 计划分类（6个计划）：');
console.log('');

console.log('1. 历史行程（已完成）→ 行前清单（只读查看）');
console.log('   • 国庆杭州西湖徒步（已完成）');
console.log('   • 中秋黄山露营（已完成）');
console.log('');

console.log('2. 草稿计划（各种状态）→ 全部跳转到行前清单');
console.log('   • 已填写完整的草稿 → 展示完整内容，可编辑');
console.log('   • 已部分填写的草稿 → 展示部分内容，可继续编辑');
console.log('   • 空白的草稿 → 显示"开始填写"按钮');
console.log('   • 构思中的草稿 → 展示构思内容，可完善');
console.log('');

console.log('🔄 最终跳转逻辑：');
console.log('├─ 历史tab → precheck-result（行前清单 - 只读查看）');
console.log('└─ 草稿tab → precheck-result（行前清单 - 全部可编辑）');
console.log('');

console.log('🔧 技术实现：');
console.log('• my-plans.js修改：删除了hasRoutePlan判断，草稿全部跳转precheck-result');
console.log('• precheck-result页面改进：');
console.log('  - 对于有数据的草稿：展示内容，提供"编辑"按钮');
console.log('  - 对于空白草稿：显示"开始填写"界面');
console.log('  - 对于历史行程：只读查看');
console.log('');

console.log('📱 测试步骤：');
console.log('1. 复制此代码到开发者工具控制台执行');
console.log('2. 刷新页面查看所有计划');
console.log('3. 测试跳转逻辑：');
console.log('   a) 点击历史行程 → 查看行前清单（只读）');
console.log('   b) 点击任意草稿计划 → 全部跳转到行前清单');
console.log('');

console.log('💡 核心优势：');
console.log('• 统一体验：草稿页所有行程跳转一致');
console.log('• 功能明确：行前清单作为统一入口');
console.log('• 灵活编辑：无论填写是否完整，都在行前清单中编辑');
console.log('• 用户体验：不会混淆用户，点击前就知道会看到行前清单');