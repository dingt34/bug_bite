// 独立计划系统 - 解决计划间互相独立的问题
// 复制到微信开发者工具控制台执行

console.log('🚀 开始设置独立计划系统...');

// 清空现有数据，确保从干净状态开始
wx.removeStorageSync('plans');
wx.removeStorageSync('planDetails');
wx.removeStorageSync('routePlans');

// 创建三个独立的草稿计划
const independentPlans = [
  {
    id: 'plan-1',
    title: '计划A：杭州西湖徒步',
    date: '2024-11-15',
    type: '徒步',
    status: '草稿',
    isCompleted: false,
    isUpcoming: true,
    hasRoutePlan: false,
    daysLeft: 10,
    checklistCount: 5
  },
  {
    id: 'plan-2',
    title: '计划B：黄山露营',
    date: '2024-12-01',
    type: '露营',
    status: '计划中',
    isCompleted: false,
    isUpcoming: false,
    hasRoutePlan: true,
    daysLeft: 25,
    checklistCount: 8
  },
  {
    id: 'plan-3',
    title: '计划C：张家界探险',
    date: '2025-01-10',
    type: '探险',
    status: '已规划',
    isCompleted: false,
    isUpcoming: false,
    hasRoutePlan: true,
    daysLeft: 60,
    checklistCount: 12
  }
];

// 为每个计划创建独立的详情数据
const planDetails = {
  'plan-1': {
    id: 'plan-1',
    title: '杭州西湖徒步',
    date: '2024-11-15',
    type: '徒步',
    status: '草稿',
    // 行前准备数据
    precheckData: {
      essentials: ['登山鞋', '水壶', '防晒霜', '地图'],
      weatherCheck: '晴转多云，15-22°C',
      safetyNotes: '注意防滑，带好急救包',
      lastUpdated: '2024-10-25 10:30'
    },
    routePlan: null // 还没有行程单
  },
  'plan-2': {
    id: 'plan-2',
    title: '黄山露营',
    date: '2024-12-01',
    type: '露营',
    status: '计划中',
    // 行前准备数据
    precheckData: {
      essentials: ['帐篷', '睡袋', '炉具', '食物', '头灯'],
      weatherCheck: '寒冷，预计-5°C到5°C',
      safetyNotes: '注意防寒，带好保暖装备',
      lastUpdated: '2024-10-26 14:20'
    },
    // 独立的行程单数据
    routePlan: {
      id: 'route-plan-2',
      name: '黄山三日露营行程',
      days: 3,
      schedule: [
        { day: 1, title: '抵达黄山', activities: ['到达黄山脚下', '入住营地', '准备晚餐'] },
        { day: 2, title: '登山观景', activities: ['早起看日出', '游览天都峰', '拍摄云海'] },
        { day: 3, title: '下山返回', activities: ['收拾营地', '徒步下山', '返程'] }
      ],
      lastUpdated: '2024-10-26 14:20'
    }
  },
  'plan-3': {
    id: 'plan-3',
    title: '张家界探险',
    date: '2025-01-10',
    type: '探险',
    status: '已规划',
    // 行前准备数据
    precheckData: {
      essentials: ['探险装备', '绳索', 'GPS', '急救箱', '应急食品'],
      weatherCheck: '冬季，预计0-8°C',
      safetyNotes: '专业向导陪同，注意安全',
      lastUpdated: '2024-10-27 09:15'
    },
    // 独立的行程单数据
    routePlan: {
      id: 'route-plan-3',
      name: '张家界探险五日行程',
      days: 5,
      schedule: [
        { day: 1, title: '抵达张家界', activities: ['到达武陵源', '入住酒店', '团队会议'] },
        { day: 2, title: '天子山探险', activities: ['游览天子山', '袁家界观景', '金鞭溪徒步'] },
        { day: 3, title: '天门山挑战', activities: ['天门山索道', '玻璃栈道', '天门洞'] },
        { day: 4, title: '探险活动', activities: ['攀岩体验', '速降挑战', '洞穴探险'] },
        { day: 5, title: '总结返程', activities: ['总结会议', '收拾装备', '返程'] }
      ],
      lastUpdated: '2024-10-27 09:15'
    }
  }
};

// 存储独立的数据
wx.setStorageSync('plans', independentPlans);
wx.setStorageSync('planDetails', planDetails);

// 如果需要，也可以存储行程单到单独的位置
const routePlans = {};
for (const planId in planDetails) {
  if (planDetails[planId].routePlan) {
    routePlans[planId] = planDetails[planId].routePlan;
  }
}
wx.setStorageSync('routePlans', routePlans);

console.log('✅ 独立计划系统设置完成！');
console.log('');
console.log('📊 创建的独立计划：');
console.log('1. 计划A (plan-1): 杭州西湖徒步');
console.log('   - 状态：草稿，无行程单');
console.log('   - 点击后跳转到：precheck（新建行前准备）');
console.log('');
console.log('2. 计划B (plan-2): 黄山露营');
console.log('   - 状态：计划中，有行程单');
console.log('   - 点击后跳转到：route-plan（编辑行程单）');
console.log('   - 独立数据：三日露营行程');
console.log('');
console.log('3. 计划C (plan-3): 张家界探险');
console.log('   - 状态：已规划，有行程单');
console.log('   - 点击后跳转到：route-plan（编辑行程单）');
console.log('   - 独立数据：五日探险行程');
console.log('');
console.log('🔧 技术实现：');
console.log('• 每个计划有独立的ID：plan-1, plan-2, plan-3');
console.log('• 独立的详情数据存储在 planDetails 对象中');
console.log('• 独立的行程单数据存储在 routePlans 对象中');
console.log('• 页面根据ID加载对应的独立数据');
console.log('');
console.log('📱 测试步骤：');
console.log('1. 复制此代码到开发者工具控制台执行');
console.log('2. 刷新页面查看三个独立计划');
console.log('3. 分别点击每个计划测试跳转');
console.log('4. 验证每个计划的数据都是独立的');
console.log('');
console.log('⚠️ 注意：页面代码需要相应修改才能正确加载独立数据！');
console.log('我已经修改了 my-plans.js 中的 open 函数，');
console.log('还需要修改 precheck.js 和 route-plan.js 来加载对应ID的数据。');