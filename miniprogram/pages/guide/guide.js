const mock = require('../../utils/mock.js');
const risk = require('../../utils/risk.js');

Page({
  data: {
    questions: [],
    answers: {},
    answeredCount: 0,
    questionCount: 0,
    completionPercent: 0,
    actionsTaken: [],
    actionOptions: [],
    insectImage: '',
    woundImage: '',
    persistedImages: { insect: false, wound: false },
    savingImage: false,
    contactType: '',
    validationMessage: ''
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
    this.setData({
      contactType: contactType,
      questions: questions,
      answers: answers,
      questionCount: questions.length,
      actionOptions: this.buildActionOptions(contactType)
    });
  },

  buildActionOptions(contactType) {
    const common = [
      '已用肥皂和清水清洁', '已隔布冷敷', '已避免抓挠', '已抬高肿胀肢体',
      '已按说明书或医嘱用药', '已咨询专业人员', '已就医', '尚未处理'
    ];
    const specific = {
      sting: ['已移除可见蜂刺'],
      attachment: ['已用细尖镊子移除虫体'],
      contact: ['已用胶带轻粘去除疑似毒毛', '眼部接触后已用清水冲洗']
    };
    return (specific[contactType] || []).concat(common);
  },

  getCompletion(questions, answers) {
    const answeredCount = questions.filter(question => {
      const value = answers[question.key];
      return question.type === 'chips'
        ? Array.isArray(value) && value.length > 0
        : value !== undefined && value !== null && value !== '';
    }).length;
    return {
      answeredCount,
      completionPercent: questions.length ? Math.round(answeredCount * 100 / questions.length) : 0
    };
  },

  onAnswer(e) {
    const ds = e.currentTarget.dataset;
    const answers = this.data.answers;
    if (ds.type === 'chips') {
      let arr = (answers[ds.key] || []).slice();
      if (ds.v === '无明显') {
        arr = arr.indexOf('无明显') > -1 ? [] : ['无明显'];
      } else {
        arr = arr.filter(item => item !== '无明显');
        const idx = arr.indexOf(ds.v);
        if (idx > -1) {
          arr.splice(idx, 1);
        } else {
          arr.push(ds.v);
        }
      }
      answers[ds.key] = arr;
    } else {
      answers[ds.key] = ds.v;
    }
    const completion = this.getCompletion(this.data.questions, answers);
    this.setData({
      answers: answers,
      validationMessage: '',
      answeredCount: completion.answeredCount,
      completionPercent: completion.completionPercent
    });
  },

  onActionTap(e) {
    const v = e.currentTarget.dataset.v;
    let arr = this.data.actionsTaken.slice();
    if (v === '尚未处理') {
      arr = arr.indexOf('尚未处理') > -1 ? [] : ['尚未处理'];
    } else {
      arr = arr.filter(item => item !== '尚未处理');
      const idx = arr.indexOf(v);
      if (idx > -1) {
        arr.splice(idx, 1);
      } else {
        arr.push(v);
      }
    }
    this.setData({ actionsTaken: arr });
  },

  chooseImage(e) {
    const type = e.currentTarget.dataset.type === 'wound' ? 'wound' : 'insect';
    const field = type === 'wound' ? 'woundImage' : 'insectImage';
    wx.chooseImage({
      count: 1,
      success: (res) => {
        const path = res.tempFilePaths && res.tempFilePaths[0];
        if (!path) return;
        const persistedImages = Object.assign({}, this.data.persistedImages, { [type]: false });
        this.setData({ [field]: path, persistedImages });
      }
    });
  },

  submit() {
    const missing = risk.validateRequiredAnswers(this.data.questions, this.data.answers);
    if (missing.length) {
      const message = '请完成：' + missing.map(question => question.label).join('、');
      this.setData({ validationMessage: message });
      wx.showToast({ title: '请先完成必填问题', icon: 'none' });
      return;
    }

    if (this.data.savingImage) {
      return;
    }

    this.persistImage(() => this.finishSubmit());
  },

  onStepChange(e) {
    const target = Number(e.detail.step);
    const delta = 3 - target;
    if (delta > 0) wx.navigateBack({ delta });
  },

  persistImage(done) {
    const imageItems = [
      { type: 'insect', label: '虫体照片', field: 'insectImage', path: this.data.insectImage },
      { type: 'wound', label: '伤口照片', field: 'woundImage', path: this.data.woundImage }
    ].filter(item => item.path && !this.data.persistedImages[item.type]);

    if (!imageItems.length) {
      done();
      return;
    }

    this.setData({ savingImage: true });
    const saveNext = index => {
      if (index >= imageItems.length) {
        this.setData({ savingImage: false });
        done();
        return;
      }
      const item = imageItems[index];
      wx.saveFile({
        tempFilePath: item.path,
        success: res => {
          const persistedImages = Object.assign({}, this.data.persistedImages, { [item.type]: true });
          this.setData({ [item.field]: res.savedFilePath, persistedImages });
          saveNext(index + 1);
        },
        fail: () => {
          this.setData({ savingImage: false });
          wx.showModal({
            title: item.label + '保存失败',
            content: '该图片尚未保存到事件记录，请重试或重新选择图片。',
            showCancel: false
          });
        }
      });
    };
    saveNext(0);
  },

  finishSubmit() {
    const app = getApp();
    const draft = app.globalData.draftEvent || {};
    draft.answers = this.data.answers;
    draft.actionsTaken = this.data.actionsTaken;
    const imageRecords = [
      this.data.insectImage ? { category: 'insect', label: '虫体照片', path: this.data.insectImage } : null,
      this.data.woundImage ? { category: 'wound', label: '伤口/皮肤表现照片', path: this.data.woundImage } : null
    ].filter(Boolean);
    draft.insectImageRef = this.data.insectImage || '';
    draft.woundImageRef = this.data.woundImage || '';
    draft.imageRecords = imageRecords;
    draft.imageRefs = imageRecords.map(item => item.path);
    const assessment = risk.evaluateRisk(this.data.contactType, this.data.answers);
    draft.matchedRules = assessment.matchedRules;
    draft.ruleVersion = assessment.ruleVersion;
    app.globalData.draftEvent = draft;
    wx.navigateTo({ url: '/pages/result/result?level=' + assessment.level });
  }
});
