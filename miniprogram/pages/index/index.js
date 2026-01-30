// index.js
const pomodoro = require('../../utils/pomodoro');
const sound = require('../../utils/sound');

Page({
  data: {
    // 番茄钟数据
    timeDisplay: '25:00',
    status: 'idle', // 'idle' | 'running' | 'paused'
    progress: 0,
    progressPercent: 0,
  },

  onLoad() {
    // 初始化番茄钟（默认25分钟）
    pomodoro.init(25 * 60 * 1000);
    this._updateDisplay();
  },

  onShow() {
    // 页面显示时，重新初始化并更新显示
    pomodoro.init(25 * 60 * 1000);
    this._updateDisplay();
    
    // 启动 UI 刷新定时器（不是计时的真实来源）
    if (!this._timerInterval) {
      this._timerInterval = setInterval(() => {
        this._updateDisplay();
      }, 300); // 300ms 更新一次 UI
    }
  },

  onHide() {
    // 页面隐藏时，清理定时器（状态已保存到本地存储）
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },

  onUnload() {
    // 页面卸载时，清理定时器
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },

  /**
   * 更新显示（从 pomodoro 获取实时快照）
   */
  _updateDisplay() {
    const snap = pomodoro.getSnapshot();
    
    this.setData({
      timeDisplay: snap.formatted,
      status: snap.status,
      progress: snap.progress,
      progressPercent: Math.round(snap.progress * 100),
    });
    
    // 检查倒计时是否完成
    if (snap.status === 'running' && snap.remainingMs <= 0) {
      this._onCountdownComplete();
    }
  },

  /**
   * 倒计时完成处理
   */
  _onCountdownComplete() {
    // 震动（使用无参数调用以兼容基础库）
    try {
      wx.vibrateShort();
    } catch (e) {
      // 兼容性容错：忽略不可用的震动 API
    }
    
    // toast 提示
    wx.showToast({
      title: '专注完成',
      icon: 'success',
      duration: 2000,
    });
    
    // 重置状态
    pomodoro.reset();
    this._updateDisplay();
    
    // 播放完成音效（如果有）
    try {
      sound.playClick();
    } catch (e) {
      // ignore
    }
  },

  /**
   * 点击"开始/继续"按钮
   */
  onStartClick() {
    try { sound.playClick(); } catch (e) {}
    pomodoro.start();
    this._updateDisplay();
  },

  /**
   * 点击"暂停"按钮
   */
  onPauseClick() {
    try { sound.playClick(); } catch (e) {}
    pomodoro.pause();
    this._updateDisplay();
  },

  /**
   * 点击"重置"按钮
   */
  onResetClick() {
    try { sound.playClick(); } catch (e) {}
    pomodoro.reset();
    this._updateDisplay();
  },
});
