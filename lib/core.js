/**
 * 系统提示词注入器的纯逻辑。
 *
 * 这个模块不依赖 Cordis / DSH 运行时，只负责：
 *   - 把配置里的规则规范化为统一结构；
 *   - 把规则应用到一次 `system-prompt/assemble` 产出的段列表上；
 *   - 处理 `contentFile`（路径展开、读取、热更新）；
 *   - 生成可供设置页展示的摘要。
 *
 * 真正的宿主接线在 `index.js`，这样这里的逻辑可以用 node:test 直接验证。
 */

import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { isAbsolute, resolve } from 'node:path'

/** 支持的模式：追加 / 前置 / 整段替换。 */
export const MODES = ['append', 'prepend', 'replace']

/** 注入目标：系统提示词 / assistant 预填充。 */
export const TARGETS = ['system', 'assistant']

/** Assistant 预填充方式：原生 / 软预填充。 */
export const PREFILL_MODES = ['native', 'soft']

/** 软预填充里允许伪造的消息角色。 */
export const SOFT_ROLES = ['user', 'assistant']

/** 注入时机：每轮都注入 / 仅会话第一次模型请求注入。 */
export const SCHEDULES = ['every', 'first']

/** 单条规则注入文本的上限，防止误把二进制文件塞进系统提示词。 */
export const MAX_TEXT_BYTES = 1024 * 1024

/**
 * 把任意字符串变成稳定的规则 id。
 * @param {unknown} value
 * @param {string} fallback
 * @returns {string}
 */
export function slugify(value, fallback = 'rule') {
  const text = typeof value === 'string' ? value.trim() : ''
  const slug = text
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff]+/g, '')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  return slug.length > 0 ? slug : fallback
}

/**
 * 规范化软预填充的一侧（基准前或基准后）的消息槽。
 * @param {unknown} value
 * @returns {Array<{ role: 'user' | 'assistant', content: string }>}
 */
function normalizeSoftSide(value) {
  if (!Array.isArray(value)) return []
  return value.map((raw) => {
    const item = raw !== null && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
    return {
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: typeof item.content === 'string' ? item.content : '',
    }
  })
}

/**
 * 规范化软预填充结构。
 * @param {unknown} value
 * @returns {{ before: Array<{ role: 'user' | 'assistant', content: string }>, after: Array<{ role: 'user' | 'assistant', content: string }> }}
 */
export function normalizeSoftPrefill(value) {
  const soft = value !== null && typeof value === 'object' ? /** @type {Record<string, unknown>} */ (value) : {}
  return {
    before: normalizeSoftSide(soft.before),
    after: normalizeSoftSide(soft.after),
  }
}

/**
 * 取出软预填充里真正有内容的消息槽。
 * @param {{ soft?: { before?: unknown[], after?: unknown[] } }} rule
 * @returns {{ before: Array<{ role: 'user' | 'assistant', content: string }>, after: Array<{ role: 'user' | 'assistant', content: string }> }}
 */
export function softSlotsOf(rule) {
  const soft = normalizeSoftPrefill(rule?.soft)
  const nonEmpty = (item) => item.content.trim().length > 0
  return {
    before: soft.before.filter(nonEmpty),
    after: soft.after.filter(nonEmpty),
  }
}

/**
 * 规范化一条规则。
 * @param {unknown} raw
 * @param {number} index
 * @returns {{ id: string, name: string, enabled: boolean, target: string, prefillMode: string, mode: string,
 *   schedule: string, content: string, contentFile: string,
 *   soft: { before: Array<{ role: 'user' | 'assistant', content: string }>, after: Array<{ role: 'user' | 'assistant', content: string }> },
 *   agentPresets: string[] }}
 */
