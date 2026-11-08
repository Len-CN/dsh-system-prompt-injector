/**
 * Assistant 预填充的纯逻辑。
 *
 * 支持两种模式：
 *   - 原生：在**本次模型请求**的消息数组末尾追加一条只存在于请求里的 assistant
 *     消息，模型把它当成自己已经写好的开头继续生成；
 *   - 软预填充：以真实用户消息为基准，在请求里插入假 user / assistant 消息，
 *     用上下文惯性引导模型。
 *
 * 两种模式都不会往会话历史或界面里写消息。这个模块不依赖 Cordis / DSH 运行时，
 * 方便直接用 node:test 验证。
 */

import { resolveRuleText, ruleMatches, softSlotsOf } from './core.js'

/** DeepSeek Messages 在 thinking mode + tools 下要求每条 assistant 历史都带 thinking。 */
const DEEPSEEK_PREFILL_THINKING = '继续上文。'

/**
 * 是否需要给合成 assistant 消息补一条 thinking 占位块。
 * 目前 DeepSeek Messages 的 thinking mode 会校验历史 assistant 消息的 content[].thinking；
 * OpenAI-compatible / Anthropic adapter 会忽略或无签名时降级为文本，不受影响。
 * @param {unknown} provider
 * @returns {boolean}
 */
export function needsThinkingReplay(provider) {
  return typeof provider === 'string' && provider.includes('deepseek')
}

/**
 * 判断一条规则是否属于 assistant 预填充。
 * @param {{ target?: string }} rule
 * @returns {boolean}
 */
export function isPrefillRule(rule) {
  return rule?.target === 'assistant'
}

/**
 * 挑出本次请求要用的预填充规则，并把正文拼成一段。
 *
 * 多条预填充规则按数组顺序用空行连接；`mode` 对预填充没有意义，一律忽略。
 *
 * @param {object} options
 * @param {Array<Record<string, any>>} options.rules
 * @param {object} options.context - 形如 `{ agent }` 的上下文，用于 agentPresets 过滤
 * @param {string} [options.baseDir]
 * @param {(path: string) => string} [options.readFile]
 * @param {Set<string>} [options.usedFirst] - 该会话已经消费过的「仅首次」规则 id
 * @returns {{ text: string, softBefore: Array<{ role: 'user' | 'assistant', content: string, ruleId: string }>,
 *   softAfter: Array<{ role: 'user' | 'assistant', content: string, ruleId: string }>,
 *   applied: Array<{ id: string, name: string, mode: string, source: string, chars: number }>,
 *   errors: Array<{ id: string, message: string }> }}
 */
export function collectPrefill({ rules, context, baseDir, readFile, usedFirst }) {
  const parts = []
  const softBefore = []
  const softAfter = []
  const applied = []
  const errors = []

  for (const rule of Array.isArray(rules) ? rules : []) {
    if (!isPrefillRule(rule)) continue
    if (rule.enabled === false) continue
    if (!ruleMatches(rule, context)) continue
    if (rule.schedule === 'first' && usedFirst?.has(rule.id) === true) continue

    if (rule.prefillMode === 'soft') {
      const slots = softSlotsOf(rule)
      if (slots.before.length === 0 && slots.after.length === 0) {
        errors.push({ id: rule.id, message: '软预填充没有填写任何消息' })
        continue
      }
      const ruleBefore = slots.before.map((item) => ({ ...item, content: item.content.trim(), ruleId: rule.id }))
      const ruleAfter = slots.after.map((item) => ({ ...item, content: item.content.trim(), ruleId: rule.id }))
      softBefore.push(...ruleBefore)
      softAfter.push(...ruleAfter)
      const chars = [...ruleBefore, ...ruleAfter].reduce((sum, item) => sum + item.content.length, 0)
      applied.push({ id: rule.id, name: rule.name, mode: 'soft', source: 'inline', chars })
      continue
    }

    const resolved = resolveRuleText(rule, { baseDir, readFile })
    if (resolved.error !== undefined) errors.push({ id: rule.id, message: resolved.error })
    const text = resolved.text.trim()
    if (text.length === 0) continue
    parts.push(text)
    applied.push({ id: rule.id, name: rule.name, mode: 'assistant', source: resolved.source, chars: text.length })
  }

  return { text: parts.join('\n\n'), softBefore, softAfter, applied, errors }
}

