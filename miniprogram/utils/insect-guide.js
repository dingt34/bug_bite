const GROUPS = [
  { key: 'all', name: '全部' },
  { key: 'blood_feeding', name: '吸血叮咬' },
  { key: 'attached', name: '附着类' },
  { key: 'stinging', name: '蜇刺类' },
  { key: 'contact', name: '接触刺激' }
];

const SOURCES = {
  cdcMosquito: { title: 'CDC · About Mosquito Bites', url: 'https://www.cdc.gov/mosquitoes/about/about-mosquito-bites.html' },
  cdcTick: { title: 'CDC · What to Do After a Tick Bite', url: 'https://www.cdc.gov/ticks/after-a-tick-bite/index.html' },
  cdcFlea: { title: 'CDC · About Fleas', url: 'https://www.cdc.gov/fleas/about/index.html' },
  cdcBedBug: { title: 'CDC · About Bed Bugs', url: 'https://www.cdc.gov/bed-bugs/about/' },
  nhsBites: { title: 'NHS · Insect bites and stings', url: 'https://www.nhs.uk/conditions/insect-bites-and-stings/' },
  cdcStings: { title: 'CDC/NIOSH · Protecting Yourself from Stinging Insects', url: 'https://www.cdc.gov/niosh/docs/2010-117/' },
  govCaterpillar: { title: 'GOV.UK · Caterpillar hair exposure health effects', url: 'https://www.gov.uk/government/publications/oak-processionary-moth-opm-health-effects-of-exposure' },
  zhejiangMosquito: { title: '浙江省 2021 年蚊媒监测结果分析', url: 'https://html.rhhz.net/ZGMJSWXJKZXZZ/1741159356592-1532348306.htm' },
  zhejiangTick: { title: '浙江省部分地区蜱种调查与鉴定', url: 'https://html.rhhz.net/ZGMJSWXJKZXZZ/20150406.htm' },
  zhejiangTeaMoth: { title: '浙江省地方标准 · 油茶主要病虫害防治', url: 'https://zjjcmspublic.oss-cn-hangzhou-zwynet-d01-a.internet.cloud.zj.gov.cn/jcms_files/jcms1/web3707/site/attach/0/c4a93f0cfcfd48e9a758c9488e9a5541.pdf' },
  hangzhouPineMoth: { title: '国家林草局 · 杭州马尾松毛虫防治', url: 'https://www.forestry.gov.cn/c/www/dfdt/640155.jhtml' }
};

const COMMON_URGENT = [
  '呼吸困难、喘鸣或喉咙发紧', '口唇、舌头、面部或眼周明显肿胀', '头晕、昏厥、意识异常',
  '短时间内症状快速加重', '短时间内发生大量、多处叮咬或蜇伤'
];

function commonsFile(fileName) {
  return 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(fileName).replace(/%20/g, '_');
}

