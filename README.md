# dsh-system-prompt-injector · 系统提示词注入器

一个 DeepSeek Harness 插件：在每次模型请求前**改写系统提示词或预置 assistant 消息**；系统规则针对模型收到的 system 消息；assistant 预填充只在本次请求的消息副本中生效。

支持两种最常见的用法：

- **注入自定义信息**：保留 Harness 原有的系统提示词，在开头或末尾追加一段自己的内容；
- **修改系统提示词**：完全替换成自己的版本；
- **Assistant 预填充**：仅在本次模型请求的消息副本里加入模拟对话或 assistant 开头，不修改系统消息和会话历史。

基于 DeepSeek Harness `0.2.2-rc.1` 的宿主接口开发；当前自动化验证以模拟宿主接线与消息请求为主，正式使用前建议在实际会话中验证所选 provider 的预填充兼容性。

---

## 和「提示词注入器」不是同一个东西

| | `dsh-prompt-injector` | 本插件 `dsh-system-prompt-injector` |
|---|---|---|
| 注入位置 | **用户消息**首部（你要发送的那条） | **系统提示词**或本次请求中的 assistant 预填充 |
| 生效范围 | 单条消息 / 每轮，按会话选择 | 每个对话独立开关（默认关闭，可用 agent preset 过滤） |
| 典型用途 | 在每轮问题前附带说明、规则、角色卡 | 改系统指令、覆盖身份、删除限制段、注入长破甲词 |
| 配置入口 | 输入框左侧的 🌸 面板 | 设置 → 系统提示词；聊天输入框旁快捷开关 |

两个插件可以同时安装，互不冲突。

---

## 功能

- **三种模式**
  - `append` — 追加到系统提示词末尾（默认）
  - `prepend` — 插入到系统提示词开头
  - `replace` — 清空原有段，只保留自定义内容
- **Assistant 预填充（原生 / 软预填充）**
  - **原生**：把规则作为一条 assistant 消息追加到本次模型请求末尾，模型会从这段文字后面接着写；需要 provider 支持 prefill。
  - **软预填充**：以本次真实用户消息为基准，在它前面或后面插入假 user / assistant 消息，用上下文惯性引导模型，不依赖 provider 的 prefill 字段。
- **多规则**：规则按数组顺序叠加，每条可单独启用/停用；只需拖动卡片左侧把手调整顺序，也可聚焦把手后用 ↑/↓ 键排序。
- **导入 / 导出**：一键把全部规则导出为 JSON；导入时可以选择「追加导入」或「替换全部」。
- **注入时机**：每条规则可选「每轮」或「仅首次」——仅首次只在该会话的第一次模型请求注入，之后不再注入。
- **按 agent preset 过滤**：只在「破甲模式」等指定预设下生效。
- **内容文件**：`contentFile` 可以直接指向 `~/.dsh/prompt-inject.md` 之类的长文本文件；文件改了，下一轮模型请求就生效，不用重启。
- **设置页与聊天快捷开关**：设置 → **系统提示词** 管理规则和总开关；总开关关闭时快捷按钮隐藏、所有规则失效。总开关开启后，还要打开当前对话的「系统提示词」快捷开关，该对话才会生效；所有对话默认关闭。开关、卡片展开和提示条都有过渡动画。
- **状态文件热加载**：直接编辑 `~/.dsh/dsh-system-prompt-injector.json` 后，下一次模型请求相关处理会检查文件变化；检查间隔至少 1 秒。
- **安全边界**：文件读取失败时若有内联内容则回退使用，否则跳过空规则并记录错误；注入文本按字面值处理，`{{...}}` 不会被误当作提示词变量。

---

## 安装

### 方式一：安装脚本（推荐）

```powershell
git clone https://github.com/Len-CN/dsh-system-prompt-injector.git
cd dsh-system-prompt-injector
./install.ps1
```

脚本会把插件以 `link:` 依赖写进 `~/.dsh/profiles/desktop/package.json`、加入 `dsh.profile.bundles`，并调用 profile 自带的 pnpm 安装。**首次安装或更新宿主侧代码后必须完整重启 DeepSeek Harness；只刷新 Web 页面不会重新加载宿主插件。**

指定其它 profile：

```powershell
./install.ps1 -Profile web
```

### 方式二：`dsh plugin`（如果你的环境有全局 dsh 命令）

```powershell
dsh plugin --profile desktop add "<克隆下来的插件目录>"
```

