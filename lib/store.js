/**
 * 规则状态存储。
 *
 * 两个持久化通道：
 *   1. Harness Settings 服务存在时，设置页的写入走 `settings.update()`，落到
 *      profile 的 cordis.patch.yml；
 *   2. 否则写 `statePath` 指向的 JSON 文件（默认 ~/.dsh/dsh-system-prompt-injector.json）。
 *
 * 无论走哪条通道，运行期都以本对象为唯一可写副本；直接编辑 JSON 文件时，
 * `refreshFromDiskIfChanged()` 会按 mtime 检测并热加载。
 */

import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { dirname } from 'node:path'
import { normalizeRule, normalizeRules } from './core.js'

/**
 * @typedef {{
 *   enabled: boolean,
 *   sessions: string[],
 *   rules: ReturnType<typeof normalizeRules>
 * }} RuleState
 */

/**
 * 规范化按会话启停的 id 列表：去空、去重、最多保留 500 个。
 * @param {unknown} value
 * @returns {string[]}
 */
export function normalizeSessionIds(value) {
  if (!Array.isArray(value)) return []
  const ids = []
  for (const item of value) {
    if (typeof item !== 'string') continue
    const id = item.trim()
    if (id.length === 0 || ids.includes(id)) continue
    ids.push(id)
  }
  return ids.slice(-500)
}

/**
 * 原子写 JSON（先写临时文件再 rename）。
 * @param {string} filePath
 * @param {RuleState} state
 */
export async function writeStateFile(filePath, state) {
  await mkdir(dirname(filePath), { recursive: true })
  const temp = `${filePath}.tmp-${process.pid}-${Date.now()}-${randomUUID()}`
  await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  await rename(temp, filePath)
}

/**
 * 读取 JSON 状态文件；文件不存在或损坏时返回 undefined。
 *
 * `enabled` 是总开关。旧版总开关关闭时，快捷按钮也不应该保留开启状态，
 * 所以总开关关闭期间一律返回空的 `sessions`。
 * 兼容上一版临时字段 `showComposerToggle`：没有 `enabled` 时按它迁移；
 * 两个开关都不存在时默认开启总开关。
 * @param {string} filePath
 * @returns {Promise<RuleState | undefined>}
 */
export async function readStateFile(filePath) {
  try {
    const text = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object') return undefined
    const enabled =
      typeof parsed.enabled === 'boolean'
        ? parsed.enabled
        : typeof parsed.showComposerToggle === 'boolean'
          ? parsed.showComposerToggle
          : true
    return {
      enabled,
      sessions: enabled ? normalizeSessionIds(parsed.sessions) : [],
      rules: normalizeRules(parsed.rules),
    }
  } catch {
    return undefined
  }
}

export class RuleStore {
  /**
   * @param {object} options
   * @param {{ enabled?: boolean, showComposerToggle?: boolean, sessions?: unknown, rules?: unknown }} [options.initial]
   * @param {string} [options.filePath]
   * @param {(state: RuleState) => Promise<void>} [options.persist]
   * @param {(message: string, error?: unknown) => void} [options.report]
   */
  constructor({ initial, filePath, persist, report } = {}) {
    this.enabled =
      initial?.enabled === undefined
        ? initial?.showComposerToggle === true
        : initial.enabled === true
    /** 已开启注入的会话 id；默认空集合 = 所有对话默认关闭。 */
    this.sessions = new Set(this.enabled ? normalizeSessionIds(initial?.sessions) : [])
    this.rules = normalizeRules(initial?.rules)
    this.revision = 0
    this.filePath = filePath
    this.persist = persist
    this.report = report ?? (() => {})
    /** 上次从磁盘加载时的 mtime；0 表示还没读过。 */
    this.fileMtime = 0
    /** 最近一次保存/加载的错误，供设置页显示。 */
    this.lastError = ''
    /** 串行化异步持久化，避免并发会话开关彼此覆盖。 */
    this.pendingWrite = Promise.resolve()
    this.pendingWriteCount = 0
  }

  /** @returns {RuleState} */
  getState() {
    return {
      enabled: this.enabled,
      sessions: [...this.sessions],
      rules: this.rules,
    }
  }

  /**
   * 某个会话是否允许注入：总开关必须开启，且该会话的快捷开关也必须开启。
   * @param {unknown} sessionId
   * @returns {boolean}
   */
  isSessionEnabled(sessionId) {
    return (
      this.enabled === true &&
      typeof sessionId === 'string' &&
      sessionId.length > 0 &&
      this.sessions.has(sessionId)
    )
  }

  /**
   * 开启或关闭一个会话的注入。总开关关闭时不能打开会话开关。
   * @param {unknown} sessionId
   * @param {boolean} enabled
   * @returns {Promise<RuleState>}
   */
  async setSessionEnabled(sessionId, enabled) {
    const key = typeof sessionId === 'string' ? sessionId.trim() : ''
    if (key.length === 0) throw new Error('sessionId 不能为空')
    return this.replace(() => {
      if (this.enabled !== true && enabled === true) return null
      const sessions = new Set(this.sessions)
      sessions.delete(key)
      if (enabled === true) {
        sessions.add(key)
        while (sessions.size > 500) {
          const oldest = sessions.values().next().value
          if (oldest === undefined) break
          sessions.delete(oldest)
        }
      }
      return { sessions: [...sessions] }
    })
  }

