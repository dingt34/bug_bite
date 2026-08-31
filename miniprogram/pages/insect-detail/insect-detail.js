const nav=require('../../utils/nav');
Page({data:{id:'tick',features:[{n:'1',t:'盾形背板',d:'身体扁平，附着吸血后明显膨大'},{n:'2',t:'八足成虫',d:'若虫与成虫足数和体型不同'},{n:'3',t:'缓慢爬行',d:'通常不会跳跃或飞行'}]},onLoad(q){this.setData({id:q.id||'tick'});},back(){nav.back();},compare(){wx.navigateTo({url:`/pages/compare/compare?ids=${this.data.id},mosquito`});},danger(){wx.navigateTo({url:'/pages/danger/danger?source=insect'});}});
