// Compact server-side snapshot of the team lead's DRAFT knowledge-base catalog.
// Candidate media remains PENDING_LICENSE and is not sent to the model.
const VERSION = 'team-lead-draft-2026-08';
const NAMES = [
  '白纹伊蚊', '三带喙库蚊', '中华按蚊', '骚扰阿蚊', '致倦库蚊', '埃及伊蚊', '猫栉首蚤', '人蚤',
  '温带臭虫', '热带臭虫', '蠓', '白蛉', '厩螫蝇', '蚋（黑蝇）', '鹿虻、虻类', '牛虻', '长角血蜱', '血红扇头蜱',
  '硬蜱（其他常见种）', '恙螨（恙虫）', '头虱', '体虱／阴虱', '疥螨', '黄脚胡蜂', '金环胡蜂', '中华蜜蜂', '纸蜂',
  '红火蚁', '大头家蚁／常见蚂蚁', '少棘蜈蚣', '花蚰蜒', '东亚钳蝎', '梭毒隐翅虫', '褐边绿刺蛾', '茶毛虫',
  '马尾松毛虫', '松毛虫类（其他种）', '毒蛾幼虫类（其他种）', '豆芋菁', '斑蝥类', '黄守瓜等瓜叶甲',
  '蜘蛛（非物种级）', '锥蝙', '采采蝇', '水蛭（非节肢动物）'
];
function asPromptText() { return NAMES.map((name, index) => (index + 1) + '. ' + name).join('、'); }
module.exports = { VERSION, NAMES, asPromptText };
