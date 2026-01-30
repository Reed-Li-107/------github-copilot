# GitHub Copilot 指令 — 番茄闹钟（微信小程序）

目标：让 AI 代码助手（Copilot 风格 agent）快速理解本仓库的架构、关键惯例与常用开发/部署流程，能在不问太多背景的情况下安全修改、扩展和调试代码。

关键概览
- 项目类型：微信小程序（前端） + 云开发云函数（后端）
- 主要目录：`miniprogram/`（小程序源码），`cloudfunctions/quickstartFunctions/`（云函数），辅助脚本：`uploadCloudFunction.sh`
- 运行时要点：小程序需在微信开发者工具中运行；云能力基于 `wx-server-sdk`（见 `cloudfunctions/quickstartFunctions/package.json`）

大体架构与数据流
- 前端（`miniprogram/`）负责 UI 与本地状态，页面入口在 `miniprogram/app.js`（注意：`globalData.env` 决定云环境）。
- 计时逻辑集中在 `miniprogram/utils/pomodoro.js`：一个基于时间戳的状态机（`status`、`startedAt`、`pausedAt`、`accPausedMs`），本地存储键为 `'pomodoro_state'`。修改倒计时逻辑应首选在此文件。
- 后端（云函数）集中在 `cloudfunctions/quickstartFunctions/index.js`：单入口 `exports.main` 使用 `switch(event.type)` 路由到各处理器（如 `getOpenId`、`getMiniProgramCode`、`createCollection` 等）。新增功能一般：在该文件新增 helper 函数并在 `switch` 中增加 `case`。
- 数据存储：使用云数据库 API（`db.collection(...).get()/add()/update()/remove()`），示例集合名 `sales` 在例子中出现。

项目约定与可复用模式（从代码可观察）
- 状态与存储：`pomodoro` 使用单个 storage key `pomodoro_state`，所有页面通过导入 `miniprogram/utils/pomodoro.js` 查询与控制。
- 云函数设计：函数内不要假设前端会传完整对象；现有实现把业务动作通过 `event.type` 字符串驱动。请保持这种「命令式类型+payload」模式以兼容现有调用。例：

  - 调用示例（前端）：
    ```js
    wx.cloud.callFunction({
      name: 'quickstartFunctions',
      data: { type: 'insertRecord', data: { region:'华东', city:'上海', sales:11 } }
    })
    ```

- 错误/成功返回：云函数多数返回 { success: true/false, data?, errMsg? }，修改时保留该返回习惯。

部署与日常开发流程（可直接执行的步骤）
- 在微信开发者工具中打开 `miniprogram/`，确保基础库版本 >= 2.2.3（在 `miniprogram/app.js` 有检测）。
- 配置云环境：将 `miniprogram/app.js` 中的 `globalData.env` 填为你的云环境 ID，或维护 `envList.js`（仓库包含该文件以供不同环境管理）。
- 部署云函数：仓库提供 `uploadCloudFunction.sh`（模板命令示例）：

  ```bash
  ${installPath} cloud functions deploy --e ${envId} --n quickstartFunctions --r --project ${projectPath}
  ```

  - 说明：脚本使用平台 CLI 模板变量；在 Windows 下可用 Git Bash / WSL 执行，或直接在云函数控制台上传/部署。

修改/扩展建议（具体、可执行）
- 新增页面或组件：在 `miniprogram/pages/` 添加目录并在 `miniprogram/app.json` 的 `pages` 列表中注册（当前含 `pages/index/index` 与 `pages/example/index`）。
- 修改倒计时行为：编辑 `miniprogram/utils/pomodoro.js`，注意保存/恢复逻辑（`_saveState` 使用 `wx.setStorageSync`）。若改 storage key，请同步更新所有引用页面。
- 添加云函数 action：在 `cloudfunctions/quickstartFunctions/index.js` 新增内部函数并在 `exports.main` 的 `switch` 中添加 `case 'yourAction'`，并且返回标准响应对象以兼容前端处理。

安全与约束（为 AI 代理提供界限）
- 不要更改云环境 ID（`globalData.env`）或删除 `uploadCloudFunction.sh`，除非用户明确要求。若需临时调试，请在本地复制并注明为临时改动。
- 避免在云函数中引入大型第三方依赖；`package.json` 仅声明 `wx-server-sdk`。如确需新增依赖，先告知并更新 `package.json`。

常见快速参考（来自仓库）
- 小程序入口：`miniprogram/app.js`
- 计时工具：`miniprogram/utils/pomodoro.js`（主要变更点）
- 云函数入口：`cloudfunctions/quickstartFunctions/index.js`
- 云函数依赖：`cloudfunctions/quickstartFunctions/package.json`
- 部署脚本：`uploadCloudFunction.sh`

如果你需要我把这些点直接写入仓库（已准备好进行提交），或希望我补充具体的代码片段/测试用例，请告诉我想要优先修改的部分。也请指出是否需要我把 `globalData.env` 占位符替换为实际 env id（这会修改 `miniprogram/app.js`）。
