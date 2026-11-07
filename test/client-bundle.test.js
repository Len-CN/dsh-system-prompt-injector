/**
 * 客户端 bundle 冒烟测试：用最小 loader / React / DOM 桩执行构建产物，确认
 * 工厂能加载并注册 settings.section。
 */

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

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
    useState(initial) {
      return [initial, () => {}]
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
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ enabled: false, rules: [], revision: 0 }) })
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

  // 只有规则卡里的开关可以 disabled：它没有禁用样式，视觉上不变。
  const disabledUses = source.match(/disabled:\s*[^,\n]+/g) ?? []
  assert.deepEqual(disabledUses, ['disabled: live.saving'])

  // 按钮不再有 :disabled 的半透明样式，否则请求一来一回就会闪一下。
  assert.ok(!/:disabled\s*\{[^}]*opacity/.test(css), '按钮不应通过 opacity 表达禁用')
  assert.ok(!/\bdisabled:\s*live\.saving,\s*onClick/.test(source), '新建规则按钮不应在保存时禁用')
})
