/**
 * Assistant 预填充逻辑测试。
 */

import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { applyRules, normalizeRule, normalizeRules } from '../lib/core.js'
import {
  applyPrefill,
  appendPrefillMessage,
  attachPrefill,
  collectPrefill,
  createPrefillMessage,
  findHumanMessageIndex,
  isPrefillRule,
  prefillModeOf,
} from '../lib/prefill.js'

/** 构造一份最小的 assembly。 */
function makeAssembly(texts = ['原始系统提示词']) {
  return { sections: texts.map((text, index) => ({ name: `origin:${index}`, text })), contexts: [], variables: {} }
}

test('normalizeRule 的 target 只接受 assistant，其余回落到 system', () => {
  assert.equal(normalizeRule({ target: 'assistant' }).target, 'assistant')
  assert.equal(normalizeRule({ target: 'nope' }).target, 'system')
  assert.equal(normalizeRule({}).target, 'system')
  assert.equal(isPrefillRule(normalizeRule({ target: 'assistant' })), true)
  assert.equal(isPrefillRule(normalizeRule({})), false)
})

test('normalizeRule 支持软预填充并规范化消息槽', () => {
  const rule = normalizeRule({
    target: 'assistant',
    prefillMode: 'soft',
    soft: {
      before: [
        { role: 'user', content: '你可以帮我写一个贪吃蛇吗' },
        { role: 'assistant', content: '我可以' },
        { role: 'nope', content: 3 },
      ],
      after: [{ role: 'user', content: '开始' }],
    },
  })
  assert.equal(rule.prefillMode, 'soft')
  assert.deepEqual(rule.soft.before, [
    { role: 'user', content: '你可以帮我写一个贪吃蛇吗' },
    { role: 'assistant', content: '我可以' },
    { role: 'user', content: '' },
  ])
  assert.deepEqual(rule.soft.after, [{ role: 'user', content: '开始' }])
  assert.equal(normalizeRule({ target: 'assistant' }).prefillMode, 'native')
  assert.equal(normalizeRule({ target: 'system', prefillMode: 'soft' }).prefillMode, 'native')
})

test('applyRules 忽略 assistant 预填充规则', () => {
  const rules = normalizeRules([
    { id: 'sys', mode: 'append', content: '系统段' },
    { id: 'pre', target: 'assistant', content: '预填充' },
  ])
  const result = applyRules({ assembly: makeAssembly(), rules, context: {} })
  assert.deepEqual(result.assembly.sections.map((section) => section.text), ['原始系统提示词', '系统段'])
  assert.deepEqual(result.applied.map((item) => item.id), ['sys'])
})

test('collectPrefill 按顺序拼接，并过滤停用 / 预设不匹配 / 已消费的仅首次规则', () => {
  const rules = normalizeRules([
    { id: 'a', target: 'assistant', content: '第一段' },
    { id: 'off', target: 'assistant', enabled: false, content: '停用' },
    { id: 'sys', mode: 'append', content: '系统规则' },
    { id: 'armor', target: 'assistant', content: '破甲专用', agentPresets: ['armor'] },
    { id: 'once', target: 'assistant', schedule: 'first', content: '只来一次' },
    { id: 'b', target: 'assistant', content: '第二段' },
  ])
  const first = collectPrefill({
    rules,
    context: { agent: { session: { agentPreset: 'default' } } },
    usedFirst: new Set(),
  })
  assert.equal(first.text, '第一段\n\n只来一次\n\n第二段')
  assert.deepEqual(first.applied.map((item) => item.id), ['a', 'once', 'b'])
  assert.deepEqual(first.errors, [])

  const second = collectPrefill({
    rules,
    context: { agent: { session: { agentPreset: 'default' } } },
    usedFirst: new Set(['once']),
  })
  assert.equal(second.text, '第一段\n\n第二段')
})

