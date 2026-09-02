const store=require('../../utils/store');const nav=require('../../utils/nav');
Page({
  data:{mode:'walk',modes:[{id:'hike',text:'徒步'},{id:'walk',text:'步行'},{id:'ride',text:'骑行'},{id:'drive',text:'驾车'}],start:'我的位置',end:'丽水古堰画乡',distance:'12.6 km',duration:'3小时40分',climb:'420m'},
  onLoad(query){this.setData({fromPost:query.from==='post'});},
  back(){nav.back();}, setMode(e){this.setData({mode:e.currentTarget.dataset.id});}, addWaypoint(){wx.showToast({title:'已添加途经点',icon:'success'});},
  confirm(){if(this.data.fromPost){wx.navigateBack();return;}store.set('routeDraft',{summary:`${this.data.end} ${this.data.mode==='ride'?'骑行':'徒步'}路线`,distance:this.data.distance,duration:this.data.duration,climb:this.data.climb});wx.navigateBack();}
});
