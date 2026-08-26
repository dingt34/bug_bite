const BASE_CONTENT = {
  emergency: {
    levelName: '紧急求助', icon: '🚨', color: '#E53935', isEmergency: true,
    basis: '已触发危险信号，需优先排除危及生命的紧急情况。',
    actions: ['立即拨打 120 或前往最近急诊', '保持镇定并留在安全位置，不要自行驾车', '向急救人员说明接触时间、危险信号和已采取的措施'],
    review: '遵医嘱；紧急事件不可通过自评自动降级。',
    checklist: ['危险信号出现的时间与变化', '接触类型和身体部位', '虫体或蜂刺是否仍在皮肤上', '已经采取的处理'],
    seekHelp: ['现在就联系 120；不要等待图片识别或继续自评。']
  },
  consult: {
    levelName: '尽快咨询', icon: '🏥', color: '#F57C00', isEmergency: false,
    basis: '存在需要专业评估的症状、部位或变化趋势，建议尽快获得医疗意见。',
    actions: ['尽快联系医疗机构或专业人员', '在等待咨询期间记录变化，不挤压、抓挠或使用偏方', '携带下方事件摘要和图片前往就诊'],
    review: '建议在 24 小时内获得专业评估；若症状继续加重，应提前就医。',
    checklist: ['症状范围是否继续扩大', '是否出现发热、渗液或新的全身不适', '疼痛、瘙痒及活动受限程度'],
    seekHelp: ['出现呼吸困难、口唇舌喉肿胀、意识异常或快速加重时，立即拨打 120。', '红肿持续扩大、局部发热、出现脓液或红线向外延伸时，应尽快就医。']
  },
  observe: {
    levelName: '观察记录', icon: '📋', color: '#2E7D5B', isEmergency: false,
    basis: '目前未发现高危信号或需要立即咨询的规则条件，可先安全处理并持续观察。',
    actions: ['拍照并记录症状边界和发生时间', '避免抓挠、挤压伤口或使用来源不明的偏方', '按下方观察重点复查变化'],
    review: '建议每日查看一次，连续记录 3 天；若没有改善或出现新症状，应咨询专业人员。',
    checklist: ['红肿、风团或水疱的范围变化', '疼痛、瘙痒和局部温度变化', '是否出现发热、皮疹扩散或明显乏力'],
    seekHelp: ['出现呼吸困难、口唇舌喉肿胀、意识异常或快速加重时，立即拨打 120。', '出现发热、化脓、红肿明显扩大或数日不改善时，应咨询医疗机构。']
  }
};

const CONTACT_GUIDANCE = {
  bite: {
    actions: ['用肥皂和清水清洁接触部位', '肿胀或瘙痒时可隔着布冷敷，避免直接用冰接触皮肤'],
    observe: ['记录叮咬数量、分布和红肿边界'],
    seekHelp: ['如果随后出现发热、全身皮疹或明显不适，应说明近期叮咬史并就医。']
  },
  sting: {
    actions: ['先离开蜂群、蚁巢或其他持续暴露区域', '若明确看到蜂刺，可用指甲或卡片边缘侧向刮除，避免挤压毒囊', '清洁后隔布冷敷；肢体肿胀时可适当抬高'],
    observe: ['记录蜇伤数量、部位和肿胀范围'],
    seekHelp: ['口腔、咽喉或眼周蜇伤，以及多个部位的蜇伤，应尽快获得专业评估。']
  },
  attachment: {
    actions: ['附着虫体应尽快处理；疑似蜱时用细尖镊子贴近皮肤夹住，稳定、均匀地向上拉', '不要用油脂、加热或指甲油迫使疑似蜱虫脱落，也不要挤压虫体', '移除后清洁双手和接触部位，并保存虫体照片与接触时间'],
    observe: ['记录虫体移除是否完整、附着部位和可能的附着时长'],
    seekHelp: ['移除后数天至数周内出现发热或新发皮疹，应就医并说明叮咬时间和地点。']
  },
  contact: {
    actions: ['停止揉搓接触部位，取下可能受污染的衣物和饰品', '疑似毒毛接触时，可先用胶带轻粘带走残留毒毛，再用流动清水冲洗并自然晾干', '若进入眼睛，立即用大量清水冲洗并尽快就医；疑似吸入毒毛也应获得医疗帮助'],
    observe: ['记录皮疹分布，以及眼睛、口鼻或呼吸道是否不适'],
    seekHelp: ['眼部接触、持续咳嗽、吞咽不适或疑似吸入毒毛时，应尽快就医。']
  },
  unknown: {
    actions: ['先离开可能继续暴露的环境，再用肥皂和清水清洁皮肤', '保留现场、虫体和皮肤表现照片，不徒手触碰未知虫体'],
    observe: ['记录接触地点、活动环境和症状首次出现时间'],
    seekHelp: ['无法判断接触物且症状持续加重时，应携带照片咨询专业人员。']
  }
};

function unique(items) {
  return items.filter((item, index) => items.indexOf(item) === index);
}

function getResultContent(level, contactType) {
  const base = BASE_CONTENT[level] || BASE_CONTENT.observe;
  const guidance = CONTACT_GUIDANCE[contactType] || CONTACT_GUIDANCE.unknown;
  if (base.isEmergency) {
    return Object.assign({}, base, {
      actions: base.actions.slice(), checklist: base.checklist.slice(), seekHelp: base.seekHelp.slice(),
      sourceNote: '参考公开指南：NHS 昆虫叮咬与蜇伤、CDC 蜱叮咬处理。'
    });
  }

  const actions = level === 'consult'
    ? [base.actions[0]].concat(guidance.actions, base.actions.slice(1))
    : guidance.actions.concat(base.actions);
  return Object.assign({}, base, {
    actions: unique(actions),
    checklist: unique(guidance.observe.concat(base.checklist)),
    seekHelp: unique(base.seekHelp.concat(guidance.seekHelp)),
    sourceNote: '参考公开指南：NHS 昆虫叮咬与蜇伤、CDC 蜱叮咬处理、MedlinePlus 毛虫接触处理。'
  });
}

module.exports = Object.assign({}, BASE_CONTENT, { getResultContent, CONTACT_GUIDANCE });