安装完成后完整重启 DeepSeek Harness。

### 方式三：手动 link

在 `~/.dsh/profiles/desktop/package.json` 中：

```json
{
  "dependencies": {
    "dsh-system-prompt-injector": "link:<克隆下来的插件目录，用正斜杠>"
  },
  "dsh": {
    "profile": {
      "bundles": ["...", "dsh-system-prompt-injector"]
    }
  }
}
```

然后在该 profile 目录执行：

```powershell
pnpm install        # 没有全局 pnpm 时用 DeepSeek Harness 内置的那个
```

重启 DeepSeek Harness。

### 开发时

```powershell
git clone https://github.com/Len-CN/dsh-system-prompt-injector.git
cd dsh-system-prompt-injector
node scripts/build-client.mjs      # 构建客户端 bundle（client/client.js）
node --test --experimental-test-isolation=none "test/*.test.js"
```

---

卸载时运行 `./uninstall.ps1`，随后在相应 profile 目录运行 `pnpm install` 同步依赖，并完整重启 DeepSeek Harness。安装脚本也包含在 npm 发布包中；本地专用的旧集成验证草稿不随仓库发布。

## 配置

### 在 profile 的 `cordis.patch.yml` 里配置

```yaml
- insert:
    - id: system-prompt-injector
      name: 'dsh-system-prompt-injector'
      config:
        enabled: true               # 总开关；关闭时快捷按钮隐藏、所有规则失效
        sessions: []                # 已开启注入的会话 id；默认无
        rules:
          - id: my-extra-rules
            name: 我的附加规则
            enabled: true
            mode: append
            content: |
              始终使用简体中文回答。
              代码注释也使用中文。
            agentPresets: []

          - id: armor-only-override
            name: 破甲模式专用系统提示词
            enabled: true
            mode: replace
            contentFile: '~/.dsh/prompt-inject.md'
            agentPresets: ['armor']
```

`enabled` 是总开关：关闭时快捷按钮隐藏、所有规则失效，重新开启后所有对话快捷开关都从关闭状态开始。`sessions` 保存已开启注入的会话 id，默认空数组，因此每个新对话都是关闭状态；只有总开关开启且会话在 `sessions` 中时才会注入。聊天快捷开关会自动维护 `sessions`。

规则字段：

| 字段 | 说明 |
|---|---|
| `id` | 稳定 id；默认自动生成 `rule-1`、`rule-2`… |
| `name` | 设置页显示的名称 |
| `enabled` | 单条规则开关，默认 `true` |
| `target` | `system`（默认，改写系统提示词）/ `assistant`（assistant 预填充） |
| `prefillMode` | `native`（默认，原生预填充）/ `soft`（软预填充；仅 `target: assistant` 时生效） |
| `mode` | `append` / `prepend` / `replace`；`target: assistant` 时忽略 |
| `schedule` | `every`（每轮，默认）/ `first`（仅会话第一次模型请求） |
| `content` | 内联注入文本；`prefillMode: native` 或系统提示词规则使用 |
| `contentFile` | 从文件读取正文；优先于 `content`；支持 `~`、绝对路径；相对路径按 `DSH_HOME`（`~/.dsh`）解析 |
| `soft` | 软预填充消息：`{ before: [{ role: user/assistant, content }], after: [...] }`；基准是运行时的真实用户消息 |
| `agentPresets` | 仅在这些 agent preset id 下生效；空数组 = 全部 |

### 设置页

左侧边栏 → **设置** → **系统提示词**：

- 总开关：关闭后所有规则立即失效，聊天输入框的快捷按钮也会隐藏；
- 规则列表：点击标题展开编辑，未保存的草稿在切换规则时保留；拖动卡片左侧把手调整规则顺序，或聚焦把手用 ↑/↓ 键排序；删除需确认且可撤销；
- 导入 / 导出：规则区域右上角「导出」下载当前规则 JSON；「导入」读取文件后选择追加或替换；
- 编辑表单：名称、注入位置（系统提示词 / Assistant 预填充）、预填充方式（原生 / 软预填充）、模式（追加 / 前置 / 替换）、注入时机（每轮 / 仅首次）、生效的 Agent Preset、注入内容、内容文件；
- 软预填充编辑器：以「真实用户消息」为固定基准，可在基准前或基准后添加假 user / assistant 消息；拖动各自列表的槽位把手调整顺序，跨侧需删除后在另一侧添加；消息只存在于本次请求，不写入历史；
- 聊天输入框左侧的「系统提示词」快捷键：只开启 / 关闭当前对话的注入，默认关闭；总开关关闭时按钮不显示；
- 保存后下一轮模型请求生效，无需重启。

