/**
 * 浏览器端的规则状态仓库。
 *
 * 设置页和聊天输入框旁的快捷开关共用同一份状态：任意一处保存，另一处会立即
 * 通过订阅收到新快照。总开关关闭时快捷按钮隐藏、所有会话停止注入；总开关
 * 开启后，还要打开某个对话的快捷开关，该对话才会生效。HTTP 接口由宿主半体提供。
 */

const API = '/system-prompt-injector/system-prompt-injector/state'

/** 导入文件里的规则规范化。和宿主端 normalizeRule 保持同一套字段。 */
export function normalizeImportedRule(raw, index = 0) {
  const rule = raw !== null && typeof raw === 'object' ? raw : {}
  const rawId = typeof rule.id === 'string' ? rule.id.trim() : ''
  const id = rawId.length > 0 ? rawId : `imported-${index + 1}`
  const target = rule.target === 'assistant' ? 'assistant' : 'system'
  const soft = rule.soft !== null && typeof rule.soft === 'object' ? rule.soft : {}
  const normalizeSide = (value) =>
    (Array.isArray(value) ? value : []).map((item) => ({
      role: item?.role === 'assistant' ? 'assistant' : 'user',
      content: typeof item?.content === 'string' ? item.content : '',
    }))
  return {
    id,
    name: typeof rule.name === 'string' && rule.name.trim().length > 0 ? rule.name.trim() : `导入规则 ${index + 1}`,
    enabled: rule.enabled !== false,
    target,
    prefillMode: target === 'assistant' && rule.prefillMode === 'soft' ? 'soft' : 'native',
    mode: ['append', 'prepend', 'replace'].includes(rule.mode) ? rule.mode : 'append',
    schedule: rule.schedule === 'first' ? 'first' : 'every',
    content: typeof rule.content === 'string' ? rule.content : '',
    contentFile: typeof rule.contentFile === 'string' ? rule.contentFile : '',
    soft: { before: normalizeSide(soft.before), after: normalizeSide(soft.after) },
    agentPresets: Array.isArray(rule.agentPresets)
      ? rule.agentPresets.map((item) => String(item).trim()).filter((item) => item.length > 0)
      : [],
  }
}

/**
 * 解析导入文件。支持导出文件对象 `{ rules: [...] }` 或裸规则数组。
 * @param {string} text
 * @returns {ReturnType<typeof normalizeImportedRule>[]}
 */
export function parseImportedRules(text) {
  let payload
  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error('不是有效的 JSON 文件')
  }
  const list = Array.isArray(payload) ? payload : Array.isArray(payload?.rules) ? payload.rules : null
  if (list === null) throw new Error('文件里没有 rules 数组')
  if (list.length === 0) throw new Error('文件里没有规则')
  return list.map((item, index) => normalizeImportedRule(item, index))
}

/**
 * 追加导入：保留现有规则，导入规则里重复的 id 自动改名。
 * @param {Array<Record<string, any>>} current
 * @param {Array<Record<string, any>>} incoming
 * @returns {Array<Record<string, any>>}
 */
export function mergeImportedRules(current, incoming) {
  const rules = (Array.isArray(current) ? current : []).map(plainRule)
  const used = new Set(rules.map((rule) => rule.id))
  let sequence = 0
  for (const item of Array.isArray(incoming) ? incoming : []) {
    const rule = plainRule(item)
    let id = rule.id
    while (used.has(id)) {
      sequence += 1
      id = `${rule.id}-imported-${sequence}`
    }
    used.add(id)
    rules.push({ ...rule, id })
  }
  return rules
}

/**
 * 生成导出 JSON 文本。
 * @param {Array<Record<string, any>>} rules
 * @returns {string}
 */
export function serializeRules(rules) {
  return `${JSON.stringify(
    {
      format: 'dsh-system-prompt-injector.rules',
      version: 1,
      exportedAt: new Date().toISOString(),
      rules: (Array.isArray(rules) ? rules : []).map(plainRule),
    },
    null,
    2,
  )}\n`
}

/** 只保留后端认识的字段，避免把 contentLength/preview 等展示字段写回去。 */
export function plainRule(rule) {
  const target = rule.target === 'assistant' ? 'assistant' : 'system'
  const soft = rule.soft !== null && typeof rule.soft === 'object' ? rule.soft : {}
  const normalizeSide = (value) =>
    (Array.isArray(value) ? value : []).map((item) => ({
      role: item?.role === 'assistant' ? 'assistant' : 'user',
      content: typeof item?.content === 'string' ? item.content : '',
    }))
  return {
    id: rule.id,
    name: rule.name,
    enabled: rule.enabled !== false,
    target,
    prefillMode: target === 'assistant' && rule.prefillMode === 'soft' ? 'soft' : 'native',
    mode: rule.mode || 'append',
    schedule: rule.schedule === 'first' ? 'first' : 'every',
    content: rule.content || '',
    contentFile: rule.contentFile || '',
    soft: {
      before: normalizeSide(soft.before),
      after: normalizeSide(soft.after),
    },
    agentPresets: Array.isArray(rule.agentPresets) ? rule.agentPresets : [],
  }
}

/**
 * 创建共享状态仓库。
 * @returns {{
 *   subscribe(listener: () => void): () => void,
 *   snapshot(): object,
 *   refresh(): Promise<boolean>,
 *   saveState(next: { enabled?: boolean, rules?: unknown[], sessionId?: string, sessionEnabled?: boolean }, successText?: string): Promise<boolean>,
 *   setMessage(message: { tone: string, text: string }): void,
 * }}
 */
export function createStore() {
  let state = {
    ready: false,
    enabled: false,
    sessions: [],
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
  let refreshSequence = 0
  let mutationSequence = 0

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
    const sequence = ++refreshSequence
    const mutationAtStart = mutationSequence
    try {
      const body = await request({})
      if (sequence !== refreshSequence || mutationAtStart !== mutationSequence || state.saving) return false
      if (typeof body.revision === 'number' && body.revision < state.revision) return false
      patch({
        ready: true,
        enabled: body.enabled === true,
        sessions: Array.isArray(body.sessions) ? body.sessions : [],
        rules: Array.isArray(body.rules) ? body.rules : [],
        revision: body.revision ?? 0,
        status: body.status ?? {},
        error: body.lastError || '',
      })
      return true
    } catch (error) {
      if (sequence !== refreshSequence || mutationAtStart !== mutationSequence || state.saving) return false
      const message = error instanceof Error ? error.message : String(error)
      patch({
        ready: true,
        error: message,
        message: { tone: 'error', text: '刷新失败：' + message },
      })
      return false
    }
  }

  const saveState = async (next, successText = '已保存，下一轮模型请求生效。') => {
    if (state.saving) return false
    mutationSequence += 1
    patch({ saving: true })
    try {
      // 只提交本次真正变化的字段：总开关和会话开关不会顺带覆盖规则。
      const payload = {}
      if (next.enabled !== undefined) payload.enabled = next.enabled === true
      if (next.rules !== undefined) payload.rules = next.rules.map(plainRule)
      if (next.sessionId !== undefined || next.sessionEnabled !== undefined) {
        payload.sessionId = next.sessionId
        payload.sessionEnabled = next.sessionEnabled === true
      }
      const body = await request({ method: 'PUT', body: JSON.stringify(payload) })
      patch({
        ready: true,
        enabled: body.enabled === true,
        sessions: Array.isArray(body.sessions) ? body.sessions : [],
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
