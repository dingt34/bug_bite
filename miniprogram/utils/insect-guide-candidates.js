const REFERENCE_IMAGES = [
  { src: '/images/insect-guide/pending/01-observe.svg', caption: '观察整体轮廓：这是记录方法示意，不是本条目的物种照片', alt: '虫体整体轮廓观察方法示意图', credit: '虫咬识途科学内容组', license: 'Original illustration', sourceUrl: '' },
  { src: '/images/insect-guide/pending/02-detail.svg', caption: '记录局部特征：足、翅、触角和体节需要分别拍清', alt: '虫体局部特征记录方法示意图', credit: '虫咬识途科学内容组', license: 'Original illustration', sourceUrl: '' },
  { src: '/images/insect-guide/pending/03-context.svg', caption: '保留尺度与环境：候选类群需要结合地点和接触方式解释', alt: '虫体尺度与环境记录方法示意图', credit: '虫咬识途科学内容组', license: 'Original illustration', sourceUrl: '' }
];

const SOURCES = {
  cdcTick: { title: 'CDC · What to Do After a Tick Bite', url: 'https://www.cdc.gov/ticks/after-a-tick-bite/index.html' },
  cdcFlea: { title: 'CDC · About Fleas', url: 'https://www.cdc.gov/fleas/about/index.html' },
  cdcLice: { title: 'CDC · About Body Lice / Pubic Lice', url: 'https://www.cdc.gov/lice/about/index.html' },
  nhsBites: { title: 'NHS · Insect bites and stings', url: 'https://www.nhs.uk/conditions/insect-bites-and-stings/' },
  nhcWasp: { title: '国家卫生健康委 · 胡蜂蜇伤诊疗原则', url: 'https://www.nhc.gov.cn/yzygj/c100067/201310/d31a91c04892408bb9fbee5ad337d080.shtml' },
  govCaterpillar: { title: 'GOV.UK · Caterpillar hair exposure health effects', url: 'https://www.gov.uk/government/publications/oak-processionary-moth-opm-health-effects-of-exposure' },
  epaBedbug: { title: 'US EPA · Bed Bug Biology and Management', url: 'https://www.epa.gov/bedbugs' },
  cdcChagas: { title: 'CDC · How Chagas Disease Spreads', url: 'https://www.cdc.gov/chagas/spreads/index.html' },
  whoTsetse: { title: 'WHO · Human African trypanosomiasis', url: 'https://www.who.int/health-topics/human-african-trypanosomiasis' },
  leechReview: { title: 'PubMed · A Comprehensive Review of Hirudiniasis', url: 'https://pubmed.ncbi.nlm.nih.gov/29030099/' }
};

const ACTIONS = {
  attached: ['不要徒手挤压或拍碎附着物', '记录附着部位、时间和移除情况', '出现持续出血、发热或进行性不适时就医'],
  bite: ['用肥皂和清水清洁接触部位', '避免抓挠，可短时冷敷缓解局部不适', '出现呼吸困难、意识异常或快速加重时立即求助'],
  sting: ['立即离开虫群或巢穴附近', '清洁后短时冷敷并观察全身反应', '多处蜇伤或出现全身症状时立即就医'],
  contact: ['避免继续揉压虫体或受污染物品', '用流动清水充分冲洗接触部位', '眼部、呼吸道受累或大片水疱时及时就医']
};

function record(config) {
  const item = Object.assign({
    aliases: [], accent: '#61786c', zhejiangStatus: '', confusedWith: [],
    mediaStatus: 'PENDING_LICENSE', images: REFERENCE_IMAGES, caution: '当前为候选类群页；三张图为观察方法示意，不是物种确证照片。'
  }, config);
  item.firstActions = item.firstActions || ACTIONS[item.actionType || 'bite'];
  item.sources = (item.sourceKeys || ['nhsBites']).map(key => SOURCES[key]).filter(Boolean);
  delete item.actionType;
  delete item.sourceKeys;
  return item;
}