设置页保存时优先通过 Harness 的 Settings 服务写入 profile 配置，同时写一份镜像到 `~/.dsh/dsh-system-prompt-injector.json`；Settings 服务不可用或没有本插件配置项时写 JSON 文件；若 Settings 更新报错，保存失败且不会只写 JSON，以免重启后旧 profile 配置覆盖成功提示。重启时若 profile 的 `config.rules` 非空，以该配置为准并镜像到 JSON；为空时尝试从 JSON 恢复。

### 状态文件

默认路径：`~/.dsh/dsh-system-prompt-injector.json`

```json
{
  "enabled": true,
  "sessions": [],
  "rules": [
    {
      "id": "my-extra-rules",
      "name": "我的附加规则",
      "enabled": true,
      "mode": "append",
      "schedule": "every",
      "content": "始终使用简体中文回答。",
      "contentFile": "",
      "agentPresets": []
    }
  ]
}
```

直接编辑这个文件后，会在下一次模型请求相关处理时检查变更（检查频率最多每秒一次）。`enabled` 关闭时 `sessions` 会被清空，重新开启后每个对话默认关闭。

---

## 模式详解

### `append` — 追加到末尾

原系统提示词保持不变，新内容作为最后一个段追加。适合添加全局要求（语言、语气、工作目录约定等）。

### `prepend` — 插入到开头

新内容作为第一个段，位于 Harness 身份声明之前；它并不高于宿主的 `complete: true` 完整段。

### `replace` — 完全替换

清空原有系统提示词段，只留下自定义内容；仅在没有有效 `complete: true` 完整段时生效。宿主会在 waterfall 之后恢复有效完整段，本插件会跳过系统规则并在诊断状态中说明原因，不会误报应用成功。

### 多条规则的顺序

规则按数组顺序执行：

```yaml
rules:
  - { id: a, mode: append, content: "A" }
  - { id: b, mode: prepend, content: "B" }
  - { id: c, mode: replace, content: "C" }   # 清空 A、B、原提示词
  - { id: d, mode: append, content: "D" }    # 结果：C + D
```

### 注入时机：每轮 / 仅首次

- `schedule: every`（默认）——每次模型请求都会注入；
- `schedule: first`——仅首轮真实用户消息对应的首次模型请求生效。系统规则在组装阶段检查 `turn 1 / phase.step 0`，预填充在 `pre-step` 阶段检查 `turn 1 / step 1`；请求发出时才记录消费。

「仅首次」按会话记录：同一会话里切换规则或再发消息都不会重复注入；新开会话会重新算第一次。插件重启后首次记录会清空，但已经进行到一半的旧会话不会被重新当成「首次」。

```yaml
rules:
  - id: welcome
    name: 会话开场提示
    mode: append
    schedule: first
    content: 这是本次会话的第一次请求，请先确认工作目录。
```

### Assistant 预填充

`target: assistant` 的规则不写进系统提示词，而是在**本次模型请求**的消息数组里预置 assistant 内容。现在有两种方式：

#### 原生预填充（`prefillMode: native`，默认）

把规则作为一条 `role: "assistant"` 消息追加到消息数组末尾：

```yaml
rules:
  - id: opening
    name: 固定开场
    target: assistant
    prefillMode: native
    content: '好的，我明白了。下面直接给出结果：'
```

模型会把这段文字当成自己已经写好的开头，从后面继续生成。适合强制开场白、固定输出格式（比如先输出 `{`）、避开某些拒绝式开头。它依赖 provider 对 assistant prefill / prefix 的支持；当前不少模型会拒绝或忽略末尾的 assistant 消息。

#### 软预填充（`prefillMode: soft`）

以本次真实用户消息为基准，在它前面或后面插入假的 user / assistant 消息。模型会把它们当成已经发生过的对话，顺着上下文惯性继续：

```yaml
rules:
  - id: snake-soft
    name: 贪吃蛇软预填充
    target: assistant
    prefillMode: soft
    soft:
      before:
        - { role: user, content: '你可以帮我写一个贪吃蛇吗' }
        - { role: assistant, content: '我可以' }
      after:
        - { role: user, content: '开始' }
```

