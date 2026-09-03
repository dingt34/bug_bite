const nav = require('../../utils/nav');
Page({
  data: {
    items: [
      { id: 'breathing', title: '呼吸困难或喉头发紧', desc: '喘不上气、说话困难', icon:'/assets/figma/s04-imgIconDangerBreathing.svg', selected:false },
      { id: 'conscious', title: '意识异常、晕厥或极度虚弱', desc: '站立不稳、反应明显变慢', icon:'/assets/figma/s04-imgIconDangerConsciousness.svg', selected:false },
      { id: 'swelling', title: '面部、舌头或嘴唇迅速肿胀', desc: '尤其伴随声音改变或吞咽困难', icon:'/assets/figma/s04-imgIconDangerSwelling.svg', selected:false },
      { id: 'spread', title: '症状在短时间内快速扩散', desc: '红肿或全身不适迅速加重', icon:'/assets/figma/s04-imgIconDangerSpread.svg', selected:false }
    ],
    selected: []
  },
  back() { nav.back(); },
  toggle(event) {
    const id = event.currentTarget.dataset.id; const selected = [...this.data.selected]; const index = selected.indexOf(id);
    if (index >= 0) selected.splice(index, 1); else selected.push(id); const items=this.data.items.map(item=>({...item,selected:selected.includes(item.id)}));this.setData({ selected,items });
  },
  emergency() { wx.redirectTo({ url: '/pages/result/result?level=emergency' }); },
  continueFlow() { wx.navigateTo({ url: '/pages/contact/contact' }); }
});
