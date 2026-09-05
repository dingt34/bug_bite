const CANDIDATE_ITEMS = require('./insect-guide-candidates');

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
  hangzhouPineMoth: { title: '国家林草局 · 杭州马尾松毛虫防治', url: 'https://www.forestry.gov.cn/c/www/dfdt/640155.jhtml' },
  cdcCulex: { title: 'CDC · About Culex Mosquitoes', url: 'https://www.cdc.gov/mosquitoes/about/culex-mosquitoes.html' },
  chinaCdcDengue: { title: '中国疾控 · 埃及伊蚊与登革热', url: 'https://icdc.chinacdc.cn/sjd/sjzxxx/sjhydt/202409/t20240925_301016.html' },
  cdcMidge: { title: 'CDC · Meet the Midge', url: 'https://www.cdc.gov/oropouche/stories/meet-the-midge.html' },
  hainanMidge: { title: '海南省卫健委 · 别拿「小咬」不当回事', url: 'https://wst.hainan.gov.cn/sjkzx/info/1213/59298.htm' },
  sanyaMidge: { title: '三亚市疾控 · 夏日将至，防止蠓咬', url: 'https://ws.sanya.gov.cn/wjwsite/jkdt/202502/d2b79868d6584e21a570a4b20e36b5e1.shtml' },
  cdcLeishmaniasis: { title: 'CDC Yellow Book · Leishmaniasis', url: 'https://www.cdc.gov/yellow-book/hcp/travel-associated-infections-diseases/leishmaniasis.html' },
  chinaCdcSandfly: { title: '中国疾控周报 · 中华白蛉适宜生境分布', url: 'https://weekly.chinacdc.cn/en/article/doi/10.46234/ccdcw2020.223' },
  pmidBlisterBeetle: { title: 'PubMed · Blister dermatitis caused by Epicauta', url: 'https://pubmed.ncbi.nlm.nih.gov/2813877/' },
  mdedgeBlisterBeetle: { title: 'MDedge/Cutis · Blister Beetles Revisited', url: 'https://blogs.the-hospitalist.org/content/whats-eating-you-blister-beetles-revisited' },
  taiwanCdcScrubTyphus: { title: '台湾疾管署 · 恙虫病（丛林斑疹伤寒）', url: 'https://www.cdc.gov.tw/Uploads/files/201301/1936a0bd-f8f5-4aa2-be4c-2f5644e49ba4.pdf' },
  cdcScrubTyphus: { title: 'CDC · Scrub Typhus', url: 'https://www.cdc.gov/typhus/scrub/index.html' },
  islandHealthHornet: { title: 'Island Health · Asian giant hornet stings', url: 'https://www.islandhealth.ca/sites/default/files/2019-09/medical-guidance-asian-giant-hornet-stings.pdf' },
  statpearlsCentipede: { title: 'StatPearls · Centipede Bites', url: 'https://www.ncbi.nlm.nih.gov/books/NBK542312/' },
  hkmjCentipede: { title: 'Hong Kong Med J · Centipede bite victims in Hong Kong', url: 'https://www.hkmj.org/system/files/hkm1110p381.pdf' },
  ufStableFly: { title: 'University of Florida · Stable Fly (Stomoxys calcitrans)', url: 'https://entnemdept.ufl.edu/creatures/URBAN/MEDICAL/Stomoxys_calcitrans.htm' },
  zjLishuiBlackfly: { title: '中国媒介生物学及控制杂志 · 浙江省丽水市蚋叮咬人事件调查', url: 'http://www.bmsw.net.cn/CN/10.11853/j.issn.1003.8280.2017.01.026' },
  purdueBlackfly: { title: 'Purdue University · Black Flies (Simuliidae)', url: 'https://extension.entm.purdue.edu/publichealth/print/insects/blackfly.html' },
  cdcHeadLouse: { title: 'CDC · About Head Lice', url: 'https://www.cdc.gov/lice/about/head-lice.html' },
  nhsHeadLice: { title: 'NHS · Head lice and nits', url: 'https://www.nhs.uk/conditions/head-lice-and-nits/' },
  statpearlsPediculosis: { title: 'StatPearls · Pediculosis', url: 'https://www.ncbi.nlm.nih.gov/books/NBK470343/' },
  cdcScabies: { title: 'CDC · About Scabies', url: 'https://www.cdc.gov/scabies/about/index.html' },
  nhsScabies: { title: 'NHS · Scabies', url: 'https://www.nhs.uk/conditions/scabies/' },
  statpearlsScabies: { title: 'StatPearls · Scabies', url: 'https://www.ncbi.nlm.nih.gov/books/NBK544306/' },
  wikiThereuopoda: { title: 'Wikipedia · Thereuopoda clunifera', url: 'https://en.wikipedia.org/wiki/Thereuopoda_clunifera' },
  statpearlsScorpion: { title: 'StatPearls · Scorpion Toxicity', url: 'https://www.ncbi.nlm.nih.gov/books/NBK430928/' },
  mesobuthusDistribution: { title: 'Journal of Arachnology · Geographical Distribution of Two Species of Mesobuthus in China', url: 'https://bioone.org/journals/the-journal-of-arachnology/volume-35/issue-2/T06-20.1/GEOGRAPHICAL-DISTRIBUTION-OF-TWO-SPECIES-OF-MESOBUTHUS-SCORPIONES-BUTHIDAE-IN/10.1636/T06-20.1.short' }
};

const COMMON_URGENT = [
  '呼吸困难、喘鸣或喉咙发紧', '口唇、舌头、面部或眼周明显肿胀', '头晕、昏厥、意识异常',
  '短时间内症状快速加重', '短时间内发生大量、多处叮咬或蜇伤'
];

function commonsFile(fileName) {
  return 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(fileName).replace(/%20/g, '_');
}