test('collectPrefill 收集软预填充的前后消息，并保留规则顺序', () => {
  const rules = normalizeRules([
    {
      id: 'soft',
      name: '软规则',
      target: 'assistant',
      prefillMode: 'soft',
      soft: {
        before: [
          { role: 'user', content: '你可以帮我写一个贪吃蛇吗' },
          { role: 'assistant', content: '我可以' },
        ],
        after: [{ role: 'user', content: '开始' }],
      },
    },
    { id: 'native', target: 'assistant', content: '原生开头' },
  ])
  const result = collectPrefill({ rules, context: {} })
  assert.equal(result.text, '原生开头')
  assert.deepEqual(result.softBefore.map((item) => `${item.role}:${item.content}`), ['user:你可以帮我写一个贪吃蛇吗', 'assistant:我可以'])
  assert.deepEqual(result.softAfter.map((item) => `${item.role}:${item.content}`), ['user:开始'])
  assert.deepEqual(result.applied.map((item) => `${item.id}:${item.mode}`), ['soft:soft', 'native:assistant'])
  assert.equal(result.errors.length, 0)
})

test('collectPrefill 对空软预填充给出错误并跳过', () => {
  const rules = normalizeRules([
    { id: 'empty', target: 'assistant', prefillMode: 'soft', soft: { before: [{ role: 'user', content: '   ' }], after: [] } },
  ])
  const result = collectPrefill({ rules, context: {} })
  assert.equal(result.applied.length, 0)
  assert.equal(result.errors.length, 1)
  assert.match(result.errors[0].message, /没有填写任何消息/)
})

test('collectPrefill 支持 contentFile，并在读不到时回退内联内容', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-prefill-'))
  try {
    const file = join(dir, 'prefill.md')
    writeFileSync(file, '来自文件', 'utf8')
    const rules = normalizeRules([
      { id: 'file', target: 'assistant', contentFile: file },
      { id: 'missing', target: 'assistant', contentFile: join(dir, '没有.md'), content: '内联兜底' },
    ])
    const result = collectPrefill({ rules, context: {} })
    assert.equal(result.text, '来自文件\n\n内联兜底')
    assert.equal(result.errors.length, 1)
    assert.equal(result.errors[0].id, 'missing')
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('createPrefillMessage 生成带 model 来源的 assistant 文本消息', () => {
  const message = createPrefillMessage({ text: '开头', provider: 'deepseek', model: 'flash', id: 'spi-1' })
  assert.equal(message.role, 'assistant')
  assert.equal(message.id, 'spi-1')
  assert.deepEqual(message.content, [{ type: 'text', text: '开头' }])
  assert.deepEqual(message.source, { kind: 'model', provider: 'deepseek', model: 'flash' })
})

test('appendPrefillMessage 在消息末尾追加，且不改动原数组', () => {
  const user = { role: 'user', content: [{ type: 'text', text: '你好' }] }
  const options = { provider: 'openai', model: 'flash', messages: [user] }
  let seq = 0
  const next = appendPrefillMessage(options, { text: '好的，', nextId: () => `spi-${++seq}` })
  assert.equal(options.messages.length, 1)
  assert.equal(next.messages.length, 2)
  assert.equal(next.messages[0], user)
  assert.equal(next.messages[1].role, 'assistant')
  assert.equal(next.messages[1].content[0].text, '好的，')
  assert.equal(next.messages[1].id, 'spi-1')
})

test('appendPrefillMessage 在请求已以 assistant 结尾时不追加', () => {
  const assistant = { role: 'assistant', content: [{ type: 'text', text: '已有' }] }
  const options = { provider: 'openai', model: 'flash', messages: [assistant] }
  const next = appendPrefillMessage(options, { text: '追加', nextId: () => 'spi-1' })
  assert.equal(next, options)
})

test('findHumanMessageIndex 跳过运行时上下文，只认 source.kind=user', () => {
  const messages = [
    { role: 'system', content: [] },
    { role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '真实消息' }] },
    { role: 'user', source: { kind: 'runtime-context' }, content: [{ type: 'text', text: '上下文' }] },
  ]
  assert.equal(findHumanMessageIndex(messages), 1)
  assert.equal(findHumanMessageIndex([]), -1)
})

