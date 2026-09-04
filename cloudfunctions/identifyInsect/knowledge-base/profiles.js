const COMMON_EMERGENCY_CONDITIONS = [
  { path: 'redFlags.breathingDifficulty', operator: 'equals', value: true },
  { path: 'redFlags.airwaySwelling', operator: 'equals', value: true },
  { path: 'redFlags.faintingOrUnconscious', operator: 'equals', value: true },
  { path: 'redFlags.seizure', operator: 'equals', value: true },
  { path: 'redFlags.severeBleeding', operator: 'equals', value: true }
]

const COMMON_CONSULT_CONDITIONS = [
  { path: 'symptoms.fever', operator: 'equals', value: true },
  { path: 'symptoms.markedSystemicUnwell', operator: 'equals', value: true },
  { path: 'local.trend', operator: 'equals', value: 'worsening' },
  { path: 'local.infectionSigns', operator: 'equals', value: true }
]

function profile(config) {
  return Object.assign({
    prevention: ['减少不必要接触，并在暴露场景中使用物理遮挡。', '户外或旅行结束后检查身体、衣物和随身物品。'],
    firstActions: ['离开持续暴露环境。', '用清水和肥皂温和清洁接触部位。', '避免抓挠、挤压或继续刺激。'],
    consultConditions: COMMON_CONSULT_CONDITIONS,
    followup: ['记录局部范围、疼痛或瘙痒变化。', '出现发热、明显全身不适或局部持续加重时尽快咨询。'],
    extraEmergencyConditions: [],
    identificationBoundary: '普通照片只能提供候选线索，不能由外观或皮损确认物种、病原体或疾病风险。'
  }, config)
}

