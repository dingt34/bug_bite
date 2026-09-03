// 修复错误并测试
// 复制到微信开发者工具控制台执行

console.log('🔧 开始修复错误并测试...');

// 步骤1：创建format.js文件（已完成）

// 步骤2：修改my-plans.js引用方式（已完成）

// 步骤3：创建测试数据
console.log('📝 创建测试数据...');

// 获取今天的日期
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

// 创建过去日期（昨天）
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const yesterdayStr = yesterday.toISOString().split('T')[0];

// 创建未来日期（明天）
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

// 创建未来日期（一周后）
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);
const nextWeekStr = nextWeek.toISOString().split('T')[0];

const testPlans = [
  {
    id: 'history-1',
    title: '昨天完成的行程',
    date: yesterdayStr.replace('-', '年').replace('-', '月') + '日',
    dateValue: yesterdayStr,
    type: '工作',
    status: '已完成',
    precheckData: {
      destination: '公司会议室',
      dateValue: yesterdayStr,
      activity: '会议',
      environment: ['室内'],
      lastUpdated: '2024-10-27T10:30:00Z'
    }
  },
  {
    id: 'draft-1',
    title: '明天海边度假',
    date: tomorrowStr.replace('-', '年').replace('-', '月') + '日',
    dateValue: tomorrowStr,
    type: '度假',
    status: '草稿',
    precheckData: {
      destination: '三亚海滩',
      dateValue: tomorrowStr,
      activity: '亲子活动',
      environment: ['近水', '过夜'],
      lastUpdated: '2024-10-28T14:30:00Z'
    }
  },
  {
    id: 'draft-2',
    title: '下周团队建设',
    date: nextWeekStr.replace('-', '年').replace('-', '月') + '日',
    dateValue: nextWeekStr,
    type: '团建',
    status: '草稿',
    precheckData: {
      destination: '团建基地',
      dateValue: nextWeekStr,
      activity: '团队活动',
      environment: ['户外', '过夜'],
      lastUpdated: '2024-10-29T09:15:00Z'
    }
  },
  {
    id: 'draft-3',
    title: '待定周末游',
    date: '', // 没有日期
    type: '周边游',
    status: '待规划'
    // 注意：没有precheckData字段
  }
];

// 存储数据
wx.setStorageSync('plans', testPlans);
wx.removeStorageSync('precheckDraft'); // 清除临时草稿

console.log('✅ 测试数据创建完成！');
console.log('');
console.log('📊 测试数据统计：');
console.log(`• 过去日期行程：1个 (${yesterdayStr})`);
console.log(`• 今天日期：${todayStr}`);
console.log(`• 未来日期行程：2个 (${tomorrowStr}, ${nextWeekStr})`);
console.log(`• 无日期行程：1个`);
console.log('');

console.log('🧪 测试步骤：');
console.log('');
console.log('1. 检查错误是否修复');
console.log('   a) 刷新小程序');
console.log('   b) 进入"我的行程"页面');
console.log('   c) 应该不再显示"module utils/format.js is not defined"错误');
console.log('');

console.log('2. 验证日期分类逻辑');
console.log('   a) 草稿页应显示：3个行程（明天、下周、无日期）');
console.log('   b) 历史页应显示：1个行程（昨天）');
console.log('   c) 检查日期分类是否正确');
console.log('');

console.log('3. 测试新建行程功能');
console.log('   a) 点击"新建行前计划"按钮');
console.log('   b) 应该跳转到precheck页面，表单应该是空的');
console.log('   c) 填写一些信息，点击"生成计划"');
console.log('   d) 保存后返回，新行程应该出现在草稿页');
console.log('');

console.log('4. 测试编辑已有行程');
console.log('   a) 点击"明天海边度假"');
console.log('   b) 应该跳转到precheck页面，表单应该自动填充已有数据');
console.log('   c) 修改一些信息后保存');
console.log('   d) 返回行程页面，再次点击同一行程');
console.log('   e) 应该显示修改后的数据');
console.log('');

console.log('5. 测试离线安全卡功能');
console.log('   a) 点击"离线安全卡"卡片');
console.log('   b) 应该跳转到离线安全卡页面');
console.log('   c) 测试添加紧急联系人');
console.log('   d) 测试生成离线安全卡');
console.log('');

console.log('6. 测试删除功能');
console.log('   a) 草稿页点击"删除"按钮');
console.log('   b) 确认删除弹窗');
console.log('   c) 行程应该被删除');
console.log('');

console.log('7. 测试历史页权限');
console.log('   a) 切换到"历史"选项卡');
console.log('   b) 点击"昨天完成的行程"');
console.log('   c) 应该跳转到只读页面，不可编辑');
console.log('');

console.log('📋 预期结果：');
console.log('✅ format.js错误已修复');
console.log('✅ 日期分类正确：过去→历史，未来→草稿');
console.log('✅ 新建行程从空白开始');
console.log('✅ 编辑已有行程加载已有数据');
console.log('✅ 离线安全卡功能正常');
console.log('✅ 删除功能正常');
console.log('✅ 历史页只读权限正常');
console.log('');

console.log('🔍 验证点：');
console.log('• 控制台无红色错误信息');
console.log('• 页面加载正常，无卡顿');
console.log('• 分类逻辑正确，行程出现在正确的选项卡');
console.log('• 功能按钮点击正常响应');
console.log('• 数据持久化正常');
console.log('');

console.log('🚀 开始测试！请刷新小程序页面...');

// 等待页面加载后执行一些检查
setTimeout(() => {
  console.log('');
  console.log('📊 当前存储数据：');
  const storedPlans = wx.getStorageSync('plans') || [];
  console.log(`• 行程总数：${storedPlans.length}`);
  
  // 分类统计
  const todayStr2 = todayStr;
  const historyCount = storedPlans.filter(p => {
    const dateValue = p.dateValue || p.date;
    return dateValue && dateValue < todayStr2;
  }).length;
  
  const draftCount = storedPlans.filter(p => {
    const dateValue = p.dateValue || p.date;
    return !dateValue || dateValue >= todayStr2;
  }).length;
  
  console.log(`• 历史行程：${historyCount}`);
  console.log(`• 草稿行程：${draftCount}`);
}, 1000);