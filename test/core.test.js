/**
 * 核心逻辑测试：不依赖 DSH 运行时。
 */

import assert from 'node:assert/strict'
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  MODES,
  agentPresetOf,
  applyRules,
  expandPath,
  normalizeRule,
  normalizeRules,
  resolveRuleText,
  slugify,
  summarizeRules,
} from '../lib/core.js'

/** 构造一份最小的 assembly。 */
function makeAssembly(texts = ['原始系统提示词第一段', '原始系统提示词第二段']) {
  return {
    sections: texts.map((text, index) => ({ name: `origin:${index}`, text })),
    contexts: [],
    variables: {},
  }
}

test('normalizeRule 补默认值并保留显式字段', () => {
  const rule = normalizeRule(
    {
      id: ' My Rule ',
      name: '测试规则',
      mode: 'prepend',
      schedule: 'first',
      content: '正文',
      contentFile: '~/x.md',
      agentPresets: ['armor', '', 3],
    },
    0,
  )
  assert.equal(rule.id, 'My-Rule')
  assert.equal(rule.name, '测试规则')
  assert.equal(rule.enabled, true)
  assert.equal(rule.mode, 'prepend')
  assert.equal(rule.schedule, 'first')
  assert.equal(rule.content, '正文')
  assert.equal(rule.contentFile, '~/x.md')
  assert.deepEqual(rule.agentPresets, ['armor', '3'])
})

test('normalizeRule 的 schedule 只接受 first，其余回落到 every', () => {
  assert.equal(normalizeRule({ schedule: 'first' }).schedule, 'first')
  assert.equal(normalizeRule({ schedule: 'nope' }).schedule, 'every')
  assert.equal(normalizeRule({}).schedule, 'every')
})

test('normalizeRule 的非法 mode 回落到 append，transform 不再被接受', () => {
  assert.equal(normalizeRule({ mode: 'nope' }).mode, 'append')
  assert.equal(normalizeRule({ mode: 'transform' }).mode, 'append')
  for (const mode of MODES) assert.equal(normalizeRule({ mode }).mode, mode)
})

test('normalizeRules 去重并补 id', () => {
  const rules = normalizeRules([
    { id: 'a', content: 'A' },
    { id: 'a', content: 'B' },
    { content: 'C' },
  ])
  assert.equal(rules.length, 2)
  assert.equal(rules[0].id, 'a')
  assert.equal(rules[0].content, 'A')
  assert.equal(rules[1].id, 'rule-3')
})

test('slugify 保留中文与常见符号', () => {
  assert.equal(slugify('我的 规则/一'), '我的-规则一')
  assert.equal(slugify('!!!'), 'rule')
})

test('expandPath 展开 ~ 并解析相对路径', () => {
  const base = join(tmpdir(), 'dsh-spi-base')
  assert.ok(expandPath('~/a.md', base).endsWith('a.md'))
  assert.equal(expandPath('a.md', base), join(base, 'a.md'))
})

