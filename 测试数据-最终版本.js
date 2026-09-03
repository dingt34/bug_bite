// 测试数据 - 最终版本
// 复制到微信开发者工具控制台执行

const testPlans = [
  // 历史行程（已完成）
  {
    id: 'history-1',
    title: '杭州西湖徒步',
    date: '2024-10-15',
    type: '徒步',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-10-15 18:30',
    checklistCount: 8
  },
  {
    id: 'history-2',
    title: '黄山露营',
    date: '2024-09-20',
    type: '露营',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-09-22 10:15',
    checklistCount: π
  },
  {
    id: 'history-3',
    title: '张家界探险',
    date: '2024-08-05',
    type: '探险',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-08-08 16:00',
    checklistCount: 8
  },

  // 草稿行程（未完成）
  {
    id: 'draft-1',
    title: '即将出发的川西之旅',
    date: '2024-12-01',
    type: '自驾游',
    status: '进行中',
    isCompleted: false,
    isUpcoming: true,
    daysLeft: 15,
    checklistCount: 12
  },
  {
    id: 'draft-2',
    title: '春节云南行',
    date: '2025-01-28',
    type: '家庭旅行',
    status: '计划中',
    isCompleted: false,
    isUpcoming: false,
    checklistCount: 6
  },
  {
    id: 'draft-3',
    title: '夏季海边露营',
    date: '2024-07-20',
    type: '露营',
    status: '草稿',
    isCompleted: false,
    isUpcoming: false,
    checklistCount: 4
  },
  {
    id: 'draft-4',
    title: '秋季摄影之旅',
    date: '2024-11-10',
    type: '摄影',
    status: '计划中',
    isCompleted: false,
    isUpcoming: false,
    checklistCount: 7
  }
];

// 存储到本地存储
wx.setStorageSync('plans', testPlans);

console.log('✅ 测试数据已设置完成！');
console.log('');
console.log('📋 包含数据：');
console.log('- 3个历史行程（已完成，查看模式）');
console.log('- 4个草稿行程（1个即将出发，3个其他计划，编辑模式）');
console.log('');
console.log('🔄 跳转逻辑：');
console.log('1. 历史界面 → 点击行程 → /pages/precheck-result/precheck-result');
console.log('   - 展示当时填写的行前准备数据和选择');
console.log('   - 如果有相关事件，页面中会显示事件详情');
console.log('');
console.log('2. 草稿界面 → 点击行程 → /pages/precheck/precheck');
console.log('   - 填写/编辑行前准备');
console.log('');
console.log('📱 测试步骤：');
console.log('1. 复制此代码到开发者工具控制台执行');
console.log('2. 刷新页面查看效果');
console.log('3. 分别点击历史行程和草稿行程测试跳转');