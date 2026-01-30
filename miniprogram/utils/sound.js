// 简单的音效播放器工具
// 使用方法：const sound = require('../../utils/sound'); sound.playClick();

const ctx = wx.createInnerAudioContext();
ctx.autoplay = false;
ctx.loop = false;

// 本地音频文件路径（请将你的音效放在 `miniprogram/assets/click.mp3`）
const CLICK_SRC = '/assets/click.mp3';

function playClick() {
  try {
    ctx.stop();
    ctx.src = CLICK_SRC;
    ctx.play();
  } catch (e) {
    // 容错：如果没有音频文件或 API 不可用，静默忽略错误
    console.warn('[sound] playClick failed:', e);
  }
}

module.exports = {
  playClick,
};