const PROFILES = {
  mosquito: profile({
    label: '蚊类吸血叮咬',
    prevention: ['穿着覆盖皮肤的衣物，并按合法产品标签使用驱避剂。', '清除或遮盖小型积水容器，住宿时使用纱窗、蚊帐等物理防护。'],
    firstActions: ['用肥皂和清水清洁叮咬处。', '避免抓挠，肿痒时可短时冷敷。', '记录近期旅行、发热、皮疹或其他全身表现。']
  }),
  flea: profile({
    label: '跳蚤叮咬',
    prevention: ['检查宠物及其休息区域，定期清洁寝具和软装环境。', '持续发现跳蚤或新叮咬时寻求规范的宠物诊疗和虫害控制。'],
    firstActions: ['清洁皮肤并避免抓挠。', '同步检查宠物、寝具、地毯和软垫环境。', '持续出现新叮咬时记录发生位置和时间。']
  }),
  bedbug: profile({
    label: '臭虫叮咬',
    prevention: ['旅行住宿时检查床垫包边、床架和行李放置区域。', '避免把来源不明的床具或家具直接带入居住空间。'],
    firstActions: ['清洁皮肤并避免抓挠。', '检查床垫、床架和行李缝隙中的虫体、蜕皮、卵或黑色痕迹。', '确认环境受影响时寻求规范虫害控制。']
  }),
  biting_fly: profile({
    label: '小型吸血飞虫叮咬',
    prevention: ['在水边、溪流、牧区或湿地活动时增加衣物遮挡。', '按合法产品标签使用驱避剂，并减少在虫群密集区域停留。'],
    firstActions: ['离开虫群密集的暴露环境。', '用肥皂和清水清洁叮咬处。', '避免抓挠，肿痛或瘙痒时可短时冷敷。']
  }),
  hard_tick: profile({
    label: '疑似硬蜱附着',
    prevention: ['在草地、灌木和林地穿浅色长袖长裤并扎紧裤脚。', '回家后检查身体、衣物、装备和宠物。'],
    firstActions: ['仍附着时，用干净的细尖头镊子贴近皮肤夹住口器附近。', '以稳定、均匀的力垂直向上拉，不扭转、不猛拽、不挤压腹部。', '取出后清洁叮咬处和双手，并检查身体其他部位。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'removal.canRemoveSafely', operator: 'equals', value: false },
      { path: 'removal.hardToReach', operator: 'equals', value: true },
      { path: 'symptoms.rash', operator: 'equals', value: true },
      { path: 'symptoms.muscleAches', operator: 'equals', value: true }
    ]),
    extraEmergencyConditions: [
      { path: 'redFlags.progressiveAscendingWeakness', operator: 'equals', value: true }
    ],
    followup: ['重点观察移除后两周的发热、乏力、头痛、肌肉酸痛、皮疹或胃肠道症状。', '随后数周出现新的全身症状时仍应就医并说明暴露时间和地点。'],
    identificationBoundary: '图片不能确认蜱种、病原体或疾病风险；虫体仍附着时不得为拍照或识别延迟移除。'
  }),
  chigger: profile({
    label: '疑似恙螨暴露',
    prevention: ['在草地、灌丛、田野活动时使用衣物遮挡并避免直接坐卧。', '活动后尽快更换和清洗衣物，并检查皮肤褶皱和衣物收紧处。'],
    firstActions: ['离开可能持续暴露的草地或灌丛。', '淋浴并更换、清洗暴露时衣物。', '记录暴露地点、时间和后续发热、头痛、皮疹等表现。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'symptoms.headache', operator: 'equals', value: true },
      { path: 'symptoms.rash', operator: 'equals', value: true },
      { path: 'local.escharLikeLesion', operator: 'equals', value: true }
    ])
  }),
  head_louse: profile({
    label: '疑似头虱',
    prevention: ['避免与他人共用梳子、帽子和贴身头部用品。', '发现活虱后检查密切接触者，并清洗近期接触头部的用品。'],
    firstActions: ['使用密齿篦子检查和移除可见活虱及附着发干的卵。', '避免仅凭头皮屑或照片自行确认。', '需要灭虱处理时咨询医疗或药学专业人员并按合法产品说明执行。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'exposure.suspectedInfestation', operator: 'equals', value: true },
      { path: 'local.scalpDischarge', operator: 'equals', value: true }
    ])
  }),
  scabies: profile({
    label: '疑似疥螨感染',
    prevention: ['避免与疑似患者长时间皮肤直接接触或共用贴身衣物和寝具。', '集体居住环境出现多人夜间瘙痒时应尽快寻求专业评估。'],
    firstActions: ['尽快联系医疗机构确认是否为疥疮。', '在专业建议前避免长期自行使用激素类药膏掩盖表现。', '记录同住者是否出现相似夜间瘙痒。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'exposure.suspectedInfestation', operator: 'equals', value: true },
      { path: 'symptoms.nightItching', operator: 'equals', value: true },
      { path: 'exposure.householdCluster', operator: 'equals', value: true }
    ])
  }),
  stinging_flying: profile({
    label: '蜂类蜇刺',
    prevention: ['不要靠近、触碰或震动蜂巢，发现蜂群时缓慢远离。', '户外食物和含糖饮料及时封闭，穿鞋并避免徒手拍打蜂类。'],
    firstActions: ['立即离开蜂群或巢穴附近，进入可封闭空间。', '不要继续拍打、追逐或返回巢穴附近拍照。', '局部肿痛可隔布冷敷，并持续观察全身反应。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'exposure.multipleStings', operator: 'equals', value: true },
      { path: 'exposure.mouthOrEyeArea', operator: 'equals', value: true }
    ])
  }),
  fire_ant: profile({
    label: '红火蚁蜇刺',
    prevention: ['不要踩踏或扰动可疑蚁丘，户外劳动时穿包脚鞋和手套。', '发现疑似红火蚁巢时交由专业人员处理。'],
    firstActions: ['迅速离开蚁丘附近并刷落仍在皮肤或衣物上的蚂蚁。', '用肥皂和清水清洁蜇刺处。', '不要挤破之后可能形成的小脓疱，并观察全身反应。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'exposure.multipleStings', operator: 'equals', value: true }
    ])
  }),
  centipede: profile({
    label: '蜈蚣或蚰蜒咬伤',
    prevention: ['搬动石块、柴草或杂物时戴手套，穿鞋前检查鞋内。', '保持潮湿隐蔽处整洁，避免徒手捕捉。'],
    firstActions: ['用肥皂和清水清洗咬伤部位。', '局部隔布冷敷并抬高患肢。', '记录疼痛、肿胀范围和全身表现。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'symptoms.severePain', operator: 'equals', value: true },
      { path: 'symptoms.vomitingOrPalpitations', operator: 'equals', value: true }
    ])
  }),
  scorpion: profile({
    label: '蝎蜇伤',
    prevention: ['翻动石块、砖堆或柴草时戴手套，穿鞋前检查鞋内。', '不要徒手捕捉或把来源不明的蝎类带入居住空间。'],
    firstActions: ['用肥皂和清水清洗蜇伤部位。', '局部隔布冷敷并保持休息。', '儿童被蜇、疼痛明显或出现全身表现时尽快就医。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'person.isChild', operator: 'equals', value: true },
      { path: 'symptoms.severePain', operator: 'equals', value: true },
      { path: 'symptoms.vomitingOrPalpitations', operator: 'equals', value: true }
    ])
  }),
  paederus: profile({
    label: '毒隐翅虫体液接触',
    prevention: ['夜间减少强光诱虫，发现虫体时轻吹或用纸片移走。', '不要在皮肤上拍打、碾压或揉擦虫体。'],
    firstActions: ['疑似接触虫体体液时立即用肥皂和大量清水冲洗。', '避免触摸和揉眼，并清洗可能沾染体液的手。', '眼部接触、大片水疱或明显疼痛时尽快就医。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'exposure.eyeOrMucosa', operator: 'equals', value: true },
      { path: 'local.widespreadBlistering', operator: 'equals', value: true }
    ]),
    identificationBoundary: '条索状皮炎或单张虫体照片都不能单独确认梭毒隐翅虫；处置依据接触过程和当前表现。'
  }),
  caterpillar: profile({
    label: '有刺激性毛虫接触',
    prevention: ['不要徒手触摸毛虫、虫茧或沾有毒毛的枝叶和衣物。', '林地、茶园或绿化作业时使用长袖衣物、手套和眼部防护。'],
    firstActions: ['停止揉擦，离开可能仍有毒毛的环境。', '避免徒手拔取细毛，可用清水温和冲洗并更换受污染衣物。', '眼部接触、呼吸不适或大片皮疹时尽快求助。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'exposure.eyeOrMucosa', operator: 'equals', value: true },
      { path: 'local.widespreadRash', operator: 'equals', value: true }
    ])
  }),
  blister_beetle: profile({
    label: '芫菁体液接触',
    prevention: ['不要徒手捏碎或揉擦芫菁类甲虫。', '处理农作物、柴草或灯下昆虫时佩戴手套。'],
    firstActions: ['疑似接触虫体体液时立即用大量清水和肥皂冲洗。', '不要主动刺破水疱。', '眼部或黏膜接触、大片水疱或明显疼痛时尽快就医。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'exposure.eyeOrMucosa', operator: 'equals', value: true },
      { path: 'local.widespreadBlistering', operator: 'equals', value: true }
    ])
  }),
  privacy_lice: profile({
    label: '体虱或阴虱疑似寄生',
    prevention: ['避免共用贴身衣物、毛巾和寝具，并使用隐私友好的方式提醒密切接触者。', '需要检查或处理时保护个人隐私，不上传可识别身体部位的照片。'],
    firstActions: ['尽快联系医疗或公共卫生专业人员确认对象和处理范围。', '清洗近期使用的贴身衣物、毛巾和寝具。', '不要仅凭瘙痒、头皮屑或模糊照片自行确认。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'exposure.suspectedInfestation', operator: 'equals', value: true },
      { path: 'local.dischargeOrUlceration', operator: 'equals', value: true }
    ]),
    identificationBoundary: '体虱和阴虱涉及不同部位与传播场景；图片不是必要条件，页面不得要求上传隐私部位照片。'
  }),
  common_ant: profile({
    label: '常见蚂蚁咬伤或蜇刺',
    prevention: ['不要徒手扰动蚁巢，处理食物和居住环境中的蚂蚁时使用物理隔离。', '没有可靠虫体和巢穴证据时不要把普通蚂蚁标成红火蚁。'],
    firstActions: ['离开蚂蚁聚集处并刷落皮肤或衣物上的蚂蚁。', '用肥皂和清水清洁接触部位。', '局部不适时可短时冷敷并观察全身反应。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'exposure.multipleStings', operator: 'equals', value: true }
    ])
  }),
  spider: profile({
    label: '疑似蜘蛛咬伤',
    prevention: ['整理柴草、杂物或石块时戴手套，穿鞋前检查鞋内。', '不要徒手捕捉未知蜘蛛。'],
    firstActions: ['用肥皂和清水清洁局部。', '记录疼痛、红肿范围和变化趋势。', '无法确认虫体时保持“不明咬伤”，不要凭伤口形状认定蜘蛛。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'symptoms.severePain', operator: 'equals', value: true },
      { path: 'local.tissueBreakdown', operator: 'equals', value: true },
      { path: 'symptoms.neurologic', operator: 'equals', value: true }
    ]),
    identificationBoundary: '伤口外观、所谓“双牙印”或症状组合都不能单独确认蜘蛛咬伤。'
  }),
  low_evidence_contact: profile({
    label: '证据不足的甲虫接触',
    prevention: ['不要徒手捏碎或揉擦来源不明的甲虫。', '农业或园艺作业时使用手套并在接触后洗手。'],
    firstActions: ['停止继续接触并用清水和肥皂清洁皮肤。', '记录是否有虫体被揉碎、植物汁液或农药等其他可能刺激物。', '没有明确反应时不生成“有毒”或疾病结论。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'exposure.eyeOrMucosa', operator: 'equals', value: true },
      { path: 'local.widespreadBlistering', operator: 'equals', value: true }
    ]),
    identificationBoundary: '当前人体健康证据不足，只能作为边界说明页，不能宣称该类群普遍有毒或会致病。'
  }),
  travel_vector: profile({
    label: '区域限定旅行媒介类群',
    prevention: ['仅在权威资料确认的旅行地区展示，并按目的地公共卫生建议采取衣物、住宿和驱避防护。', '行程结束后保留国家、地区、日期和暴露场景记录。'],
    firstActions: ['清洁叮咬处并避免抓挠。', '记录旅行国家、地区、日期和可能接触环境。', '旅行后出现发热、皮疹、明显乏力或神经系统不适时尽快就医并说明行程。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'symptoms.rash', operator: 'equals', value: true },
      { path: 'symptoms.neurologic', operator: 'equals', value: true },
      { path: 'exposure.inRelevantTravelRegion', operator: 'equals', value: true }
    ]),
    identificationBoundary: '地理范围是必要限制；不能在中国本地普通场景仅凭照片输出该旅行媒介候选。'
  }),
  leech: profile({
    label: '水蛭附着（非节肢动物）',
    prevention: ['在已知有水蛭的水域或湿地使用覆盖皮肤的衣物和鞋袜。', '离开水域后检查皮肤和衣物。'],
    firstActions: ['确认对象为柔软、有吸盘的疑似水蛭，不套用硬蜱垂直拔除流程。', '脱离后用清水清洁伤口并持续按压止血。', '无法止血、附着于眼鼻口等黏膜或出现明显不适时尽快就医。'],
    consultConditions: COMMON_CONSULT_CONDITIONS.concat([
      { path: 'local.bleedingNotStopping', operator: 'equals', value: true },
      { path: 'exposure.eyeOrMucosa', operator: 'equals', value: true },
      { path: 'exposure.internalAttachmentSuspected', operator: 'equals', value: true }
    ]),
    identificationBoundary: '水蛭属于环节动物而非节肢动物；不得复用蜱的镊子垂直拔除步骤。'
  })
}

function getProfile(profileId) {
  const value = PROFILES[profileId]
  if (!value) throw new Error(`Unknown safety profile: ${profileId}`)
  return value
}

module.exports = { COMMON_EMERGENCY_CONDITIONS, PROFILES, getProfile }
