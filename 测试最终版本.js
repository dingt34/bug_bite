// 测试最终版本：草稿和历史根据日期分类（修复图标问题）
// 复制到微信开发者工具控制台执行

console.log('🚀 开始测试：草稿和历史根据日期分类逻辑（最终版）...');

// 清空现有数据
wx.removeStorageSync('plans');
wx.removeStorageSync('precheckDraft');

// 创建今天的日期
const today = new Date();
const todayStr = today.toISOString().split('T')[0];

// 创建测试日期
const pastDate = new Date(today);
pastDate.setDate(today.getDate() - 7); // 7天前
const pastDateStr = pastDate.toISOString().split('T')[0];

const futureDate1 = new Date(today);
futureDate1.setDate(today.getDate() + 15); // 15天后
const futureDateStr1 = futureDate1.toISOString().split('T')[0];

const futureDate2 = new Date(today);
futureDate2.setDate(today.getDate() + 30); // 30天后
const futureDateStr2 = futureDate2.toISOString().split('T')[0];

// 创建测试行程数据
const testPlans = [
  // 历史行程（过去日期）
  {
    id: 'history-1',
    title: '上周露营（已过期）',
    date: pastDateStr.replace('-', '年').replace('-', '月') + '日',
    dateValue: pastDateStr,
    type: '露营',
    status: '草稿', // 状态还是草稿，但因为日期过去，应该出现在历史页
    precheckData: {
      destination: '西山露营地',
      dateValue: pastDateStr,
      activity: '徒步露营',
      environment: ['林地', '过夜'],
      lastUpdated: '2024-09-25T10:30:00Z'
    }
  },
  
  // 草稿行程（未来日期）
  {
    id: 'draft-1',
    title: '下周海边度假',
    date: futureDateStr1.replace('-', '年').replace('-', '月') + '日',
    dateValue: futureDateStr1,
    type: '度假',
    status: '草稿',
    precheckData: {
      destination: '三亚海滩',
      dateValue: futureDateStr1,
      activity: '亲子活动',
      environment: ['近水', '过夜'],
      lastUpdated: '2024-10-28T14:30:00Z'
    }
  },
  
  // 草稿行程（未来日期）
  {
    id: 'draft-2',
    title: '下月滑雪计划',
    date: futureDateStr2.replace('-', '年').replace('-', '月') + '日',
    dateValue: futureDateStr2,
    type: '滑雪',
    status: '草稿',
    precheckData: {
      destination: '长白山滑雪场',
      dateValue: futureDateStr2,
      activity: '其他户外活动',
      environment: ['过夜'],
      lastUpdated: '2024-10-20T14:30:00Z'
    }
  },
  
  // 新建草稿（没有precheckData）
  {
    id: 'draft-3',
    title: '新建周末游',
    date: futureDateStr1.replace('-', '年').replace('-', '月') + '日',
    dateValue: futureDateStr1,
    type: '周边游',
    status: '待规划'
    // 注意：没有precheckData字段
  }
];

// 存储数据
wx.setStorageSync('plans', testPlans);

console.log('✅ 测试数据设置完成！');
console.log('');
console.log('📅 日期信息：');
console.log('• 今天日期：', todayStr);
console.log('• 过去日期：', pastDateStr, '（应出现在历史页）');
console.log('• 未来日期1：', futureDateStr1, '（应出现在草稿页）');
console.log('• 未来日期2：', futureDateStr2, '（应出现在草稿页）');
console.log('');

console.log('📊 测试行程分类结果预期：');
console.log('');
console.log('1. 历史页应包含：');
console.log('   • 上周露营（已过期）');
console.log('   - 日期：', pastDateStr, '（过去日期）');
console.log('   - 跳转到precheck-result?readonly=true（只读模式）');
console.log('');

console.log('2. 草稿页应包含：');
console.log('   • 下周海边度假');
console.log('   • 下月滑雪计划');
console.log('   • 新建周末游');
console.log('   - 跳转到precheck（可编辑）');
console.log('   - 有删除按钮（文字"删除"）');
console.log('');

console.log('🔄 测试步骤：');
console.log('');
console.log('1. 刷新小程序页面');
console.log('2. 进入"我的行程"页面');
console.log('');
console.log('3. 验证"历史"选项卡：');
console.log('   a) 应该看到1个行程："上周露营（已过期）"');
console.log('   b) 点击该行程 → 应该跳转到precheck-result?readonly=true');
console.log('   c) 页面应该显示"历史记录不可编辑"的提示');
console.log('   d) 编辑功能和保存按钮应该被禁用');
console.log('');
console.log('4. 验证"草稿"选项卡：');
console.log('   a) 应该看到3个行程');
console.log('   b) 每个行程应该有："草稿"标签 + "删除"文字按钮');
console.log('   c) 测试删除功能：');
console.log('      - 点击"删除"按钮删除"新建周末游"');
console.log('      - 确认删除后，行程应该消失');
console.log('   d) 测试跳转功能：');
console.log('      - 点击行程标题或信息区域 → 跳转到precheck页面');
console.log('      - 表单应该自动填充已有数据（如有）');
console.log('      - 修改数据后保存');
console.log('      - 返回行程页面，再次点击同一行程');
console.log('      - 应该显示修改后的数据');
console.log('   e) 测试新建功能：');
console.log('      - 点击"新建行前计划"按钮');
console.log('      - 跳转到precheck页面（空白表单）');
console.log('      - 填写完整信息后点击"生成计划"');
console.log('      - 应该保存成功并返回行程页面');
console.log('      - 新行程应该出现在草稿页');
console.log('');
console.log('5. 测试日期自动分类：');
console.log('   a) 创建一个今天日期的行程 → 应该出现在草稿页');
console.log('   b) 创建一个过去日期的行程 → 应该出现在历史页');
console.log('   c) 创建一个未来日期的行程 → 应该出现在草稿页');
console.log('');
console.log('🔧 已修复的问题：');
console.log('✅ 删除图标路径问题（使用文字"删除"替代）');
console.log('✅ 日期分类逻辑（基于dateValue字段）');
console.log('✅ 权限控制（历史只读，草稿可编辑）');
console.log('✅ 删除功能（草稿页可删除）');
console.log('');
console.log('💡 核心验证点：');
console.log('• 日期分类：过去日期→历史页，未来日期→草稿页');
console.log('• 权限控制：历史只读，草稿可编辑');
console.log('• 删除功能：草稿页可以删除行程');
console.log('• 数据持久化：编辑后的数据可以正确保存和加载');
console.log('• 用户体验：逻辑清晰，符合预期');
console.log('');
console.log('📝 修改的文件：');
console.log('1. my-plans.js：日期分类逻辑、删除功能');
console.log('2. my-plans.wxml：删除按钮改为文字"删除"');
console.log('3. precheck.js：generate函数不标记已完成');
console.log('4. precheck-result.js：支持只读模式');
console.log('5. my-plans.wxss：删除按钮样式');