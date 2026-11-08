/**
 * 客户端 bundle 冒烟测试：用最小 loader / React / DOM 桩执行构建产物，确认
 * 工厂能加载并注册 settings.section。
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { mergeImportedRules, parseImportedRules, plainRule, serializeRules } from '../client/src/store.js'

test('client/client.js 可以被 Harness 模块加载器加载并注册设置页', () => {
  const source = readFileSync(new URL('../client/client.js', import.meta.url), 'utf8')

  /** @type {any} */
  let loaded
  const styles = []
  const documentStub = {
    querySelector: () => null,
    createElement: () => ({ dataset: {}, textContent: '' }),
    head: {
      appendChild(node) {
        styles.push(node)
      },
    },
  }
  const windowStub = {
    __ModuleLoader__: {
      load(definition) {
        loaded = definition
      },
    },
  }

  const fakeReact = {
    createElement(type, props, ...children) {
      return { type, props: { ...(props ?? {}), children } }
    },
    useEffect() {},
    useLayoutEffect() {},
    useRef(initial) {
      return { current: initial }
    },
    useState(initial) {
      return [initial, () => {}]
    },
    useSyncExternalStore(subscribe, getSnapshot) {
      return getSnapshot()
    },
  }

  const require = (name) => {
    if (name === 'react') return fakeReact
    throw new Error(`unexpected require: ${name}`)
  }

  // client.js 是普通脚本（不是 ESM），用 Function 构造器执行以模拟浏览器加载。
  // eslint-disable-next-line no-new-func
  const run = new Function('window', 'document', 'require', `${source}\n//# sourceURL=client-client.js`)
  run(windowStub, documentStub, require)

  assert.ok(loaded, '应该调用 window.__ModuleLoader__.load')
  assert.equal(loaded.id, 'dsh-system-prompt-injector')
  const entry = loaded.factory(require)
  assert.equal(typeof entry.apply, 'function')
  assert.deepEqual(entry.inject, ['slots'])

  const registrations = []
  const ctx = {
    slots: {
      inject(name, callback) {
        callback()
      },
      register(options, component) {
        registrations.push({ options, component })
      },
    },
  }
  // apply() 会立即拉一次状态；提供一个最小的 fetch 桩，避免真实网络请求。
  const previousFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ enabled: false, sessions: [], rules: [], revision: 0 }),
  })
  try {
    entry.apply(ctx, {})
  } finally {
    globalThis.fetch = previousFetch
  }
  assert.equal(registrations.length, 2)
  assert.deepEqual(
    registrations.map((item) => item.options.id).sort(),
    ['system-prompt-injector', 'system-prompt-injector-toggle'],
  )
  assert.deepEqual(
    registrations.map((item) => item.options.name).sort(),
    ['conversation.input.left', 'settings.section'],
  )
  assert.equal(typeof registrations[0].component, 'function')
  assert.ok(styles.length >= 1, '应该注入样式')
})

test('保存期间不改变按钮外观，避免「新建规则」等按钮闪动', () => {
  const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../client/src/styles.js', import.meta.url), 'utf8')

  // 排序只通过把手操作，保存期间仅规则卡开关使用 disabled。
  const disabledUses = source.match(/disabled:\s*[^,\n]+/g) ?? []
  assert.deepEqual(disabledUses, ['disabled: live.saving'])

  // 按钮不再有 :disabled 的半透明样式，否则请求一来一回就会闪一下。
  assert.ok(!/\.spi-btn:disabled\s*\{[^}]*opacity/.test(css), '保存按钮不应通过 opacity 表达禁用')
  assert.ok(!/\bdisabled:\s*live\.saving,\s*onClick/.test(source), '新建规则按钮不应在保存时禁用')
})

test('plainRule 保留 target / prefillMode 字段，旧规则默认 system + native', () => {
  assert.equal(plainRule({ id: 'a', target: 'assistant' }).target, 'assistant')
  assert.equal(plainRule({ id: 'b' }).target, 'system')
  assert.equal(plainRule({ id: 'c', target: 'nope' }).target, 'system')
  assert.equal(plainRule({ id: 'd', target: 'assistant', prefillMode: 'soft' }).prefillMode, 'soft')
  assert.equal(plainRule({ id: 'e', target: 'assistant' }).prefillMode, 'native')
})

test('plainRule 保留软预填充消息并规范化角色', () => {
  const rule = plainRule({
    id: 'soft',
    target: 'assistant',
    prefillMode: 'soft',
    soft: {
      before: [{ role: 'assistant', content: '应答' }, { role: 'x', content: 3 }],
      after: [{ role: 'user', content: '开始' }],
    },
  })
  assert.deepEqual(rule.soft.before, [
    { role: 'assistant', content: '应答' },
    { role: 'user', content: '' },
  ])
  assert.deepEqual(rule.soft.after, [{ role: 'user', content: '开始' }])
})

