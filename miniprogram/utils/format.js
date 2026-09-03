// utils/format.js
// 日期格式化工具

/**
 * 格式化日期
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串
 */
function formatDate(date) {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // 如果是无效日期
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}年${month}月${day}日`;
}

/**
 * 格式化日期用于显示
 * @param {string} dateStr - YYYY-MM-DD格式的日期字符串
 * @returns {string} 格式化后的日期字符串
 */
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  
  // 如果是YYYY-MM-DD格式
  if (dateStr.includes('-')) {
    const [year, month, day] = dateStr.split('-');
    return `${year}年${month}月${day}日`;
  }
  
  // 如果已经是格式化过的日期
  return dateStr;
}

/**
 * 比较两个日期字符串（YYYY-MM-DD格式）
 * @param {string} date1 - 第一个日期
 * @param {string} date2 - 第二个日期
 * @returns {number} 比较结果：-1（date1 < date2），0（相等），1（date1 > date2）
 */
function compareDates(date1, date2) {
  if (!date1 || !date2) return 0;
  return date1.localeCompare(date2);
}

/**
 * 获取今天的日期字符串（YYYY-MM-DD格式）
 * @returns {string} 今天的日期
 */
function getTodayString() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * 检查日期是否是过去日期
 * @param {string} dateStr - YYYY-MM-DD格式的日期字符串
 * @returns {boolean} 是否是过去日期
 */
function isPastDate(dateStr) {
  if (!dateStr) return false;
  
  const today = getTodayString();
  return dateStr < today;
}

/**
 * 检查日期是否是未来日期
 * @param {string} dateStr - YYYY-MM-DD格式的日期字符串
 * @returns {boolean} 是否是未来日期
 */
function isFutureDate(dateStr) {
  if (!dateStr) return true; // 没有日期视为未来日期（草稿）
  
  const today = getTodayString();
  return dateStr >= today;
}

module.exports = {
  formatDate,
  formatDateForDisplay,
  compareDates,
  getTodayString,
  isPastDate,
  isFutureDate
};