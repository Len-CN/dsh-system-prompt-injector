# dsh-system-prompt-injector · 系统提示词注入器

一个 [DeepSeek Harness](https://deepseek.com/harness/) Web 插件：在每次模型请求前**改写系统提示词**——也就是模型收到的 `messages[0]`（`role: "system"`）。

支持两种最常见的用法：

- **注入自定义信息**：保留 Harness 原有的系统提示词，在开头或末尾追加一段自己的内容；
- **修改系统提示词**：完全替换成自己的版本。

在 DeepSeek Harness `0.2.2-rc.1` 上开发和验证。

---

## 和「提示词注入器」不是同一个东西

| | `dsh-prompt-injector` | 本插件 `dsh-system-prompt-injector` |
|---|---|---|
| 注入位置 | **用户消息**首部（你要发送的那条） | **系统提示词**（`messages[0]`, role=system） |
| 生效范围 | 单条消息 / 每轮，按会话选择 | 整个 profile 的所有会话（可用 agent preset 过滤） |
| 典型用途 | 在每轮问题前附带说明、规则、角色卡 | 改系统指令、覆盖身份、删除限制段、注入长破甲词 |
| 配置入口 | 输入框左侧的 🌸 面板 | 设置 → 系统提示词；聊天输入框旁快捷开关 |

两个插件可以同时安装，互不冲突。

---

## 功能

- **三种模式**
  - `append` — 追加到系统提示词末尾（默认）
  - `prepend` — 插入到系统提示词开头
  - `replace` — 清空原有段，只保留自定义内容
- **多规则**：规则按数组顺序叠加，每条可单独启用/停用。
- **注入时机**：每条规则可选「每轮」或「仅首次」——仅首次只在该会话的第一次模型请求注入，之后不再注入。
- **按 agent preset 过滤**：只在「破甲模式」等指定预设下生效。
- **内容文件**：`contentFile` 可以直接指向 `~/.dsh/prompt-inject.md` 之类的长文本文件；文件改了，下一轮模型请求就生效，不用重启。
- **设置页与聊天快捷开关**：设置 → **系统提示词** 管理规则；聊天输入框左侧的「系统提示词」小开关可一键开启/关闭注入。开关、卡片展开和提示条都有过渡动画。
- **状态文件热加载**：直接编辑 `~/.dsh/dsh-system-prompt-injector.json` 也会在 1 秒内生效。
- **安全边界**：注入失败的规则会被跳过并记录错误，不会破坏本轮会话；注入文本按字面值处理，`{{...}}` 不会被误当作提示词变量。

---

## 安装

### 方式一：安装脚本（推荐）

```powershell
cd "C:/Users/lingcy/Documents/DSH/提示词注入/dsh-system-prompt-injector"
./install.ps1
```

脚本会把插件以 `link:` 依赖写进 `~/.dsh/profiles/desktop/package.json`、加入 `dsh.profile.bundles`，并调用 profile 自带的 pnpm 安装。完成后重启 DeepSeek Harness（或刷新 Web GUI）。

指定其它 profile：

```powershell
./install.ps1 -Profile web
```

### 方式二：`dsh plugin`（如果你的环境有全局 dsh 命令）

```powershell
dsh plugin --profile desktop add "C:/Users/lingcy/Documents/DSH/提示词注入/dsh-system-prompt-injector"
```

然后重启 profile（或刷新 Web GUI）。

### 方式三：手动 link

在 `~/.dsh/profiles/desktop/package.json` 中：

```json
{
  "dependencies": {
    "dsh-system-prompt-injector": "link:C:/Users/lingcy/Documents/DSH/提示词注入/dsh-system-prompt-injector"
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
node "C:/Users/lingcy/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/pnpm/bin/pnpm.cjs" install
```

重启 DeepSeek Harness。

### 开发时

```powershell
cd "C:/Users/lingcy/Documents/DSH/提示词注入/dsh-system-prompt-injector"
node scripts/build-client.mjs      # 构建设置页
node --test --experimental-test-isolation=none "test/*.test.js"   # 跑测试
```

---

## 配置

### 在 profile 的 `cordis.patch.yml` 里配置

```yaml
- insert:
    - id: system-prompt-injector
      name: 'dsh-system-prompt-injector'
      config:
        enabled: true
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

规则字段：

| 字段 | 说明 |
|---|---|
| `id` | 稳定 id；默认自动生成 `rule-1`、`rule-2`… |
| `name` | 设置页显示的名称 |
| `enabled` | 单条规则开关，默认 `true` |
| `mode` | `append` / `prepend` / `replace` |
| `schedule` | `every`（每轮，默认）/ `first`（仅会话第一次模型请求） |
| `content` | 内联注入文本 |
| `contentFile` | 从文件读取正文；优先于 `content`；支持 `~`、绝对路径；相对路径按 `DSH_HOME`（`~/.dsh`）解析 |
| `agentPresets` | 仅在这些 agent preset id 下生效；空数组 = 全部 |

### 设置页

左侧边栏 → **设置** → **系统提示词**：

- 总开关：关掉后所有规则立即失效（配置保留）；
- 规则列表：点击规则展开编辑；每张卡片显示启用状态、模式、字符数和内容预览；
- 编辑表单：名称、模式（追加 / 前置 / 替换）、注入时机（每轮 / 仅首次）、生效的 Agent Preset、注入内容、内容文件；
- 聊天输入框左侧的「系统提示词」快捷键：一键开启 / 关闭注入，不用进设置页；
- 保存后下一轮模型请求生效，无需重启。

设置页的写入优先通过 Harness 的 Settings 服务落到该 profile 的 `cordis.patch.yml`（当该服务能定位到本插件时），同时写一份镜像到 `~/.dsh/dsh-system-prompt-injector.json`；否则直接写 JSON 文件。两种情况下重启后都会从 JSON 文件恢复规则。

### 状态文件

默认路径：`~/.dsh/dsh-system-prompt-injector.json`

```json
{
  "enabled": true,
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

直接编辑这个文件后，最多 1 秒内会被热加载；下一轮模型请求生效。

---

## 模式详解

### `append` — 追加到末尾

原系统提示词保持不变，新内容作为最后一个段追加。适合添加全局要求（语言、语气、工作目录约定等）。

### `prepend` — 插入到开头

新内容作为第一个段，位于 harness 身份声明之前。适合放最高优先级的指令。

### `replace` — 完全替换

清空原有所有系统提示词段，只留下自定义内容。**这是最强的修改方式**：`messages[0]` 只剩你写的内容。

> 如果组合中还有其他插件注册了 `complete: true` 的段，宿主会在 waterfall 之后强制用该段覆盖整套提示词，`replace` 的结果会被它盖掉。

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
- `schedule: first`——只在当前**会话的第一次模型请求**注入一次，之后该会话不再注入。

「仅首次」按会话记录：同一会话里切换规则或再发消息都不会重复注入；新开会话会重新算第一次。插件重启后首次记录会清空。

```yaml
rules:
  - id: welcome
    name: 会话开场提示
    mode: append
    schedule: first
    content: 这是本次会话的第一次请求，请先确认工作目录。
```

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
- 出错时回退到原始 assembly，保证会话不中断。

---

## 验证

### 单元测试

```powershell
cd "C:/Users/lingcy/Documents/DSH/提示词注入/dsh-system-prompt-injector"
node --test --experimental-test-isolation=none "test/*.test.js"
```

当前 21 个用例，覆盖三种模式、每轮/仅首次时机、多规则顺序、agentPreset 过滤、文件热读取、错误回退和 Host 接线，外加客户端 bundle 的加载冒烟测试。

### 在真实会话里验证

1. 设置页里新建一条规则：模式 `replace`，内容 `你是测试助手，请在第一句回答中说明你收到的系统提示词。`
2. 保存，然后新建一个会话，问任意问题；
3. 模型应该按照你给的系统提示词回答。

也可以看设置页顶部的「上次应用」条：会显示应用时间和命中的规则。

### 诊断

- 设置页顶部会显示 `lastApplied`（时间、agent preset、应用的规则 id、错误）；
- `~/.dsh/dsh-system-prompt-injector.json` 是当前规则的镜像；
- Host 日志里会打印 `[system-prompt-injector] 已应用 N 条规则…`。

---

## 兼容性

- 开发验证版本：DeepSeek Harness `0.2.2-rc.1`；
- 依赖宿主提供的 `ctx.systemPrompt` 服务（由 `@deepseek-ai/dsh-system-prompt` 提供）；
- 纯 Host 侧功能，客户端设置页是可选增强；没有 Web UI 的 headless 组合仍可通过 `config.rules` / 状态文件使用。

## 已知限制

- `complete: true` 段存在时，`replace`/`append` 的结果会被宿主强制覆盖（这是宿主的语义，不是本插件能绕过的）。
- 设置页目前不提供「仅当前会话生效」的开关；需要会话级隔离时请用 `agentPresets` 或改用 `dsh-prompt-injector` 的消息级注入。

## 安全提示

本插件能改写发给模型的系统提示词，效果等同于由你亲手编辑系统提示词。请只启用你自己写或信任的规则；不要粘贴来路不明的长文本。设置页不会上传任何内容，规则只保存在本机 profile / 状态文件里。

