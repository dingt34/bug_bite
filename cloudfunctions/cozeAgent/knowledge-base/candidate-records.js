const CATALOG_SOURCE = {
  title: '项目名录 · 节肢动物内容名录（产品版）',
  url: '../../../docs/arthropod-catalog.md'
}

const WHO_VECTOR_SOURCE = {
  title: 'WHO · Vector-borne diseases',
  url: 'https://www.who.int/news-room/fact-sheets/detail/vector-borne-diseases'
}

const CDC_VECTOR_PREVENTION = {
  title: 'CDC · Prevent mosquito and tick bites',
  url: 'https://www.cdc.gov/vector-borne-diseases/prevention/index.html'
}

const CDC_TICK = {
  title: 'CDC · What to Do After a Tick Bite',
  url: 'https://www.cdc.gov/ticks/after-a-tick-bite/index.html'
}

const CDC_FLEA = {
  title: 'CDC · About Fleas',
  url: 'https://www.cdc.gov/fleas/about/index.html'
}

const CDC_STINGS = {
  title: 'CDC/NIOSH · Protecting Yourself from Stinging Insects',
  url: 'https://www.cdc.gov/niosh/docs/2010-117/'
}

const NHS_BITES = {
  title: 'NHS · Insect bites and stings',
  url: 'https://www.nhs.uk/conditions/insect-bites-and-stings/'
}

const GOV_CATERPILLAR = {
  title: 'GOV.UK · Caterpillar hair exposure health effects',
  url: 'https://www.gov.uk/government/publications/oak-processionary-moth-opm-health-effects-of-exposure'
}

const VERIFIED_SOURCES = {
  hardTickTaxonomy: { title: '辽宁省市场监督管理局 · 硬蜱科属级鉴别地方标准征求稿', url: 'https://scjg.ln.gov.cn/scjdglj/hd/zjdc/2024032110222554039/2024032110191019531.pdf' },
  humanFleaGovernment: { title: '双台子区人民政府 · 病媒生物系列科普：蚤', url: 'https://www.stq.gov.cn/2026_05/05_16/content-562111.html' },
  humanFleaGbif: { title: 'GBIF · Pulex irritans', url: 'https://www.gbif.org/species/296725452' },
  bodyLice: { title: 'CDC · About Body Lice', url: 'https://www.cdc.gov/lice/about/body-lice.html' },
  pubicLice: { title: 'CDC · About Pubic Lice', url: 'https://www.cdc.gov/lice/about/pubic-lice.html' },
  horseFly: { title: 'Penn State Extension · Horse and Deer Fly Bites', url: 'https://extension.psu.edu/protecting-horses-from-horse-and-deer-fly-bites' },
  paperWasp: { title: '国家卫健委 · 胡蜂蜇伤诊疗原则', url: 'https://www.nhc.gov.cn/yzygj/c100067/201310/d31a91c04892408bb9fbee5ad337d080.shtml' },
  ants: { title: '国家卫健委 · 红火蚁诊疗与防控相关技术文件', url: 'https://www.nhc.gov.cn/cms-search/downFiles/da3548a3c147433bb7c21616b37aced7.pdf' },
  spiderStudy: { title: 'PubMed · Prospective study of definite spider bites', url: 'https://pubmed.ncbi.nlm.nih.gov/12391384/' },
  spiderHealth: { title: 'Victoria Department of Health · Spiders pest control', url: 'https://www.health.vic.gov.au/environmental-health/spiders-pest-control' },
  pineMothTaxonomy: { title: '国家林草局 · LY/T 3137—2019 林业生物分类代码', url: 'https://www.forestry.gov.cn/html/lykj/lykj_1716/20190704152301877420072/file/20190704210951288677543.pdf' },
  tussockCdc: { title: '福田区疾控中心 · 毒蛾幼虫皮炎预警', url: 'https://www.szft.gov.cn/bmxx_qt/jkzx/xwzx/tzgg/content/post_3385761.html' },
  cucumberAgriculture: { title: '怀化市农业农村局 · 蔬菜绿色生产病虫害防治用药指南', url: 'https://www.huaihua.gov.cn/nyncj/c108787/202101/a2bc0e93fd334af3ad2dbc911bfa9c52.shtml' },
  blisterReview: { title: 'PubMed · Oedemerid blister beetle dermatosis review', url: 'https://pubmed.ncbi.nlm.nih.gov/2189910/' },
  tropicalBedbug: { title: 'US EPA · Bed Bug Biology and Management', url: 'https://www.epa.gov/system/files/documents/2024-01/r9-winter-2024-rtoc-presentation-bed-bug-biology-and-mgmnt-for-tribes.pdf' },
  chagas: { title: 'CDC · How Chagas Disease Spreads', url: 'https://www.cdc.gov/chagas/spreads/index.html' },
  tsetseWho: { title: 'WHO · Human African trypanosomiasis', url: 'https://www.who.int/data/gho/data/themes/topics/human-african-trypanosomiasis/1000' },
  tsetseCdc: { title: 'CDC · Preventing Sleeping Sickness', url: 'https://www.cdc.gov/sleeping-sickness/prevention/index.html' },
  leechReview: { title: 'PubMed · A Comprehensive Review of Hirudiniasis', url: 'https://pubmed.ncbi.nlm.nih.gov/29030099/' },
  leechHealth: { title: 'Healthdirect Australia · Insect bites and stings including leeches', url: 'https://www.healthdirect.gov.au/insect-bites-and-stings' }
}