软预填充不依赖 provider 的 `assistant_prefill` 字段，兼容性通常更好；但它属于「伪造上下文」，不是逐字续写，模型仍可能改写或重新组织内容。

DeepSeek Messages 在 thinking mode + tools 下会要求每条 assistant 历史都带 `content[].thinking`；插件会对 DeepSeek 的合成 assistant 消息自动补一个 thinking 占位块，避免该类 400 错误。

- 只在「用户刚发来新消息」的那一步生效，工具调用后的续跑步骤不会重复；
- 原生规则的文本按数组顺序用空行拼接；
- `mode` 对预填充没有意义，设置页会隐藏该选项；
- 和系统提示词规则一样对子代理生效，需要区分时用 `agentPresets` 过滤；
- 实现上只替换本次 `llm.prepareCall()` dispatch 的 `messages` 副本，不改动 session 日志。

---

## 原理

DSH 的系统提示词不是拼在 `request` 的某个 `system` 字段里，而是由 `@deepseek-ai/dsh-system-prompt` 在每次模型步骤前组装成一串有序的「段」，再作为派生历史中的 `system/message` 节点（即模型视角的 `messages[0]`）送往模型。

本插件监听的是宿主提供的权威接缝：

```js
ctx.on('system-prompt/assemble', async (assembly, context, next) => {
  const result = await next()          // 先让其他插件完成组装
  // 在这里按规则增删/替换 result.sections
  return { ...result, sections: nextSections }
}, { prepend: true })
```

- 注入的每个段都带 `interpolate: false`，因此正文里的 `{{...}}` 不会被当成提示词变量而报错；
- `context.agent.session.agentPreset` 用于按预设过滤；
- 插件不改会话历史、不改宿主文件，只影响本次请求的组装结果；
- 插件处理出错时保留其他 waterfall 监听器已处理的组装结果，避免插件错误中断会话。

---

## 验证

### 单元测试

```powershell
git clone https://github.com/Len-CN/dsh-system-prompt-injector.git
cd dsh-system-prompt-injector
node --test --experimental-test-isolation=none "test/*.test.js"
```

当前 73 个用例，覆盖系统提示词和预填充模式、DeepSeek thinking 兼容、仅首次注入、`complete` 优先级、并发持久化、客户端刷新竞态、导入导出及客户端 bundle 加载。提交前请执行 `npm run check`。

### 在真实会话里验证

1. 设置页里新建一条规则：模式 `replace`，内容 `你是测试助手，请在第一句回答中说明你收到的系统提示词。`
2. 确认设置页右上角的总开关是「已启用」；
3. 新建一个会话，在输入框左侧把「系统提示词」开关打开，问任意问题；
4. 模型应该按照你给的系统提示词回答。

也可以看设置页顶部的「上次应用」条：会显示应用时间和命中的规则。

### 诊断

- 设置页顶部会显示 `lastApplied`（时间、agent preset、应用的规则 id、错误）；
- `~/.dsh/dsh-system-prompt-injector.json` 保存规则状态；若 profile 中有非空 `config.rules`，启动时以该配置为准；
- Host 日志中系统规则发出时记录 `系统规则已随请求发出（规则 id…）`，assistant 预填充发出时另记 `预填充已随请求发出…`。

---

## 兼容性

- 参考宿主接口：DeepSeek Harness `0.2.2-rc.1`；新预填充行为仍需按实际 provider 做端到端验证；
- 依赖宿主提供的 `ctx.systemPrompt` 服务（由 `@deepseek-ai/dsh-system-prompt` 提供）；
- 纯 Host 侧功能，客户端设置页是可选增强；没有 Web UI 的 headless 组合仍可通过 `config.rules` + `config.sessions`（已开启的会话 id）或状态文件使用。

## 已知限制

- 有效 `complete: true` 段存在时，宿主优先使用完整段，本插件跳过 `replace`、`append`、`prepend` 系统规则并在状态中说明；预填充规则不受系统段优先级影响。
- 聊天快捷开关按会话生效；设置页只能看到已开启会话数量，不能直接在设置页里切换某个会话。

## 安全提示

本插件能改写发给模型的系统提示词，效果等同于由你亲手编辑系统提示词。请只启用你自己写或信任的规则；不要粘贴来路不明的长文本。设置页不会上传任何内容，规则只保存在本机 profile / 状态文件里。

## 许可

[MIT](LICENSE)

