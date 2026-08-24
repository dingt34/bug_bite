module.exports = {
  emergency: {
    levelName: '紧急求助',
    icon: '🚨',
    color: '#E53935',
    isEmergency: true,
    basis: '已触发危险信号，需优先排除危及生命的紧急情况。',
    actions: ['立即拨打 120 或前往最近急诊', '保持镇定，不要自行驾车', '向急救人员说明接触类型与已出现的危险信号'],
    review: '遵医嘱；紧急事件不可通过自评自动降级。',
    checklist: ['危险信号与发生时间', '接触类型与身体部位', '虫体是否移除（如附着）', '已采取的措施']
  },
  consult: {
    levelName: '尽快咨询',
    icon: '🏥',
    color: '#F57C00',
    isEmergency: false,
    basis: '存在需要专业评估的症状或变化趋势，建议尽快获得医疗意见。',
    actions: ['尽快联系医疗机构或专业人员', '密切观察症状变化，必要时升级求助', '携带下方就医摘要前往就诊'],
    review: '建议 24 小时内复查或就诊。',
    checklist: ['症状变化时间线', '已采取措施', '可复制的就医摘要']
  },
  observe: {
    levelName: '观察记录',
    icon: '📋',
    color: '#2E7D5B',
    isEmergency: false,
    basis: '未发现高危信号，可先进行安全观察并记录变化。',
    actions: ['保持局部清洁，避免抓挠', '记录症状变化并拍照留证', '按建议复查时间更新情况'],
    review: '建议 3 天后复查；若出现危险信号立即升级求助。',
    checklist: ['观察重点：红肿范围、疼痛瘙痒变化', '建议复查时间', '升级求助条件']
  }
};
