const store=require('../../utils/store'); const nav=require('../../utils/nav');
const copy={emergency:{title:'紧急求助',sub:'已发现危险信号',color:'#EA4038'},consult:{title:'尽快咨询',sub:'症状正在加重',color:'#EA8B18'},observe:{title:'观察记录',sub:'当前未发现高危信号',color:'#E99A1A'}};
Page({
  data:{level:'observe',info:copy.observe,eventId:''},
  onLoad(q){const level=q.level||'observe';this.setData({level,info:copy[level]});this.saveEvent(level);}, back(){nav.back();},
  saveEvent(level){const draft=store.get('safetyDraft',{});const events=store.get('events',[]);const event={id:store.id('event'),type:draft.contactType==='sting'?'蜂类蜇伤':'蚊虫叮咬',level:copy[level].title,place:'待补充',body:'待补充',symptoms:draft.symptoms||[],trend:draft.trend||'待观察',createdAt:'刚刚',reviewAt:level==='observe'?'2 小时后':'尽快',status:'待复查'};events.unshift(event);store.set('events',events);this.setData({eventId:event.id});},
  call(){wx.makePhoneCall({phoneNumber:'120'});}, home(){wx.switchTab({url:'/pages/home/home'});}, events(){wx.navigateTo({url:'/pages/events/events'});}
});
