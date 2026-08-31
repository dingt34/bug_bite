const store=require('../../utils/store'); const nav=require('../../utils/nav');
Page({
  data:{type:'bite', symptoms:['红肿','瘙痒'], options:[{label:'红肿',selected:true},{label:'瘙痒',selected:true},{label:'疼痛',selected:false},{label:'发热感',selected:false},{label:'水疱',selected:false},{label:'出血',selected:false},{label:'麻木',selected:false},{label:'其他',selected:false}],ranges:['1 处','2–5 处','多处 / 成片'],trends:['正在减轻','基本不变','逐渐加重'], range:'1 处', trend:'基本不变', photo:''},
  onLoad(q){this.setData({type:q.type||'bite'});}, back(){nav.back();},
  toggle(e){const v=e.currentTarget.dataset.value;const a=[...this.data.symptoms];const i=a.indexOf(v);i>=0?a.splice(i,1):a.push(v);const options=this.data.options.map(item=>({...item,selected:a.includes(item.label)}));this.setData({symptoms:a,options});},
  setRange(e){this.setData({range:e.currentTarget.dataset.value});}, setTrend(e){this.setData({trend:e.currentTarget.dataset.value});},
  addPhoto(){wx.chooseMedia({count:1,mediaType:['image'],sourceType:['album','camera'],success:r=>this.setData({photo:r.tempFiles[0].tempFilePath})});},
  save(){store.set('safetyDraft',{step:3,...this.data});wx.showToast({title:'草稿已保存'});},
  next(){const level=this.data.trend==='逐渐加重'?'consult':'observe';store.set('safetyDraft',{step:4,...this.data});wx.navigateTo({url:`/pages/result/result?level=${level}`});}
});