const ITEMS = [
  record({ id:'hard_ticks_other', name:'硬蜱（其他常见种）', scientificName:'Ixodes spp.; Dermacentor spp.', commonCategory:'硬蜱类群', aliases:['其他硬蜱','硬蜱类'], group:'attached', groupName:'附着类', actionType:'attached', summary:'覆盖长角血蜱和血红扇头蜱之外的硬蜱暴露，仅提供类群级辨识。', appearance:'硬蜱成体通常有八足，口器位于身体前端，吸血后体形可明显胀大。', identificationKeys:['持续附着皮肤','成体八足','前端可见口器'], distribution:'不同属种分布差异明显，必须结合本地监测资料解释。', habitat:'草地、灌木、林地、落叶层及动物活动区域。', contactPattern:'可能附着皮肤持续吸血，叮咬当时不一定有明显感觉。', commonReaction:'附着处可能出现小红点或局部刺激，也可能暂时没有明显表现。', compareClues:'普通照片通常只能判断疑似硬蜱，种级鉴定需要专业形态观察。', sourceKeys:['cdcTick'] }),
  record({ id:'human_flea', name:'人蚤', scientificName:'Pulex irritans', commonCategory:'跳蚤类', aliases:['人跳蚤'], group:'blood_feeding', groupName:'吸血叮咬', summary:'可与人和多种动物相关；环境暴露和持续新叮咬比皮损形状更有参考价值。', appearance:'无翅、身体侧扁、后足发达，近似种通常需要显微特征区分。', identificationKeys:['无翅侧扁','后足发达','能够快速跳跃'], distribution:'世界多地可见，发生与宿主和居住环境相关。', habitat:'动物巢穴、寝具、地毯和受影响的居住环境。', contactPattern:'可造成多处瘙痒性叮咬，环境未处理时可能持续出现。', commonReaction:'常见小丘疹、红肿和瘙痒，皮损排列不能确认蚤种。', compareClues:'虫体会跳及动物接触史比皮损形状更有意义。', sourceKeys:['cdcFlea','nhsBites'] }),
  record({ id:'body_pubic_lice', name:'体虱／阴虱', scientificName:'Pediculus humanus humanus / Pthirus pubis', commonCategory:'虱类组合页', aliases:['体虱','阴虱','衣虱'], group:'attached', groupName:'附着／寄生', actionType:'attached', summary:'两类对象的寄生部位和传播场景不同，本页仅作为隐私友好的组合入口。', appearance:'体虱与衣物缝隙关系密切；阴虱体形较短宽，常附着于较粗体毛。', identificationKeys:['活虱或卵的直接证据','相应衣物或体毛部位','密切接触或同住线索'], distribution:'全球可见，发生与具体接触和生活条件相关。', habitat:'体虱多见于贴身衣物缝隙；阴虱主要涉及较粗体毛区域。', contactPattern:'可经密切接触或受影响衣物传播。', commonReaction:'可能出现瘙痒、抓痕和局部刺激，继发感染时需就医。', compareClues:'头皮屑、一般瘙痒或模糊照片都不能作为确证。', sourceKeys:['cdcLice'] }),
  record({ id:'horse_deer_flies', name:'鹿虻、虻类', scientificName:'Tabanidae', commonCategory:'虻科类群', aliases:['虻类','鹿虻','马虻'], group:'blood_feeding', groupName:'吸血叮咬', summary:'户外、水边和牧区可能遇到的疼痛性叮咬飞虫类群。', appearance:'多为中大型、复眼明显、飞行有力的双翅目昆虫，属种间差异较大。', identificationKeys:['中大型飞虫','复眼明显','叮咬常立即疼痛'], distribution:'世界多地可见，中国和浙江的具体属种需本地昆虫资料确认。', habitat:'湿地、水边、牧场、林缘及大型动物活动区域。', contactPattern:'雌虫可能在白天叮咬暴露皮肤。', commonReaction:'可出现疼痛、红肿和瘙痒；大片肿胀或全身反应需升级求助。', compareClues:'大型飞虫、疼痛叮咬和水边环境只能提示虻类，不能确认属种。' }),
  record({ id:'tabanus', name:'牛虻', scientificName:'Tabanus spp.', commonCategory:'虻属代表页', aliases:['牛虻类'], group:'blood_feeding', groupName:'吸血叮咬', summary:'虻属代表性类群页，不承担种级诊断。', appearance:'通常为中大型、体形粗壮的飞虫，复眼明显，具体种间差异较大。', identificationKeys:['体形粗壮','复眼明显','叮咬疼痛'], distribution:'属级分布广，浙江具体种需监测或分类资料确认。', habitat:'牧区、田野、林缘和水体附近。', contactPattern:'可能在白天叮咬人或动物的暴露皮肤。', commonReaction:'常见即时疼痛、红肿和瘙痒。', compareClues:'与其他虻科成员难凭普通照片区分，应回到虻类安全流程。' }),
  record({ id:'paper_wasp', name:'纸蜂', scientificName:'Polistes spp.', commonCategory:'纸蜂属类群', aliases:['长脚蜂'], group:'stinging', groupName:'蜇刺类', actionType:'sting', summary:'常在屋檐、灌木或建筑附近筑开放式纸巢的蜂类群。', appearance:'身体较细长、足较长，飞行时足可能下垂；不同种颜色差异明显。', identificationKeys:['体形细长','足较长','开放式纸巢'], distribution:'世界多地可见，具体物种分布需本地核验。', habitat:'屋檐、棚架、灌木和其他可固定开放式巢的位置。', contactPattern:'靠近或扰动巢穴时可能发生防御性蜇刺。', commonReaction:'常见即时疼痛、红肿和瘙痒，严重过敏需立即求助。', compareClues:'远距离观察即可，不要靠近蜂巢拍照确认。', sourceKeys:['nhcWasp','nhsBites'] }),
  record({ id:'common_ants', name:'大头家蚁／常见蚂蚁', scientificName:'Formicidae', commonCategory:'蚁科类群', aliases:['常见蚂蚁'], group:'stinging', groupName:'咬伤／蜇刺', actionType:'sting', summary:'用于提醒不要把所有蚂蚁都等同于红火蚁。', appearance:'蚂蚁有弯折触角和细腰，不同属种的体形、颜色及螫刺能力差异很大。', identificationKeys:['弯折触角','腰部明显收窄','常见群体活动'], distribution:'广泛存在于居住区和户外环境。', habitat:'住宅缝隙、庭院、土壤、树木和食物附近。', contactPattern:'部分种类可咬或蜇，多数日常常见蚂蚁不会造成严重伤害。', commonReaction:'可能有短暂刺痛、红痒；出现全身反应时仍需按急症处理。', compareClues:'只有可靠巢体、虫体和地区证据才支持更具体的类群判断。' }),
  record({ id:'spider', name:'蜘蛛（非物种级）', scientificName:'Araneae', commonCategory:'蜘蛛目类群', aliases:['蜘蛛类'], group:'stinging', groupName:'疑似咬伤', summary:'重点说明无法凭伤口外观确认蜘蛛咬伤。', appearance:'成体通常有八足、无触角，身体多分为头胸部和腹部，外观差异极大。', identificationKeys:['成体八足','身体通常分前后两部分','无触角'], distribution:'广泛存在于室内外环境，多数种类避人。', habitat:'房屋角落、庭院、植被、石缝及小型节肢动物丰富处。', contactPattern:'确切咬伤通常需要目击或获得虫体；许多不明皮损会被误认为蜘蛛咬伤。', commonReaction:'可有局部疼痛和红肿；进行性坏死、剧烈全身症状或神经异常需就医。', compareClues:'伤口上的所谓“双牙印”不是可靠确证标准。' }),
  record({ id:'pine_caterpillars_other', name:'松毛虫类（其他种）', scientificName:'Dendrolimus spp.', commonCategory:'松毛虫属类群', aliases:['其他松毛虫'], group:'contact', groupName:'接触刺激', actionType:'contact', summary:'覆盖马尾松毛虫之外的松林毛虫接触，不强行识别到种。', appearance:'幼虫通常有较多毛束，不同种和龄期差异明显。', identificationKeys:['松林暴露','多毛幼虫','接触后刺激'], distribution:'不同种与松树分布相关，本地种类需林业资料核验。', habitat:'松林、松树枝叶和受影响林区物品。', contactPattern:'触碰幼虫、虫茧、脱落毛或受污染衣物可能引起刺激。', commonReaction:'可能出现瘙痒、红疹以及眼部或呼吸道刺激。', compareClues:'应按刺激性毛虫接触处理，图片只用于类群记录。', sourceKeys:['govCaterpillar'] }),
  record({ id:'tussock_moth_larvae', name:'毒蛾幼虫类（其他种）', scientificName:'Erebidae: Lymantriinae', commonCategory:'毒蛾亚科幼虫类群', aliases:['毒蛾毛虫'], group:'contact', groupName:'接触刺激', actionType:'contact', summary:'覆盖茶毛虫之外的多毛毒蛾幼虫接触。', appearance:'幼虫常有明显毛簇或毛刷状结构，但不同类群差异显著。', identificationKeys:['多毛幼虫','毛簇明显','接触后刺激'], distribution:'不同种分布差异较大，需结合本地林业和昆虫资料。', habitat:'树木、灌木、园林及可能沾有刺激性毛的物品。', contactPattern:'触碰幼虫、脱落毛或受污染物品可能引起皮肤、眼部或呼吸道刺激。', commonReaction:'可能出现瘙痒、红疹、眼部刺激或呼吸不适。', compareClues:'不依赖种级识别决定是否冲洗和求助。', sourceKeys:['govCaterpillar'] }),
  record({ id:'cucumber_leaf_beetles', name:'黄守瓜等瓜叶甲', scientificName:'Chrysomelidae', commonCategory:'叶甲科候选类群', aliases:['黄守瓜','瓜叶甲'], group:'contact', groupName:'接触边界', actionType:'contact', summary:'农业和园艺场景的边界条目；现有证据不足以将其描述为普遍有毒。', appearance:'叶甲通常体形较小、椭圆，颜色和斑纹多样；黄守瓜只是通俗代表。', identificationKeys:['小型甲虫','植物叶面活动','种间差异较大'], distribution:'与农作物和园艺植物相关，浙江本地种类需农业资料核验。', habitat:'菜园、瓜田、农作物和园艺植物周边。', contactPattern:'普通接触通常不是典型虫咬场景；应记录是否有虫体被揉碎或其他物质接触。', commonReaction:'目前不应给出特异性人体反应结论。', compareClues:'证据不足时应视为常见甲虫类，而不是主要致伤对象。' }),
  record({ id:'blister_beetles', name:'斑蝥类', scientificName:'Meloidae', commonCategory:'芫菁科类群', aliases:['芫菁类','斑蝥'], group:'contact', groupName:'接触刺激', actionType:'contact', summary:'与豆芫菁共用体液接触安全流程，俗名不等于单一物种。', appearance:'芫菁科成员体形和颜色多样，部分体节较柔软，普通照片不宜精确到种。', identificationKeys:['甲虫外形','体液接触','可能形成水疱'], distribution:'多地可见，具体属种和本地记录需进一步核验。', habitat:'农田、草地、花丛、灯下或柴草物品。', contactPattern:'拍碎、揉压或体液接触皮肤可能造成刺激。', commonReaction:'可能出现灼痛、红斑和水疱。', compareClues:'处置取决于体液接触和皮肤表现，不依赖物种识别。' }),
  record({ id:'tropical_bedbug', name:'热带臭虫', scientificName:'Cimex hemipterus', commonCategory:'臭虫类旅行条目', aliases:['热带床虱'], group:'blood_feeding', groupName:'旅行／住宿叮咬', summary:'住宿和国际旅行场景的补充条目。', appearance:'与温带臭虫外观相似，物种级区分需要专业形态观察。', identificationKeys:['住宿环境证据','扁平无翅虫体','床具缝隙痕迹'], distribution:'偏热带和亚热带地区，必须结合旅行目的地解释。', habitat:'旅馆、住宅、交通住宿环境、行李和床具缝隙。', contactPattern:'常在睡眠期间叮咬暴露皮肤，并可能随行李迁移。', commonReaction:'可出现红肿和瘙痒，也可能暂时没有明显反应。', compareClues:'不能用皮损排列区分温带与热带臭虫。', sourceKeys:['epaBedbug','nhsBites'] }),
  record({ id:'triatomine', name:'锥蝽', scientificName:'Triatominae', commonCategory:'锥蝽亚科旅行类群', aliases:['接吻虫'], group:'blood_feeding', groupName:'国际旅行叮咬', summary:'区域限定的国际旅行安全条目，中国本地场景不应优先输出。', appearance:'体形通常扁长、头部较长，腹部边缘可能有色带；近似半翅目昆虫较多。', identificationKeys:['美洲旅行地区','夜间居住环境','虫体专业鉴定'], distribution:'主要相关地区位于美洲，必须结合旅行目的地限制展示。', habitat:'部分流行地区的住宅缝隙、动物巢穴和室外栖息地。', contactPattern:'可能在夜间吸血，单次皮损不能确认锥蝽。', commonReaction:'叮咬处可能出现局部反应；旅行后不适需说明目的地和暴露史。', compareClues:'不能把中国常见猎蝽等近似昆虫自动标成锥蝽。', sourceKeys:['cdcChagas'] }),
  record({ id:'tsetse_fly', name:'采采蝇', scientificName:'Glossina spp.', commonCategory:'采采蝇属旅行类群', aliases:['舌蝇'], group:'blood_feeding', groupName:'国际旅行叮咬', summary:'仅用于撒哈拉以南非洲旅行场景。', appearance:'中等体形吸血蝇类，静止时翅常重叠；普通用户照片不适合可靠确认。', identificationKeys:['非洲旅行地区','白天户外暴露','专业虫体鉴定'], distribution:'限于撒哈拉以南非洲部分地区。', habitat:'不同种与河岸植被、林地或稀树草原相关。', contactPattern:'雌雄均可在白天叮咬吸血。', commonReaction:'可能出现疼痛性叮咬；旅行后发热或神经系统不适需尽快就医并说明行程。', compareClues:'地理范围是关键限制，不能在中国本地场景输出采采蝇候选。', sourceKeys:['whoTsetse'] }),
  record({ id:'leech', name:'水蛭（非节肢动物）', scientificName:'Hirudinea', commonCategory:'非节肢动物补充入口', aliases:['蚂蟥'], group:'attached', groupName:'水生附着／吸血', actionType:'attached', summary:'水蛭不是节肢动物，但常被用户归入“虫咬”，因此提供明确补充入口。', appearance:'身体柔软、分节并有吸盘，形态与蜱类完全不同。', identificationKeys:['柔软伸缩身体','具有前后吸盘','水域或潮湿环境'], distribution:'不同水蛭类群分布广，需结合具体水域和旅行场景。', habitat:'淡水、湿地、溪流或潮湿植被环境。', contactPattern:'可吸附皮肤吸血，脱离后伤口可能继续少量渗血。', commonReaction:'常见局部伤口和短时渗血；大量出血、无法止血或黏膜附着需就医。', compareClues:'明确标注非节肢动物，不应套用蜱的移除流程。', firstActions:['不要强行拉扯黏膜内附着物', '皮肤表面脱离后清洁并持续按压止血', '无法止血、黏膜附着或明显不适时就医'], sourceKeys:['leechReview'] })
];

module.exports = ITEMS;
