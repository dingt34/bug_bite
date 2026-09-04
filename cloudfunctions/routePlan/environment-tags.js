const ENVIRONMENT_RULES = [
  { tag: '高草/灌木', pattern: /高草|草地|草坪|灌木|花海|芦苇|荒草/ },
  { tag: '林地/落叶层', pattern: /森林|林场|林区|林地|树林|竹林|竹海|山林|山区|山谷|山峰|山岭|登山|盘山|植物园|自然保护区/ },
  { tag: '水边/湿地', pattern: /湿地|水库|西湖|湖边|湖畔|沿湖|环湖|湖滨|江边|江畔|沿江|滨江|江堤|河边|河畔|沿河|河道|河滨|溪流|溪边|沿溪|海边|海滨|沿海|海岸|港湾|堤岸|滨水/ },
  { tag: '农田/果园', pattern: /农田|农场|果园|茶园|稻田|麦田|菜地|采摘园/ },
  { tag: '城市公园', pattern: /城市公园|公园|广场|绿道|体育中心|游乐园/ },
  { tag: '室内住宿', pattern: /酒店|宾馆|民宿|旅馆|客栈|招待所|室内住宿/ }
];

function valueText(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return [value.title, value.name, value.address, value.city, value.district].filter(Boolean).join(' ');
}

function routeText(route, places) {
  const steps = Array.isArray(route && route.steps) ? route.steps : [];
  return (Array.isArray(places) ? places : []).map(valueText).concat(steps.map(step => [
    step && step.instruction,
    step && step.road_name,
    step && step.act_desc
  ].filter(Boolean).join(' '))).join(' ');
}

function inferEnvironmentTags(route, places) {
  const source = routeText(route, places);
  if (!source) return [];
  return ENVIRONMENT_RULES.filter(rule => rule.pattern.test(source)).map(rule => rule.tag);
}

module.exports = { ENVIRONMENT_RULES, routeText, inferEnvironmentTags };
