# 工业级番茄钟倒计时核心 - 实现说明

## 实现完成 ✓

### 新增文件

#### 1. **miniprogram/utils/pomodoro.js**
- **作用**: 番茄钟倒计时状态机核心模块
- **核心特性**:
  - 基于时间戳差值计时（防止后台计时不准）
  - 完整的状态管理: `idle` → `running` → `paused` → 循环
  - 自动恢复功能：进程杀死后重启能恢复到正确的剩余时间
  - 本地存储持久化（wx.setStorageSync / wx.getStorageSync）
  
- **导出 API**:
  - `init(durationMs)` - 初始化，传入时长（ms），自动从存储恢复状态
  - `start()` - 从 idle/paused 开始运行
  - `pause()` - 暂停运行
  - `reset()` - 重置为 idle 状态
  - `getSnapshot()` - 获取当前状态快照（含 formatted 时间、progress 进度等）
  - `clearStorage()` - 清除本地存储

- **内部状态**:
  ```javascript
  {
    status: 'idle' | 'running' | 'paused',
    durationMs: number,           // 初始时长（ms）
    startedAt: number | null,     // 运行开始时刻（时间戳ms）
    pausedAt: number | null,      // 暂停开始时刻（时间戳ms）
    accPausedMs: number,          // 累计暂停时长（ms）
    lastSavedAt: number | null,   // 最后保存时刻
  }
  ```

### 修改文件

#### 2. **miniprogram/pages/index/index.js**
- **变更**: 完全替换为番茄钟实现
- **功能**:
  - 页面加载时初始化番茄钟（默认25分钟）
  - onShow 时启动 300ms 的 setInterval（仅用于 UI 刷新，不是计时来源）
  - onHide/onUnload 时清理定时器（状态自动保存到本地存储）
  - 监听倒计时完成：remainingMs ≤ 0 时触发
  - 完成时：触发震动 + toast 提示 + 自动重置

- **事件处理**:
  - `onStartClick()` - 开始/继续按钮
  - `onPauseClick()` - 暂停按钮
  - `onResetClick()` - 重置按钮
  - `_updateDisplay()` - 从 pomodoro 获取快照并更新 UI
  - `_onCountdownComplete()` - 倒计时完成处理

#### 3. **miniprogram/pages/index/index.wxml**
- **变更**: 完全替换为番茄钟 UI
- **布局**:
  - 标题: "番茄钟"
  - 大号倒计时显示 (mm:ss 格式)
  - 进度条（线性显示）
  - 状态文本（准备就绪 / 专注中 / 已暂停）
  - 按钮组:
    - 开始/继续 (条件显示：status !== 'running')
    - 暂停 (条件显示：status === 'running')
    - 重置 (始终显示)

#### 4. **miniprogram/pages/index/index.json**
- **变更**: 导航栏标题改为 "番茄钟"
- **移除**: 之前的 cloudTipModal 组件依赖

#### 5. **miniprogram/pages/index/index.wxss**
- **变更**: 完全替换为番茄钟样式
- **设计**:
  - 渐变背景 (紫色系)
  - 大号计时文字 (180rpx)
  - 进度条可视化
  - 按钮交互反馈 (active 状态、缩放效果)
  - 完全垂直居中布局

## 核心实现细节

### 时间计算精度
真实剩余时间计算公式：
```
remainingMs = durationMs - (now - startedAt - accPausedMs - (paused ? 0 : (now - pausedAt)))
```

- **now**: 当前时间戳 (Date.now())
- **startedAt**: 开始运行时的时间戳
- **accPausedMs**: 累计暂停时长
- **pausedAt**: 如果当前是暂停状态，从 pausedAt 开始的暂停时长

这样保证：
- ✓ 后台杀进程后重新打开，能恢复到正确时间
- ✓ setInterval 500ms 或更长不会导致跳秒
- ✓ 不依赖 setInterval 做计时（仅用于 UI 刷新）

### 边界处理
- **重复点击开始**: 在 running 状态时再点击 start() 会直接返回，不会重置 startedAt
- **暂停切后台**: 状态已保存到存储，pausedAt 被保留
- **重置后切后台**: idle 状态下的存储结构清晰，恢复时直接显示初始时间
- **计时结束瞬间切后台**: remainingMs 已经是 0，重新打开会触发倒计时完成逻辑

### 存储设计
- 使用单一键 `pomodoro_state` 存储完整状态对象
- wx.setStorageSync 在每次状态变更时调用
- 不需要手动清理（除非调用 clearStorage()）

## 测试检查表

- [ ] 点击"开始"，倒计时正常运行（每300ms刷新UI）
- [ ] 点击"暂停"，倒计时停止（显示"已暂停"）
- [ ] 点击"继续"（从暂停状态），倒计时继续（时间从暂停位置继续）
- [ ] 点击"重置"，回到 25:00，状态为"准备就绪"
- [ ] 运行中切后台再回来，时间正确（不丢秒、不跳秒）
- [ ] 倒计时到 00:00 时，触发震动 + toast + 自动重置
- [ ] 重复点击"开始"按钮，不会导致倒计时重置
- [ ] 暂停后切后台，再回来时仍为暂停状态且时间不变

## 使用方式

在微信开发者工具直接编译运行项目，首页会显示番茄钟。

配置默认时长：修改 `miniprogram/pages/index/index.js` 中 `onLoad()` 的参数即可，例如：
```javascript
pomodoro.init(10 * 60 * 1000); // 改为10分钟
```