test('resolveRuleText：文件优先，读不到时回退到内联内容', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dsh-spi-'))
  try {
    const file = join(dir, 'prompt.md')
    writeFileSync(file, '文件里的内容', 'utf8')
    const fromFile = resolveRuleText(normalizeRule({ content: '内联', contentFile: file }), { baseDir: dir })
    assert.equal(fromFile.text, '文件里的内容')
    assert.equal(fromFile.source, 'file')

    const missing = resolveRuleText(normalizeRule({ content: '内联', contentFile: join(dir, 'missing.md') }), { baseDir: dir })
    assert.equal(missing.text, '内联')
    assert.equal(missing.source, 'inline')
    assert.match(missing.error, /读取文件失败/)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('applyRules：append 追加到末尾，注入段保持字面文本', () => {
  const rules = normalizeRules([{ id: 'x', mode: 'append', content: '注入 {{不是变量}}' }])
  const out = applyRules({ assembly: makeAssembly(), rules, context: {} })
  assert.equal(out.assembly.sections.length, 3)
  assert.equal(out.assembly.sections[2].text, '注入 {{不是变量}}')
  assert.equal(out.assembly.sections[2].interpolate, false)
  assert.deepEqual(out.applied.map((item) => item.id), ['x'])
})

test('applyRules：prepend 插到开头', () => {
  const rules = normalizeRules([{ id: 'x', mode: 'prepend', content: '开头' }])
  const out = applyRules({ assembly: makeAssembly(), rules, context: {} })
  assert.equal(out.assembly.sections[0].text, '开头')
  assert.equal(out.assembly.sections[1].text, '原始系统提示词第一段')
})

test('applyRules：replace 清空原有段', () => {
  const rules = normalizeRules([{ id: 'x', mode: 'replace', content: '只剩我' }])
  const out = applyRules({ assembly: makeAssembly(), rules, context: {} })
  assert.equal(out.assembly.sections.length, 1)
  assert.equal(out.assembly.sections[0].text, '只剩我')
})

test('applyRules：多规则按数组顺序生效', () => {
  const rules = normalizeRules([
    { id: 'first', mode: 'append', content: '一' },
    { id: 'second', mode: 'prepend', content: '二' },
    { id: 'third', mode: 'replace', content: '三' },
    { id: 'fourth', mode: 'append', content: '四' },
  ])
  const out = applyRules({ assembly: makeAssembly(), rules, context: {} })
  assert.deepEqual(out.assembly.sections.map((section) => section.text), ['三', '四'])
})

test('applyRules：agentPresets 过滤', () => {
  const rules = normalizeRules([
    { id: 'armor-only', mode: 'append', content: '只给 armor', agentPresets: ['armor'] },
  ])
  const other = applyRules({ assembly: makeAssembly(), rules, context: { agent: { session: { agentPreset: 'default' } } } })
  assert.equal(other.applied.length, 0)
  assert.equal(other.assembly.sections.length, 2)

  const armor = applyRules({ assembly: makeAssembly(), rules, context: { agent: { session: { agentPreset: 'armor' } } } })
  assert.equal(armor.applied.length, 1)
  assert.equal(armor.assembly.sections[2].text, '只给 armor')
})

test('agentPresetOf 从多个位置容错读取', () => {
  assert.equal(agentPresetOf({ agent: { session: { header: { agentPreset: 'header-preset' } } } }), 'header-preset')
  assert.equal(agentPresetOf({ agent: { session: { agentPreset: 'a' } } }), 'a')
  assert.equal(agentPresetOf({ agent: { agentPreset: 'b' } }), 'b')
  assert.equal(agentPresetOf({ agentPreset: 'c' }), 'c')
  assert.equal(agentPresetOf({}), '')
})

test('summarizeRules 返回内容长度与文件错误', () => {
  const rules = normalizeRules([
    { id: 'a', content: '12345' },
    { id: 'b', contentFile: '~/不存在的文件.md' },
  ])
  const summary = summarizeRules(rules, { baseDir: tmpdir() })
  assert.equal(summary[0].contentLength, 5)
  assert.equal(summary[0].source, 'inline')
  assert.equal(summary[0].preview, '12345')
  assert.equal(summary[1].contentLength, 0)
  assert.match(summary[1].error, /读取文件失败/)
})

test('summarizeRules 软预填充按消息统计长度并生成角色预览', () => {
  const rules = normalizeRules([
    {
      id: 'soft',
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
  ])
  const summary = summarizeRules(rules)
  assert.equal(summary[0].contentLength, ['你可以帮我写一个贪吃蛇吗', '我可以', '开始'].join('\n').length)
  assert.equal(summary[0].source, 'inline')
  assert.match(summary[0].preview, /用户：你可以帮我写一个贪吃蛇吗/)
  assert.match(summary[0].preview, /助手：我可以/)
})