const ITEMS = [
  {
    id: 'mosquito', name: '白纹伊蚊', scientificName: 'Aedes albopictus', commonCategory: '蚊类',
    aliases: ['亚洲虎蚊', '花蚊子', '伊蚊'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#3F8F70',
    summary: '城市与居民区常见的伊蚊代表种，白天也会活动，常利用小型积水容器繁殖。',
    appearance: '黑色体表配有醒目的白色斑纹；胸背中央常见一条纵向白线，足部有白色环带。',
    identificationKeys: ['胸背中央单条白线', '黑白相间的足部环带', '体形细长且有长口器'],
    distribution: '原产亚洲，现已扩散至世界多地；在我国许多城市和温暖地区可见。',
    habitat: '居民区、公园、林缘及花盆托盘、废旧容器等小型积水周边。',
    contactPattern: '雌蚊短暂吸血，虫体通常不会持续附着；白天和黄昏均可能叮咬。',
    commonReaction: '可出现小的隆起、发红和瘙痒；不同人的反应差异较大。',
    compareClues: '优先观察胸背白线和腿部白环，不用叮咬包判断蚊种。',
    firstActions: ['用肥皂和清水清洁', '避免抓挠，肿痒时可短时冷敷', '记录近期旅行、发热或皮疹等全身表现'],
    caution: '外观相似的伊蚊仍可能混淆；照片只能提供线索，不能判断是否携带病原体。',
    confusedWith: ['flea', 'bedbug'], sourceKeys: ['cdcMosquito', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Aedes_albopictus',
    images: [
      { src: '/images/insect-guide/aedes-albopictus/01-overview.webp', caption: '侧面整体：观察长足、口器与足部白环', alt: '白纹伊蚊侧面整体照片', credit: 'Sixto Emmanuel Picones Puebla', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Aedes albopictus (Mosquito tigre).jpg') },
      { src: '/images/insect-guide/aedes-albopictus/02-dorsal.webp', caption: '背面细节：胸背中央纵向白线', alt: '白纹伊蚊背面辨识特征照片', credit: 'James Gathany, CDC', license: 'Public domain', sourceUrl: commonsFile('Aedes albopictus cdc.jpg') },
      { src: '/images/insect-guide/aedes-albopictus/03-wall.webp', caption: '停栖姿态：观察黑白相间的足部', alt: '白纹伊蚊停在墙面的照片', credit: 'Kyu3a', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Aedes albopictus on the wall - 1.jpg') }
    ]
  },
  {
    id: 'rove_beetle', name: '梭毒隐翅虫', scientificName: 'Paederus fuscipes', commonCategory: '隐翅虫类',
    aliases: ['毒隐翅虫', '隐翅虫', '青腰虫'], group: 'contact', groupName: '接触刺激', accent: '#A86B45',
    summary: '常见的毒隐翅虫代表种；不会靠叮咬致伤，拍碎或揉压后体液接触皮肤才是主要风险。',
    appearance: '身体细长，头部和短鞘翅多为黑色，胸部及部分腹节呈橙红色，外形近似小蚂蚁。',
    identificationKeys: ['黑橙相间的细长身体', '鞘翅很短且腹部外露', '受惊时可抬起腹端'],
    distribution: '广泛分布于亚洲等地，在温暖潮湿季节和水田、草地附近较常见。',
    habitat: '农田、水边、草地和潮湿植被附近，夜间可能被灯光吸引进入室内。',
    contactPattern: '通常不是叮咬；虫体被拍打、碾压或揉擦后，体液接触皮肤可引起刺激。',
    commonReaction: '接触后可出现灼痛、红斑、水疱或条索状皮炎，常在数小时后逐渐明显。',
    compareClues: '“黑橙细长虫体＋短鞘翅＋被拍碎后接触”比皮损形状更有参考价值。',
    firstActions: ['不要拍打或徒手捏碎，轻吹或用纸片移走', '疑似接触体液时尽快用肥皂和大量清水冲洗', '避免揉眼；眼部接触、大片水疱或明显疼痛时就医'],
    caution: '隐翅虫皮炎属于接触刺激，不是虫咬；仅凭条状红斑仍不能确定虫种。',
    confusedWith: ['ant', 'caterpillar'], sourceKeys: ['nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Paederus_fuscipes',
    images: [
      { src: '/images/insect-guide/paederus-fuscipes/01-overview.webp', caption: '背面整体：黑橙相间且腹部外露', alt: '梭毒隐翅虫背面整体照片', credit: 'Kyu3a', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Paederus fuscipes - 1.jpg') },
      { src: '/images/insect-guide/paederus-fuscipes/02-side.webp', caption: '侧面姿态：观察细长体形和短鞘翅', alt: '梭毒隐翅虫侧面照片', credit: 'Kyu3a', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Paederus fuscipes - 2.jpg') },
      { src: '/images/insect-guide/paederus-fuscipes/03-detail.webp', caption: '标本细节：头、胸、短鞘翅与腹部色带', alt: '梭毒隐翅虫标本细节照片', credit: 'Punlop Anusonpornperm', license: 'CC BY 4.0', sourceUrl: commonsFile('Paederus fuscipes Curtis 01.jpg') }
    ]
  },
  {
    id: 'flea', name: '猫栉首蚤', scientificName: 'Ctenocephalides felis', commonCategory: '跳蚤类',
    aliases: ['猫蚤', '跳蚤', '猫栉头蚤'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#887451',
    summary: '猫、犬及家庭环境中最常见的跳蚤代表种之一，无翅、侧扁且善跳。',
    appearance: '棕褐色、无翅，身体左右侧扁；后足发达，头部与前胸可见栉状刺列。',
    identificationKeys: ['身体左右侧扁', '后足特别发达', '头栉与前胸栉呈梳齿状'],
    distribution: '随猫犬等宿主广泛分布于世界多地，也可出现在室内织物环境。', habitat: '宠物休息区、地毯、软垫、动物巢穴及相关室内环境。',
    contactPattern: '可连续出现多处叮咬，腿部尤其膝下较常见，但并非固定规律。', commonReaction: '可出现瘙痒和刺激性小包，常为成组分布。',
    compareClues: '发现会跳的小型侧扁虫体、宠物接触史及环境证据比皮损排列更可靠。',
    firstActions: ['清洁皮肤并避免抓挠', '同步检查宠物、寝具和软装环境', '持续出现新叮咬时考虑专业虫害控制'], caution: '猫栉首蚤与犬栉首蚤等近似种通常需要显微特征确认。',
    confusedWith: ['bedbug', 'mosquito'], sourceKeys: ['cdcFlea', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Ctenocephalides_felis',
    images: [
      { src: '/images/insect-guide/ctenocephalides-felis/01-overview.webp', caption: '侧面整体：侧扁身体和发达后足', alt: '猫栉首蚤侧面整体照片', credit: 'Evanherk', license: 'CC BY-SA 3.0', sourceUrl: commonsFile('Catflea small.jpg') },
      { src: '/images/insect-guide/ctenocephalides-felis/02-specimen.webp', caption: '博物馆标本：观察体节和后足比例', alt: '猫栉首蚤博物馆标本照片', credit: 'Daniel J. Drew', license: 'CC0', sourceUrl: commonsFile('Ctenocephalides felis (YPM IZ 099582) 001.jpeg') },
      { src: '/images/insect-guide/ctenocephalides-felis/03-head.webp', caption: '头部细节：头栉与前胸栉示意', alt: '猫栉首蚤头部梳齿结构照片', credit: 'Uwe Gille / B kimmel', license: 'Public domain', sourceUrl: commonsFile('Cat flea combs.png') }
    ]
  },
  {
    id: 'bedbug', name: '温带臭虫', scientificName: 'Cimex lectularius', commonCategory: '臭虫类',
    aliases: ['臭虫', '床虱', '床虫'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#A56455',
    summary: '与人类居住环境关系密切的臭虫代表种，扁平无翅，常隐藏于床具和家具缝隙。',
    appearance: '成虫红褐色、椭圆且背腹扁平，无翅；吸血后腹部会变得更长、更饱满。', identificationKeys: ['红褐色椭圆扁平身体', '无翅且腹部分节明显', '成虫通常约苹果籽大小'],
    distribution: '随人员和行李迁移，世界多地的住宅、旅馆及交通住宿环境均可能出现。', habitat: '床垫包边、床架、家具缝隙、行李和住宿环境。',
    contactPattern: '常在睡眠期间叮咬暴露皮肤，可能出现成簇或近似线状分布。', commonReaction: '可有轻度肿起、发红和瘙痒，也有人暂时没有明显皮肤反应。',
    compareClues: '床垫缝隙内的虫体、蜕皮、卵或黑色排泄痕迹比皮损排列更有参考价值。', firstActions: ['清洁皮肤并避免抓挠', '检查床垫包边、床架和行李缝隙', '确认环境受影响时寻求规范虫害控制'],
    caution: '所谓“三点一线”并非确诊标准，皮肤表现与多种叮咬高度重叠。', confusedWith: ['flea', 'mosquito'], sourceKeys: ['cdcBedBug', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Cimex_lectularius',
    images: [
      { src: '/images/insect-guide/cimex-lectularius/01-adult.webp', caption: '成虫侧面：观察无翅、分节腹部', alt: '温带臭虫成虫侧面照片', credit: 'CDC / Piotr Naskrecki', license: 'Public domain', sourceUrl: commonsFile('Adult bed bug, Cimex lectularius.jpg') },
      { src: '/images/insect-guide/cimex-lectularius/02-female.webp', caption: '雌成虫背面：扁平椭圆体形，长度约 5 mm', alt: '温带臭虫雌成虫背面照片', credit: 'Gilles San Martin', license: 'CC BY-SA 2.0', sourceUrl: commonsFile('Adult Female Bed Bug - Cimex lectularius - Bug length approximately 5 mm.jpg') },
      { src: '/images/insect-guide/cimex-lectularius/03-evidence.webp', caption: '环境线索：床具缝隙中的臭虫活动痕迹', alt: '床具缝隙中的臭虫环境证据照片', credit: 'NY State IPM Program, Cornell University', license: 'CC BY 2.0', sourceUrl: commonsFile('Bed Bug Evidence (11555819853).jpg') }
    ]
  },
  {
    id: 'tick', name: '长角血蜱', scientificName: 'Haemaphysalis longicornis', commonCategory: '硬蜱类',
    aliases: ['长角蜱', '亚洲长角蜱', '蜱虫'], group: 'attached', groupName: '附着类', accent: '#566B49', summary: '东亚常见硬蜱代表种，可寄生于多种动物，也可能附着人体吸血。',
    appearance: '未吸血时体形较小、褐色且背腹扁平；成蜱有八足，吸血后腹部明显胀大。', identificationKeys: ['成体八足且无触角', '口器位于身体前端', '吸血前后体形变化明显'],
    distribution: '原生于东亚及周边地区，现已在更多国家和地区发现。', habitat: '高草、灌木、林地、落叶层以及牲畜或野生动物可能经过的区域。',
    contactPattern: '可牢固附着皮肤持续吸血，叮咬当时可能不明显；户外活动后应全身检查。', commonReaction: '附着处可有小红点或局部刺激，也可能暂时没有明显表现。',
    compareClues: '“持续附着＋八足虫体＋草灌环境”可提示硬蜱，但种级鉴定通常需要专业观察。', firstActions: ['尽快用清洁细尖镊子贴近皮肤夹住并稳定向上拉', '移除后清洁皮肤和双手并记录时间地点', '之后数周若出现发热或皮疹应就医并说明蜱暴露史'],
    caution: '不要用热源、指甲油或凡士林刺激其脱落；普通照片通常不足以确认长角血蜱。', confusedWith: ['bedbug', 'flea'], sourceKeys: ['cdcTick', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Haemaphysalis_longicornis',
    images: [
      { src: '/images/insect-guide/haemaphysalis-longicornis/01-overview.webp', caption: '腹面整体：观察八足与前端口器', alt: '长角血蜱腹面整体照片', credit: 'James Gathany, CDC', license: 'Public domain', sourceUrl: commonsFile('Longhorned tick (Haemaphysalis longicornis).png') },
      { src: '/images/insect-guide/haemaphysalis-longicornis/02-key.webp', caption: '雌成蜱辨识图：背面与腹面组合', alt: '长角血蜱雌成蜱辨识图', credit: 'Egizi et al., ZooKeys (2019)', license: 'CC0', sourceUrl: commonsFile('Haemaphysalis longicornis (10.3897-zookeys.818.30448) Figure 1.jpg') },
      { src: '/images/insect-guide/haemaphysalis-longicornis/03-detail.webp', caption: '雄成蜱辨识图：不同视角下的结构', alt: '长角血蜱雄成蜱辨识图', credit: 'Egizi et al., ZooKeys (2019)', license: 'CC0', sourceUrl: commonsFile('Haemaphysalis longicornis (10.3897-zookeys.818.30448) Figure 2.jpg') }
    ]
  },
  {
    id: 'bee_wasp', name: '黄脚胡蜂', scientificName: 'Vespa velutina', commonCategory: '胡蜂类',
    aliases: ['黄脚虎头蜂', '亚洲胡蜂', '黄脚马蜂'], group: 'stinging', groupName: '蜇刺类', accent: '#D19724', summary: '亚洲常见胡蜂代表种，体色整体偏深，足端偏黄；接近巢穴可能引发防御攻击。',
    appearance: '胸部多呈深色，腹部以深色为主并有较显眼的黄橙色带，足部末端偏黄。', identificationKeys: ['深色胸部', '腹部黄橙色宽带', '足端呈黄色'],
    distribution: '原产亚洲，在我国多地可见，部分亚种已扩散到欧洲等地。', habitat: '林地、果园、花丛、屋檐及高处或隐蔽处的巢穴周边。',
    contactPattern: '蜇刺通常立即疼痛；靠近或扰动巢穴时可能遭遇多只蜂连续攻击。', commonReaction: '常见局部疼痛、红肿和瘙痒；严重过敏可累及呼吸、循环或全身。',
    compareClues: '远距离观察深色胸部、腹部色带和黄足即可，不要靠近巢穴拍照确认。', firstActions: ['立即离开蜂群或巢穴附近', '不要拍打追逐，进入室内或车辆等可封闭空间', '局部肿痛可隔布冷敷并持续观察全身反应'],
    caution: '胡蜂种类相似且现场风险高；口咽附近蜇伤、多次蜇伤或全身反应应尽快求助。', confusedWith: ['ant'], sourceKeys: ['cdcStings', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Vespa_velutina',
    images: [
      { src: '/images/insect-guide/vespa-velutina/01-overview.webp', caption: '自然姿态：深色胸部、腹部色带和黄足', alt: '黄脚胡蜂在花上的侧面照片', credit: 'Charles J. Sharp', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Asian hornet (Vespa velutina).jpg') },
      { src: '/images/insect-guide/vespa-velutina/02-side.webp', caption: '侧面整体：观察体色与足端颜色', alt: '黄脚胡蜂侧面整体照片', credit: 'Eastolany', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Asian Hornet.jpg') },
      { src: '/images/insect-guide/vespa-velutina/03-detail.webp', caption: '近距离细节：仅作图鉴观察，请勿现场靠近', alt: '黄脚胡蜂近距离辨识照片', credit: 'nature.catcher', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Asian predatory wasp (Vespa velutina var. nigrithorax).jpg') }
    ]
  },
  {
    id: 'ant', name: '红火蚁', scientificName: 'Solenopsis invicta', commonCategory: '蚂蚁类',
    aliases: ['入侵红火蚁', '火蚁', '红蚂蚁'], group: 'stinging', groupName: '蜇刺类', accent: '#B45B3C', summary: '具有攻击性的入侵蚁种，受扰动时可群体爬上人体并反复蜇刺。',
    appearance: '工蚁红褐至深褐色，同一群体内个体大小差异明显，腹部通常颜色更深。', identificationKeys: ['同巢工蚁大小不一', '红褐色身体与较深腹部', '地面常见疏松土丘状蚁巢'],
    distribution: '原产南美，已入侵多个国家和地区；我国南方部分地区有分布。', habitat: '草坪、田地、路边、堤岸和受扰动地面，常形成明显或不规则蚁丘。',
    contactPattern: '工蚁可先咬住皮肤再以腹部蜇刺，短时间内可能造成多处损伤。', commonReaction: '常先有灼痛和红色小包，之后可能形成白色液体样小疱。',
    compareClues: '现场蚁丘、群体快速攻击、大小不一的红褐色工蚁是重要线索。', firstActions: ['迅速离开蚁群并拂去附着蚂蚁', '清洁皮肤并隔布冷敷', '不要挤破后续出现的小疱'],
    caution: '普通红色蚂蚁不一定是红火蚁，确认物种应结合蚁巢和专业鉴定。', confusedWith: ['bee_wasp', 'rove_beetle'], sourceKeys: ['cdcStings'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Solenopsis_invicta',
    images: [
      { src: '/images/insect-guide/solenopsis-invicta/01-colony.webp', caption: '群体活动：同巢工蚁大小可有差异', alt: '红火蚁群体活动照片', credit: 'Wing-Chi Poon', license: 'CC BY-SA 2.5', sourceUrl: commonsFile('A Texas Ant Colony.jpg') },
      { src: '/images/insect-guide/solenopsis-invicta/02-workers.webp', caption: '工蚁整体：观察红褐色身体与深色腹部', alt: '红火蚁工蚁照片', credit: 'USDA', license: 'Public domain', sourceUrl: commonsFile('Fire ants02.jpg') },
      { src: '/images/insect-guide/solenopsis-invicta/03-closeup.webp', caption: '自然环境近照：观察头、胸、腹部色差', alt: '红火蚁在植物上的近距离照片', credit: 'Hugo A. Quintero G.', license: 'CC BY 2.0', sourceUrl: commonsFile('Formicidae Solenopsis invicta (8248285394).jpg') }
    ]
  },
  {
    id: 'caterpillar', name: '褐边绿刺蛾', scientificName: 'Parasa consocia', commonCategory: '刺蛾类',
    aliases: ['基褐绿刺蛾', '黄缘绿刺蛾', '刺毛虫'], group: 'contact', groupName: '接触刺激', accent: '#779455', summary: '常见绿刺蛾代表种；造成皮肤刺激的是带刺幼虫，成虫为绿色与褐色相间的蛾。',
    appearance: '幼虫黄绿色，体表有成簇刺突；成虫前翅以绿色为主，基部和外缘带褐色。', identificationKeys: ['幼虫体表有成簇刺突', '幼虫背部常见蓝绿色纵纹', '成虫绿翅带褐色边区'],
    distribution: '分布于中国、日本、朝鲜半岛、俄罗斯远东及台湾等地区。', habitat: '林地、园林和多种阔叶植物叶片上，幼虫可能混在枝叶或掉落物中。',
    contactPattern: '多为皮肤直接触碰幼虫刺毛，不一定发生真正的“叮咬”。', commonReaction: '可出现即时刺痛、瘙痒、红斑或风团，严重程度因接触范围和个体而异。',
    compareClues: '应同时区分幼虫与成虫阶段；有刺激风险的是带刺幼虫。', firstActions: ['不要徒手揉搓或拍打幼虫', '可用胶带轻粘残留刺毛后用流动水冲洗并自然晾干', '脱下可能沾有刺毛的衣物并单独清洗'],
    caution: '刺蛾幼虫近似种较多，颜色会随龄期变化；眼、口鼻接触或全身反应应及时就医。', confusedWith: ['rove_beetle', 'bee_wasp'], sourceKeys: ['nhsBites', 'govCaterpillar'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Parasa_consocia',
    images: [
      { src: '/images/insect-guide/parasa-consocia/01-larva.webp', caption: '幼虫阶段：体表刺突是接触风险来源', alt: '褐边绿刺蛾幼虫在叶片上的照片', credit: 'Bulsara1971', license: 'Public domain', sourceUrl: commonsFile('Larva of moth.jpg') },
      { src: '/images/insect-guide/parasa-consocia/02-specimen.webp', caption: '成虫标本：观察绿色前翅和褐色边区', alt: '褐边绿刺蛾成虫标本照片', credit: 'Hsu Hong Lin', license: 'CC BY 2.0', sourceUrl: commonsFile('A32-20180518-116 (42466980684).jpg') },
      { src: '/images/insect-guide/parasa-consocia/03-adult.webp', caption: '成虫停栖：成虫外观与带刺幼虫差异明显', alt: '褐边绿刺蛾成虫停在墙面的照片', credit: 'KKPCW (Kyu3)', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Green moth on white wall - 1.jpg') }
    ]
  },
  {
    id: 'culex_tritaeniorhynchus', name: '三带喙库蚊', scientificName: 'Culex tritaeniorhynchus', commonCategory: '蚊类',
    aliases: ['三斑家蚊', '三带库蚊', '库蚊'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#587A5B', zhejiangStatus: '浙江监测常见种',
    summary: '浙江蚊媒监测中的常见优势种之一，稻田和牲畜活动区附近较多，黄昏至夜间更活跃。',
    appearance: '中小型棕褐色蚊，口器中段及腹部可见浅色带；许多关键特征很细小，现场照片不易稳定区分。',
    identificationKeys: ['整体棕褐且体形细长', '口器中段可见浅色环带', '腹部各节有浅色带纹'],
    distribution: '浙江 2021 年监测中占捕获蚊虫的 53.40%，在稻田、农村及畜禽环境周边尤其值得留意。',
    habitat: '稻田、灌溉沟渠、池塘等较大水体周边，以及猪圈、牛棚等动物活动区域。',
    contactPattern: '雌蚊多在黄昏至夜间吸血，可叮咬动物和人；吸血后不会持续附着。',
    commonReaction: '常见为局部隆起、发红和瘙痒，皮肤表现不能用于区分库蚊种类。',
    compareClues: '结合稻田或畜禽环境、夜间活动和口器浅色带观察；种级确认通常需要显微鉴定。',
    firstActions: ['用肥皂和清水清洁叮咬处', '避免抓挠，肿痒时可短时冷敷', '若之后出现发热、明显头痛或意识异常应及时就医并说明蚊虫暴露'],
    caution: '三带喙库蚊可涉及蚊媒疾病传播，但一次叮咬不等于感染；不能凭照片或皮损判断病原体风险。',
    confusedWith: ['mosquito', 'anopheles_sinensis', 'armigeres_subalbatus'], sourceKeys: ['zhejiangMosquito', 'cdcMosquito', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Culex_tritaeniorhynchus',
    images: [
      { src: '/images/insect-guide/culex-tritaeniorhynchus/01-overview.webp', caption: '整体与口器细节组合：观察棕褐体色和浅色带', alt: '三带喙库蚊整体与口器细节照片', credit: 'Michael Wunderli', license: 'CC BY 2.0', sourceUrl: commonsFile('Culex Tritaeniorhynchus (14854579477).jpg') },
      { src: '/images/insect-guide/culex-tritaeniorhynchus/02-side.webp', caption: '侧面整体：观察长足、口器和腹部带纹', alt: '三带喙库蚊侧面照片', credit: 'Michael Wunderli', license: 'CC BY 2.0', sourceUrl: commonsFile('Culex Tritaeniorhynchus (15038071321).jpg') },
      { src: '/images/insect-guide/culex-tritaeniorhynchus/03-detail.webp', caption: '近距离细节：口器和腹部浅色环带仅作辅助线索', alt: '三带喙库蚊近距离细节照片', credit: 'Kyu3a', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Reddish Brown mosquito on ground glass.jpg') }
    ]
  },
  {
    id: 'anopheles_sinensis', name: '中华按蚊', scientificName: 'Anopheles sinensis', commonCategory: '按蚊类',
    aliases: ['中华疟蚊', '按蚊'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#657D52', zhejiangStatus: '浙江监测记录种',
    summary: '浙江蚊媒监测记录种，常与稻田、水塘等环境相关，雌蚊多在黄昏和夜间吸血。',
    appearance: '体形细长，翅上常有深浅斑点；停栖时腹部常与停落面形成角度，而非大致平行。',
    identificationKeys: ['翅面可见深浅斑点', '停栖时腹部常向上倾斜', '雌蚊下颚须接近口器长度'],
    distribution: '浙江 2021 年蚊媒监测中有记录，水稻种植区和乡村水体周边较常见。',
    habitat: '稻田、池塘、沟渠和缓流水体周边，成蚊也可能进入住宅或牲畜棚舍。',
    contactPattern: '雌蚊以黄昏至夜间吸血为主，吸血后飞离，不会持续附着皮肤。',
    commonReaction: '可出现局部红肿、隆起和瘙痒；反应形态与其他蚊虫叮咬重叠。',
    compareClues: '完整虫体照片中“斑翅＋倾斜停姿”较有价值，单看叮咬包不能区分按蚊。',
    firstActions: ['清洁皮肤并避免抓挠', '出现局部肿痒时可短时冷敷', '若后续发热、寒战或明显不适，应就医并说明时间地点和蚊虫暴露'],
    caution: '按蚊种类的准确鉴定需要观察翅斑、足部和生殖器等特征；图片只能辅助初筛。',
    confusedWith: ['culex_tritaeniorhynchus', 'mosquito'], sourceKeys: ['zhejiangMosquito', 'cdcMosquito', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Anopheles_sinensis',
    images: [
      { src: '/images/insect-guide/anopheles-sinensis/01-feeding.webp', caption: '雌成蚊吸血姿态：观察斑翅和身体角度', alt: '中华按蚊雌成蚊吸血照片', credit: 'James Gathany, CDC', license: 'Public domain', sourceUrl: commonsFile('Anopheles-sinensis.png') },
      { src: '/images/insect-guide/anopheles-sinensis/02-illustration.webp', caption: '历史科学插图：按蚊成虫典型外形参考', alt: '中华按蚊科学插图', credit: 'Patrick Manson', license: 'Public domain', sourceUrl: commonsFile('Tropical Diseases - Fig 41.png') },
      { src: '/images/insect-guide/anopheles-sinensis/03-pupa.webp', caption: '蛹期显微影像：展示与成蚊不同的发育阶段', alt: '中华按蚊蛹期显微影像', credit: 'Ha Y, Yeom E, Ryu J, Lee S', license: 'CC BY 4.0', sourceUrl: commonsFile('Three-dimensional-structures-of-the-tracheal-systems-of-Anopheles-sinensis-and-Aedes-togoi-pupae-srep44490-s1.ogv') }
    ]
  },
  {
    id: 'armigeres_subalbatus', name: '骚扰阿蚊', scientificName: 'Armigeres subalbatus', commonCategory: '阿蚊类',
    aliases: ['白斑阿蚊', '阿蚊'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#536B60', zhejiangStatus: '浙江监测记录种',
    summary: '浙江监测可见的体形较粗壮蚊种，幼虫偏好富含有机质的积水，叮咬常让人立即感觉明显。',
    appearance: '成蚊整体深色而较粗壮，腹部侧面和足部可见浅色斑纹，口器较长并略向下弯。',
    identificationKeys: ['体形比常见库蚊更粗壮', '深色身体带浅色斑纹', '较长口器略向下弯'],
    distribution: '浙江 2021 年蚊媒监测中占 2.47%，在居民点及有机质丰富积水附近可能遇到。',
    habitat: '树洞、竹筒、废旧容器、污水沟和化粪池等富含有机质的小型积水附近。',
    contactPattern: '雌蚊可在白天、黄昏活动，叮咬时常较疼或让人立即察觉，吸血后飞离。',
    commonReaction: '常见局部疼痛、红肿或瘙痒，但反应不能用于确认虫种。',
    compareClues: '重点看粗壮体形、深浅斑纹和长口器，并结合有机质积水环境；不要只按叮咬疼痛判断。',
    firstActions: ['清洁叮咬处并避免抓挠', '肿痒时可隔布冷敷', '清理住处周边容器和富有机质积水，必要时联系专业消杀'],
    caution: '阿蚊与其他深色带白斑的蚊种容易混淆，普通手机照片常不足以做种级确认。',
    confusedWith: ['mosquito', 'culex_tritaeniorhynchus'], sourceKeys: ['zhejiangMosquito', 'cdcMosquito', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Armigeres_subalbatus',
    images: [
      { src: '/images/insect-guide/armigeres-subalbatus/01-overview.webp', caption: '自然停栖：观察较粗壮身体与浅色斑纹', alt: '骚扰阿蚊自然停栖照片', credit: 'LiCheng Shih', license: 'CC BY 2.0', sourceUrl: commonsFile('Armigeres (31179729360).jpg') },
      { src: '/images/insect-guide/armigeres-subalbatus/02-side.webp', caption: '侧面整体：观察长口器、长足与腹部斑纹', alt: '骚扰阿蚊侧面整体照片', credit: 'LiCheng Shih', license: 'CC BY 2.0', sourceUrl: commonsFile('Armigeres (31179729700).jpg') },
      { src: '/images/insect-guide/armigeres-subalbatus/03-specimen.webp', caption: '实验室标本：用于对照体形和足部比例', alt: '骚扰阿蚊实验室标本照片', credit: 'Frank Collins, CDC', license: 'Public domain', sourceUrl: commonsFile('Armigeres subalbatus mosquito.jpg') }
    ]
  },
  {
    id: 'tea_tussock_moth', name: '茶毛虫', scientificName: 'Euproctis pseudoconspersa', commonCategory: '毒蛾类',
    aliases: ['茶黄毒蛾', '茶毒蛾', 'Arna pseudoconspersa'], group: 'contact', groupName: '接触刺激', accent: '#9B7840', zhejiangStatus: '浙江林业防治对象',
    summary: '浙江茶园、油茶和山茶植物上可能遇到的毒蛾；幼虫及遗留毒毛接触皮肤可造成刺激。',
    appearance: '幼虫黄褐至深褐色，体表有密集长毛并常群集取食；成虫黄褐色，外观与幼虫差异明显。',
    identificationKeys: ['幼虫密生长毛', '低龄幼虫常群集叶面', '常见于茶、油茶或山茶叶片'],
    distribution: '浙江地方林业标准将茶黄毒蛾列为油茶主要害虫，并特别提示防止幼虫毒毛接触人体。',
    habitat: '茶园、油茶林、山茶花和其他茶科植物叶片、枝条附近，毒毛也可能残留在衣物或工具上。',
    contactPattern: '多为触碰幼虫、虫蜕、茧或飘散毒毛，不属于真正叮咬；揉擦会扩大接触范围。',
    commonReaction: '可出现刺痒、灼痛、红斑、丘疹或风团，眼鼻吸入或大面积接触风险更高。',
    compareClues: '“茶科植物＋群集长毛幼虫”是重要线索，但毒蛾幼虫近似种多，仍需结合专业鉴定。',
    firstActions: ['不要徒手拍打或揉擦接触处', '可用胶带轻粘表面毒毛，再用流动水冲洗并自然晾干', '更换并单独清洗可能沾有毒毛的衣物'],
    caution: '旧学名常写 Euproctis pseudoconspersa，部分分类资料使用 Arna pseudoconspersa；眼部、呼吸道接触或大片皮疹应及时就医。',
    confusedWith: ['pine_caterpillar', 'caterpillar'], sourceKeys: ['zhejiangTeaMoth', 'govCaterpillar', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Euproctis_pseudoconspersa',
    images: [
      { src: '/images/insect-guide/euproctis-pseudoconspersa/01-larvae.webp', caption: '群集幼虫：密生长毛，是主要接触风险阶段', alt: '茶毛虫幼虫群集在叶片上的照片', credit: 'Easyman', license: 'CC BY-SA 3.0', sourceUrl: commonsFile('Chadokuga.JPG') },
      { src: '/images/insect-guide/euproctis-pseudoconspersa/02-adult.webp', caption: '成虫阶段：黄褐色蛾体与幼虫外观差异明显', alt: '茶毛虫成虫照片', credit: 'Sui-setz', license: 'CC BY-SA 3.0', sourceUrl: commonsFile('Euproctis pseudoconspersa(adult) 081007.jpg') },
      { src: '/images/insect-guide/euproctis-pseudoconspersa/03-video-frame.webp', caption: '视频预览帧：成虫在草地环境活动', alt: '茶毛虫成虫在草地活动的视频预览帧', credit: 'The Nature Box', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Tea tussock moth (Arna pseudoconspersa).webm') }
    ]
  },
  {
    id: 'pine_caterpillar', name: '马尾松毛虫', scientificName: 'Dendrolimus punctatus', commonCategory: '枯叶蛾类',
    aliases: ['松毛虫', '马尾松枯叶蛾'], group: 'contact', groupName: '接触刺激', accent: '#776B4E', zhejiangStatus: '杭州常见林业害虫',
    summary: '浙江松林和景区可能遇到的有毒毛幼虫，杭州林业资料将其列为当地松树常见害虫。',
    appearance: '幼虫体形粗长、褐色至灰褐色，密生长毛并常在松针上活动；成虫为褐色枯叶状蛾。',
    identificationKeys: ['幼虫粗长且密生毛束', '主要取食马尾松等松针', '成虫褐色并有波状翅纹'],
    distribution: '国家林草局资料显示马尾松毛虫在杭州松林较常见，部分年份可发生多代并形成明显虫情。',
    habitat: '马尾松等松林、景区山地、林缘步道和松针落叶层；幼虫或脱落毒毛可能落到衣物上。',
    contactPattern: '触碰幼虫或其毒毛可刺激皮肤，并非吸血或蜇刺；不要踩踏、拍打或徒手清理。',
    commonReaction: '可出现局部刺痛、瘙痒、红斑或丘疹，接触范围大时反应可能更明显。',
    compareClues: '“松针环境＋粗长多毛幼虫”比单看皮疹更有参考价值；成虫本身并非主要接触风险阶段。',
    firstActions: ['避免揉擦，用胶带轻粘可能残留的毒毛', '用流动水冲洗并自然晾干接触处', '将沾染衣物脱下后单独清洗，避免抖动扩散毒毛'],
    caution: '松毛虫近似种和龄期差异较大；不要近距离触碰取样，眼口鼻接触、呼吸不适或大片反应应及时就医。',
    confusedWith: ['tea_tussock_moth', 'caterpillar'], sourceKeys: ['hangzhouPineMoth', 'govCaterpillar', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Dendrolimus_punctatus',
    images: [
      { src: '/images/insect-guide/dendrolimus-punctatus/01-view.webp', caption: '成虫标本：褐色翅面与波状纹路参考', alt: '马尾松毛虫成虫标本照片', credit: 'Hsu Hong Lin', license: 'CC BY 2.0', sourceUrl: commonsFile('A32-20111123-P003 (6571897885).jpg') },
      { src: '/images/insect-guide/dendrolimus-punctatus/02-view.webp', caption: '幼虫与松针：观察粗长身体和密集毛束', alt: '马尾松毛虫幼虫在松针上的照片', credit: 'LiCheng Shih', license: 'CC BY 2.0', sourceUrl: commonsFile('Dendrolimus punctatus (33101541162).jpg') },
      { src: '/images/insect-guide/dendrolimus-punctatus/03-view.webp', caption: '幼虫近照：不要在现场为拍摄而靠近或触碰', alt: '马尾松毛虫幼虫近距离照片', credit: 'LiCheng Shih', license: 'CC BY 2.0', sourceUrl: commonsFile('Dendrolimus punctatus (37963899204).jpg') }
    ]
  },
  {
    id: 'brown_dog_tick', name: '血红扇头蜱', scientificName: 'Rhipicephalus sanguineus', commonCategory: '硬蜱类',
    aliases: ['犬蜱', '褐犬蜱', '棕色犬蜱'], group: 'attached', groupName: '附着类', accent: '#705A43', zhejiangStatus: '浙江调查记录种',
    summary: '浙江蜱类调查中有记录，与犬及犬舍环境关系密切，也可能在室内完成生活史并叮咬人。',
    appearance: '未吸血时红褐至棕褐色、背腹扁平，成蜱八足且背面通常无明显花纹；雌蜱吸血后明显膨大。',
    identificationKeys: ['成蜱八足且整体棕褐', '背板通常无明显花纹', '与犬和犬舍环境关系密切'],
    distribution: '浙江多地蜱种调查记录到血红扇头蜱；不同调查中的数量差异较大，不代表所有地点都常见。',
    habitat: '犬体、犬舍、墙缝、地板缝、宠物休息区及温暖干燥的室内外环境。',
    contactPattern: '可附着皮肤持续吸血；也可能先在宠物或室内缝隙中发现游走虫体。',
    commonReaction: '附着处可有小红点、轻度红肿或刺激，也可能暂时没有明显感觉。',
    compareClues: '犬接触史和室内犬舍环境是重要线索；与长角血蜱的种级区分通常需观察口器和盾板等细节。',
    firstActions: ['用清洁细尖镊子贴近皮肤夹住蜱口器附近并稳定向上拉', '移除后清洁皮肤和双手，保存照片并记录时间地点', '之后数周出现发热、皮疹或明显不适时就医并说明蜱暴露史'],
    caution: '血红扇头蜱常被视为物种复合群，外观相近成员难凭照片区分；不要用热源、油脂或化学品刺激附着蜱。',
    confusedWith: ['tick', 'bedbug'], sourceKeys: ['zhejiangTick', 'cdcTick', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Rhipicephalus_sanguineus',
    images: [
      { src: '/images/insect-guide/rhipicephalus-sanguineus/01-overview.webp', caption: '吸血后雌蜱：腹部膨大，前端仍可见足部', alt: '吸血后的血红扇头蜱照片', credit: 'gailhampshire', license: 'CC BY 2.0', sourceUrl: commonsFile('Brown Dog Tick. Rhipicephalus sanguineus - Flickr - gailhampshire (1).jpg') },
      { src: '/images/insect-guide/rhipicephalus-sanguineus/02-side.webp', caption: '侧面整体：观察棕褐体色、八足与前端口器', alt: '血红扇头蜱侧面整体照片', credit: 'gailhampshire', license: 'CC BY 2.0', sourceUrl: commonsFile('Brown Dog Tick. Rhipicephalus sanguineus - Flickr - gailhampshire.jpg') },
      { src: '/images/insect-guide/rhipicephalus-sanguineus/03-sexes.webp', caption: '雌雄背面对照：观察盾板覆盖范围差异', alt: '血红扇头蜱雌雄背面对照照片', credit: 'Daktaridudu', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Rhipicephalus-sanguineus-female-male.jpg') }
    ]
  }
];

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function normalizeText(value) { return String(value || '').trim().toLowerCase(); }
function sourceList(sourceKeys) { return (sourceKeys || []).map(key => SOURCES[key]).filter(Boolean); }

function toSummary(item) {
  return { id: item.id, name: item.name, scientificName: item.scientificName, commonCategory: item.commonCategory,
    aliases: item.aliases.slice(), group: item.group, groupName: item.groupName, accent: item.accent,
    zhejiangStatus: item.zhejiangStatus || '', summary: item.summary, compareClues: item.compareClues,
    coverImage: item.images[0].src, imageCount: item.images.length };
}

function list(options) {
  const settings = options || {}, group = settings.group || 'all', query = normalizeText(settings.query);
  return ITEMS.filter(item => {
    if (group !== 'all' && item.group !== group) return false;
    if (!query) return true;
    const searchable = [item.name, item.scientificName, item.commonCategory, item.groupName, item.zhejiangStatus, item.summary, item.habitat,
      item.distribution, item.contactPattern].concat(item.aliases, item.identificationKeys).join(' ').toLowerCase();
    return searchable.indexOf(query) > -1;
  }).map(toSummary);
}

function getById(id) {
  const item = ITEMS.find(entry => entry.id === id);
  if (!item) return null;
  const result = clone(item);
  result.sources = sourceList(item.sourceKeys);
  result.sources.unshift({ title: 'Wikimedia Commons · ' + item.scientificName + ' 图片与分类', url: item.taxonUrl });
  result.urgentSignals = COMMON_URGENT.slice();
  result.confusedItems = item.confusedWith.map(confusedId => {
    const confused = ITEMS.find(entry => entry.id === confusedId);
    return confused ? toSummary(confused) : null;
  }).filter(Boolean);
  return result;
}

function sanitizeSelection(currentIds) {
  return (currentIds || []).filter((value, index, values) =>
    ITEMS.some(item => item.id === value) && values.indexOf(value) === index
  ).slice(0, 3);
}

function toggleSelection(currentIds, id, maxCount) {
  const limit = Number(maxCount) || 3;
  const validIds = sanitizeSelection(currentIds).slice(0, limit);
  if (!ITEMS.some(item => item.id === id)) return { selectedIds: validIds, error: '未找到该虫种' };
  if (validIds.indexOf(id) > -1) return { selectedIds: validIds.filter(value => value !== id), error: '' };
  if (validIds.length >= limit) return { selectedIds: validIds, error: '最多选择 ' + limit + ' 种进行对比' };
  return { selectedIds: validIds.concat(id), error: '' };
}

function buildComparison(ids) {
  const uniqueIds = (ids || []).filter((id, index, values) => values.indexOf(id) === index);
  const items = uniqueIds.map(id => ITEMS.find(item => item.id === id)).filter(Boolean).slice(0, 3);
  if (items.length < 2) throw new Error('at least two guide items required');
  const rows = [
    { key: 'scientificName', label: '学名' }, { key: 'commonCategory', label: '所属类别' }, { key: 'keyText', label: '辨识重点' },
    { key: 'appearance', label: '外形线索' }, { key: 'distribution', label: '分布概况' }, { key: 'habitat', label: '常见环境' },
    { key: 'contactPattern', label: '接触方式' }, { key: 'commonReaction', label: '常见表现' }, { key: 'compareClues', label: '对比线索' }, { key: 'caution', label: '判断边界' }
  ].map(row => ({ key: row.key, label: row.label, values: items.map(item => row.key === 'keyText' ? item.identificationKeys.join('；') : item[row.key]) }));
  return { items: items.map(toSummary), rows, disclaimer: '照片用于学习具体物种的典型特征；个体、性别和生长阶段会造成外观差异，不能替代专业虫体鉴定或医疗诊断。' };
}

module.exports = { GROUPS: clone(GROUPS), list, getById, sanitizeSelection, toggleSelection, buildComparison };