/**
 * 计算一次预填充实际使用的模式。
 * @param {{ text?: string, softBefore?: unknown[], softAfter?: unknown[] }} plan
 * @returns {'native' | 'soft' | 'mixed'}
 */
export function prefillModeOf(plan) {
  const native = typeof plan?.text === 'string' && plan.text.trim().length > 0
  const soft = (plan?.softBefore?.length ?? 0) + (plan?.softAfter?.length ?? 0) > 0
  return native && soft ? 'mixed' : soft ? 'soft' : 'native'
}

/**
 * 构造一条只存在于请求里的消息。
 * @param {{ role?: 'user' | 'assistant', text: string, provider?: string, model?: string, id: string, thinking?: string }} options
 * @returns {Record<string, unknown>}
 */
export function createInjectedMessage({ role = 'assistant', text, provider, model, id, thinking }) {
  const assistant = role === 'assistant'
  const content = []
  if (assistant && typeof thinking === 'string' && thinking.trim().length > 0) {
    content.push({ type: 'reasoning', text: thinking })
  }
  content.push({ type: 'text', text })
  return {
    id,
    role: assistant ? 'assistant' : 'user',
    content,
    source: assistant
      ? {
          kind: 'model',
          ...(typeof provider === 'string' ? { provider } : {}),
          ...(typeof model === 'string' ? { model } : {}),
        }
      : { kind: 'dsh-spi-soft' },
  }
}

/**
 * 构造一条只存在于请求里的 assistant 消息。
 * @param {{ text: string, provider?: string, model?: string, id: string, thinking?: string }} options
 * @returns {Record<string, unknown>}
 */
export function createPrefillMessage({ text, provider, model, id, thinking }) {
  return createInjectedMessage({ role: 'assistant', text, provider, model, id, thinking })
}

/**
 * 找到请求消息里最后一条真实用户消息的下标。
 * 运行时上下文、系统提醒等 user 消息的 source.kind 不是 user，会被跳过。
 * @param {Array<Record<string, any>>} messages
 * @returns {number}
 */
export function findHumanMessageIndex(messages) {
  if (!Array.isArray(messages)) return -1
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role === 'user' && message?.source?.kind === 'user') return index
  }
  return -1
}

/**
 * 在请求消息末尾追加一条 assistant 预填充消息。
 *
 * 只有最后一条消息不是 assistant 时才追加：如果请求已经以 assistant 结尾，再追加
 * 一条 assistant 只会把两段接在一起，没有意义。
 *
 * @param {Record<string, any>} options - `GenerateOptions`
 * @param {{ text: string, nextId: () => string }} prefill
 * @returns {Record<string, any>}
 */
export function appendPrefillMessage(options, { text, nextId, thinking }) {
  const messages = Array.isArray(options?.messages) ? options.messages : []
  const last = messages[messages.length - 1]
  if (last?.role === 'assistant') return options
  return {
    ...options,
    messages: [
      ...messages,
      createPrefillMessage({
        text,
        provider: options?.provider,
        model: options?.model,
        id: nextId(),
        thinking,
      }),
    ],
  }
}

/**
 * 把软预填充消息插到真实用户消息的前后，并在需要时补上原生 assistant 预填充。
 *
 * 返回实际注入的消息数组，供诊断与状态展示使用。
 *
 * @param {Record<string, any>} options
 * @param {{ text?: string, softBefore?: Array<{ role: 'user' | 'assistant', content: string }>,
 *   softAfter?: Array<{ role: 'user' | 'assistant', content: string }>, nextId: () => string }} plan
 * @returns {{ options: Record<string, any>, injected: Array<Record<string, any>> }}
 */