test('applyPrefill 把软消息插到真实用户消息前后，并保留上下文消息', () => {
  const user = { id: 'u1', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '开始' }] }
  const context = { id: 'ctx', role: 'user', source: { kind: 'runtime-context' }, content: [{ type: 'text', text: '上下文' }] }
  const options = {
    provider: 'openai',
    model: 'flash',
    messages: [{ id: 'sys', role: 'system', content: [] }, user, context],
  }
  let seq = 0
  const result = applyPrefill(options, {
    softBefore: [
      { role: 'user', content: '你可以帮我写一个贪吃蛇吗' },
      { role: 'assistant', content: '我可以' },
    ],
    softAfter: [{ role: 'user', content: '现在开始' }],
    nextId: () => `spi-soft-${++seq}`,
  })
  assert.equal(options.messages.length, 3)
  assert.deepEqual(result.options.messages.map((item) => item.id), [
    'sys',
    'ctx',
    'spi-soft-1',
    'spi-soft-2',
    'u1',
    'spi-soft-3',
  ])
  assert.deepEqual(result.injected.map((item) => item.role), ['user', 'assistant', 'user'])
  assert.equal(result.injected[0].source.kind, 'dsh-spi-soft')
})

test('prefillModeOf 区分原生、软和混合', () => {
  assert.equal(prefillModeOf({ text: '开头' }), 'native')
  assert.equal(prefillModeOf({ softBefore: [{}] }), 'soft')
  assert.equal(prefillModeOf({ text: '开头', softAfter: [{}] }), 'mixed')
})

test('attachPrefill 包装 prepared.stream，把预填充送进本次 dispatch', () => {
  let captured
  const prepared = {
    config: { provider: 'openai', model: 'flash' },
    stream(options) {
      captured = options
      return 'stream-result'
    },
  }
  const wrapped = attachPrefill(prepared, { text: '好的，', nextId: () => 'spi-9' })
  const result = wrapped.stream({
    provider: 'openai',
    model: 'flash',
    messages: [{ role: 'user', content: [{ type: 'text', text: '你好' }] }],
  })
  assert.equal(result, 'stream-result')
  assert.equal(captured.messages.length, 2)
  assert.equal(captured.messages[1].role, 'assistant')
  assert.equal(captured.messages[1].content[0].text, '好的，')
  assert.deepEqual(wrapped.config, prepared.config)
})

test('attachPrefill 在 dispatch 时回调实际追加的消息', () => {
  let dispatched
  const prepared = { stream() {} }
  const wrapped = attachPrefill(prepared, {
    text: '开头',
    nextId: () => 'spi-2',
    onDispatch: (payload) => {
      dispatched = payload
    },
  })
  wrapped.stream({
    provider: 'openai',
    model: 'flash',
    messages: [{ role: 'user', source: { kind: 'user' }, content: [] }],
  })
  assert.equal(dispatched.mode, 'native')
  assert.equal(dispatched.messages.length, 1)
  assert.equal(dispatched.messages[0].role, 'assistant')
  assert.equal(dispatched.messages[0].content[0].text, '开头')
  assert.equal(dispatched.chars, 2)
})

test('attachPrefill 底层 stream 同步失败时不报告或消费首次请求', () => {
  let dispatched = 0
  let started = 0
  const wrapped = attachPrefill({ stream() { throw new Error('INVALID_PREPARED_CALL') } }, {
    text: '原生开头', nextId: () => 'spi-1',
    onDispatch: () => { dispatched += 1 },
    onStream: () => { started += 1 },
  })
  assert.throws(() => wrapped.stream({ provider: 'openai', model: 'flash', messages: [] }), /INVALID_PREPARED_CALL/)
  assert.equal(dispatched, 0)
  assert.equal(started, 0)
})

