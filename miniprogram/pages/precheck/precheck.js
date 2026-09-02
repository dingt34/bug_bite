const store=require('../../utils/store');const nav=require('../../utils/nav');
function standardDate(value){const match=String(value).match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);return match?`${match[1]}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`:'';}
Page({
  data:{destination:'浙江省 · 丽水市',date:'2026年8月18日',activity:'徒步露营',environment:['林地','近水','过夜'],environmentText:'林地 · 近水 · 过夜',route:null},
  onShow(){const route=store.get('routeDraft',null);if(route)this.setData({route});}, back(){nav.back();},
  chooseDestination(){wx.chooseLocation({success:r=>this.setData({destination:r.name||r.address})});},
  chooseDate(){wx.showActionSheet({itemList:['2026年8月18日','2026年9月6日','2026年10月2日'],success:r=>this.setData({date:['2026年8月18日','2026年9月6日','2026年10月2日'][r.tapIndex]})});},
  chooseActivity(){wx.showActionSheet({itemList:['徒步露营','公园步行','骑行','亲子活动'],success:r=>this.setData({activity:['徒步露营','公园步行','骑行','亲子活动'][r.tapIndex]})});},
  editEnvironment(){wx.showActionSheet({itemList:['林地','草地','近水','过夜','携带宠物'],success:r=>{const environment=[['林地','草地','近水','过夜','携带宠物'][r.tapIndex]];this.setData({environment,environmentText:environment.join(' · ')});}});},
  route(){wx.navigateTo({url:'/pages/route/route'});}, save(){store.set('precheckDraft',this.data);wx.showToast({title:'草稿已保存'});},
  generate(){const plans=store.get('plans',[]);const p={id:store.id('trip'),title:this.data.destination.replace('浙江省 · ',''),date:this.data.date.replace(/^\d{4}年/,''),startAt:standardDate(this.data.date),type:this.data.activity,status:'新计划',distance:this.data.route?.distance||''};plans.unshift(p);store.set('plans',plans);store.set('currentPlan',{...this.data,id:p.id});wx.navigateTo({url:'/pages/precheck-result/precheck-result'});}
});