const CORE_ITEMS = [
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
  },
  {
    id: 'culex_pipiens', name: '致倦库蚊', scientificName: 'Culex pipiens quinquefasciatus', commonCategory: '蚊类',
    aliases: ['家蚊', '淡色库蚊', '南方家蚊'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#5B7A5B',
    summary: '库蚊属最常见的室内叮咬蚊种，雌蚊夜间吸血、偏好人血，是南方城区居室内最主要的“家蚊”。',
    appearance: '中型蚊，体色黄褐至淡褐色，无鲜艳斑纹；喙与各足跗节均无白环，翅鳞密而暗色，腹部背板有淡色基带；停落时腹部与停落面大致平行，体态低调，不像伊蚊那样黑白醒目。',
    identificationKeys: ['体色黄褐、喙与足跗节无白环，翅无明显斑块', '停落时身体与停落面近平行，不翘起后足', '多在室内阴暗处、夜间至凌晨活动'],
    distribution: '广布全球热带亚热带；在中国大致分布于北纬 32°—34° 以南的南方地区及沿海岛屿，浙江等南方城区室内极常见。',
    habitat: '幼虫孳生于污水沟、下水道、化粪池、旧轮胎及各类污染积水；成蚊栖息于住房、地下室、车库、楼道等室内外阴暗处。',
    contactPattern: '雌蚊夜间吸血、偏好人血兼吸动物血，活动高峰在黄昏至黎明；常在睡觉时反复叮咬。',
    commonReaction: '叮咬处出现红肿、瘙痒的丘疹或风团，中央可有小刺点，通常数日内自行消退。',
    compareClues: '与白纹伊蚊、埃及伊蚊相比体色黄褐、无白斑、夜间活动；与中华按蚊相比停落时腹部与停落面近平行。',
    firstActions: ['用肥皂水或清水清洗叮咬处，避免抓挠', '冷敷减轻红肿与瘙痒', '瘙痒明显可外用炉甘石洗剂；夜间防叮咬用纱窗、蚊帐和驱蚊剂'],
    caution: '库蚊在南方少数地区可传播乙脑、丝虫病等，但绝大多数叮咬仅引起局部瘙痒红肿、数日自愈；叮咬后若出现高热、剧烈头痛、意识异常应就医并告知蚊叮史。',
    confusedWith: ['mosquito', 'aedes_aegypti', 'culex_tritaeniorhynchus', 'anopheles_sinensis', 'armigeres_subalbatus'],
    sourceKeys: ['cdcMosquito', 'cdcCulex'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Culex_quinquefasciatus',
    images: [
      { src: '/images/insect-guide/culex-quinquefasciatus/01-feeding.webp', caption: '正在人体皮肤上吸血的雌性致倦库蚊，腹部因饱血而膨大呈红色', alt: '一只雌性致倦库蚊正以口针刺入皮肤吸血', credit: 'CDC / James Gathany', license: 'Public domain', sourceUrl: commonsFile('Culexquinquefasciatus.png') },
      { src: '/images/insect-guide/culex-quinquefasciatus/02-illustration.webp', caption: '1905 年彩色科学插画，左为雄蚊、右为雌蚊，可整体观察库蚊形态', alt: '致倦库蚊雄蚊与雌蚊并排的彩色科学插画', credit: 'Emil August Goeldi', license: 'Public domain', sourceUrl: commonsFile('Culex quinquefasciatus E-A-Goeldi 1905.jpg') },
      { src: '/images/insect-guide/culex-quinquefasciatus/03-overview.webp', caption: '自然光下的致倦库蚊成蚊，可见黄褐体色与无白环的足', alt: '一只黄褐色的致倦库蚊成蚊停落', credit: 'Robert Webster', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Culex quinquefasciatus - inat 83267718.jpg') }
    ]
  },
  {
    id: 'aedes_aegypti', name: '埃及伊蚊', scientificName: 'Aedes aegypti', commonCategory: '蚊类',
    aliases: ['黄热病蚊', '埃及花斑蚊'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#5B6E7A',
    summary: '典型“家栖”伊蚊，体黑、胸背有银白色里拉琴形斑纹，是登革热、黄热病等病毒的重要传播媒介。',
    appearance: '体色黑色，全身具黑白相间斑纹，俗称“花斑蚊”；最醒目的是胸背盾片上左右各一个镰刀形（里拉琴状）银白色斑纹，各足有清晰白色环带；停落时后足常上翘、身体斜置。',
    identificationKeys: ['胸背具银白色里拉琴形斑纹，是本种最典型标志', '足有黑白相间白环，整体呈“花斑”外观', '白昼吸血，多在人居室内及其周边活动'],
    distribution: '广布全球热带；在中国分布局限，主要见于海南沿海、广东雷州半岛、云南边境区县、台湾嘉义以南等地。',
    habitat: '家栖蚊种，与人类“共居一室”；幼虫孳生于室内外中小型清洁积水，如水缸、水培植物、花盆托、旧轮胎等。',
    contactPattern: '雌蚊嗜吸人血、可多次反复叮咬，吸血以白天为主（早晨与近黄昏为高峰）。',
    commonReaction: '叮咬处出现红肿、瘙痒的丘疹或风团，一般数日消退；过敏者红肿瘙痒可较明显。',
    compareClues: '与白纹伊蚊同为黑白花蚊，但埃及伊蚊胸背为左右里拉琴形白斑，白纹伊蚊为中央一条纵向白纹。',
    firstActions: ['用肥皂水或清水清洗叮咬处，避免抓挠', '冷敷或外涂炉甘石洗剂止痒消肿', '清除室内外积水以防孳生'],
    caution: '埃及伊蚊是登革热、黄热病等的重要传播媒介，但仅在疫区且蚊体实际带毒时才传播，并非每只都带病毒；若突发高热、皮疹、眼眶后疼痛或出血倾向应及时就医并告知旅居史与蚊叮史。',
    confusedWith: ['mosquito', 'culex_pipiens', 'culex_tritaeniorhynchus', 'anopheles_sinensis'],
    sourceKeys: ['cdcMosquito', 'chinaCdcDengue'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Aedes_aegypti',
    images: [
      { src: '/images/insect-guide/aedes-aegypti/01-dorsal.webp', caption: '埃及伊蚊特写，胸背清晰的里拉琴形银白斑纹是本种关键辨识点', alt: '埃及伊蚊背面特写，胸背有左右对称的里拉琴形银白色斑纹', credit: 'James Gathany', license: 'Public domain', sourceUrl: commonsFile('Aedes aegypti CDC-Gathany.jpg') },
      { src: '/images/insect-guide/aedes-aegypti/02-overview.webp', caption: '停落在叶上的埃及伊蚊，足部白色环带清晰可见', alt: '埃及伊蚊停落在叶片上，各足有明显白色环带', credit: 'Wee Hong', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Aedes aegypti on leaf.jpg') },
      { src: '/images/insect-guide/aedes-aegypti/03-feeding.webp', caption: '正在吸血的埃及伊蚊，可观察其黑体白斑的整体形态', alt: '埃及伊蚊正以口针刺入皮肤吸血', credit: 'Malena Lorente', license: 'CC BY 4.0', sourceUrl: commonsFile('Aedes aegypti 255499300.jpg') }
    ]
  },
  {
    id: 'biting_midge', name: '蠓', scientificName: 'Culicoides spp.', commonCategory: '蠓类',
    aliases: ['小咬', '库蠓', '蠛蠓', '墨蚊', '吸血蠓'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#7A5B7A',
    summary: '体型仅 1—4 毫米的极小微吸血蝇类，常成群围攻叮咬，叮咬处奇痒且比蚊子包更持久，代表属为库蠓 Culicoides。',
    appearance: '双翅目蠓科极小型昆虫，成虫仅约 1—4 毫米，外形似微型“黑芝麻”或“小黑点”，比蚊子小得多；翅多具斑点花纹，口器短、为刺吸式，雌蠓吸血。',
    identificationKeys: ['体型仅 1—4 毫米，明显小于蚊，肉眼接近“小黑点”', '翅具斑点花纹、口器短（库蠓属特征）', '常成群同时叮咬，叮咬处奇痒且持续数日'],
    distribution: '全国广泛分布，南方湿润地区尤多；浙江西湖、湘湖及各地公园、湖边、绿化带等潮湿植被茂盛处是常见叮咬场所。',
    habitat: '水边、池塘、湖边、草地、树荫等阴凉潮湿、植被茂盛处；幼虫孳生于水体边缘淤泥、湿润沙土等。',
    contactPattern: '雌蠓吸血，库蠓多晨昏吸血、蠛蠓多白天活动；常在户外草丛、湖边成群围攻裸露皮肤，甚至可穿透薄织物叮咬。',
    commonReaction: '叮咬处呈绿豆大小红色丘疹、风团或红斑，中央可见小刺点，包多成片密集、奇痒难忍，比蚊子包更痒、持续更久。',
    compareClues: '与蚊子区分：蠓极小、无长喙与带鳞翅，叮咬常成片且更痒；与跳蚤、臭虫的成串或成线叮咬分布不同。',
    firstActions: ['用肥皂水或清水反复冲洗叮咬处，避免抓挠', '冰块或冷水冷敷，外用炉甘石洗剂等止痒', '红肿明显或起小水泡可在医生指导下外用糖皮质激素软膏'],
    caution: '蠓叮咬以局部奇痒、红肿为主，多数数日至一周自行缓解；极少数过敏者可出现明显水肿或全身反应，若呼吸困难、发热等应及时就医。',
    confusedWith: ['mosquito', 'culex_pipiens', 'aedes_aegypti', 'flea', 'bedbug'],
    sourceKeys: ['cdcMidge', 'hainanMidge', 'sanyaMidge'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Culicoides',
    images: [
      { src: '/images/insect-guide/culicoides/01-overview.webp', caption: '库蠓（吸血蠓）成蠓，可见典型的翅斑与短小刺吸式口器', alt: '一只库蠓成蠓，翅膀上有斑点花纹，口器短小', credit: 'Daktaridudu', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Culicoides-cornutus-midge.jpg') },
      { src: '/images/insect-guide/culicoides/02-on-skin.webp', caption: '停落在人体皮肤上的吸血蠓，可直观感受其仅数毫米的微小体型', alt: '一只微小的吸血蠓停落在人体皮肤上', credit: 'CSIRO', license: 'CC BY 3.0', sourceUrl: commonsFile('CSIRO ScienceImage 11052 Biting midge on human skin.jpg') },
      { src: '/images/insect-guide/culicoides/03-feeding.webp', caption: '正在吸血的雌性库蠓，展示其刺吸式取食行为', alt: '一只雌性库蠓正通过口器吸血', credit: 'Scott Bauer, USDA ARS', license: 'Public domain', sourceUrl: commonsFile('Culicoides sonorensis.jpg') }
    ]
  },
  {
    id: 'sandfly', name: '白蛉', scientificName: 'Phlebotomus chinensis', commonCategory: '白蛉类',
    aliases: ['沙蝇', '白蛉子'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#8B7355',
    summary: '体型极小、夜晚无声叮咬的吸血蝇类，是我国内脏利什曼病（黑热病）的主要传播媒介。',
    appearance: '体型微小，体长约 1.5—3.5 毫米，约为普通蚊子的 1/3 到 1/2，全身和翅膀密被细毛；停落时翅膀上举呈明显 V 字形，不像蚊子那样平贴体侧；飞行无声。',
    identificationKeys: ['体型很小（约 1.5—3.5 毫米），远小于常见蚊类', '停落时双翅竖起呈 V 字形，全身密被细毛', '飞行无声，多在黄昏至清晨活动叮咬'],
    distribution: '我国白蛉主要分布在长江以北地区，以黄土高原及周边山丘地带为主；浙江省并非主要分布区，相关风险主要出现在北方或中西部疫区旅行时。',
    habitat: '土房墙缝、畜圈、石缝、洞穴、鼠洞等阴暗潮湿处，多见于农村、丘陵和林草地带。',
    contactPattern: '雌蛉在黄昏至黎明叮咬裸露皮肤吸血，叮咬时分泌麻醉物质，往往无痛、不易察觉。',
    commonReaction: '叮咬处多为不明显的小红点或轻度瘙痒丘疹；在疫区被带虫白蛉叮咬后数月可出现长期不愈合的皮肤溃疡，或持续发热、消瘦、肝脾肿大等。',
    compareClues: '远小于蚊子、停落时翅膀呈 V 字形竖起、飞行无声，是与普通蚊类区别的关键。',
    firstActions: ['用肥皂水清洗叮咬处，避免搔抓', '疫区活动后留意叮咬部位，若出现长期不愈合溃疡或持续发热应就医', '疫区防护：黄昏至清晨减少裸露、使用含避蚊胺的驱虫剂、用细网眼蚊帐'],
    caution: '我国大部分地区（含浙江）白蛉并不常见，黑热病风险主要与疫区旅行或居住史相关；若曾在西北、华北等疫区活动后出现上述症状，应主动告知医生旅行史。',
    confusedWith: ['mosquito', 'culex_tritaeniorhynchus', 'anopheles_sinensis', 'armigeres_subalbatus', 'flea'],
    sourceKeys: ['cdcLeishmaniasis', 'chinaCdcSandfly'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Phlebotomus',
    images: [
      { src: '/images/insect-guide/phlebotomus/01-bloodfed.webp', caption: '吸血后的白蛉（近缘种 Phlebotomus papatasi），腹部因吸饱血而胀大透明', alt: '白蛉吸血后腹部胀大透明的显微照片', credit: 'CDC / Frank Collins（摄影：James Gathany）', license: 'Public domain', sourceUrl: commonsFile('Phlebotomus pappatasi bloodmeal finished.jpg') },
      { src: '/images/insect-guide/phlebotomus/02-resting.webp', caption: '白蛉（Phlebotomus sp.）停落时双翅竖起呈 V 字形、全身被毛', alt: '白蛉停落时双翅呈 V 字形上举的照片', credit: 'Luis Fernández García', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Phlebotomus-sp-20150705-a.jpg') },
      { src: '/images/insect-guide/phlebotomus/03-specimen.webp', caption: '白蛉雄虫标本（Phlebotomus sp.），因外形相似易被误认为蚊子', alt: '白蛉雄虫整体标本照片', credit: 'CDC / 世界卫生组织（WHO）', license: 'Public domain', sourceUrl: commonsFile('Phlebotomus sp. 6274 lores.jpg') }
    ]
  },
  {
    id: 'vespa_mandarinia', name: '金环胡蜂', scientificName: 'Vespa mandarinia', commonCategory: '胡蜂类',
    aliases: ['大虎头蜂', '金环马蜂', '亚洲大虎头蜂', '地龙蜂'], group: 'stinging', groupName: '蜇刺类', accent: '#B8860B',
    summary: '世界上体型最大的胡蜂，蜇刺剧痛且可反复蜇刺，多次蜇伤或过敏可能危及生命。',
    appearance: '工蜂体长约 2.5—4 厘米，蜂王可达 4.5 厘米以上，为体型最大的胡蜂。头部宽大、呈橙红至橙黄色，复眼大，上颚粗壮；胸部深褐至黑色；腹部深褐色，具黄褐色至橙黄色环带；翅深褐色。',
    identificationKeys: ['头部宽大呈橙红色，明显大于普通胡蜂与蜜蜂', '体型硕大，腹部具黄褐色环带', '翅深褐色，飞行时翅展大、嗡鸣声低沉', '螫针无倒钩，可反复蜇刺（区别于蜜蜂留针）'],
    distribution: '分布于东亚：中国（华北、华东、华中、西南等地）、日本、韩国、俄罗斯远东及东南亚；近年被意外引入北美部分地区。',
    habitat: '营巢于地下土洞、树洞、岩缝及房屋墙缝、屋顶下等隐蔽处；夏末至秋季蜂群最活跃。',
    contactPattern: '靠近、惊扰或拍打蜂巢时群起攻击；踩踏、身穿深色衣物或浓烈气味也可能招致蜇刺。',
    commonReaction: '蜇刺处如烧红铁钉刺入般剧痛，伴局部红肿、灼热；大量或多次蜇刺可出现溶血、横纹肌溶解、急性肾损伤等，重者可致多器官损伤甚至死亡。',
    compareClues: '与黄脚胡蜂相比头部更宽大、体型更大；与蜜蜂相比体表近无毛、蜇后螫针不留在皮肤且可反复蜇刺。',
    firstActions: ['迅速离开现场，避免再次被蜇', '用冷敷或冰袋敷蜇处减痛、减慢毒液扩散，不要揉搓', '出现呼吸困难、全身荨麻疹、头晕、恶心呕吐等立即拨打急救电话，过敏者尽早使用肾上腺素'],
    caution: '单次蜇刺对过敏体质者即可引起致死性过敏性休克；多次蜇刺即使非过敏者也可能发生中毒性全身反应；发现蜂巢切勿自行处理，应联系专业人员清除。',
    confusedWith: ['bee_wasp', 'apis_cerana'],
    sourceKeys: ['cdcStings', 'nhsBites', 'islandHealthHornet'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Vespa_mandarinia',
    images: [
      { src: '/images/insect-guide/vespa-mandarinia/01-queen.webp', caption: '金环胡蜂（大虎头蜂）蜂王整体形态，示橙红色宽大头部与深色腹部', alt: '金环胡蜂蜂王特写，头部橙红色，腹部深褐带黄橙色环带', credit: 'Yasunori Koide', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('20200512-P1090972 Vespa mandarinia japonica.jpg') },
      { src: '/images/insect-guide/vespa-mandarinia/02-side.webp', caption: '金环胡蜂蜂王侧面观，示深褐色翅与硕大体型', alt: '金环胡蜂蜂王侧面照片，体型硕大，翅深褐色', credit: 'Yasunori Koide', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('20200512-P1090983 Vespa mandarinia japonica.jpg') },
      { src: '/images/insect-guide/vespa-mandarinia/03-head.webp', caption: '金环胡蜂蜂王近观，示橙红色头部与发达上颚', alt: '金环胡蜂头部近观照片，可见橙红色头部与强壮上颚', credit: 'Yasunori Koide', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('20200512-P1100051 Vespa mandarinia japonica.jpg') }
    ]
  },
  {
    id: 'apis_cerana', name: '中华蜜蜂', scientificName: 'Apis cerana', commonCategory: '蜜蜂类',
    aliases: ['中蜂', '土蜂', '中华蜂'], group: 'stinging', groupName: '蜇刺类', accent: '#D4A017',
    summary: '中国本土蜜蜂，蜇刺后螫针带倒钩留于皮肤、蜂自身死亡；过敏者单次蜇刺即可发生危险。',
    appearance: '工蜂体长约 10—13 毫米，比常见意大利蜜蜂略小、体色更黑褐。胸部密布灰黄色绒毛，腹部具灰黑色与黄色相间环带；后足有花粉篮。',
    identificationKeys: ['体小、黑褐色、多毛', '蜇后螫针（带毒囊）留在皮肤上，蜂自身死亡', '胸部灰黄色绒毛、腹部黑黄相间环带'],
    distribution: '中国本土广泛分布（华南、西南、华中、华东等），并见于东亚、东南亚及南亚。',
    habitat: '野生常营巢于树洞、岩洞、石缝；人工饲养于传统桶养或活框蜂箱；多在花丛附近活动。',
    contactPattern: '靠近蜂巢、踩踏或拍打蜜蜂、采蜜作业时被蜇；蜂群御敌时会群起攻击。',
    commonReaction: '蜇处立即刺痛，局部红肿、灼热、瘙痒，多数数小时至数日内消退。',
    compareClues: '与胡蜂相比体型小、毛多、螫针有倒钩且蜇后留针；与金环胡蜂相比明显更小更黑。',
    firstActions: ['尽快用指甲、卡片等边缘刮除留在皮肤的螫针（速度优先，勿用镊子挤压毒囊）', '肥皂水清洗蜇处，冷敷并抬高患肢', '出现呼吸困难、喉头或舌肿胀、全身荨麻疹、头晕等立即急救并就医'],
    caution: '对蜂毒过敏者单次蜇刺即可致过敏性休克，需立即就医；口咽部被蜇可致气道梗阻；多次蜇刺可致中毒性全身反应。',
    confusedWith: ['bee_wasp', 'vespa_mandarinia'],
    sourceKeys: ['cdcStings', 'nhsBites'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Apis_cerana',
    images: [
      { src: '/images/insect-guide/apis-cerana/01-worker.webp', caption: '中华蜜蜂工蜂特写，可见黑褐色体色与灰黄色绒毛', alt: '中华蜜蜂工蜂微距照片，展示黑褐色身体与胸部灰黄色绒毛', credit: 'Vengolis', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Apis cerana08409.jpg') },
      { src: '/images/insect-guide/apis-cerana/02-overview.webp', caption: '中华蜜蜂（湖南乡间自然环境）', alt: '中华蜜蜂在湖南乡村自然环境中的照片', credit: 'FlyingBatt', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Apis cerana (Asian honeybee) in rural areas of Hunan, China.jpg') },
      { src: '/images/insect-guide/apis-cerana/03-foraging.webp', caption: '中华蜜蜂在花上觅食', alt: '中华蜜蜂在花丛采蜜的照片', credit: 'FlyingBatt', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Apis cerana (Asian honeybee) on flowing trees.jpg') }
    ]
  },
  {
    id: 'scolopendra_subspinipes_mutilans', name: '少棘蜈蚣', scientificName: 'Scolopendra subspinipes mutilans', commonCategory: '蜈蚣类',
    aliases: ['红头蜈蚣', '金头蜈蚣', '百足虫'], group: 'stinging', groupName: '蜇刺类', accent: '#8B4513',
    summary: '大型蜈蚣，用头部下方毒颚咬刺注毒，多为剧痛局部反应，少数可出现严重全身症状。',
    appearance: '体长可达 12—20 厘米，身体扁平、分节，共 21 个体节、21 对步足；头部及第一背板呈橙红至红褐色，触角细长；体色深褐至黑褐，步足黄色，最后一对足向后伸长。',
    identificationKeys: ['身体扁平长条、21 对步足（多足，非昆虫）', '头部橙红至红褐色，触角细长', '夜行、喜湿，藏于石块、枯木、落叶下', '咬伤处常留两个针尖样刺痕'],
    distribution: '分布于中国（华南、华东、华中、西南等地）、日本、韩国及东南亚。',
    habitat: '栖息于潮湿阴暗处：石块下、枯木与落叶下、洞穴、墙缝及潮湿的卫生间、厨房角落；夜间活动。',
    contactPattern: '翻动石块或木料、清理杂物、穿鞋或穿衣时被其毒颚咬刺；蜈蚣可爬入鞋内、衣物中。',
    commonReaction: '咬伤处立即剧烈灼痛，局部红肿、水肿，常留两个针尖样刺痕；疼痛可放射并持续数小时至数日。',
    compareClues: '与胡蜂或蜜蜂蜇刺的锐痛类似，但为多足长条形节肢动物所致；咬痕常为两个针尖样点。',
    firstActions: ['用肥皂水或清水冲洗伤口，避免挤压或自行切开', '冷敷或温热敷缓解疼痛，抬高患肢', '口服止痛药、抗组胺药；出现呼吸困难、胸痛、心悸、恶心呕吐等立即就医'],
    caution: '多数为局部反应、可自愈，但儿童、老人、过敏体质者或反复被蜇伤者风险更高；极少数可出现横纹肌溶解、急性肾损伤或过敏性休克，症状加重应尽早就医。',
    confusedWith: ['vespa_mandarinia', 'apis_cerana'],
    sourceKeys: ['statpearlsCentipede', 'hkmjCentipede'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Scolopendra_subspinipes_mutilans',
    images: [
      { src: '/images/insect-guide/scolopendra-subspinipes/01-overview.webp', caption: '少棘蜈蚣整体形态，与手指对比可见体长可达约 18 厘米', alt: '红头蜈蚣全身照片，旁边有手指作大小对比', credit: 'Thomas Brown', license: 'CC BY 2.0', sourceUrl: commonsFile('Chinese Red-headed Centipede (Scolopendra subspinipes) (5780837186).jpg') },
      { src: '/images/insect-guide/scolopendra-subspinipes/02-body.webp', caption: '少棘蜈蚣整体观，示扁平分节身体与 21 对步足', alt: '红头蜈蚣全身照片，身体扁平分节，多对步足', credit: 'Thomas Brown', license: 'CC BY 2.0', sourceUrl: commonsFile('Chinese Red-headed Centipede (Scolopendra subspinipes) (5804635464).jpg') },
      { src: '/images/insect-guide/scolopendra-subspinipes/03-head.webp', caption: '少棘蜈蚣头部特写，示橙红色头部、触角与毒颚', alt: '红头蜈蚣头部特写，头部橙红色，可见触角', credit: 'Thomas Brown', license: 'CC BY 2.0', sourceUrl: commonsFile('Chinese Red-headed Centipede (Scolopendra subspinipes) (5804636142).jpg') }
    ]
  },
  {
    id: 'blister_beetle', name: '豆芫菁', scientificName: 'Epicauta gorhami', commonCategory: '芫菁类',
    aliases: ['豆芜菁', '锯角豆芫菁', '斑蝥', '红头娘', '葛上亭长'], group: 'contact', groupName: '接触刺激', accent: '#C0392B',
    summary: '头部红色、鞘翅黑色的甲虫，受惊或受压时分泌含斑蝥素的黄色体液，接触皮肤可引起水疱性皮炎。',
    appearance: '成虫体长约 10.5—18.5 毫米，头部红色，胸腹部和鞘翅黑色，前胸背板中央和每片鞘翅中央常有灰白色纵纹；雄虫触角锯齿状，雌虫触角丝状。',
    identificationKeys: ['红色头部＋黑色鞘翅，鞘翅上有灰白色纵纹', '受惊时腿节末端会分泌黄色（含斑蝥素）液体', '群集啃食大豆、豇豆等豆科植物叶片'],
    distribution: '广泛分布于我国多数省区，包括江苏、浙江、江西、湖南、四川、广东、广西、台湾等，也见于日本。',
    habitat: '大豆、菜豆、豇豆、花生等豆科作物田和农田草地，成虫群集取食叶片。',
    contactPattern: '爬落在皮肤上被拍打或碾压，或夜间趋光落在皮肤上，受惊受压时从腿节末端分泌黄色体液，斑蝥素直接接触皮肤引起刺激。',
    commonReaction: '接触后数分钟至数小时皮肤出现灼热、刺痛感，随后起红斑和水疱（可为条状、片状），破溃后结痂，搔抓可继发感染。',
    compareClues: '与隐翅虫皮炎相似都会起水疱，但豆芫菁体型明显更大、有红头黑身和灰白色纵纹，且为主动分泌黄色液体。',
    firstActions: ['切勿在皮肤上拍打或碾压，应轻轻吹落或用纸片拨开', '立即用大量肥皂水或酒精擦洗接触部位', '已起水疱者保持局部清洁、避免抓破；大水疱请就医处理'],
    caution: '斑蝥素有毒，误服或大量接触可引起腹痛、血尿、肾损伤等全身中毒；若出现恶心、腹痛、血尿等全身症状应立即急诊就医。',
    confusedWith: ['rove_beetle', 'ant', 'caterpillar', 'bee_wasp'],
    sourceKeys: ['pmidBlisterBeetle', 'mdedgeBlisterBeetle'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Epicauta',
    images: [
      { src: '/images/insect-guide/epicauta-gorhami/01-overview.webp', caption: '豆芫菁（Epicauta gorhami），红色头部＋黑色鞘翅', alt: '豆芫菁红色头部黑色鞘翅的清晰照片', credit: 'Phonon.b', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Epicauta gorhami.jpg') },
      { src: '/images/insect-guide/epicauta-gorhami/02-related.webp', caption: '近缘芫菁（Epicauta hirticornis），示红头黑身的典型特征', alt: '红头黑身芫菁近缘种的照片', credit: 'Vaikoovery', license: 'CC BY 3.0', sourceUrl: commonsFile('Epicauta hirticornis (Haag-Rutenberg, 1880).jpg') },
      { src: '/images/insect-guide/epicauta-gorhami/03-perched.webp', caption: '芫菁（Epicauta sp.）停栖于植物上，示整体形态', alt: '芫菁甲虫停栖在植物上的照片', credit: 'xpda', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Epicauta P1460083a.jpg') }
    ]
  },
  {
    id: 'chigger', name: '恙螨（恙虫）', scientificName: 'Leptotrombidium deliense', commonCategory: '恙螨类',
    aliases: ['恙虫', '地里纤恙螨'], group: 'attached', groupName: '附着类', accent: '#E67E22',
    summary: '肉眼难辨的红色螨类幼虫，叮咬时无痛，是恙虫病（丛林斑疹伤寒）的传播媒介。',
    appearance: '仅幼虫（恙螨）营寄生，体长约 0.2—0.5 毫米，呈橙红或红色，肉眼仅见针尖大的红点；幼虫具 6 条腿。叮咬时注入消化酶，取食组织液而非血液。',
    identificationKeys: ['红色、针尖大小的极小微螨，常在草丛或灌木', '叮咬无痛，好发于腰际、腋下、腹股沟、膝窝等潮湿隐蔽处', '叮咬处可形成中央有黑痂（焦痂）的无痛性溃疡'],
    distribution: '地里纤恙螨是我国南方及台湾地区恙虫病的主要媒介，长江以南及东南沿海（含浙江）的草地、林缘、河谷等均有分布。',
    habitat: '草丛、灌木、田埂、河岸、林地边缘等潮湿环境，幼虫爬到草叶顶端等待宿主经过。',
    contactPattern: '野外活动时幼虫爬到皮肤上，钻入腰际、袖口、裤脚、腋下、腹股沟等束紧潮湿处附着叮咬，分泌酶使局部麻醉，故叮咬时多无感觉。',
    commonReaction: '叮咬处先出现不痛不痒的小红丘疹，可成片瘙痒；感染恙虫病者经 6—21 天潜伏期后突发高热、头痛、皮疹、淋巴结肿大，并在叮咬处形成圆形黑色焦痂。',
    compareClues: '与蜱虫都会叮咬传播疾病，但恙螨极小、叮咬无痛且不留明显虫体，典型焦痂加高热是其特征。',
    firstActions: ['野外活动后尽快沐浴，重点搓洗腋窝、腹股沟、膝窝、腰际等部位并换洗衣物', '叮咬处保持清洁、避免搔抓，可外用止痒药', '叮咬后 2—3 周内出现发热或皮肤黑色焦痂、溃疡，应立即就医并告知野外活动史'],
    caution: '恙虫病若不治疗可发展为肺炎、脑炎、心肌炎、多器官损害甚至危及生命，但早期用多西环素等抗生素治疗效果好；务必观察焦痂与持续发热。本病不人传人。',
    confusedWith: ['tick', 'flea', 'bedbug', 'brown_dog_tick'],
    sourceKeys: ['taiwanCdcScrubTyphus', 'cdcScrubTyphus'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Trombiculidae',
    images: [
      { src: '/images/insect-guide/leptotrombidium/01-overview.webp', caption: '恙螨（Leptotrombidium，恙虫病媒介）显微照片', alt: '恙螨（地里纤恙螨）显微照片', credit: 'Michael Wunderli', license: 'CC BY 2.0', sourceUrl: commonsFile('Leptotrombidium, chigger mites (14854410979).jpg') },
      { src: '/images/insect-guide/leptotrombidium/02-larva.webp', caption: '恙螨幼虫（Leptotrombidium）另一视角，示微小红色虫体', alt: '恙螨幼虫另一角度的显微照片', credit: 'Michael Wunderli', license: 'CC BY 2.0', sourceUrl: commonsFile('Leptotrombidium, chigger mites (15041128245).jpg') },
      { src: '/images/insect-guide/leptotrombidium/03-stylostome.webp', caption: '恙螨幼虫（近缘属 Trombicula）吸血期，可见刺入皮肤的茎状口针', alt: '恙螨幼虫带茎状口针的显微照片', credit: 'Alan R Walker', license: 'CC BY-SA 3.0', sourceUrl: commonsFile('Trombicula-larva-stylostome.jpg') }
    ]
  },
  {
    id: 'stable_fly', name: '厩螫蝇', scientificName: 'Stomoxys calcitrans', commonCategory: '蝇类',
    aliases: ['厩螯蝇', '吸血厩蝇', '螫蝇', '刺蝇'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#5F7A5F',
    summary: '形似家蝇但会吸血的蝇类，口器像刺刀前伸，白天多叮咬小腿脚踝。',
    appearance: '灰褐色，与家蝇大小相近；头部前方平伸细长刺吸式口器，胸部有 4 条深色纵纹。',
    identificationKeys: ['口器像刺刀般向前平伸', '胸部背面 4 条深色纵纹', '雌雄均叮咬、白天活动'],
    distribution: '世界性分布，我国华北、华中、华南均常见，华东及浙江有分布。',
    habitat: '牛舍、马厩、猪场等牲畜场所及其周边，也见于海滨和河滩。',
    contactPattern: '白天叮咬裸露的小腿、脚踝和足背，叮咬瞬间锐痛，可隔着薄衣物叮咬。',
    commonReaction: '叮咬处锐痛后出现红色丘疹或风团，中央有小叮痕，多数数天内消退。',
    compareClues: '与家蝇区分看口器——家蝇舐食不吸血、口器短软，厩螫蝇口器前伸且叮咬锐痛。',
    firstActions: ['用肥皂和清水清洗叮咬处', '冷敷减轻疼痛和肿胀', '避免抓挠，必要时外用止痒药'],
    caution: '叮咬多为自限性；红肿流脓、发热或大量叮咬后不适时就医。',
    confusedWith: ['mosquito', 'biting_midge', 'flea'],
    sourceKeys: ['nhsBites', 'ufStableFly'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Stomoxys_calcitrans',
    images: [
      { src: '/images/insect-guide/stomoxys-calcitrans/01-overview.webp', caption: '厩螫蝇成虫整体形态，可见头部前方平伸的刺吸式口器与胸部纵纹', alt: '一只灰褐色的厩螫蝇成虫，头部前方伸出一根细长的刺吸式口器', credit: 'Stu\'s Images', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Stomoxys calcitrans, Stable Fly, UK.jpg') },
      { src: '/images/insect-guide/stomoxys-calcitrans/02-detail.webp', caption: '头部与口器细节：从下方视角特写刺吸式喙（吸血针）', alt: '厩螫蝇头部与口器的特写，展示向前伸出的刺吸式喙', credit: 'KnochenJochen', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Stomoxys calcitrans Kopfnahansicht.png') },
      { src: '/images/insect-guide/stomoxys-calcitrans/03-behavior.webp', caption: '厩螫蝇正在人体皮肤上吸血，展示其叮咬行为', alt: '一只厩螫蝇落在皮肤上用口器吸血的特写', credit: 'Peterwchen', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Stomoxys calcitrans-sucking blood.jpg') }
    ]
  },
  {
    id: 'black_fly', name: '蚋（黑蝇）', scientificName: 'Simulium spp.', commonCategory: '蚋类',
    aliases: ['黑蝇', '驼背蚋', '挖背', '吸血蚋'], group: 'blood_feeding', groupName: '吸血叮咬', accent: '#4A6B6B',
    summary: '俗称黑蝇，体型微小、背部隆起，雌蚋白天成群叮咬，事后瘙痒红肿明显。',
    appearance: '体长约 2～5 毫米，粗壮、多为黑色，背部隆起似驼背；翅宽阔，静止时平叠于体背。',
    identificationKeys: ['体型微小、背部隆起', '翅宽阔、静止时平叠', '成群白天叮咬头面颈等暴露处'],
    distribution: '世界性分布，我国山区溪流附近广布，浙江丽水、宁波等地有吸血蚋记录。',
    habitat: '山溪、河流等清洁流水附近的草丛灌木；幼虫孳生于流动清水。',
    contactPattern: '白天在溪边、林缘成群叮咬，多咬头面部、耳后和四肢，叮咬瞬间常无痛。',
    commonReaction: '叮后局部红肿剧痒，中央有针尖样出血点，反应重时可伴“蚋热”等全身症状。',
    compareClues: '与蠓区分看大小与翅型——蠓更小、翅窄、孳生于湿地；与蚊子区分看活动环境与口器。',
    firstActions: ['离开溪边等孳生环境并清洗叮咬处', '冷敷减轻红肿瘙痒', '必要时外用止痒药或口服抗组胺药'],
    caution: '在我国一般不传播河盲症，主要危害是剧痒和过敏；溃烂、发热或呼吸困难时就医。',
    confusedWith: ['biting_midge', 'mosquito', 'flea'],
    sourceKeys: ['nhsBites', 'zjLishuiBlackfly', 'purdueBlackfly'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Simulium',
    images: [
      { src: '/images/insect-guide/simulium/01-overview.webp', caption: '蚋（黑蝇）成虫整体形态：体型粗短、背部隆起呈驼背状', alt: '一只黑色的小型蚋成虫，背部隆起，翅宽阔', credit: 'Fritz Geller-Grimm', license: 'CC BY-SA 2.5', sourceUrl: commonsFile('Simuliidae fg01.jpg') },
      { src: '/images/insect-guide/simulium/02-detail.webp', caption: '蚋的头部特写：可见复眼与短粗的刺吸式口器', alt: '蚋的头部特写，展示复眼和口器', credit: 'Erin Hayes-Pontius', license: 'CC BY-SA 3.0', sourceUrl: commonsFile('Simuliidae - Face.jpg') },
      { src: '/images/insect-guide/simulium/03-behavior.webp', caption: '一对蚋成虫在河边交配，展示其生活于流水环境的行为', alt: '两只蚋成虫在交配的行为特写', credit: 'Syrio', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Simuliidae sp couple 01.jpg') }
    ]
  },
  {
    id: 'head_louse', name: '头虱', scientificName: 'Pediculus humanus capitis', commonCategory: '虱类',
    aliases: ['头虱子', '人头虱', '发虱'], group: 'attached', groupName: '附着类', accent: '#8B5A5A',
    summary: '专一寄生于人头发的吸血型体表寄生虫，不会跳飞，主要靠头对头接触传播。',
    appearance: '成虱体长约 2～3 毫米，扁平灰白至棕褐色，6 足末端带爪；卵（虮子）牢固粘附发干。',
    identificationKeys: ['头皮持续瘙痒（枕部耳后多见）', '发丝上发现活虱或紧贴发根的卵壳', '密切接触者有相似病例'],
    distribution: '全球分布，与卫生条件无关，儿童高发；浙江及华东校园聚集性感染常见。',
    habitat: '寄生于头皮和头发，尤其耳后、枕部、颈后发际。',
    contactPattern: '主要通过头对头直接接触或共用梳子、帽子、枕套等个人物品传播。',
    commonReaction: '头皮瘙痒（对虱唾液过敏），搔抓可致抓痕、破损和继发细菌感染。',
    compareClues: '与头皮屑区分——虮子牢固粘附发干需用力才能滑落，头皮屑轻拍即落。',
    firstActions: ['用密齿篦子反复篦除活虱和卵', '按说明使用灭虱洗剂并隔期重复', '热水清洗或密封隔离个人物品'],
    caution: '头虱不致命也不传播严重疾病；头皮红肿、渗脓、发热时提示继发感染应就医。',
    confusedWith: ['bedbug', 'flea', 'chigger', 'tick', 'mosquito'],
    sourceKeys: ['cdcHeadLouse', 'nhsHeadLice', 'statpearlsPediculosis'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Pediculus_humanus_capitis',
    images: [
      { src: '/images/insect-guide/pediculus-humanus-capitis/01-adult.webp', caption: '雄性头虱整体形态（微距放大）', alt: '雄性头虱的微距照片，可见其扁平身体与六条带爪的足', credit: 'Gilles San Martin', license: 'CC BY-SA 2.0', sourceUrl: commonsFile('Male human head louse.jpg') },
      { src: '/images/insect-guide/pediculus-humanus-capitis/02-cdc.webp', caption: '头虱形态（美国疾控中心 PHIL 图像库）', alt: '头虱的显微图像，展示其身体与足部结构', credit: 'CDC（美国疾病控制与预防中心）', license: 'Public domain', sourceUrl: commonsFile('Pediculus humanus capitis CDC0377.png') },
      { src: '/images/insect-guide/pediculus-humanus-capitis/03-on-hair.webp', caption: '头虱紧抓发丝（显微放大）', alt: '显微照片显示一只头虱附着并抓握头发发干', credit: 'Janek Lass', license: 'CC BY 4.0', sourceUrl: commonsFile('Inimese peatäi.jpg') }
    ]
  },
  {
    id: 'scabies_mite', name: '疥螨', scientificName: 'Sarcoptes scabiei', commonCategory: '螨类',
    aliases: ['疥虫', '疥疮螨', '痒螨', '人疥螨'], group: 'attached', groupName: '附着类', accent: '#B07050',
    summary: '钻入皮肤角质层挖隧道生活的微小寄生虫，引起疥疮——剧烈瘙痒和特征性丘疹。',
    appearance: '成螨约 0.3～0.4 毫米，肉眼几乎不可见，近圆形、乳白至淡棕色；皮疹见丘疹、水疱和灰色隧道。',
    identificationKeys: ['夜间或遇热后瘙痒明显加重', '指缝、腕、腋下、腰腹等褶皱处丘疹与隧道', '同住者同时或相继瘙痒'],
    distribution: '全球流行，集体生活环境中高发；浙江及华东人口密集、集体住宿多。',
    habitat: '寄生于皮肤角质层内，好发于指缝、腕部、腋窝、腹股沟等薄嫩温暖处。',
    contactPattern: '通过长时间皮肤直接接触或污染衣物、床单传播；短暂握手通常不传播。',
    commonReaction: '潜伏 2～6 周后出现剧烈瘙痒（夜间加重）、红色丘疹、水疱和隧道，搔抓可继发感染。',
    compareClues: '与湿疹区分看隧道与好发部位；与蚊蚤叮咬的散发丘疹不同，疥疮密集且累及指缝。',
    firstActions: ['尽早就医明确诊断，勿自行长期涂激素药膏', '遵医嘱用杀疥药物从颈以下全身涂抹', '同住者同治疗并高温清洗或隔离衣物寝具'],
    caution: '一般不致命，主要危害是瘙痒和继发感染；红肿渗脓、发热或久治不愈应复诊。',
    confusedWith: ['bedbug', 'flea', 'chigger', 'mosquito'],
    sourceKeys: ['cdcScabies', 'nhsScabies', 'statpearlsScabies'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Sarcoptes_scabiei',
    images: [
      { src: '/images/insect-guide/sarcoptes-scabiei/01-microscope.webp', caption: '光学显微镜下的疥螨（放大 20 倍）', alt: '光学显微镜下的疥螨照片，可见其近圆形虫体和足', credit: 'Arthur Goldstein', license: 'CC BY-SA 4.0', sourceUrl: commonsFile('Sarcopte scabiei under a microscope.jpg') },
      { src: '/images/insect-guide/sarcoptes-scabiei/02-adult.webp', caption: '疥螨成虫（微距）', alt: '疥螨成虫的微距照片，展示其圆形身体与四对足', credit: 'Alan R Walker', license: 'CC BY-SA 3.0', sourceUrl: commonsFile('Sarcoptes-scabiei-adult-mite-2.JPG') },
      { src: '/images/insect-guide/sarcoptes-scabiei/03-mite.webp', caption: '疥螨（Sarcoptes scabiei）形态', alt: '疥螨的放大照片，展示虫体轮廓与腿部结构', credit: 'Alan R Walker', license: 'CC BY-SA 3.0', sourceUrl: commonsFile('Sarcoptes-scabiei.JPG') }
    ]
  },
  {
    id: 'house_centipede', name: '花蚰蜒', scientificName: 'Thereuopoda clunifera', commonCategory: '蚰蜒类',
    aliases: ['蚰蜒', '大蚰蜒', '墙串子', '钱串子'], group: 'stinging', groupName: '蜇刺类', accent: '#7A6B4A',
    summary: '步足纤细、行动极快的蚰蜒，以蚊蝇蟑螂为食，仅被捕捉受压时才咬人，毒性弱。',
    appearance: '体长 2.5～4 厘米，黄褐至灰褐；共 15 对极细长步足，末对特长超出身体末端如触角。',
    identificationKeys: ['15 对细长步足，末对特长', '体背深浅相间斑纹、行动极快', '头部有长触角和钩状毒颚'],
    distribution: '分布于东亚，中国华东、华中、华南及西南有记录，浙江有分布。',
    habitat: '卫生间、厨房、地下室等潮湿阴暗处，也见于室外石缝、落叶层，夜间活跃。',
    contactPattern: '通常避人；被咬多因夜间触碰、穿衣时衣物内藏有蚰蜒或徒手捕捉。',
    commonReaction: '咬处针刺样疼痛、局部发红和轻度肿胀，一般数小时至 1～2 天消退。',
    compareClues: '与蜈蚣区分——蚰蜒步足细长（15 对）、末对特长、咬伤通常更轻。',
    firstActions: ['用肥皂和清水清洗咬伤部位', '局部冷敷减痛消肿', '症状加重或过敏时就医'],
    caution: '毒性弱，多为轻微局部反应；出现全身荨麻疹、呼吸困难等过敏征象时就医。',
    confusedWith: ['scolopendra_subspinipes_mutilans'],
    sourceKeys: ['statpearlsCentipede', 'hkmjCentipede', 'wikiThereuopoda'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Thereuopoda_clunifera',
    images: [
      { src: '/images/insect-guide/thereuopoda/01-overview.webp', caption: '花蚰蜒整体形态，可见 15 对细长步足与末对特长后足', alt: '一只花蚰蜒的完整侧面照，身体细长，多对细长步足向四周展开，末对足向后延伸超过身体末端', credit: 'Thomas Brown', license: 'CC BY 2.0', sourceUrl: commonsFile('Long-legged Centipede (Thereuopoda clunifera) (5827306239).jpg') },
      { src: '/images/insect-guide/thereuopoda/02-head.webp', caption: '花蚰蜒头部特写，可见发达复眼、长触角与钩状毒颚', alt: '花蚰蜒头部近距离特写，显示复眼、细长触角和位于头部下方的钩状毒颚', credit: 'heikindai_87', license: 'CC0', sourceUrl: commonsFile('Thereuopoda clunifera 126701283.jpg') },
      { src: '/images/insect-guide/thereuopoda/03-habitat.webp', caption: '花蚰蜒在野外水渠旁捕食（旁为蟋蟀残骸），展示其生活场景', alt: '一只花蚰蜒在石缝水渠旁，旁边有被它捕食的蟋蟀残骸，展示其夜间捕食行为', credit: 'Thomas Brown', license: 'CC BY 2.0', sourceUrl: commonsFile('Long-legged Centipede (Thereuopoda clunifera) (6747989937).jpg') }
    ]
  },
  {
    id: 'chinese_scorpion', name: '东亚钳蝎', scientificName: 'Mesobuthus martensii', commonCategory: '蝎类',
    aliases: ['马氏钳蝎', '中华钳蝎', '远东钳蝎', '全蝎'], group: 'stinging', groupName: '蜇刺类', accent: '#5A4A6B',
    summary: '中国及东亚常见的蝎类，尾部末端有毒针，蜇刺以局部剧痛为主，预后多良好。',
    appearance: '体长（含尾）约 4～6 厘米，黄褐至黄绿；前部一对螯和 4 对步足，尾部末端有球状尾节和向上弯的毒针。',
    identificationKeys: ['前部一对螯、4 对步足', '后体细长如尾，末端有毒针', '昼伏夜出，藏于石缝土穴'],
    distribution: '主要分布于长江以北（华北、西北东部、东北南部）；浙江非自然分布区，偶见养殖流通个体。',
    habitat: '山坡石缝、土穴、砖石堆、墙缝及农田边缘，昼伏夜出。',
    contactPattern: '翻动石块、搬柴草、穿鞋时鞋内有蝎或徒手捕捉时被蜇。',
    commonReaction: '蜇后立即剧痛，局部发红肿胀，疼痛向近端放射，持续数小时至 1～2 天。',
    compareClues: '与蜈蚣咬伤区分——蝎蜇多为单个刺点、灼痛为主；东亚钳蝎毒性弱、致死风险很低。',
    firstActions: ['用肥皂和清水清洗蜇伤部位', '局部冷敷镇痛并抬高患肢', '出现全身症状或儿童被蜇时尽快就医'],
    caution: '多为局部剧痛、可自行缓解；恶心呕吐、心慌、呼吸困难等全身反应或儿童被蜇应就医。',
    confusedWith: ['scolopendra_subspinipes_mutilans'],
    sourceKeys: ['statpearlsScorpion', 'mesobuthusDistribution'], taxonUrl: 'https://commons.wikimedia.org/wiki/Category:Mesobuthus_martensii',
    images: [
      { src: '/images/insect-guide/mesobuthus-martensii/01-overview.webp', caption: '东亚钳蝎（中国金蝎）整体形态，可见一对螯、4 对步足与末端的尾针', alt: '一只黄褐色的东亚钳蝎整体照，前部有一对螯和四对步足，后部细长的尾巴末端向上弯曲带有毒针', credit: 'Holger Krisp', license: 'CC BY 4.0', sourceUrl: commonsFile('Olivierus martensii Chinesischer Goldskorpion 1.jpg') },
      { src: '/images/insect-guide/mesobuthus-martensii/02-dorsal.webp', caption: '东亚钳蝎背面观，显示黄褐体色与细长的尾节', alt: '东亚钳蝎从上方拍摄的背面照片，身体黄褐色，尾部细长，末端尾针清晰可见', credit: 'Já', license: 'CC BY-SA 3.0', sourceUrl: commonsFile('Mesobuthus martensii (283).jpg') },
      { src: '/images/insect-guide/mesobuthus-martensii/03-live.webp', caption: '东亚钳蝎侧面生活照，展示其爬行姿态与体态特征', alt: '一只活体东亚钳蝎的侧面照片，正趴在基质上，前部螯肢与后部弯曲的尾部清晰可见', credit: 'Holger Krisp', license: 'CC BY 4.0', sourceUrl: commonsFile('Olivierus martensii Chinesischer Goldskorpion 2.jpg') }
    ]
  }
];

const ITEMS = CORE_ITEMS.concat(CANDIDATE_ITEMS);

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function normalizeText(value) { return String(value || '').trim().toLowerCase(); }
function sourceList(sourceKeys) { return (sourceKeys || []).map(key => SOURCES[key]).filter(Boolean); }

function toSummary(item) {
  return { id: item.id, name: item.name, scientificName: item.scientificName, commonCategory: item.commonCategory,
    aliases: item.aliases.slice(), group: item.group, groupName: item.groupName, accent: item.accent,
    zhejiangStatus: item.zhejiangStatus || '', summary: item.summary, compareClues: item.compareClues,
    coverImage: item.images[0].src, imageCount: item.images.length, mediaStatus: item.mediaStatus || 'LICENSED' };
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
  result.sources = item.sources ? clone(item.sources) : sourceList(item.sourceKeys);
  if (item.taxonUrl) result.sources.unshift({ title: 'Wikimedia Commons · ' + item.scientificName + ' 图片与分类', url: item.taxonUrl });
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
