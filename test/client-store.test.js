import assert from 'node:assert/strict'
import test from 'node:test'
import { createStore } from '../client/src/store.js'

const response = (body) => ({ ok: true, json: async () => body })

test('未完成的刷新不会覆盖随后保存成功的规则', async () => {
  const originalFetch = globalThis.fetch
  let releaseRefresh
  let refreshStarted
  const started = new Promise((resolve) => { refreshStarted = resolve })
  globalThis.fetch = async (_url, init) => {
    if (init.method === 'PUT') return response({ enabled: true, sessions: [], rules: [{ id: 'new' }], revision: 2 })
    refreshStarted()
    return new Promise((resolve) => { releaseRefresh = resolve })
  }
  try {
    const store = createStore()
    const refreshing = store.refresh()
    await started
    assert.equal(await store.saveState({ rules: [{ id: 'new' }] }), true)
    releaseRefresh(response({ enabled: true, sessions: [], rules: [{ id: 'old' }], revision: 1 }))
    assert.equal(await refreshing, false)
    assert.deepEqual(store.snapshot().rules.map((rule) => rule.id), ['new'])
    assert.equal(store.snapshot().revision, 2)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('较早的刷新响应不覆盖较新的刷新结果', async () => {
  const originalFetch = globalThis.fetch
  const pending = []
  globalThis.fetch = () => new Promise((resolve) => { pending.push(resolve) })
  try {
    const store = createStore()
    const first = store.refresh()
    const second = store.refresh()
    pending[1](response({ enabled: true, sessions: [], rules: [{ id: 'latest' }], revision: 2 }))
    assert.equal(await second, true)
    pending[0](response({ enabled: true, sessions: [], rules: [{ id: 'stale' }], revision: 1 }))
    assert.equal(await first, false)
    assert.deepEqual(store.snapshot().rules.map((rule) => rule.id), ['latest'])
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('刷新失败在共享状态中提供可见错误消息', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => { throw new Error('网络断开') }
  try {
    const store = createStore()
    assert.equal(await store.refresh(), false)
    assert.match(store.snapshot().message.text, /刷新失败：网络断开/)
  } finally {
    globalThis.fetch = originalFetch
  }
})
