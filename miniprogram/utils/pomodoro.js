/**
 * 番茄钟倒计时状态机
 * 基于时间戳差值计时，setInterval 仅用于 UI 刷新
 */

const STORAGE_KEY = 'pomodoro_state';
const DEFAULT_DURATION_MS = 25 * 60 * 1000;

// 内部状态存储
let state = {
  status: 'idle',           // 'idle' | 'running' | 'paused'
  durationMs: DEFAULT_DURATION_MS,
  startedAt: null,          // 运行开始时的时间戳（ms）
  pausedAt: null,           // 暂停开始时的时间戳（ms）
  accPausedMs: 0,           // 累计暂停时长（ms）
  lastSavedAt: null,        // 最后保存的时刻
};

/**
 * 初始化：恢复存储状态或使用默认值
 * @param {number} durationMs - 默认时长（毫秒）
 */
function init(durationMs = DEFAULT_DURATION_MS) {
  try {
    const stored = wx.getStorageSync(STORAGE_KEY);
    if (stored && typeof stored === 'object') {
      state = stored;
      state.durationMs = state.durationMs || durationMs;
      
      // 如果恢复时是运行状态，需要继续累计时间
      if (state.status === 'running' && state.startedAt) {
        // 保持原来的 startedAt，累计从上次保存到现在的暂停时长
        // 如果上次是暂停了，则需要累加
      }
      // 如果恢复时是暂停状态，pausedAt 需要保持
    } else {
      // 首次初始化
      state = {
        status: 'idle',
        durationMs,
        startedAt: null,
        pausedAt: null,
        accPausedMs: 0,
        lastSavedAt: null,
      };
      _saveState();
    }
  } catch (e) {
    console.error('[Pomodoro] init storage error:', e);
    state = {
      status: 'idle',
      durationMs,
      startedAt: null,
      pausedAt: null,
      accPausedMs: 0,
      lastSavedAt: null,
    };
  }
}

/**
 * 开始倒计时
 * 如果是 idle 或 paused 状态，可以开始/继续
 */
function start() {
  const now = Date.now();
  
  if (state.status === 'running') {
    // 已在运行，忽略重复点击
    return;
  }
  
  if (state.status === 'idle') {
    // 从 idle 开始
    state.status = 'running';
    state.startedAt = now;
    state.pausedAt = null;
    state.accPausedMs = 0;
  } else if (state.status === 'paused') {
    // 从 paused 继续
    state.status = 'running';
    if (state.pausedAt !== null) {
      // 累加本次暂停的时长
      const pauseDuration = now - state.pausedAt;
      state.accPausedMs += pauseDuration;
    }
    state.pausedAt = null;
  }
  
  _saveState();
}

/**
 * 暂停倒计时
 */
function pause() {
  if (state.status !== 'running') {
    return;
  }
  
  state.status = 'paused';
  state.pausedAt = Date.now();
  _saveState();
}

/**
 * 重置倒计时
 * 清除所有计时状态，回到 idle 并显示初始时间
 */
function reset() {
  state.status = 'idle';
  state.startedAt = null;
  state.pausedAt = null;
  state.accPausedMs = 0;
  _saveState();
}

/**
 * 获取当前快照（包含计算出的剩余时间）
 * @returns {Object}
 */
function getSnapshot() {
  const now = Date.now();
  let remainingMs = state.durationMs;
  
  if (state.status === 'running' && state.startedAt !== null) {
    // 真实剩余 = 初始时长 - (现在 - 开始) - 累计暂停
    const elapsedMs = now - state.startedAt - state.accPausedMs;
    remainingMs = Math.max(0, state.durationMs - elapsedMs);
  } else if (state.status === 'paused') {
    // 暂停状态保持不变（使用上一次的快照）
    const elapsedBeforePause = state.pausedAt - state.startedAt - state.accPausedMs;
    remainingMs = Math.max(0, state.durationMs - elapsedBeforePause);
  }
  // 如果是 idle，remainingMs = durationMs
  
  return {
    status: state.status,
    durationMs: state.durationMs,
    remainingMs,
    progress: Math.min(1, (state.durationMs - remainingMs) / state.durationMs),
    formatted: _formatTime(remainingMs),
    startedAt: state.startedAt,
    pausedAt: state.pausedAt,
    accPausedMs: state.accPausedMs,
  };
}

/**
 * 将毫秒转换为 mm:ss 格式
 */
function _formatTime(ms) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * 保存状态到本地存储
 */
function _saveState() {
  try {
    state.lastSavedAt = Date.now();
    wx.setStorageSync(STORAGE_KEY, state);
  } catch (e) {
    console.error('[Pomodoro] saveState error:', e);
  }
}

/**
 * 清除所有存储
 */
function clearStorage() {
  try {
    wx.removeStorageSync(STORAGE_KEY);
  } catch (e) {
    console.error('[Pomodoro] clearStorage error:', e);
  }
}

module.exports = {
  init,
  start,
  pause,
  reset,
  getSnapshot,
  clearStorage,
};
