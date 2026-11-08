/**
 * 宿主接线测试：用最小 Cordis 上下文桩验证 `apply()` 的行为。
 */

import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { apply } from '../lib/index.js'
import { RuleStore, readStateFile } from '../lib/store.js'

/**
 * 最小 Cordis 上下文桩：只实现本插件用到的 on / effect / get / inject / logger。
 * @param {{ webServer?: object, settings?: object }} [services]
 */
function createMockCtx(services = {}) {
  services.systemPrompt ??= { layers: { merge: () => new Map() } }
  /** @type {Array<{ name: string, callback: Function, prepend: boolean }>} */
  const listeners = []
  const disposed = []
  const ctx = {
    logger: { info() {}, warn() {} },
    on(name, callback, options) {
      listeners.push({ name, callback, prepend: options?.prepend === true })
      return () => {}
    },
    effect(factory) {
      const dispose = factory()
      if (typeof dispose === 'function') disposed.push(dispose)
      return () => {}
    },
    get(name) {
      return services[name]
    },
    inject(names, callback) {
      callback()
    },
  }
  return {
    ctx,
    listeners,
    services,
    /** 模拟一次 waterfall：按 prepend 优先、其余按注册顺序执行。 */
    async fireWaterfall(name, payload, context) {
      const chain = [
        ...listeners.filter((item) => item.name === name && item.prepend),
        ...listeners.filter((item) => item.name === name && !item.prepend),
      ]
      const inner = async () => payload
      let index = 0
      const dispatch = async () => {
        const item = chain[index++]
        if (item === undefined) return inner()
        return item.callback(payload, context, () => dispatch())
      }
      return dispatch()
    },
    /** 模拟 agent/pre-step：宿主签名是 (payload, next)。 */
    async fireAgentWaterfall(name, payload) {
      const chain = [
        ...listeners.filter((item) => item.name === name && item.prepend),
        ...listeners.filter((item) => item.name === name && !item.prepend),
      ]
      let index = 0
      const dispatch = async () => {
        const item = chain[index++]
        if (item === undefined) return payload
        return item.callback(payload, () => dispatch())
      }
      return dispatch()
    },
    disposeAll() {
      for (const dispose of disposed) dispose()
    },
  }
}

/** 最小 assembly。 */
function makeAssembly(texts = ['原始系统提示词']) {
  return { sections: texts.map((text, index) => ({ name: `origin:${index}`, text })), contexts: [], variables: {} }
}

