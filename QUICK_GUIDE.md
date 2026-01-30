# 番茄钟小程序 - 快速使用指南

## 项目文件改动总结

### ✅ 已实现功能

| 功能 | 实现状态 | 文件 |
|------|---------|------|
| 基础倒计时 25 分钟 | ✓ | pomodoro.js, index.js |
| 开始/暂停/继续/重置 | ✓ | index.js, index.wxml |
| 时间戳精确计时 | ✓ | pomodoro.js |
| 后台恢复正确时间 | ✓ | pomodoro.js |
| 本地存储持久化 | ✓ | pomodoro.js |
| 倒计时完成处理 | ✓ | index.js |
| 震动 + Toast 提示 | ✓ | index.js |
| 完整的 UI 界面 | ✓ | index.wxml, index.wxss |

## 文件列表

### 新增文件
```
miniprogram/utils/pomodoro.js (191 行)
├── 状态机实现
├── 时间戳计算
├── 本地存储管理
└── 导出 6 个 API
```

### 修改文件
```
miniprogram/pages/index/
├── index.js      (110 行) - 完全替换，集成 pomodoro
├── index.wxml    (46 行)  - 完全替换，番茄钟 UI
├── index.json    (2 行)   - 导航栏标题改为"番茄钟"
└── index.wxss    (140 行) - 完全替换，新样式设计
```

## 项目结构
```
miniprogram/
├── app.js                  (不改动)
├── app.json                (不改动)
├── app.wxss                (不改动)
├── envList.js              (不改动)
├── sitemap.json            (不改动)
├── components/
│   └── cloudTipModal/      (不改动)
├── images/                 (不改动)
├── pages/
│   ├── example/            (不改动)
│   └── index/              (✓ 完全改动)
│       ├── index.js        (✓ 新实现)
│       ├── index.json      (✓ 新实现)
│       ├── index.wxml      (✓ 新实现)
│       └── index.wxss      (✓ 新实现)
└── utils/
    └── pomodoro.js         (✓ 新增)
```

## 核心 API 使用示例

```javascript
const pomodoro = require('../../utils/pomodoro');

// 1. 初始化（自动从存储恢复）
pomodoro.init(25 * 60 * 1000);

// 2. 获取快照
const snap = pomodoro.getSnapshot();
console.log(snap);
// {
//   status: 'idle' | 'running' | 'paused',
//   durationMs: 1500000,
//   remainingMs: 1500000,
//   progress: 0,
//   formatted: '25:00',
//   startedAt: null,
//   pausedAt: null,
//   accPausedMs: 0
// }

// 3. 控制流程
pomodoro.start();    // idle → running
pomodoro.pause();    // running → paused
pomodoro.start();    // paused → running (继续)
pomodoro.reset();    // any → idle
```

## 状态转移图
```
    ┌─────────────────────────────────┐
    │                                 │
    ▼                                 │
  [idle] ────────┐                    │
    ▲            │ start()            │
    │            ▼                    │
    │          [running]              │
    │            │     │              │
    │ reset()    │     │ pause()      │
    │            │     ▼              │
    │            │   [paused]         │
    └────────────┤     │              │
                 │     │ start()      │
                 │     └──────────────┘
                 │
            reset()
                 │
                 ▼
            [倒计时完成]
                 │
                 └──► [idle] (自动重置)
```

## 时间计算原理

### 为什么用时间戳差值而不是 setInterval?

1. **精度问题**: setInterval 在后台时不准，手机休眠时会延迟执行
2. **解决方案**: 每次需要剩余时间时，用 `Date.now() - startedAt - accPausedMs` 计算

### 真实剩余时间计算

```javascript
if (running) {
  elapsedMs = now - startedAt - accPausedMs
  remainingMs = durationMs - elapsedMs
}

if (paused) {
  elapsedMs = pausedAt - startedAt - accPausedMs
  remainingMs = durationMs - elapsedMs
}
```