test('客户端包含软预填充可视化编辑器、拖动排序和卡片收起逻辑', () => {
  const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
  assert.match(source, /真实用户消息/)
  assert.match(source, /在基准前添加/)
  assert.match(source, /在基准后添加/)
  assert.match(source, /拖动排序/)
  assert.match(source, /data-flip-id/)
  assert.match(source, /toggleEdit/)
})

test('总开关与按 sessionId 的快捷开关共同决定是否注入', () => {
  const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
  assert.match(source, /live\.enabled !== true/)
  assert.match(source, /sessionEnabled/)
  assert.match(source, /live\.sessions\.includes\(id\)/)
  assert.match(source, /本对话的系统提示词注入/)
})

test('软预填充增删节点时不播放 FLIP 位移动画', () => {
  const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
  assert.match(source, /batchChanged/)
  assert.match(source, /previousIds/)
  assert.match(source, /node\.offsetTop/)
})

test('设置页保留跨规则草稿并确认破坏性操作', () => {
  const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
  assert.match(source, /drafts\.current\.set\(editingId, draft\)/)
  assert.match(source, /drafts\.current\.get\(rule\.id\) \?\? toDraft\(rule\)/)
  assert.match(source, /window\.confirm\(`确定删除规则/)
  assert.match(source, /window\.confirm\(`确定用/)
  assert.match(source, /撤销删除/)
  assert.match(source, /rules\.splice\(Math\.min\(deletedRule\.index, rules\.length\), 0, deletedRule\.rule\)/)
})

test('编辑器键盘可达且收起时不可聚焦，减少 FLIP 重排测量', () => {
  const source = readFileSync(new URL('../client/index.js', import.meta.url), 'utf8')
  const css = readFileSync(new URL('../client/src/styles.js', import.meta.url), 'utf8')
  assert.match(source, /inert: !open/)
  assert.match(source, /onMove: \(direction\) => move\(side, index, direction\)/)
  assert.match(source, /moveRule\(rule, event\.key === 'ArrowUp' \? -1 : 1\)/)
  assert.doesNotMatch(source, /上移消息|下移消息|上移规则|下移规则|spi-order-actions/)
  assert.match(source, /tabIndex: 0/)
  assert.match(source, /规则开关`/)
  assert.match(source, /消息内容`/)
  assert.match(source, /live\.error\s*\? createElement/)
  assert.match(source, /if \(token === lastToken\.current\) return/)
  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(css, /max-width: 580px/)
  assert.match(css, /flex-basis: calc\(100% - 32px\)/)
  assert.match(css, /overflow-wrap: anywhere/)
  assert.match(css, /--spi-ink-faint: var\(--dsw-alias-label-tertiary, #57606a\)/)
})

test('parseImportedRules 支持对象和裸数组，并补默认字段', () => {
  const fromObject = parseImportedRules(
    JSON.stringify({
      rules: [
        {
          id: 'soft',
          name: '导入的软规则',
          target: 'assistant',
          prefillMode: 'soft',
          soft: { before: [{ role: 'user', content: '请求' }], after: [] },
        },
      ],
    }),
  )
  assert.equal(fromObject.length, 1)
  assert.equal(fromObject[0].target, 'assistant')
  assert.equal(fromObject[0].prefillMode, 'soft')
  assert.deepEqual(fromObject[0].soft.before, [{ role: 'user', content: '请求' }])
  assert.equal(fromObject[0].mode, 'append')
  assert.equal(fromObject[0].schedule, 'every')

  const fromArray = parseImportedRules(JSON.stringify([{ content: '普通规则' }]))
  assert.equal(fromArray.length, 1)
  assert.equal(fromArray[0].id, 'imported-1')
  assert.equal(fromArray[0].name, '导入规则 1')
})

test('parseImportedRules 拒绝无效 JSON 和空规则', () => {
  assert.throws(() => parseImportedRules('{oops'), /不是有效的 JSON/)
  assert.throws(() => parseImportedRules('{"rules":[]}'), /没有规则/)
  assert.throws(() => parseImportedRules('{"foo":1}'), /没有 rules 数组/)
})

test('mergeImportedRules 追加并给重复 id 改名', () => {
  const result = mergeImportedRules(
    [{ id: 'same', name: '现有', content: 'A' }],
    [{ id: 'same', name: '导入', content: 'B' }, { id: 'new', name: '新', content: 'C' }],
  )
  assert.deepEqual(result.map((rule) => rule.id), ['same', 'same-imported-1', 'new'])
  assert.equal(result[1].content, 'B')
})

test('serializeRules 输出可再次解析的导出文件', () => {
  const text = serializeRules([{ id: 'a', name: '规则', content: '正文' }])
  const payload = JSON.parse(text)
  assert.equal(payload.format, 'dsh-system-prompt-injector.rules')
  assert.equal(payload.version, 1)
  assert.equal(payload.rules[0].content, '正文')
  assert.ok(!('contentLength' in payload.rules[0]))
  assert.equal(parseImportedRules(text)[0].id, 'a')
})