  /**
   * 从 statePath 读取一次（启动时使用）。
   * @returns {Promise<boolean>} 是否读到了有效内容
   */
  async loadFromFile() {
    if (this.filePath === undefined || this.pendingWriteCount > 0 || this.revision > 0) return false
    const state = await readStateFile(this.filePath)
    if (state === undefined || this.pendingWriteCount > 0 || this.revision > 0) return false
    this.enabled = state.enabled
    this.sessions = new Set(state.sessions)
    this.rules = state.rules
    this.revision += 1
    try {
      this.fileMtime = (await stat(this.filePath)).mtimeMs
    } catch {
      this.fileMtime = 0
    }
    this.report(`已从 ${this.filePath} 加载 ${this.rules.length} 条规则`)
    return true
  }

  /**
   * 文件被外部编辑时热加载；最多每 1 秒检查一次。
   * @param {number} [now]
   * @returns {Promise<boolean>} 是否发生了重载
   */
  async refreshFromDiskIfChanged(now = Date.now()) {
    if (this.filePath === undefined || this.pendingWriteCount > 0) return false
    if (this.lastCheckAt !== undefined && now - this.lastCheckAt < 1000) return false
    this.lastCheckAt = now
    let info
    try {
      info = await stat(this.filePath)
    } catch {
      return false
    }
    if (info.mtimeMs === this.fileMtime) return false
    const revisionAtStart = this.revision
    const state = await readStateFile(this.filePath)
    if (state === undefined || this.pendingWriteCount > 0 || this.revision !== revisionAtStart) return false
    this.enabled = state.enabled
    this.sessions = new Set(state.sessions)
    this.rules = state.rules
    this.fileMtime = info.mtimeMs
    this.revision += 1
    this.report(`检测到 ${this.filePath} 变更，已热加载 ${this.rules.length} 条规则`)
    return true
  }

  /**
   * 保存新的状态。先持久化再替换内存，避免"界面显示改了、实际没存进去"。
   * 未提供的字段保持原值，因此设置页、快捷键开关可以分别做局部更新。
   * 总开关关闭时清空会话开关，重新开启后所有快捷按钮都从关闭状态开始。
   * @param {{ enabled?: boolean, showComposerToggle?: boolean, sessions?: unknown, rules?: unknown }} next
   * @returns {Promise<RuleState>}
   */
  async replace(next) {
    const save = async () => {
      const update = typeof next === 'function' ? next() : next
      if (update === null) return this.getState()
      const enabled =
        update?.enabled === undefined
          ? update?.showComposerToggle === undefined
            ? this.enabled
            : update.showComposerToggle === true
          : update.enabled === true
      const sessions =
        enabled === true
          ? normalizeSessionIds(update?.sessions === undefined ? [...this.sessions] : update.sessions)
          : []
      const state = {
        enabled,
        sessions,
        rules: normalizeRules(update?.rules === undefined ? this.rules : update.rules),
      }
      try {
        if (this.persist !== undefined) await this.persist(state)
        else if (this.filePath !== undefined) await writeStateFile(this.filePath, state)
      } catch (error) {
        this.lastError = error instanceof Error ? error.message : String(error)
        throw error
      }
      this.enabled = state.enabled
      this.sessions = new Set(state.sessions)
      this.rules = state.rules
      this.revision += 1
      this.lastError = ''
      if (this.filePath !== undefined) {
        try {
          this.fileMtime = (await stat(this.filePath)).mtimeMs
        } catch {
          this.fileMtime = 0
        }
      }
      return this.getState()
    }
    this.pendingWriteCount += 1
    const result = this.pendingWrite.then(save).finally(() => { this.pendingWriteCount -= 1 })
    this.pendingWrite = result.catch(() => {})
    return result
  }

  /**
   * 新增或更新一条规则（按 id）。
   * @param {unknown} rule
   * @returns {Promise<RuleState>}
   */
  async upsert(rule) {
    return this.replace(() => {
      const rules = [...this.rules]
      const incoming = normalizeRule(rule, rules.length)
      const existingIndex = rules.findIndex((item) => item.id === incoming.id)
      if (existingIndex < 0) rules.push(incoming)
      else rules[existingIndex] = incoming
      return { rules }
    })
  }

  /**
   * 删除一条规则。
   * @param {string} id
   * @returns {Promise<{ removed: boolean, state: RuleState }>}
   */
  async remove(id) {
    const rules = this.rules.filter((rule) => rule.id !== id)
    const removed = rules.length !== this.rules.length
    if (removed) await this.replace({ rules })
    return { removed, state: this.getState() }
  }
}
