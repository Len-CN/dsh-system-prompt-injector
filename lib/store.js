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
import { dirname } from 'node:path'
import { normalizeRules } from './core.js'

/**
 * @typedef {{ enabled: boolean, rules: ReturnType<typeof normalizeRules> }} RuleState
 */

/**
 * 原子写 JSON（先写临时文件再 rename）。
 * @param {string} filePath
 * @param {RuleState} state
 */
export async function writeStateFile(filePath, state) {
  await mkdir(dirname(filePath), { recursive: true })
  const temp = `${filePath}.tmp-${process.pid}-${Date.now()}`
  await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  await rename(temp, filePath)
}

/**
 * 读取 JSON 状态文件；文件不存在或损坏时返回 undefined。
 * @param {string} filePath
 * @returns {Promise<RuleState | undefined>}
 */
export async function readStateFile(filePath) {
  try {
    const text = await readFile(filePath, 'utf8')
    const parsed = JSON.parse(text)
    if (parsed === null || typeof parsed !== 'object') return undefined
    return {
      enabled: parsed.enabled !== false,
      rules: normalizeRules(parsed.rules),
    }
  } catch {
    return undefined
  }
}

export class RuleStore {
  /**
   * @param {object} options
   * @param {{ enabled?: boolean, rules?: unknown }} [options.initial]
   * @param {string} [options.filePath]
   * @param {(state: RuleState) => Promise<void>} [options.persist]
   * @param {(message: string, error?: unknown) => void} [options.report]
   */
  constructor({ initial, filePath, persist, report } = {}) {
    this.enabled = initial?.enabled !== false
    this.rules = normalizeRules(initial?.rules)
    this.revision = 0
    this.filePath = filePath
    this.persist = persist
    this.report = report ?? (() => {})
    /** 上次从磁盘加载时的 mtime；0 表示还没读过。 */
    this.fileMtime = 0
    /** 最近一次保存/加载的错误，供设置页显示。 */
    this.lastError = ''
  }

  /** @returns {RuleState} */
  getState() {
    return { enabled: this.enabled, rules: this.rules }
  }

  /**
   * 从 statePath 读取一次（启动时使用）。
   * @returns {Promise<boolean>} 是否读到了有效内容
   */
  async loadFromFile() {
    if (this.filePath === undefined) return false
    const state = await readStateFile(this.filePath)
    if (state === undefined) return false
    this.enabled = state.enabled
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
    if (this.filePath === undefined) return false
    if (this.lastCheckAt !== undefined && now - this.lastCheckAt < 1000) return false
    this.lastCheckAt = now
    let info
    try {
      info = await stat(this.filePath)
    } catch {
      return false
    }
    if (info.mtimeMs === this.fileMtime) return false
    const state = await readStateFile(this.filePath)
    if (state === undefined) return false
    this.enabled = state.enabled
    this.rules = state.rules
    this.fileMtime = info.mtimeMs
    this.revision += 1
    this.report(`检测到 ${this.filePath} 变更，已热加载 ${this.rules.length} 条规则`)
    return true
  }

  /**
   * 保存新的状态。先持久化再替换内存，避免"界面显示改了、实际没存进去"。
   * @param {{ enabled?: boolean, rules?: unknown }} next
   * @returns {Promise<RuleState>}
   */
  async replace(next) {
    const state = {
      enabled: next?.enabled === undefined ? this.enabled : next.enabled !== false,
      rules: normalizeRules(next?.rules === undefined ? this.rules : next.rules),
    }
    try {
      if (this.persist !== undefined) await this.persist(state)
      else if (this.filePath !== undefined) {
        await writeStateFile(this.filePath, state)
        try {
          this.fileMtime = (await stat(this.filePath)).mtimeMs
        } catch {
          this.fileMtime = 0
        }
      }
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error)
      throw error
    }
    this.enabled = state.enabled
    this.rules = state.rules
    this.revision += 1
    this.lastError = ''
    return this.getState()
  }

  /**
   * 新增或更新一条规则（按 id）。
   * @param {unknown} rule
   * @returns {Promise<RuleState>}
   */
  async upsert(rule) {
    const rules = normalizeRules([...this.rules, rule])
    const incoming = rules[rules.length - 1]
    const existingIndex = this.rules.findIndex((item) => item.id === incoming.id)
    if (existingIndex >= 0) rules.splice(existingIndex, 1)
    else rules.pop()
    if (existingIndex < 0) rules.push(incoming)
    else rules.splice(existingIndex, 0, incoming)
    return this.replace({ rules })
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
