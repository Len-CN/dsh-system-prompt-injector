/**
 * 宿主接线测试：用最小 Cordis 上下文桩验证 `apply()` 的行为。
 */

import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { apply } from '../lib/index.js'

/**
 * 最小 Cordis 上下文桩：只实现本插件用到的 on / effect / get / inject / logger。
 * @param {{ webServer?: object, settings?: object }} [services]
 */
function createMockCtx(services = {}) {
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
    disposeAll() {
      for (const dispose of disposed) dispose()
    },
  }
}

/** 最小 assembly。 */
function makeAssembly(texts = ['原始系统提示词']) {
  return { sections: texts.map((text, index) => ({ name: `origin:${index}`, text })), contexts: [], variables: {} }
}

test('apply：append 规则在 system-prompt/assemble 的 waterfall 末尾生效', async () => {
  const mock = createMockCtx()
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      enabled: true,
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'hello', mode: 'append', content: '自定义信息' }],
    })
    const result = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), { agent: { session: { agentPreset: 'default' } } })
    assert.equal(result.sections.length, 2)
    assert.equal(result.sections[1].text, '自定义信息')
    assert.equal(result.sections[1].interpolate, false)
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：enabled=false 时不修改任何内容', async () => {
  const mock = createMockCtx()
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      enabled: false,
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'hello', mode: 'append', content: '不应出现' }],
    })
    const result = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {})
    assert.deepEqual(result.sections.map((section) => section.text), ['原始系统提示词'])
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
      statePath: join(dir, 'state.json'),
      rules: [],
      onStore: (instance) => {
        store = instance
      },
    })
    await store.replace({ rules: [{ id: 'later', mode: 'replace', content: '后写入的内容' }] })
    const result = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {})
    assert.equal(result.sections.length, 1)
    assert.equal(result.sections[0].text, '后写入的内容')
    const onDisk = JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8'))
    assert.equal(onDisk.rules[0].content, '后写入的内容')
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})

test('apply：仅首次规则只在每个会话的第一次请求注入', async () => {
  const mock = createMockCtx()
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-host-'))
  try {
    apply(mock.ctx, {
      enabled: true,
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'once', mode: 'append', schedule: 'first', content: '只出现一次' }],
    })
    const sessionA = { agent: { session: { id: 'session-a', agentPreset: 'default' } } }
    const sessionB = { agent: { session: { id: 'session-b', agentPreset: 'default' } } }

    const first = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), sessionA)
    assert.equal(first.sections.length, 2)
    assert.equal(first.sections[1].text, '只出现一次')

    const second = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), sessionA)
    assert.equal(second.sections.length, 1)

    const otherSession = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), sessionB)
    assert.equal(otherSession.sections.length, 2)
    assert.equal(otherSession.sections[1].text, '只出现一次')
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
    const { writeFileSync } = await import('node:fs')
    writeFileSync(file, '第一版', 'utf8')
    apply(mock.ctx, {
      enabled: true,
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'file', mode: 'replace', contentFile: file }],
    })
    const first = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {})
    assert.equal(first.sections[0].text, '第一版')
    writeFileSync(file, '第二版', 'utf8')
    const second = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {})
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
      statePath: join(dir, 'state.json'),
      rules: [{ id: 'bad', mode: 'append', contentFile: join(dir, '不存在的文件.md') }],
    })
    const result = await mock.fireWaterfall('system-prompt/assemble', makeAssembly(), {})
    assert.deepEqual(result.sections.map((section) => section.text), ['原始系统提示词'])
  } finally {
    mock.disposeAll()
    rmSync(dir, { recursive: true, force: true })
  }
})
