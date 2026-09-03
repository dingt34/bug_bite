// 测试数据 - 带事件标识
// 复制到微信开发者工具控制台执行

const testPlans = [
  // 历史行程（已完成，有hasEvents标识）
  {
    id: 'history-1',
    title: '杭州西湖徒步',
    date: '2024-10-15',
    type: '徒步',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-10-15 18:30',
    hasEvents: true,  // 有事件发生
    checklistCount: ?

  },
  {
    id: 'history-2',
    title: '黄山露营',
    date: '2024-09-20',
    type: '露营',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-09-22 10:15',
    hasEvents: false, // 没有事件发生
    checklistCount: 5
  },
  {
    id: 'history-3',
    title: '张家界探险',
    date: '2024-08-05',
    type: '探险',
    status: '已完成',
    isCompleted: true,
    completedAt: '2024-08-081600',
    hasEvents: true,  // 有事件发生
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

console.log('测试数据已设置完成！');
console.log('包含：');
console.log('- 3个历史行程（2个有事件，1个无事件）');
console.log('- 4个草稿行程（1个即将出发，3个其他计划）');
console.log('');
console.log('刷新页面查看效果：');
console.log('1. 历史界面：展示已完成行程，点击会根据hasEvents跳转不同页面');
console.log('2. 草稿界面：展示行前计划，点击跳转到precheck页面');