export function normalizeRule(raw, index = 0) {
  const rule = raw !== null && typeof raw === 'object' ? /** @type {Record<string, unknown>} */ (raw) : {}
  const id = typeof rule.id === 'string' && rule.id.trim().length > 0
    ? slugify(rule.id, `rule-${index + 1}`)
    : `rule-${index + 1}`
  const mode = typeof rule.mode === 'string' && MODES.includes(rule.mode) ? rule.mode : 'append'
  const schedule = rule.schedule === 'first' ? 'first' : 'every'
  const target = rule.target === 'assistant' ? 'assistant' : 'system'
  const prefillMode = target === 'assistant' && rule.prefillMode === 'soft' ? 'soft' : 'native'
  return {
    id,
    name: typeof rule.name === 'string' && rule.name.trim().length > 0 ? rule.name.trim() : `规则 ${index + 1}`,
    enabled: rule.enabled !== false,
    target,
    prefillMode,
    mode,
    schedule,
    content: typeof rule.content === 'string' ? rule.content : '',
    contentFile: typeof rule.contentFile === 'string' ? rule.contentFile.trim() : '',
    soft: normalizeSoftPrefill(rule.soft),
    agentPresets: Array.isArray(rule.agentPresets)
      ? rule.agentPresets.map((item) => String(item).trim()).filter((item) => item.length > 0)
      : [],
  }
}

/**
 * 规范化整个规则列表：去重（后者丢弃）、补默认值。
 * @param {unknown} value
 * @returns {ReturnType<typeof normalizeRule>[]}
 */
export function normalizeRules(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const rules = []
  for (const [index, raw] of value.entries()) {
    const rule = normalizeRule(raw, index)
    if (seen.has(rule.id)) continue
    seen.add(rule.id)
    rules.push(rule)
  }
  return rules
}

/**
 * 展开 `~` 开头的路径；相对路径按 baseDir 解析。
 * @param {string} filePath
 * @param {string} baseDir
 * @returns {string}
 */
export function expandPath(filePath, baseDir) {
  let text = String(filePath).trim()
  if (text === '~') text = homedir()
  else if (text.startsWith('~/') || text.startsWith('~\\')) text = resolve(homedir(), text.slice(2))
  return isAbsolute(text) ? text : resolve(baseDir, text)
}

/**
 * 读取规则对应的正文。
 *
 * `contentFile` 优先于内联 `content`：文件存在且可读时用文件内容（每次都重新读，
 * 所以改文件后下一轮模型请求就会生效）；文件读不到时退回 `content`，并返回
 * 一条可展示的错误。规则里两者都没有时返回空文本。
 *
 * @param {ReturnType<typeof normalizeRule>} rule
 * @param {{ baseDir?: string, readFile?: (path: string) => string }} [options]
 * @returns {{ text: string, source: 'file' | 'inline' | 'empty', error?: string, path?: string }}
 */
export function resolveRuleText(rule, options = {}) {
  const readFile = options.readFile ?? ((path) => readFileSync(path, 'utf8'))
  const baseDir = options.baseDir ?? process.cwd()
  if (rule.contentFile.length > 0) {
    const filePath = expandPath(rule.contentFile, baseDir)
    try {
      const text = readFile(filePath)
      if (Buffer.byteLength(text, 'utf8') > MAX_TEXT_BYTES) {
        return { text: '', source: 'file', path: filePath, error: `文件超过 ${MAX_TEXT_BYTES} 字节上限` }
      }
      return { text, source: 'file', path: filePath }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      if (rule.content.trim().length > 0) {
        return { text: rule.content, source: 'inline', path: filePath, error: `读取文件失败，已回退到内联内容：${message}` }
      }
      return { text: '', source: 'empty', path: filePath, error: `读取文件失败：${message}` }
    }
  }
  return rule.content.trim().length > 0 ? { text: rule.content, source: 'inline' } : { text: '', source: 'empty' }
}

/**
 * 从组装上下文里读取当前 agent 的 preset id。
 * @param {object} context - `system-prompt/assemble` 的 context（含 agent）
 * @returns {string}
 */
export function agentPresetOf(context) {
  const agent = context && typeof context === 'object' ? /** @type {any} */ (context).agent : undefined
  const session = agent?.session
  const preset =
    session?.header?.agentPreset ?? session?.agentPreset ?? agent?.agentPreset ?? context?.agentPreset
  return typeof preset === 'string' ? preset : ''
}