test('readStateFile：总开关关闭时清空会话开关', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-store-'))
  const file = join(dir, 'state.json')
  try {
    writeFileSync(file, JSON.stringify({ enabled: true, sessions: ['s1'], rules: [] }), 'utf8')
    const state = await readStateFile(file)
    assert.equal(state.enabled, true)
    assert.deepEqual(state.sessions, ['s1'])

    writeFileSync(file, JSON.stringify({ enabled: false, sessions: ['s1'], rules: [] }), 'utf8')
    const hidden = await readStateFile(file)
    assert.equal(hidden.enabled, false)
    assert.deepEqual(hidden.sessions, [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('旧状态文件缺少总开关字段时默认保持启用', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-legacy-'))
  const file = join(dir, 'state.json')
  try {
    writeFileSync(file, JSON.stringify({ sessions: ['s1'], rules: [{ id: 'old', content: '旧内容' }] }), 'utf8')
    const state = await readStateFile(file)
    assert.equal(state.enabled, true)
    assert.deepEqual(state.sessions, ['s1'])
    writeFileSync(file, JSON.stringify({ showComposerToggle: false, sessions: ['s1'], rules: [] }), 'utf8')
    const off = await readStateFile(file)
    assert.equal(off.enabled, false)
    assert.deepEqual(off.sessions, [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('RuleStore：更新已有规则保留原顺序，新增规则追加', async () => {
  const store = new RuleStore({ initial: { enabled: true, rules: [{ id: 'a', content: '旧' }, { id: 'b', content: '保留' }] } })
  await store.upsert({ id: 'a', content: '新' })
  assert.deepEqual(store.rules.map((item) => item.id), ['a', 'b'])
  assert.equal(store.rules[0].content, '新')
  await store.upsert({ id: 'c', content: '新增' })
  assert.deepEqual(store.rules.map((item) => item.id), ['a', 'b', 'c'])
})

test('RuleStore：会话开关默认关闭，保存后写入状态文件', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-store-'))
  const file = join(dir, 'state.json')
  try {
    const store = new RuleStore({ initial: { enabled: true, rules: [] }, filePath: file })
    assert.equal(store.isSessionEnabled('s1'), false)
    await store.setSessionEnabled('s1', true)
    assert.equal(store.isSessionEnabled('s1'), true)
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).sessions, ['s1'])
    await store.setSessionEnabled('s1', false)
    assert.equal(store.isSessionEnabled('s1'), false)
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).sessions, [])
    await store.setSessionEnabled('s1', true)
    await store.replace({ enabled: false })
    assert.equal(store.getState().enabled, false)
    assert.deepEqual(store.getState().sessions, [])
    assert.deepEqual(JSON.parse(readFileSync(file, 'utf8')).sessions, [])
    await store.setSessionEnabled('s1', true)
    assert.deepEqual(store.getState().sessions, [])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('Settings 写入失败时拒绝保存，防止重启后旧配置覆盖 JSON', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-settings-'))
  const file = join(dir, 'state.json')
  const mock = createMockCtx({ settings: {
    describe: () => [{ ns: 'system-prompt-injector', revision: 1 }],
    update: async () => { throw new Error('Settings 不可写') },
  } })
  try {
    let store
    apply(mock.ctx, { enabled: true, statePath: file, rules: [], onStore: (value) => { store = value } })
    await assert.rejects(store.replace({ rules: [{ id: 'new', content: '内容' }] }), /Settings 不可写/)
    assert.deepEqual(store.rules, [])
    assert.equal(store.lastError, 'Settings 不可写')
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：append 规则在 system-prompt/assemble 的 waterfall 末尾生效', async () => {
  const mock = createMockCtx()
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      enabled: true,
      sessions: ['s1'],
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'hello', mode: 'append', content: '自定义信息' }],
    })
    const result = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {
      agent: { session: { id: 's1', agentPreset: 'default' } },
    })
    assert.equal(result.sections.length, 2)
    assert.equal(result.sections[1].text, '自定义信息')
    assert.equal(result.sections[1].interpolate, false)
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：总开关开启时按会话开关决定是否注入', async () => {
  const mock = createMockCtx()
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      enabled: true,
      sessions: ['enabled-session'],
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'hello', mode: 'append', content: '只给已开启会话' }],
    })
    const enabled = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {
      agent: { session: { id: 'enabled-session', agentPreset: 'default' } },
    })
    assert.equal(enabled.sections.length, 2)
    assert.equal(enabled.sections[1].text, '只给已开启会话')

    const disabled = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {
      agent: { session: { id: 'other-session', agentPreset: 'default' } },
    })
    assert.deepEqual(disabled.sections.map((section) => section.text), ['原始系统提示词'])
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：总开关关闭时任何会话都不注入，并清空会话开关', async () => {
  const mock = createMockCtx()
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    /** @type {any} */
    let store
    apply(mock.ctx, {
      enabled: false,
      sessions: ['s1'],
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'hello', mode: 'append', content: '不应出现' }],
      onStore: (instance) => {
        store = instance
      },
    })
    assert.equal(store.isSessionEnabled('s1'), false)
    const result = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {
      agent: { session: { id: 's1', agentPreset: 'default' } },
    })
    assert.deepEqual(result.sections.map((section) => section.text), ['原始系统提示词'])
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：会话开关默认关闭，打开后立即影响下一轮', async () => {
  const mock = createMockCtx()
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    /** @type {any} */
    let store
    apply(mock.ctx, {
      enabled: true,
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'hello', mode: 'append', content: '按会话开启' }],
      onStore: (instance) => {
        store = instance
      },
    })
    const session = { agent: { session: { id: 's1', agentPreset: 'default' } } }
    const before = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), session)
    assert.deepEqual(before.sections.map((section) => section.text), ['原始系统提示词'])

    await store.setSessionEnabled('s1', true)
    const after = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), session)
    assert.equal(after.sections[1].text, '按会话开启')

    await store.setSessionEnabled('s1', false)
    const closed = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), session)
    assert.deepEqual(closed.sections.map((section) => section.text), ['原始系统提示词'])
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：通过 onStore 获取的 store 保存后立即影响下一轮', async () => {
  const mock = createMockCtx()
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    /** @type {any} */
    let store
    apply(mock.ctx, {
      enabled: true,
      sessions: ['s1'],
      statePath: join(dir, 'state.json'),
      rules: [],
      onStore: (instance) => {
        store = instance
      },
    })
    await store.replace({ rules: [{ id: 'later', mode: 'replace', content: '后写入的内容' }] })
    const result = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {
      agent: { session: { id: 's1', agentPreset: 'default' } },
    })
    assert.equal(result.sections.length, 1)
    assert.equal(result.sections[0].text, '后写入的内容')
    const onDisk = JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8'))
    assert.equal(onDisk.rules[0].content, '后写入的内容')
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：启动静态镜像不覆盖紧接着保存的新规则', async () => {
  const mock = createMockCtx()
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  const file = join(dir, 'state.json')
  try {
    let store
    apply(mock.ctx, {
      enabled: true, sessions: ['s1'], statePath: file,
      rules: [{ id: 'old', content: '旧规则' }],
      onStore: (instance) => { store = instance },
    })
    writeFileSync(file, JSON.stringify({ enabled: true, sessions: ['s1'], rules: [{ id: 'stale', content: '过期' }] }), 'utf8')
    assert.equal(await store.refreshFromDiskIfChanged(), false)
    assert.equal(store.rules[0].id, 'old')
    await store.replace({ rules: [{ id: 'new', content: '新规则' }] })
    assert.equal(JSON.parse(readFileSync(file, 'utf8')).rules[0].id, 'new')
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：仅首次系统规则只在 turn 1 step 1 的真实请求消费', async () => {
  const llm = { async prepareCall() { return { stream() { return 'ok' } } } }
  const mock = createMockCtx({ llm })
  const logs = []
  mock.ctx.logger.info = (line) => logs.push(line)
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      enabled: true,
      sessions: ['session-a', 'session-b'],
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'once', mode: 'append', schedule: 'first', content: '只出现一次' }],
    })
    const sessionA = { agent: { session: { id: 'session-a', agentPreset: 'default' }, phase: { kind: 'running', turn: 1, step: 0 } }, signal: {} }
    const sessionB = { agent: { session: { id: 'session-b', agentPreset: 'default' }, phase: { kind: 'running', turn: 1, step: 0 } }, signal: {} }

    const first = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), sessionA)
    assert.equal(first.sections.length, 2)
    assert.equal(first.sections[1].text, '只出现一次')

    const notSent = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), sessionA)
    assert.equal(notSent.sections.length, 2)
    const prepared = await llm.prepareCall({ provider: 'openai', model: 'flash' }, sessionA.signal)
    prepared.stream({ provider: 'openai', model: 'flash', messages: [] })
    const second = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), sessionA)
    assert.equal(second.sections.length, 1)
    sessionA.agent.phase = { kind: 'running', turn: 1, step: 1 }
    const laterStep = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), sessionA)
    assert.equal(laterStep.sections.length, 1)
    const continued = await llm.prepareCall({ provider: 'openai', model: 'flash' }, sessionA.signal)
    continued.stream({ provider: 'openai', model: 'flash', messages: [] })
    assert.equal(logs.filter((line) => line.includes('系统规则已随请求发出')).length, 1)

    const otherSession = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), sessionB)
    assert.equal(otherSession.sections.length, 2)
    assert.equal(otherSession.sections[1].text, '只出现一次')
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：宿主有效 complete 段阻止 waterfall 系统规则虚假应用', async () => {
  const effective = new Map([['complete', { name: 'complete', text: '权威系统提示词', complete: true }]])
  const routes = new Map()
  const webServer = { register(route) { routes.set(route.path, route.handler); return () => {} } }
  const mock = createMockCtx({ systemPrompt: { layers: { merge: () => effective } }, webServer })
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      sessions: ['s1'], statePath: join(dir, 'state.json'),
      rules: [{ id: 'replace', mode: 'replace', content: '不能覆盖' }],
    })
    const result = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(['权威系统提示词']), {
      agent: { session: { id: 's1' }, phase: { kind: 'running', turn: 1, step: 0 } }, signal: {},
    })
    assert.deepEqual(result.sections.map((item) => item.text), ['权威系统提示词'])
    let body = ''
    await routes.get('/system-prompt-injector/system-prompt-injector/state')(
      { method: 'GET' }, { writeHead() {}, end(value) { body = value } },
    )
    const status = JSON.parse(body).status.lastApplied
    assert.deepEqual(status.applied, [])
    assert.match(status.errors[0].message, /complete.*优先/)
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：缺少宿主注册表时不声称系统规则可覆盖 complete', async () => {
  const mock = createMockCtx({ systemPrompt: {} })
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      sessions: ['s1'], statePath: join(dir, 'state.json'),
      rules: [{ id: 'replace', mode: 'replace', content: '不能确认优先级' }],
    })
    const result = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {
      agent: { session: { id: 's1' } },
    })
    assert.deepEqual(result.sections.map((item) => item.text), ['原始系统提示词'])
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：contentFile 文件内容修改后下一轮生效（热读取）', async () => {
  const mock = createMockCtx()
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  const file = join(dir, 'prompt.md')
  try {
    writeFileSync(file, '第一版', 'utf8')
    apply(mock.ctx, {
      enabled: true,
      sessions: ['s1'],
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'file', mode: 'replace', contentFile: file }],
    })
    const session = { agent: { session: { id: 's1', agentPreset: 'default' } } }
    const first = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), session)
    assert.equal(first.sections[0].text, '第一版')
    writeFileSync(file, '第二版', 'utf8')
    const second = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), session)
    assert.equal(second.sections[0].text, '第二版')
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：规则异常不会破坏本轮组装', async () => {
  const mock = createMockCtx()
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      enabled: true,
      sessions: ['s1'],
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'bad', mode: 'append', contentFile: join(dir, '不存在的文件.md') }],
    })
    const result = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {
      agent: { session: { id: 's1', agentPreset: 'default' } },
    })
    assert.deepEqual(result.sections.map((section) => section.text), ['原始系统提示词'])
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：仅首次预填充只在会话的 turn 1 step 1 生效', async () => {
  /** @type {any} */
  let captured
  const llm = {
    async prepareCall(config) {
      return {
        config,
        stream(options) {
          captured = options
          return 'stream'
        },
      }
    },
  }
  const mock = createMockCtx({ llm })
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      enabled: true,
      sessions: ['s1'],
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'once', target: 'assistant', schedule: 'first', content: '只在新会话' }],
    })
    const user = { id: 'u1', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '你好' }] }
    const agent = { session: { id: 's1', agentPreset: 'default' } }

    // 老会话（turn 2）里不应被当成首次。
    const lateSignal = { tag: 'late' }
    await mock.fireAgentWaterfall('agent/pre-step', { agent, turn: 2, step: 1, signal: lateSignal, messages: [user] })
    const late = await llm.prepareCall({ provider: 'openai', model: 'flash' }, lateSignal)
    late.stream({ provider: 'openai', model: 'flash', messages: [user] })
    assert.equal(captured.messages.length, 1)

    // 新会话的第一条消息生效。
    const firstSignal = { tag: 'first' }
    await mock.fireAgentWaterfall('agent/pre-step', { agent, turn: 1, step: 1, signal: firstSignal, messages: [user] })
    const first = await llm.prepareCall({ provider: 'openai', model: 'flash' }, firstSignal)
    // prepareCall 已完成但 stream 未调用时不消费首次计划。
    const retry = await mock.fireAgentWaterfall('agent/pre-step', { agent, turn: 1, step: 1, signal: firstSignal, messages: [user] })
    assert.equal(retry.kind, undefined)
    first.stream({ provider: 'openai', model: 'flash', messages: [user] })
    assert.equal(captured.messages.length, 2)
    assert.equal(captured.messages[1].content[0].text, '只在新会话')
    const consumedSignal = {}
    await mock.fireAgentWaterfall('agent/pre-step', { agent, turn: 1, step: 1, signal: consumedSignal, messages: [user] })
    const consumed = await llm.prepareCall({ provider: 'openai', model: 'flash' }, consumedSignal)
    consumed.stream({ provider: 'openai', model: 'flash', messages: [user] })
    assert.equal(captured.messages.length, 1)
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：软预填充插在真实用户消息前后，不写进消息历史', async () => {
  /** @type {any} */
  let captured
  const llm = {
    async prepareCall(config) {
      return {
        config,
        stream(options) {
          captured = options
          return 'stream'
        },
      }
    },
  }
  const mock = createMockCtx({ llm })
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      enabled: true,
      sessions: ['s1'],
      statePath: join(dir, 'state.json'),
      rules: [
        {
          id: 'soft',
          target: 'assistant',
          prefillMode: 'soft',
          soft: {
            before: [
              { role: 'user', content: '你可以帮我写一个贪吃蛇吗' },
              { role: 'assistant', content: '我可以' },
            ],
            after: [{ role: 'user', content: '现在开始' }],
          },
        },
      ],
    })
    const user = { id: 'u1', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '开始' }] }
    const context = { id: 'ctx', role: 'user', source: { kind: 'runtime-context' }, content: [{ type: 'text', text: '上下文' }] }
    const signal = { tag: 'soft' }
    await mock.fireAgentWaterfall('agent/pre-step', {
      agent: { session: { id: 's1', agentPreset: 'default' } },
      turn: 1,
      step: 1,
      signal,
      messages: [user],
    })
    const prepared = await llm.prepareCall({ provider: 'openai', model: 'flash' }, signal)
    prepared.stream({ provider: 'openai', model: 'flash', messages: [user, context] })
    assert.deepEqual(captured.messages.map((item) => item.content[0]?.text), [
      '上下文',
      '你可以帮我写一个贪吃蛇吗',
      '我可以',
      '开始',
      '现在开始',
    ])
    assert.equal(captured.messages[1].role, 'user')
    assert.equal(captured.messages[2].role, 'assistant')
    assert.equal(captured.messages[3].role, 'user')
    assert.equal(captured.messages[0].source.kind, 'runtime-context')
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：assistant 预填充追加在请求消息末尾，工具续跑步骤不追加', async () => {
  /** @type {any} */
  let captured
  const llm = {
    async prepareCall(config) {
      return {
        config,
        stream(options) {
          captured = options
          return 'stream'
        },
      }
    },
  }
  const mock = createMockCtx({ llm })
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      enabled: true,
      sessions: ['s1'],
      statePath: join(dir, 'state.json'),
      rules: [
        { id: 'pre', target: 'assistant', content: '好的，' },
        { id: 'sys', mode: 'append', content: '系统段' },
      ],
    })
    const user = { id: 'u1', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '你好' }] }

    const signal = { tag: 'turn-1' }
    await mock.fireAgentWaterfall('agent/pre-step', {
      agent: { session: { id: 's1', agentPreset: 'default' } },
      turn: 1,
      step: 1,
      signal,
      messages: [user],
    })
    const prepared = await llm.prepareCall({ provider: 'openai', model: 'flash' }, signal)
    prepared.stream({ provider: 'openai', model: 'flash', messages: [user] })
    assert.equal(captured.messages.length, 2)
    assert.equal(captured.messages[1].role, 'assistant')
    assert.equal(captured.messages[1].content[0].text, '好的，')

    // 同一个 turn 的工具续跑步骤：没有用户消息，不应再预填充。
    captured = undefined
    await mock.fireAgentWaterfall('agent/pre-step', {
      agent: { session: { id: 's1' } },
      turn: 1,
      step: 2,
      signal,
      messages: [],
    })
    const continued = await llm.prepareCall({ provider: 'openai', model: 'flash' }, signal)
    continued.stream({ provider: 'openai', model: 'flash', messages: [user] })
    assert.equal(captured.messages.length, 1)
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})
