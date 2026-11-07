/**
 * 浏览器端的规则状态仓库。
 *
 * 设置页和聊天输入框旁的快捷开关共用同一份状态：任意一处保存，另一处会立即
 * 通过订阅收到新快照。HTTP 接口由宿主半体提供。
 */

const API = '/system-prompt-injector/system-prompt-injector/state'

/** 只保留后端认识的字段，避免把 contentLength/preview 等展示字段写回去。 */
export function plainRule(rule) {
  return {
    id: rule.id,
    name: rule.name,
    enabled: rule.enabled !== false,
    mode: rule.mode || 'append',
    schedule: rule.schedule === 'first' ? 'first' : 'every',
    content: rule.content || '',
    contentFile: rule.contentFile || '',
    agentPresets: Array.isArray(rule.agentPresets) ? rule.agentPresets : [],
  }
}

/**
 * 创建共享状态仓库。
 * @returns {{
 *   subscribe(listener: () => void): () => void,
 *   snapshot(): object,
 *   refresh(): Promise<boolean>,
 *   saveState(next: { enabled?: boolean, rules?: unknown[] }, successText?: string): Promise<boolean>,
 *   setMessage(message: { tone: string, text: string }): void,
 * }}
 */
export function createStore() {
  let state = {
    ready: false,
    enabled: false,
    rules: [],
    revision: 0,
    status: {},
    error: '',
    saving: false,
    message: { tone: 'idle', text: '' },
  }
  /** @type {Set<() => void>} */
  const listeners = new Set()
  let snapshot = state

  const emit = () => {
    snapshot = state
    for (const listener of [...listeners]) {
      try {
        listener()
      } catch (error) {
        console.error('[system-prompt-injector] listener failed', error)
      }
    }
  }

  const patch = (fields) => {
    state = { ...state, ...fields }
    emit()
  }

  const request = async (init) => {
    const response = await fetch(API, {
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      ...init,
    })
    const body = await response.json().catch(() => undefined)
    if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`)
    return body
  }

  const subscribe = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const refresh = async () => {
    if (state.saving) return false
    try {
      const body = await request({})
      patch({
        ready: true,
        enabled: body.enabled === true,
        rules: Array.isArray(body.rules) ? body.rules : [],
        revision: body.revision ?? 0,
        status: body.status ?? {},
        error: body.lastError || '',
      })
      return true
    } catch (error) {
      patch({
        ready: true,
        error: error instanceof Error ? error.message : String(error),
      })
      return false
    }
  }

  const saveState = async (next, successText = '已保存，下一轮模型请求生效。') => {
    if (state.saving) return false
    patch({ saving: true })
    try {
      const current = {
        enabled: next.enabled === undefined ? state.enabled : next.enabled !== false,
        rules: (next.rules === undefined ? state.rules : next.rules).map(plainRule),
      }
      const body = await request({ method: 'PUT', body: JSON.stringify(current) })
      patch({
        ready: true,
        enabled: body.enabled === true,
        rules: Array.isArray(body.rules) ? body.rules : [],
        revision: body.revision ?? 0,
        status: body.status ?? {},
        error: body.lastError || '',
        saving: false,
        message: { tone: 'ok', text: successText },
      })
      return true
    } catch (error) {
      patch({
        saving: false,
        message: { tone: 'error', text: '保存失败：' + (error instanceof Error ? error.message : String(error)) },
      })
      return false
    }
  }

  return {
    subscribe,
    snapshot: () => snapshot,
    refresh,
    saveState,
    setMessage: (message) => patch({ message }),
  }
}
