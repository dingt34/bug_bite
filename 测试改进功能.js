// 测试改进功能：新建行程从空白开始 + 离线安全卡
// 复制到微信开发者工具控制台执行

console.log('🚀 开始测试：新建行程从空白开始 + 离线安全卡功能...');

// 清空现有数据
wx.removeStorageSync('plans');
wx.removeStorageSync('precheckDraft');
wx.removeStorageSync('safetyCard');

// 创建测试行程数据
const today = new Date();
const futureDate = new Date(today);
futureDate.setDate(today.getDate() + 15);
const futureDateStr = futureDate.toISOString().split('T')[0];

const testPlans = [
  {
    id: 'draft-1',
    title: '下周海边度假',
    date: futureDateStr.replace('-', '年').replace('-', '月') + '日',
    dateValue: futureDateStr,
    type: '度假',
    status: '草稿',
    precheckData: {
      destination: '三亚海滩',
      dateValue: futureDateStr,
      activity: '亲子活动',
      environment: ['近水', '过夜'],
      lastUpdated: '2024-10-28T14:30:00Z'
    }
  },
  {
    id: 'draft-2',
    title: '新建周末游',
    date: futureDateStr.replace('-', '年').replace('-', '月') + '日',
    dateValue: futureDateStr,
    type: '周边游',
    status: '待规划'
    // 注意：没有precheckData字段
  }
];

// 存储数据
wx.setStorageSync('plans', testPlans);

console.log('✅ 测试数据设置完成！');
console.log('');

console.log('📝 改进功能测试指南：');
console.log('');
console.log('1. 新建行程从空白开始');
console.log('   =================');
console.log('   a) 点击"新建行前计划"按钮');
console.log('   b) 应该跳转到precheck页面');
console.log('   c) 表单应该是空的（不加载其他行程的数据）');
console.log('   d) 填写信息后点击"生成计划"');
console.log('   e) 保存后返回行程页面');
console.log('   f) 新行程应该出现在草稿页');
console.log('');

console.log('2. 编辑已有行程');
console.log('   ==============');
console.log('   a) 点击"下周海边度假"');
console.log('   b) 应该跳转到precheck页面');
console.log('   c) 表单应该自动填充已有数据');
console.log('   d) 修改一些信息后保存');
console.log('   e) 返回行程页面，再次点击同一行程');
console.log('   f) 应该显示修改后的数据');
console.log('');

console.log('3. 离线安全卡功能');
console.log('   ===============');
console.log('   a) 点击"离线安全卡"卡片');
console.log('   b) 应该跳转到离线安全卡页面');
console.log('   c) 测试功能：');
console.log('      • 添加紧急联系人');
console.log('      • 查看急救指南');
console.log('      • 查看安全提示');
console.log('      • 生成离线安全卡');
console.log('      • 查看最近生成的安全卡');
console.log('');

console.log('4. 日期分类逻辑验证');
console.log('   =================');
console.log('   a) 创建一个今天日期的行程 → 草稿页');
console.log('   b) 创建一个过去日期的行程 → 历史页');
console.log('   c) 创建一个未来日期的行程 → 草稿页');
console.log('   d) 创建一个没有日期的行程 → 草稿页');
console.log('');

console.log('5. 权限控制验证');
console.log('   =============');
console.log('   a) 草稿页：可编辑、可删除');
console.log('   b) 历史页：只读查看，不可编辑');
console.log('');

console.log('🔧 已实现的改进：');
console.log('✅ 1. 新建行程从空白表单开始');
console.log('   - 清除临时草稿数据');
console.log('   - 不加载其他行程的数据');
console.log('   - 完全重新开始');
console.log('');
console.log('✅ 2. 离线安全卡功能设计');
console.log('   - 紧急联系人管理');
console.log('   - 急救指南');
console.log('   - 安全提示');
console.log('   - 离线可用');
console.log('   - 可绑定到特定行程');
console.log('   - 可添加个人联系人');
console.log('');

console.log('📁 新增的文件：');
console.log('• pages/offline-safety/offline-safety.js');
console.log('• pages/offline-safety/offline-safety.wxml');
console.log('• pages/offline-safety/offline-safety.wxss');
console.log('');

console.log('💡 核心验证点：');
console.log('• 新建行程：点击"新建行前计划" → 空白表单');
console.log('• 编辑行程：点击已有草稿 → 加载已有数据');
console.log('• 离线安全卡：点击卡片 → 可添加联系人、生成安全卡');
console.log('• 日期分类：正确分类到草稿页/历史页');
console.log('• 权限控制：草稿可编辑删除，历史只读');
console.log('');

console.log('🔄 修改的文件：');
console.log('1. my-plans.js：添加openSafetyCard函数');
console.log('2. my-plans.wxml：离线安全卡可点击');
console.log('3. precheck.js：处理new=true参数，从空白开始');
console.log('');

console.log('📱 用户操作流程：');
console.log('');
console.log('创建新行程：');
console.log('   点击"新建行前计划" → 空白表单 → 填写信息 → 保存');
console.log('');
console.log('管理安全信息：');
console.log('   点击"离线安全卡" → 添加联系人 → 查看指南 → 生成安全卡');
console.log('');
console.log('查看历史行程：');
console.log('   切换到"历史"选项卡 → 点击行程 → 只读查看记录');
console.log('');

console.log('🎯 测试重点：');
console.log('1. 确保新建行程真的从空白开始');
console.log('2. 确保离线安全卡功能正常工作');
console.log('3. 确保日期分类逻辑正确');
console.log('4. 确保权限控制有效');

console.log('');
console.log('🚀 开始测试！');