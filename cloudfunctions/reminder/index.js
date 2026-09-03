const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();
const _ = db.command;

exports.main = async event => {
  const { OPENID } = cloud.getWXContext();
  const fromTimer = event && event.Type === 'Timer';
  const action = fromTimer ? 'sendDue' : String(event.action || 'create');
  try {
    if (action === 'create') {
      if (!OPENID) return { ok: false, code: 'NO_OPENID', message: '无法确认微信身份' };
      const dueAt = new Date(event.dueAt);
      if (Number.isNaN(dueAt.getTime())) return { ok: false, code: 'INVALID_TIME', message: '提醒时间无效' };
      const result = await db.collection('reminders').add({ data: {
        ownerOpenid: OPENID, eventId: String(event.eventId || '').slice(0, 64), dueAt,
        title: String(event.title || '叨咬情况复查').slice(0, 40), status: 'pending', createdAt: db.serverDate()
      } });
      return { ok: true, data: { reminderId: result._id } };
    }
    if (action === 'cancel') {
      const id = String(event.reminderId || '');
      const reminder = await db.collection('reminders').doc(id).get();
      if (!reminder.data || reminder.data.ownerOpenid !== OPENID) return { ok: false, code: 'FORBIDDEN', message: '无权取消该提醒' };
      await db.collection('reminders').doc(id).update({ data: { status: 'cancelled', updatedAt: db.serverDate() } });
      return { ok: true, data: { cancelled: true } };
    }
    if (action === 'sendDue') {
      if (!fromTimer) return { ok: false, code: 'FORBIDDEN', message: '只能由云端定时任务发送提醒' };
      const templateId = process.env.SUBSCRIBE_TEMPLATE_ID;
      if (!templateId) return { ok: false, code: 'NOT_CONFIGURED', message: '未配置订阅消息模板' };
      const due = await db.collection('reminders').where({ status: 'pending', dueAt: _.lte(new Date()) }).limit(100).get();
      let sent = 0;
      for (const item of due.data) {
        try {
          await cloud.openapi.subscribeMessage.send({
            touser: item.ownerOpenid, page: `pages/review/review?id=${encodeURIComponent(item.eventId || '')}`,
            lang: 'zh_CN', miniprogramState: process.env.MINIPROGRAM_STATE || 'formal', templateId,
            data: { thing1: { value: item.title || '叨咬情况复查' }, time2: { value: new Date(item.dueAt).toLocaleString('zh-CN', { hour12: false }) } }
          });
          await db.collection('reminders').doc(item._id).update({ data: { status: 'sent', sentAt: db.serverDate() } });
          sent += 1;
        } catch (sendError) {
          console.error('send reminder', item._id, sendError);
          await db.collection('reminders').doc(item._id).update({ data: { status: 'failed', errorCode: sendError.errCode || 0 } });
        }
      }
      return { ok: true, data: { checked: due.data.length, sent } };
    }
    return { ok: false, code: 'UNKNOWN_ACTION', message: '不支持的操作' };
  } catch (error) {
    console.error('reminder', action, error);
    return { ok: false, code: 'CLOUD_ERROR', message: '提醒服务暂时不可用' };
  }
};