/**
 * 判断规则是否适用于当前 agent。
 * @param {ReturnType<typeof normalizeRule>} rule
 * @param {object} context
 * @returns {boolean}
 */
export function ruleMatches(rule, context) {
  if (rule.agentPresets.length === 0) return true
  const preset = agentPresetOf(context)
  return preset.length > 0 && rule.agentPresets.includes(preset)
}

/**
 * 把规则应用到一次组装结果上。
 *
 * 规则按数组顺序生效：`replace` 会清掉之前所有段，`prepend` / `append` 在
 * 当前段列表两端插入。注入的段一律 `interpolate: false`，避免正文里的
 * `{{...}}` 被系统提示词的变量插值当成未知变量而整轮组装失败。
 *
 * @param {object} options
 * @param {{ sections?: Array<Record<string, unknown>> } & Record<string, unknown>} options.assembly
 * @param {ReturnType<typeof normalizeRule>[]} options.rules
 * @param {object} options.context
 * @param {string} [options.baseDir]
 * @param {(path: string) => string} [options.readFile]
 * @returns {{ assembly: object, applied: Array<{ id: string, name: string, mode: string, source: string, chars: number }>, errors: Array<{ id: string, message: string }> }}
 */
export function applyRules({ assembly, rules, context, baseDir, readFile }) {
  // 先剔除本插件此前注入的段，保证重复应用（例如 profile 重载后残留的另一个
  // 实例）不会把同一段文本叠两遍。注册表里的原始段不受影响。
  let sections = Array.isArray(assembly?.sections)
    ? assembly.sections.filter((section) => !String(section?.name ?? '').startsWith('dsh-spi:'))
    : []
  const applied = []
  const errors = []

  for (const rule of rules) {
    if (rule.enabled === false) continue
    // assistant 预填充规则不是系统提示词段，由 lib/prefill.js 处理。
    if (rule.target === 'assistant') continue
    if (!ruleMatches(rule, context)) continue
    const resolved = resolveRuleText(rule, { baseDir, readFile })
    if (resolved.error !== undefined) errors.push({ id: rule.id, message: resolved.error })
    if (resolved.text.trim().length === 0) continue

    const section = { name: `dsh-spi:${rule.id}`, text: resolved.text, interpolate: false }
    if (rule.mode === 'replace') sections = [section]
    else if (rule.mode === 'prepend') sections = [section, ...sections]
    else sections = [...sections, section]
    applied.push({ id: rule.id, name: rule.name, mode: rule.mode, source: resolved.source, chars: resolved.text.length })
  }

  return { assembly: { ...assembly, sections }, applied, errors }
}

/**
 * 生成设置页/状态接口用的规则摘要。
 * @param {ReturnType<typeof normalizeRule>[]} rules
 * @param {{ baseDir?: string, readFile?: (path: string) => string }} [options]
 * @returns {Array<Record<string, unknown>>}
 */
export function summarizeRules(rules, options = {}) {
  return rules.map((rule) => {
    if (rule.target === 'assistant' && rule.prefillMode === 'soft') {
      const { before, after } = softSlotsOf(rule)
      const slots = [...before, ...after]
      const text = slots.map((item) => item.content.trim()).join('\n')
      const preview = slots
        .map((item) => `${item.role === 'assistant' ? '助手' : '用户'}：${item.content.replace(/\s+/g, ' ').trim()}`)
        .join(' / ')
        .slice(0, 120)
      return {
        ...rule,
        contentLength: text.length,
        source: 'inline',
        error: '',
        filePath: '',
        preview,
      }
    }
    const resolved = resolveRuleText(rule, options)
    return {
      ...rule,
      contentLength: resolved.text.length,
      source: resolved.source,
      error: resolved.error ?? '',
      filePath: resolved.path ?? '',
      preview: resolved.text.replace(/\s+/g, ' ').trim().slice(0, 120),
    }
  })
}
