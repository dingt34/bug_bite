const tabs = [
  '/pages/home/home',
  '/pages/ai/ai',
  '/pages/camera/camera',
  '/pages/community/community',
  '/pages/profile/profile'
];

function back(fallback = '/pages/home/home') {
  const pages = getCurrentPages();
  if (pages.length > 1) wx.navigateBack();
  else wx.switchTab({ url: fallback });
}

function syncTab(page, index) {
  if (typeof page.getTabBar === 'function' && page.getTabBar()) {
    page.getTabBar().setData({ selected: index });
  }
}

module.exports = { tabs, back, syncTab };
