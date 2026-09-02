const mock = require('../../utils/mock.js');
const risk = require('../../utils/risk.js');
const eventUtils = require('../../utils/event.js');
const resultContent = require('../../utils/result-content.js');
const cloudSync = require('../../utils/cloud-sync.js');

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const pad = value => String(value).padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
}

Page({
  data: {
    event: null,
    questions: [],
    answers: {},
    signals: [],
    selectedDanger: [],
    actionsTaken: [],
    actionOptions: [
      '清水和肥皂清洁', '冷敷', '避免抓挠', '抬高患肢',
      '标记红肿边界', '按说明书或医嘱用药', '已咨询专业人员',
      '已就医', '未处理'
    ],
    previewImage: '',
    imagePersisted: false,
    savingImage: false,
    validationMessage: ''
  },

  onLoad(options) {
    const events = wx.getStorageSync('events') || [];
    const event = events.find(item => item.id === options.id);
    if (!event) {
      wx.showModal({
        title: '记录不存在',
        content: '无法为不存在的事件添加复查。',
        showCancel: false,
        success: () => wx.navigateBack()
      });
      return;
    }

    const common = mock.REVIEW_QUESTIONS.common.map(question => Object.assign({}, question));
    const specific = (mock.REVIEW_QUESTIONS[event.contactType] || []).map(question => Object.assign({}, question));
    const questions = common.concat(specific);
    const answers = {};
    questions.forEach(question => {
      answers[question.key] = question.type === 'chips' ? [] : '';
    });
    const signals = mock.DANGER_SIGNALS.filter(signal => !signal.contactTypes || signal.contactTypes.indexOf(event.contactType) > -1);
    this.setData({ event, questions, answers, signals });
  },

  toggleDanger(e) {
    const key = e.currentTarget.dataset.key;
    const selected = this.data.selectedDanger.slice();
    const index = selected.indexOf(key);
    if (index > -1) selected.splice(index, 1);
    else selected.push(key);
    this.setData({ selectedDanger: selected, validationMessage: '' });
  },

  onAnswer(e) {
    const data = e.currentTarget.dataset;
    const answers = Object.assign({}, this.data.answers);
    if (data.type === 'chips') {
      let values = (answers[data.key] || []).slice();
      if (data.v === '无明显') {
        values = values.indexOf('无明显') > -1 ? [] : ['无明显'];
      } else {
        values = values.filter(item => item !== '无明显');
        const index = values.indexOf(data.v);
        if (index > -1) values.splice(index, 1);
        else values.push(data.v);
      }
      answers[data.key] = values;
    } else {
      answers[data.key] = data.v;
    }
    this.setData({ answers, validationMessage: '' });
  },

  onActionTap(e) {
    const value = e.currentTarget.dataset.v;
    let actions = this.data.actionsTaken.slice();
    if (value === '未处理') {
      actions = actions.indexOf('未处理') > -1 ? [] : ['未处理'];
    } else {
      actions = actions.filter(item => item !== '未处理');
      const index = actions.indexOf(value);
      if (index > -1) actions.splice(index, 1);
      else actions.push(value);
    }
    this.setData({ actionsTaken: actions });
  },

  chooseImage() {
    wx.chooseImage({
      count: 1,
      success: res => {
        this.setData({ previewImage: res.tempFilePaths[0], imagePersisted: false });
      }
    });
  },

  submit() {
    if (!this.data.selectedDanger.length) {
      const missing = risk.validateRequiredAnswers(this.data.questions, this.data.answers);
      if (missing.length) {
        const message = '请完成：' + missing.map(question => question.label).join('、');
        this.setData({ validationMessage: message });
        wx.showToast({ title: '请先完成必填问题', icon: 'none' });
        return;
      }
    }
    if (this.data.savingImage) return;
    this.persistImage(() => this.saveReview());
  },

  persistImage(done) {
    if (!this.data.previewImage || this.data.imagePersisted) {
      done();
      return;
    }
    this.setData({ savingImage: true });
    wx.saveFile({
      tempFilePath: this.data.previewImage,
      success: res => {
        this.setData({ previewImage: res.savedFilePath, imagePersisted: true, savingImage: false });
        done();
      },
      fail: () => {
        this.setData({ savingImage: false });
        wx.showModal({ title: '图片保存失败', content: '请重试或重新选择图片。', showCancel: false });
      }
    });
  },

  saveReview() {
    const event = this.data.event;
    const reviewAnswers = {};
    Object.keys(this.data.answers).forEach(key => {
      const value = this.data.answers[key];
      if ((Array.isArray(value) && value.length) || (!Array.isArray(value) && value)) {
        reviewAnswers[key] = value;
      }
    });
    const mergedAnswers = Object.assign({}, event.answers || {}, reviewAnswers);
    let assessment;
    if (this.data.selectedDanger.length) {
      assessment = {
        level: 'emergency',
        ruleVersion: risk.RULE_VERSION,
        matchedRules: this.data.selectedDanger.map(key => {
          const signal = mock.DANGER_SIGNALS.find(item => item.key === key);
          return { id: 'danger_' + key, text: signal ? signal.name : key };
        })
      };
    } else {
      assessment = risk.evaluateRisk(event.contactType, mergedAnswers);
    }

    const resolvedLevel = eventUtils.resolveReviewLevel(event.riskLevel, assessment.level);
    const downgradeBlocked = resolvedLevel.downgradeBlocked;
    const effectiveLevel = resolvedLevel.level;
    const content = resultContent[effectiveLevel];
    const timestamp = Date.now();
    const summaryParts = [
      '复查结果：' + content.levelName,
      '当前身体部位：' + ((this.data.answers.bodyParts || []).join('、') || '未填写'),
      '当前局部表现：' + ((this.data.answers.localSymptoms || []).join('、') || '未填写'),
      '当前全身不适：' + ((this.data.answers.systemicSymptoms || []).join('、') || '未填写'),
      '变化趋势：' + (this.data.answers.trend || '未填写'),
      '日常活动影响：' + (this.data.answers.dailyImpact || '未填写')
    ];
    if (this.data.answers.removed) {
      summaryParts.push('附着虫体状态：' + this.data.answers.removed);
    }
    if (this.data.selectedDanger.length) {
      summaryParts.push('危险信号：' + assessment.matchedRules.map(rule => rule.text).join('、'));
    }
    if (this.data.actionsTaken.length) {
      summaryParts.push('本次措施：' + this.data.actionsTaken.join('、'));
    }
    if (downgradeBlocked) {
      summaryParts.push('说明：紧急事件不可通过自评自动降级，请遵医嘱复查。');
    }

    const review = {
      id: 'review_' + timestamp,
      createdAt: formatTime(timestamp),
      createdAtTimestamp: timestamp,
      answers: reviewAnswers,
      dangerSignals: this.data.selectedDanger,
      actionsTaken: this.data.actionsTaken,
      imageRefs: this.data.previewImage ? [this.data.previewImage] : [],
      calculatedRiskLevel: assessment.level,
      riskLevel: effectiveLevel,
      levelName: content.levelName,
      nextReviewAt: content.review,
      matchedRules: assessment.matchedRules,
      ruleVersion: assessment.ruleVersion,
      downgradeBlocked: downgradeBlocked,
      summary: summaryParts.join('\n')
    };

    const updatedEvent = eventUtils.appendReview(event, review, timestamp);
    const events = eventUtils.upsertEvent(wx.getStorageSync('events') || [], updatedEvent);
    wx.setStorageSync('events', events);
    cloudSync.queuePush(wx, typeof getApp === 'function' ? getApp() : null);
    wx.showToast({ title: '复查已保存', icon: 'success' });
    setTimeout(() => {
      wx.redirectTo({ url: '/pages/event-detail/event-detail?id=' + event.id });
    }, 500);
  }
});