function candidate(config) {
  return Object.assign({
    aliases: [],
    zhejiangStatus: '待补充本地分布证据',
    images: [],
    mediaStatus: 'PENDING_LICENSE',
    sources: [CATALOG_SOURCE],
    caution: '当前为候选类群页，不能凭普通照片或皮肤表现确认到物种。'
  }, config)
}

const RECORDS = [
  candidate({
    id: 'hard_ticks_other', name: '硬蜱（其他常见种）', scientificName: 'Ixodes spp.; Dermacentor spp.', commonCategory: '硬蜱类群',
    aliases: ['其他硬蜱', '硬蜱类'], group: 'attached', groupName: '附着类',
    summary: '用于覆盖长角血蜱和血红扇头蜱之外的硬蜱暴露，不提供种级图片确证。',
    appearance: '硬蜱成体通常有八足，口器位于身体前端，吸血后体形可明显胀大。',
    identificationKeys: ['持续附着皮肤', '成体八足', '前端可见口器'],
    distribution: '不同属种的分布差异明显，必须结合本地监测资料解释。', habitat: '草地、灌木、林地、落叶层及动物活动区域。',
    contactPattern: '可能附着皮肤持续吸血，叮咬当时不一定有明显感觉。', commonReaction: '附着处可能出现小红点或局部刺激，也可能暂时没有明显表现。',
    compareClues: '只能判断“疑似硬蜱”，种级鉴定通常需要专业形态观察。',
    sources: [CATALOG_SOURCE, VERIFIED_SOURCES.hardTickTaxonomy, CDC_VECTOR_PREVENTION, CDC_TICK]
  }),
  candidate({
    id: 'human_flea', name: '人蚤', scientificName: 'Pulex irritans', commonCategory: '跳蚤类',
    aliases: ['人跳蚤'], group: 'blood_feeding', groupName: '吸血叮咬',
    summary: '人和多种动物相关的跳蚤代表种；产品重点是环境暴露和持续新叮咬，而不是照片种级鉴定。',
    appearance: '无翅、侧扁并有发达后足，体形很小，近似种通常需要显微特征区分。', identificationKeys: ['无翅侧扁', '后足发达', '可快速跳跃'],
    distribution: '可随人、动物和居住环境出现，具体本地资料待核验。', habitat: '动物巢穴、寝具、地毯和受影响的居住环境。',
    contactPattern: '可能造成多处瘙痒性叮咬，并在环境未处理时持续出现。', commonReaction: '常见小丘疹、红肿和瘙痒，皮损排列不能确认蚤种。',
    compareClues: '虫体会跳、环境和动物接触史比皮损形状更有参考价值。',
    sources: [CATALOG_SOURCE, VERIFIED_SOURCES.humanFleaGovernment, VERIFIED_SOURCES.humanFleaGbif, CDC_FLEA, NHS_BITES]
  }),
  candidate({
    id: 'body_pubic_lice', name: '体虱／阴虱', scientificName: 'Pediculus humanus humanus / Pthirus pubis', commonCategory: '虱类组合页',
    aliases: ['体虱', '阴虱', '衣虱'], group: 'attached', groupName: '附着／寄生',
    summary: '与头虱分开的隐私友好类群页；两类对象的部位和传播场景不同，不能相互替代。',
    appearance: '体虱与衣物缝隙关系密切；阴虱体形较短宽并常附着于较粗体毛。普通照片不宜承担诊断。', identificationKeys: ['活虱或卵的直接证据', '相应衣物或体毛部位', '密切接触和同住线索'],
    distribution: '全球可见，发生与具体接触和生活条件相关。', habitat: '体虱多与贴身衣物缝隙相关；阴虱主要涉及较粗体毛区域。',
    contactPattern: '可经密切接触或受影响衣物传播；页面必须采用非评判、保护隐私的表达。', commonReaction: '可能出现瘙痒、抓痕和局部刺激，继发感染时需就医。',
    compareClues: '不能把头皮屑、一般瘙痒或单张模糊照片当作确证。',
    sources: [CATALOG_SOURCE, VERIFIED_SOURCES.bodyLice, VERIFIED_SOURCES.pubicLice, WHO_VECTOR_SOURCE]
  }),
  candidate({
    id: 'horse_deer_flies', name: '鹿虻、虻类', scientificName: 'Tabanidae', commonCategory: '虻科类群',
    aliases: ['虻类', '鹿虻', '马虻'], group: 'blood_feeding', groupName: '吸血叮咬',
    summary: '户外、水边和牧区可能遇到的疼痛性叮咬飞虫类群。', appearance: '多为中大型、复眼明显、飞行有力的双翅目昆虫，属种间外观差异较大。',
    identificationKeys: ['中大型飞虫', '复眼明显', '叮咬常立即疼痛'], distribution: '世界多地可见；中国和浙江具体属种需本地昆虫资料确认。',
    habitat: '湿地、水边、牧场、林缘及大型动物活动区域。', contactPattern: '雌虫可能在白天叮咬暴露皮肤，常有明显疼痛。',
    commonReaction: '可出现疼痛、红肿和瘙痒；大片肿胀或全身反应需升级求助。', compareClues: '“疼痛叮咬＋大型飞虫＋水边或牧区”只能提示虻类，不能确认属种。',
    sources: [CATALOG_SOURCE, VERIFIED_SOURCES.horseFly, NHS_BITES]
  }),
  candidate({
    id: 'tabanus', name: '牛虻', scientificName: 'Tabanus spp.', commonCategory: '虻属代表页', aliases: ['牛虻类'],
    group: 'blood_feeding', groupName: '吸血叮咬', summary: '作为虻类页的代表例展示，不承担种级诊断。',
    appearance: '通常为中大型、体形粗壮的飞虫，复眼明显；具体种间差异较大。', identificationKeys: ['体形粗壮', '复眼明显', '叮咬疼痛'],
    distribution: '属级分布广，浙江具体种需补监测或分类资料。', habitat: '牧区、田野、林缘和水体附近。',
    contactPattern: '可能在白天叮咬人或动物的暴露皮肤。', commonReaction: '常见疼痛、红肿和瘙痒。',
    compareClues: '与其他虻科成员难凭普通照片稳定区分，应回到“虻类”安全流程。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.horseFly, NHS_BITES]
  }),
  candidate({
    id: 'paper_wasp', name: '纸蜂', scientificName: 'Polistes spp.', commonCategory: '纸蜂属类群', aliases: ['长脚蜂'],
    group: 'stinging', groupName: '蜇刺类', summary: '常在屋檐、灌木或建筑附近筑开放式纸巢的蜂类群。',
    appearance: '身体较细长、足较长，飞行时足可能下垂；不同种颜色差异明显。', identificationKeys: ['体形细长', '足较长', '开放式纸巢'],
    distribution: '世界多地可见，具体物种分布需本地核验。', habitat: '屋檐、棚架、灌木和其他可固定开放式巢的位置。',
    contactPattern: '靠近或扰动巢穴时可能发生防御性蜇刺。', commonReaction: '常见即时疼痛、红肿和瘙痒；严重过敏需立即求助。',
    compareClues: '远距离观察即可，不要靠近蜂巢拍照确认。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.paperWasp, CDC_STINGS, NHS_BITES]
  }),
  candidate({
    id: 'common_ants', name: '大头家蚁／常见蚂蚁', scientificName: 'Formicidae', commonCategory: '蚁科类群', aliases: ['常见蚂蚁'],
    group: 'stinging', groupName: '咬伤／蜇刺', summary: '用于提示用户不要把所有蚂蚁都等同于红火蚁。',
    appearance: '蚂蚁有明显触角和细腰，不同属种体形、颜色和是否具有有效螫针差异很大。', identificationKeys: ['弯折触角', '细腰', '群体活动'],
    distribution: '广泛分布于居住区和户外环境。', habitat: '住宅缝隙、庭院、土壤、树木和食物附近。',
    contactPattern: '部分种类可咬或蜇，但多数日常常见蚂蚁不会造成严重伤害。', commonReaction: '可能有短暂刺痛、红痒；严重全身反应罕见但需按急症处理。',
    compareClues: '只有在有可靠巢体、虫体和地区证据时才考虑更具体类群。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.ants, CDC_STINGS]
  }),
  candidate({
    id: 'spider', name: '蜘蛛（非物种级）', scientificName: 'Araneae', commonCategory: '蜘蛛目类群', aliases: ['蜘蛛类'],
    group: 'stinging', groupName: '疑似咬伤', summary: '安全说明页，重点强调无法凭伤口外观确认蜘蛛咬伤。',
    appearance: '成体通常有八足、无触角，外观差异极大。', identificationKeys: ['成体八足', '身体通常分前后两部分', '无触角'],
    distribution: '广泛存在于室内外环境，多数种类避人。', habitat: '房屋角落、庭院、植被、石缝和其他小型节肢动物丰富处。',
    contactPattern: '确切咬伤通常需要目击或获取虫体；许多不明皮损会被误认为蜘蛛咬伤。', commonReaction: '可有局部疼痛、红肿；进行性坏死、剧烈全身症状或神经异常需及时就医。',
    compareClues: '伤口上的“双牙印”不是可靠确证标准。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.spiderStudy, VERIFIED_SOURCES.spiderHealth, NHS_BITES]
  }),
  candidate({
    id: 'pine_caterpillars_other', name: '松毛虫类（其他种）', scientificName: 'Dendrolimus spp.', commonCategory: '松毛虫属类群', aliases: ['其他松毛虫'],
    group: 'contact', groupName: '接触刺激', summary: '覆盖马尾松毛虫之外的松林毛虫接触，不强行识别到种。',
    appearance: '幼虫通常体表有较多毛束，不同种及龄期差异明显。', identificationKeys: ['松林暴露', '多毛幼虫', '接触后刺激'],
    distribution: '不同种与松树分布相关，本地种类需林业资料核验。', habitat: '松林、松树枝叶和受影响林区物品。',
    contactPattern: '直接触碰幼虫、虫茧、脱落毒毛或受污染衣物可能引起刺激。', commonReaction: '可能出现瘙痒、红疹和眼部或呼吸道刺激。',
    compareClues: '应按“刺激性毛虫接触”处理，图片只用于类群记录。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.pineMothTaxonomy, GOV_CATERPILLAR]
  }),
  candidate({
    id: 'tussock_moth_larvae', name: '毒蛾幼虫类（其他种）', scientificName: 'Erebidae: Lymantriinae', commonCategory: '毒蛾亚科幼虫类群', aliases: ['毒蛾毛虫'],
    group: 'contact', groupName: '接触刺激', summary: '用于覆盖茶毛虫之外的多毛毒蛾幼虫接触。',
    appearance: '幼虫常有明显毛簇或毛刷状结构，但不同类群差异显著。', identificationKeys: ['多毛幼虫', '毛簇明显', '接触后刺激'],
    distribution: '不同种分布差异很大，需结合本地林业和昆虫资料。', habitat: '树木、灌木、园林和可能沾有毒毛的物品。',
    contactPattern: '触碰幼虫、脱落毛或受污染物品可能引起皮肤、眼部或呼吸道刺激。', commonReaction: '可能出现瘙痒、红疹、眼部刺激或呼吸不适。',
    compareClues: '不依赖毛虫种级识别决定是否冲洗和求助。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.tussockCdc, GOV_CATERPILLAR]
  }),
  candidate({
    id: 'cucumber_leaf_beetles', name: '黄守瓜等瓜叶甲', scientificName: 'Chrysomelidae', commonCategory: '叶甲科候选类群', aliases: ['黄守瓜', '瓜叶甲'],
    group: 'contact', groupName: '接触刺激', summary: '农业和园艺场景的边界条目；目前缺乏足够人体健康证据，不应描述为普遍有毒。',
    appearance: '叶甲通常体形较小、椭圆，颜色和斑纹多样；黄守瓜只是其中的通俗代表。', identificationKeys: ['小型甲虫', '植物叶面活动', '物种差异大'],
    distribution: '与农作物和园艺植物相关，浙江本地种类需农业资料核验。', habitat: '菜园、瓜田、农作物和园艺植物周边。',
    contactPattern: '普通接触通常不是典型虫咬场景；若出现刺激，应记录是否有虫体被揉碎或其他物质接触。', commonReaction: '目前不应给出特异性人体反应结论。',
    compareClues: '证据不足时显示“常见甲虫类，通常不属于本产品主要致伤对象”。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.cucumberAgriculture]
  }),
  candidate({
    id: 'blister_beetles', name: '斑蝥类', scientificName: 'Meloidae', commonCategory: '芫菁科类群', aliases: ['芫菁类', '斑蝥'],
    group: 'contact', groupName: '接触刺激', summary: '与豆芫菁共用芫菁体液接触安全流程，避免把俗名等同于单一物种。',
    appearance: '芫菁科成员体形和颜色多样，部分体节较柔软；普通照片不宜精确到种。', identificationKeys: ['甲虫外形', '体液接触', '可能形成水疱'],
    distribution: '多地可见，具体属种和本地记录待核验。', habitat: '农田、草地、花丛、灯下或柴草物品。',
    contactPattern: '拍碎、揉压或体液接触皮肤可能造成刺激。', commonReaction: '可能出现灼痛、红斑和水疱。',
    compareClues: '处置取决于体液接触和皮肤表现，不依赖物种识别。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.blisterReview, NHS_BITES]
  }),
  candidate({
    id: 'tropical_bedbug', name: '热带臭虫', scientificName: 'Cimex hemipterus', commonCategory: '臭虫类旅行条目', aliases: ['热带床虱'],
    group: 'blood_feeding', groupName: '旅行／住宿叮咬', summary: '住宿和国际旅行场景补充；是否独立展示取决于目标地区。',
    appearance: '与温带臭虫外观相似，物种级区分需要专业形态观察。', identificationKeys: ['住宿环境证据', '扁平无翅虫体', '床具缝隙痕迹'],
    distribution: '偏热带和亚热带地区，具体旅行目的地需地区资料核验。', habitat: '旅馆、住宅、交通住宿环境、行李和床具缝隙。',
    contactPattern: '常在睡眠期间叮咬暴露皮肤，并可能随行李迁移。', commonReaction: '可出现红肿、瘙痒，也可能暂时没有明显反应。',
    compareClues: '不能用皮损排列区分温带和热带臭虫。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.tropicalBedbug, NHS_BITES]
  }),
  candidate({
    id: 'triatomine', name: '锥蝽', scientificName: 'Triatominae', commonCategory: '锥蝽亚科旅行类群', aliases: ['接吻虫'],
    group: 'blood_feeding', groupName: '国际旅行叮咬', summary: '区域限定的国际旅行安全条目，中国本地首页优先级低。',
    appearance: '体形通常扁长，头部较长，腹部边缘可能有明显色带；近似半翅目昆虫较多。', identificationKeys: ['旅行地区', '夜间居住环境', '虫体专业鉴定'],
    distribution: '主要风险地区位于美洲，产品必须结合旅行目的地限制展示。', habitat: '部分流行地区的简陋住宅缝隙、动物巢穴和室外栖息地。',
    contactPattern: '可能在夜间吸血；单次皮损不能确认锥蝽。', commonReaction: '叮咬处可能出现局部反应；旅行后不适需告知目的地和暴露史。',
    compareClues: '不能把中国常见猎蝽等近似昆虫自动标成锥蝽。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.chagas, WHO_VECTOR_SOURCE]
  }),
  candidate({
    id: 'tsetse_fly', name: '采采蝇', scientificName: 'Glossina spp.', commonCategory: '采采蝇属旅行类群', aliases: ['舌蝇'],
    group: 'blood_feeding', groupName: '国际旅行叮咬', summary: '仅用于撒哈拉以南非洲旅行场景，不放入中国本地识别首页。',
    appearance: '中等体形的吸血蝇类，静止时翅常重叠；普通用户照片不适合可靠确认。', identificationKeys: ['非洲旅行地区', '白天户外暴露', '专业虫体鉴定'],
    distribution: '限于撒哈拉以南非洲部分地区。', habitat: '不同种与河岸植被、林地或稀树草原相关。',
    contactPattern: '雌雄均可在白天叮咬吸血。', commonReaction: '可能出现疼痛性叮咬；旅行后发热或神经系统不适需尽快就医并说明行程。',
    compareClues: '地理范围是重要限制，不能在中国本地场景输出采采蝇候选。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.tsetseWho, VERIFIED_SOURCES.tsetseCdc, WHO_VECTOR_SOURCE]
  }),
  candidate({
    id: 'leech', name: '水蛭（非节肢动物）', scientificName: 'Hirudinea', commonCategory: '非节肢动物补充入口', aliases: ['蚂蟥'],
    group: 'attached', groupName: '水生附着／吸血', summary: '水蛭不是节肢动物，但用户可能将其归入“虫咬”，因此提供明确的补充入口。',
    appearance: '身体柔软、分节并有吸盘，形态与蜱类完全不同。', identificationKeys: ['柔软伸缩身体', '前后吸盘', '水域或潮湿环境'],
    distribution: '不同水蛭类群分布广，需结合具体水域和旅行场景。', habitat: '淡水、湿地、溪流或潮湿植被环境。',
    contactPattern: '可吸附皮肤吸血，脱离后伤口可能继续少量渗血。', commonReaction: '常见局部伤口和持续一段时间的少量渗血；大量出血、无法止血或黏膜附着需就医。',
    compareClues: '明确标注“非节肢动物”，不要套用蜱的镊子垂直拔除流程。', sources: [CATALOG_SOURCE, VERIFIED_SOURCES.leechReview, VERIFIED_SOURCES.leechHealth]
  })
]

function getById(id) {
  return RECORDS.find((record) => record.id === id) || null
}

module.exports = { RECORDS, getById }


