const mock = require('../../utils/mock.js');

Page({
  data: {
    questions: [],
    answers: {},
    actionsTaken: [],
    actionOptions: ['挤压伤口', '涂抹药膏', '冷敷', '服药', '已就医', '无'],
    previewImage: '',
    contactType: ''
  },

  onLoad(options) {
    const contactType = options.contactType || 'bite';
    const common = mock.COMMON_QUESTIONS.map(q => Object.assign({}, q));
    const specific = (mock.SPECIFIC_QUESTIONS[contactType] || []).map(q => Object.assign({}, q));
    const questions = common.concat(specific);
    const answers = {};
    questions.forEach(q => {
      answers[q.key] = q.type === 'chips' ? [] : '';
    });
    this.setData({ contactType: contactType, questions: questions, answers: answers });
  },

  onAnswer(e) {
    const ds = e.currentTarget.dataset;
    const answers = this.data.answers;
    if (ds.type === 'chips') {
      const arr = answers[ds.key];
      const idx = arr.indexOf(ds.v);
      if (idx > -1) {
        arr.splice(idx, 1);
      } else {
        arr.push(ds.v);
      }
      answers[ds.key] = arr;
    } else {
      answers[ds.key] = ds.v;
    }
    this.setData({ answers: answers });
  },

  onActionTap(e) {
    const v = e.currentTarget.dataset.v;
    const arr = this.data.actionsTaken;
    const idx = arr.indexOf(v);
    if (idx > -1) {
      arr.splice(idx, 1);
    } else {
      arr.push(v);
    }
    this.setData({ actionsTaken: arr });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: (res) => {
        // 初稿仅本地展示，不接云存储
        this.setData({ previewImage: res.tempFilePaths[0] });
      }
    });
  },

  submit() {
    const app = getApp();
    const draft = app.globalData.draftEvent || {};
    draft.answers = this.data.answers;
    draft.actionsTaken = this.data.actionsTaken;
    app.globalData.draftEvent = draft;
    const level = this.computeRisk(this.data.answers);
    wx.navigateTo({ url: '/pages/result/result?level=' + level });
  },

  computeRisk(answers) {
    const sys = answers.systemicSymptoms || [];
    const hasSystemic = sys.some(s => s !== '无明显');
    const trend = answers.trend;
    const local = answers.localSymptoms || [];
    const hasSeriousLocal = local.indexOf('水疱') > -1 || local.indexOf('出血点') > -1;
    if (trend === '快速加重' || hasSystemic || hasSeriousLocal) {
      return 'consult';
    }
    return 'observe';
  }
});
