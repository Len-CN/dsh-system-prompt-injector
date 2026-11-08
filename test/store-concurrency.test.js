import assert from 'node:assert/strict'
import test from 'node:test'
import { RuleStore } from '../lib/store.js'

test('并发切换不同会话开关不会互相覆盖', async () => {
  let releaseFirst
  const firstPersist = new Promise((resolve) => { releaseFirst = resolve })
  const saved = []
  const store = new RuleStore({
    initial: { enabled: true, sessions: [], rules: [] },
    persist: async (state) => {
      if (saved.length === 0) await firstPersist
      saved.push([...state.sessions])
    },
  })
  const first = store.setSessionEnabled('a', true)
  const second = store.setSessionEnabled('b', true)
  releaseFirst()
  await Promise.all([first, second])
  assert.deepEqual([...store.sessions], ['a', 'b'])
  assert.deepEqual(saved, [['a'], ['a', 'b']])
})

test('队列中某次保存失败不会阻断后续更新', async () => {
  let attempts = 0
  const store = new RuleStore({
    initial: { enabled: true },
    persist: async () => {
      if (++attempts === 1) throw new Error('暂时不可写')
    },
  })
  const first = store.setSessionEnabled('a', true)
  const second = store.setSessionEnabled('b', true)
  await assert.rejects(first, /暂时不可写/)
  await second
  assert.deepEqual([...store.sessions], ['b'])
})
