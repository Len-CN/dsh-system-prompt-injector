# AGENTS.md — dsh-system-prompt-injector

## 项目定位

DeepSeek Harness（DSH）Web 插件：在每次模型请求前注入自定义系统提示词，或向本次请求预置 assistant 内容。

核心能力：

- 系统提示词：`append` / `prepend` / `replace`
- Assistant 预填充：`native`（原生）/ `soft`（软预填充）
- 规则按列表顺序生效，支持按 agent preset 过滤
- 设置页可视化编辑：软预填充消息槽、规则拖拽排序、导入 / 导出
- 规则持久化到 DSH Settings / `~/.dsh/dsh-system-prompt-injector.json`

当前版本：`0.6.0`

## 目录结构

```text
lib/
  core.js       纯逻辑：规则规范化、系统提示词应用、摘要
  prefill.js    Assistant 预填充：原生消息、软预填充消息槽、thinking 兼容
  index.js      Cordis 接线：system-prompt/assemble、agent/pre-step、llm.prepareCall
  store.js      规则状态与文件持久化
  http.js       设置页 HTTP 接口
  config.js     Config schema
client/
  index.js      设置页 + 聊天快捷开关
  src/store.js  客户端状态、plainRule、导入导出解析
  src/styles.js 内联 CSS
  client.js     构建产物（由 scripts/build-client.mjs 生成）
test/           node:test 测试
scripts/build-client.mjs  无打包器的客户端构建脚本
```

## 开发命令

所有命令在 `dsh-system-prompt-injector` 目录下执行：

```powershell
node scripts/build-client.mjs
node --test --experimental-test-isolation=none "test/*.test.js"
npm run check
```

修改 `client/index.js`、`client/src/store.js` 或 `client/src/styles.js` 后，必须重新执行 `node scripts/build-client.mjs`，并提交/保留更新后的 `client/client.js`。

## 关键实现约定

- 用户可见文案、代码注释、测试名称使用中文；代码标识符保持项目现有命名风格。
- 客户端不使用 JSX、不使用打包器；`client/index.js` 只用 `createElement`，由 `scripts/build-client.mjs` 生成 lazy-CJS bundle。
- 系统提示词规则只在 `system-prompt/assemble` 中处理；assistant 预填充规则不进入 `applyRules()`。
- 总开关 `enabled`（默认 `true`）关闭时所有规则失效，聊天输入框的快捷按钮也要隐藏；关闭总开关时清空 `sessions`，重新开启后所有对话快捷开关默认关闭。
- 只有总开关 `enabled === true` 且当前 `sessionId` 在 `sessions` 中时，该对话才注入；聊天快捷开关只修改当前会话的 `sessionEnabled`，不要顺带提交 `rules`。
- 预填充消息只在调用 `prepared.stream(options)` 时进入本次请求的 `options.messages` 副本，绝不能写进 session 日志或真实会话历史。
- `agent/pre-step` 只在真实用户消息（`source.kind === 'user'`）的步骤计算预填充；工具续跑步骤不重复注入。
- `schedule: 'first'` 的系统规则在 assemble 阶段要求 phase 为 running 且 turn=1、phase.step=0；assistant 预填充在真实用户消息的 pre-step 阶段要求 turn=1、step=1；均在请求开始分派后才标记消费，避免老会话误判为首次。
- 软预填充以真实用户消息为基准：`before` 消息插到它前面，`after` 消息跟在它后面；实际发送时把真实用户消息连同软消息移到请求末尾，避免运行时上下文夹在中间。
- 原生 / 软预填充的合成 assistant 消息在 DeepSeek provider 下必须带 `reasoning` 占位块，`dsh-llm-deepseek` 会序列化为 `content[].thinking`；不要在未验证的情况下移除。
- 规则顺序就是数组顺序；拖拽排序保存的是整个规则数组顺序。
- 软预填充槽位的 FLIP 动画只用于同批节点重排；新增 / 删除节点时跳过位移动画，避免长列表上下闪。
- 设置页点击规则标题可展开；未修改时再次点击同一标题收起，有未保存修改时不要丢弃 draft。
- 导入导出格式为 JSON；导入支持裸数组和 `{ rules: [...] }`，追加导入遇到重复 id 时自动改名。
- 默认不要执行 `git push`，除非用户明确要求。发布前先确认测试和客户端构建通过。

## 验证要求

提交前至少运行：

```powershell
node scripts/build-client.mjs
node --test --experimental-test-isolation=none "test/*.test.js"
```

宿主侧代码改动需要完整重启 DSH 才会生效；只刷新 Web 页面只会重新加载客户端 bundle。