### 关键点
- ✓ 不依赖 setInterval 做计时（只用于 UI 刷新）
- ✓ 暂停时间由 accPausedMs 记录，每次暂停→继续时累加
- ✓ 后台关闭的时间自动被扣除（因为使用的是时间戳差值）

## 边界场景处理

| 场景 | 处理方式 | 结果 |
|------|---------|------|
| 重复点击开始 | start() 检查状态，running 时直接返回 | ✓ 不会重置计时 |
| 暂停切后台再回来 | 状态保存到存储，pausedAt 被保留 | ✓ 时间不变 |
| 计时结束时切后台 | remainingMs 已经是 0，恢复时触发完成逻辑 | ✓ 不丢失完成事件 |
| 进程被杀死后重启 | wx.getStorageSync 恢复完整状态 | ✓ 恢复到正确时间 |
| 重置后切后台 | 清空状态，存储 idle 状态 | ✓ 恢复时显示初始时间 |

## 开发建议

### 修改默认时长
```javascript
// 文件: miniprogram/pages/index/index.js
// 在 onLoad 和 onShow 中修改:
pomodoro.init(10 * 60 * 1000); // 改为 10 分钟
```

### 添加声音提示
```javascript
// 在 index.js 的 _onCountdownComplete() 中添加:
wx.playBackgroundAudio({
  dataUrl: '/path/to/sound.mp3',
});
```

### 添加计时历史记录
```javascript
// 可以在 pomodoro.js 中添加:
const COMPLETED_KEY = 'pomodoro_completed_count';
function recordCompletion() {
  const count = wx.getStorageSync(COMPLETED_KEY) || 0;
  wx.setStorageSync(COMPLETED_KEY, count + 1);
}
// 在页面中调用 pomodoro.getCompletedCount()
```

## 测试方法

### 基础功能测试
1. 点击"开始"，观察计时器倒数
2. 点击"暂停"，计时停止
3. 点击"继续"，从暂停位置继续
4. 点击"重置"，回到 25:00

### 后台恢复测试
1. 点击开始，等待几秒
2. 返回手机首页（切后台）
3. 重新打开小程序（不要杀进程）
4. 验证：时间应该继续倒数，不会重置或跳秒

### 进程杀死恢复测试
1. 点击开始，等待几秒（如 10 秒左右，此时应显示 24:50）
2. 在手机设置中杀死微信进程（或在模拟器中）
3. 重新打开小程序
4. 验证：应该显示接近 24:50 的时间（考虑重新打开时的延迟）

### 边界测试
- 重复快速点击开始按钮 → 应无效
- 暂停状态下点击暂停 → 应无效
- idle 状态下点击继续 → 应显示"开始"

## 常见问题

**Q: 为什么用 wx.getStorageSync 而不是 async?**
A: 简化代码逻辑。小程序的 storage 操作很快，同步 API 足够。

**Q: 为什么计时结束后自动重置而不是进入某个"完成"状态?**
A: 符合番茄钟工作法，一个周期完成后立即可以开始新一轮。可根据需求修改。

**Q: 如何修改界面颜色?**
A: 编辑 `index.wxss`，搜索 `#667eea` 和 `#764ba2` 修改渐变色。

**Q: 如何禁用返回按钮?**
A: 在 `index.json` 中添加:
```json
{
  "navigationBarTitleText": "番茄钟",
  "navigationStyle": "custom"
}
```
然后在 `index.js` 的 `onBackPress` 返回 `true`。

## 验证清单

- [x] 文件结构正确
- [x] 无 JS 语法错误
- [x] 状态机逻辑完整
- [x] 时间计算正确
- [x] 本地存储集成
- [x] UI 显示正常
- [x] 事件处理完善
- [x] 边界情况处理
- [x] 可直接编译运行

---

**项目完成时间**: 2026-01-30
**总计改动**: 5 个文件（1 新增 + 4 修改）
**代码行数**: ~450 行（含注释）