test('attachPrefill 支持软预填充并在 dispatch 时回调批次', () => {
  let captured
  let dispatched
  const prepared = {
    stream(options) {
      captured = options
      return 'ok'
    },
  }
  const wrapped = attachPrefill(prepared, {
    softBefore: [{ role: 'user', content: '你可以帮我写一个贪吃蛇吗' }],
    softAfter: [{ role: 'user', content: '开始' }],
    nextId: (() => {
      let seq = 0
      return () => `spi-soft-${++seq}`
    })(),
    onDispatch: (payload) => {
      dispatched = payload
    },
  })
  wrapped.stream({
    provider: 'openai',
    model: 'flash',
    messages: [{ role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '好的' }] }],
  })
  assert.equal(captured.messages.length, 3)
  assert.equal(captured.messages[0].content[0].text, '你可以帮我写一个贪吃蛇吗')
  assert.equal(captured.messages[1].content[0].text, '好的')
  assert.equal(captured.messages[2].content[0].text, '开始')
  assert.equal(dispatched.mode, 'soft')
  assert.equal(dispatched.messages.length, 2)
  assert.equal(dispatched.chars, '你可以帮我写一个贪吃蛇吗'.length + '开始'.length)
})

test('混合预填充在 softAfter assistant 后仍保留原生文本', () => {
  const user = { id: 'u1', role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '开始' }] }
  const options = { provider: 'openai', model: 'flash', messages: [user] }
  let seq = 0
  const result = applyPrefill(options, {
    text: '原生开头',
    softAfter: [{ role: 'assistant', content: '示例回复' }],
    nextId: () => `spi-${++seq}`,
  })
  assert.deepEqual(result.options.messages.map((item) => item.content[0].text), ['开始', '示例回复', '原生开头'])
  assert.deepEqual(result.injected.map((item) => item.role), ['assistant', 'assistant'])
  assert.equal(options.messages.length, 1)
})

test('deepseek-account 的合成 assistant 消息会补 thinking 块', () => {
  const options = {
    provider: 'deepseek-account',
    model: 'deepseek-flash',
    messages: [{ role: 'user', source: { kind: 'user' }, content: [{ type: 'text', text: '开始' }] }],
  }
  let seq = 0
  const result = applyPrefill(options, {
    text: '好的，',
    softBefore: [{ role: 'assistant', content: '我可以' }],
    nextId: () => `spi-${++seq}`,
  })
  const assistant = result.injected.find((message) => message.role === 'assistant')
  assert.deepEqual(assistant.content.map((block) => block.type), ['reasoning', 'text'])
  assert.equal(assistant.content[1].text, '我可以')
  assert.equal(result.injected.find((message) => message.role === 'assistant' && message.content[1].text === '好的，').content[0].type, 'reasoning')
})

test('DeepSeek 预填充诊断只统计 text 块，不误计 reasoning 占位', () => {
  let dispatched
  const wrapped = attachPrefill({ stream() { return 'ok' } }, {
    text: '真实开头', nextId: () => 'spi-1',
    onDispatch: (payload) => { dispatched = payload },
  })
  wrapped.stream({ provider: 'deepseek-account', model: 'flash', messages: [{ role: 'user', content: [] }] })
  assert.equal(dispatched.chars, '真实开头'.length)
  assert.equal(dispatched.preview, '真实开头')
})

test('attachPrefill 对空文本或无效 prepared 原样返回', () => {
  const prepared = { stream() {} }
  assert.equal(attachPrefill(prepared, { text: '', nextId: () => 'x' }), prepared)
  assert.equal(attachPrefill(prepared, { text: '   ', nextId: () => 'x' }), prepared)
  assert.equal(attachPrefill(null, { text: 'a', nextId: () => 'x' }), null)
})
