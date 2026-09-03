// 测试数据 - 最终跳转逻辑
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
    checklistCount: 12
  },

  // 草稿行程 - 新建的草稿（还没有行程单）
  {
    id: 'new-draft-1',
    title: '新建的川西之旅',
    date: '2024-12-01',
    type: '自驾游',
    status: '草稿',
    isCompleted: false,
    isUpcoming: true,
    hasRoutePlan: false, // 没有行程单
    daysLeft: 15,
    checklistCount: 5
  },
  {
    id: 'new-draft-2',
    title: '春节云南行计划',
    date: '2025-01-28',
    type: '家庭旅行',
    status: '计划中',
    isCompleted: false,
    isUpcoming: false,
    hasRoutePlan: false, // 没有行程单
    checklistCount: administrativeMark
  },

  // 草稿行程 - 已有的计划（已经有行程单）
  {
    id: 'existing-plan-1',
    title: '夏季海边露营（已有行程单）',
    date: '2024-07-20',
    type: '露营',
    status: '已规划',
    isCompleted: false,
    isUpcoming: false,
    hasRoutePlan: true, // 已经有行程单
    routePlanName: '海边露营详细行程',
    checklistCount: 9
  },
  {
    id: 'existing-plan-2',
    title: '秋季摄影之旅（已有行程单）',
    date: '2024-11-10',
    type: '摄影',
    status: '已规划',
    isCompleted: false,
    isUpcoming: false,
    hasRoutePlan: true, // 已经有行程单
    routePlanName: '秋色摄影路线',
    checklistCount: 7
  }
];

// 存储到本地存储
wx.setStorageSync('plans', testPlans);

console.log('✅ 测试数据已设置完成！');
console.log('');
console.log('📋 包含数据：');
console.log('- 2个历史行程（已完成，查看模式）');
console.log('- 2个新建草稿（没有行程单）');
console.log('- 2个已有计划（有行程单）');
console.log('');
console.log('🔄 最终跳转逻辑：');
console.log('1. 历史行程 → /pages/precheck-result/precheck-result');
console.log('   - 查看历史行前准备数据');
console.log('');
console.log('2. 新建草稿（hasRoutePlan: false）');
console.log('   → /pages/precheck/precheck');
console.log('   - 新建行前准备');
console.log('');
console.log('3. 已有计划（hasRoutePlan: true）');
console.log('   → /pages/route-plan/route-plan');
console.log('   - 查看/编辑已有的行程单');
console.log('   - 提供进一步编辑的通道');
console.log('');
console.log('📱 测试步骤：');
console.log('1. 复制此代码到开发者工具控制台执行');
console.log('2. 刷新页面查看效果');
console.log('3. 分别测试三种类型的行程跳转');