export function applyPrefill(options, { text, softBefore = [], softAfter = [], nextId }) {
  const original = options !== null && typeof options === 'object' ? options : {}
  const messages = Array.isArray(original.messages) ? original.messages : []
  const before = Array.isArray(softBefore) ? softBefore : []
  const after = Array.isArray(softAfter) ? softAfter : []
  const thinking = needsThinkingReplay(original.provider) ? DEEPSEEK_PREFILL_THINKING : ''
  const injected = []
  let nextMessages = messages

  if (before.length > 0 || after.length > 0) {
    const baseline = findHumanMessageIndex(messages)
    if (baseline >= 0) {
      const beforeMessages = before.map((item) =>
        createInjectedMessage({
          role: item.role,
          text: item.content,
          provider: original.provider,
          model: original.model,
          id: nextId(),
          thinking,
        }),
      )
      const afterMessages = after.map((item) =>
        createInjectedMessage({
          role: item.role,
          text: item.content,
          provider: original.provider,
          model: original.model,
          id: nextId(),
          thinking,
        }),
      )
      // 把真实用户消息和软预填充消息一起推到请求末尾，避免 DSH 的运行时上下文
      // 消息（AGENTS.md、时间等）隔在预填充和真实用户消息之间。
      nextMessages = [
        ...messages.slice(0, baseline),
        ...messages.slice(baseline + 1),
        ...beforeMessages,
        messages[baseline],
        ...afterMessages,
      ]
      injected.push(...beforeMessages, ...afterMessages)
    }
  }

  const trimmed = typeof text === 'string' ? text.trim() : ''
  if (trimmed.length > 0) {
    const last = nextMessages[nextMessages.length - 1]
    // softAfter 的 assistant 属于示例对话；原生文本仍需成为最后一条 assistant。
    if (last?.role !== 'assistant' || after.length > 0) {
      const nativeMessage = createPrefillMessage({
        text: trimmed,
        provider: original.provider,
        model: original.model,
        id: nextId(),
        thinking,
      })
      nextMessages = [...nextMessages, nativeMessage]
      injected.push(nativeMessage)
    }
  }

  if (injected.length === 0) return { options: original, injected }
  return { options: { ...original, messages: nextMessages }, injected }
}

/**
 * 包装 `llm.prepareCall()` 返回的 prepared call，让它的 `stream()` 带上预填充。
 *
 * 不修改也不依赖 prepared 的其余字段，`config` 等原样透传；`callConfigEquals()`
 * 只比较 provider/model/采样参数，不比较 messages，所以替换消息数组不会触发
 * `INVALID_PREPARED_CALL`。
 *
 * @param {object} prepared
 * @param {{ text?: string, softBefore?: Array<{ role: 'user' | 'assistant', content: string }>,
 *   softAfter?: Array<{ role: 'user' | 'assistant', content: string }>,
 *   nextId: () => string, onStream?: () => void,
 *   onDispatch?: (dispatch: { messages: Array<Record<string, unknown>>, chars: number, preview: string, mode: string }) => void }} prefill
 * @returns {object}
 */
export function attachPrefill(prepared, { text, softBefore = [], softAfter = [], nextId, onDispatch, onStream }) {
  const trimmed = typeof text === 'string' ? text.trim() : ''
  const hasSoft = (Array.isArray(softBefore) && softBefore.length > 0) || (Array.isArray(softAfter) && softAfter.length > 0)
  if (prepared === null || typeof prepared !== 'object' || typeof prepared.stream !== 'function') return prepared
  if (trimmed.length === 0 && !hasSoft && typeof onStream !== 'function') return prepared
  const stream = prepared.stream
  return {
    ...prepared,
    stream(options) {
      const applied = applyPrefill(options, { text: trimmed, softBefore, softAfter, nextId })
      const result = stream(applied.options)
      if (applied.injected.length > 0) {
        const texts = applied.injected.map((message) => {
          const block = Array.isArray(message?.content)
            ? message.content.find((item) => item?.type === 'text')
            : undefined
          return typeof block?.text === 'string' ? block.text : ''
        })
        const chars = texts.reduce((sum, value) => sum + value.length, 0)
        const preview = texts.join(' / ').replace(/\s+/g, ' ').trim().slice(0, 120)
        try {
          onDispatch?.({
            messages: applied.injected,
            chars,
            preview,
            mode: prefillModeOf({ text: trimmed, softBefore, softAfter }),
          })
        } catch {
          // 诊断回调失败不影响请求。
        }
      }
      try {
        onStream?.()
      } catch {
        // 诊断回调失败不影响请求。
      }
      return result
    },
  }
}
