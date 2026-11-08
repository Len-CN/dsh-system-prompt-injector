/**
 * dsh-system-prompt-injector — 宿主半体。
 *
 * 在 `system-prompt/assemble` 的 waterfall 中应用规则；宿主 complete 段优先于
 * waterfall 的改写，不能被本插件覆盖。支持：
 *   - append / prepend：在系统提示词末尾/开头注入自定义信息；
 *   - replace：用自定义内容完全替换系统提示词；
 *   - assistant 预填充：原生模式和软预填充；只改本次模型请求的消息，不写入
 *     会话历史。
 *
 * 规则来源有两条：
 *   - profile 的 cordis.patch.yml 里本插件的 `config.rules`（静态配置）；
 *   - `~/.dsh/dsh-system-prompt-injector.json`（设置页保存、支持热加载）。
 *
 * 插件自身不直接触碰 session 历史，也不修改任何宿主文件；它只改变本次组装结果，
 * 因此不会污染历史记录，也不会破坏其他插件的段。
 */

import { copyFileSync, existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { applyRules, agentPresetOf, expandPath, normalizeRules, ruleMatches } from './core.js'
import { attachPrefill, collectPrefill, isPrefillRule } from './prefill.js'
import { registerRoutes } from './http.js'
import { RuleStore, writeStateFile } from './store.js'

/** 与 cordis.patch.yml 里的 profile 条目 id 保持一致；也是 Settings 命名空间。 */
export const INJECTOR_ID = 'system-prompt-injector'

export const name = 'system-prompt-injector'

/**
 * 可选加载 Config schema：没有 schemastery 的纯 Node 环境仍能加载插件。
 * @returns {Promise<any>}
 */
async function loadConfigModule() {
  try {
    return await import('./config.js')
  } catch {
    return undefined
  }
}

/** 没有 schemastery 时的透传校验器（Cordis 通过 Standard Schema 接口校验）。 */
const passThroughConfig = {
  '~standard': {
    version: 1,
    vendor: 'dsh-system-prompt-injector',
    validate(value) {
      return { value }
    },
  },
}

const configModule = await loadConfigModule()

export const Config = (() => {
  try {
    if (configModule === undefined) return passThroughConfig
    return configModule.createConfigSchema()
  } catch {
    return passThroughConfig
  }
})()

/**
 * 挂载宿主半体。
 * @param {import('@deepseek-ai/cordis').Context} ctx
 * @param {{ enabled?: boolean, sessions?: string[], rules?: unknown[], statePath?: string }} config
 */
export function apply(ctx, config) {
  const log = (message, error) => {
    const line = `[system-prompt-injector] ${message}`
    if (error === undefined) ctx.logger?.info?.(line)
    else ctx.logger?.warn?.(`${line}: ${String(error)}`)
    if (ctx.logger === undefined) {
      if (error === undefined) process.stderr.write(`${line}\n`)
      else process.stderr.write(`${line}: ${String(error)}\n`)
    }
  }

  const configuredPath = typeof config?.statePath === 'string' ? config.statePath.trim() : ''
  const dshHome = typeof process.env.DSH_HOME === 'string' && process.env.DSH_HOME.trim().length > 0
    ? process.env.DSH_HOME.trim()
    : join(homedir(), '.dsh')
  const statePath = configuredPath.length > 0 ? expandPath(configuredPath, dshHome) : join(dshHome, 'dsh-system-prompt-injector.json')

  // 旧版本把状态文件写在了用户主目录根下（homedir() 而不是 homedir()/.dsh）。
  // 默认路径下如果新位置还没有文件，自动把旧文件迁移过来，避免规则丢失。
  if (configuredPath.length === 0) {
    const legacyPath = join(homedir(), 'dsh-system-prompt-injector.json')
    try {
      if (!existsSync(statePath) && existsSync(legacyPath)) copyFileSync(legacyPath, statePath)
    } catch {
      // 迁移失败不阻塞插件启动；规则仍可通过设置页重新保存。
    }
  }

  /** 设置页写入：优先 Settings 服务（落 profile patch），同时写 JSON 镜像。 */
  const persist = async (state) => {
    const settings = ctx.get('settings')
    if (settings !== undefined) {
      const descriptor = settings.describe().find((entry) => entry.ns === INJECTOR_ID)
      if (descriptor !== undefined) {
        try {
          await settings.update(
            INJECTOR_ID,
            {
              enabled: state.enabled,
              sessions: state.sessions,
              rules: state.rules,
            },
            descriptor.revision,
          )
        } catch (error) {
          log('Settings 持久化失败，未保存本次变更', error)
          throw error
        }
      }
    }
    await writeStateFile(statePath, state)
  }

  const initial = {
    enabled: config?.enabled !== false,
    sessions: Array.isArray(config?.sessions) ? config.sessions : [],
    rules: normalizeRules(config?.rules),
  }
  const store = new RuleStore({ initial, filePath: statePath, persist, report: log })

  // 启动时如果配置文件里没有规则，尝试从 statePath 加载一份便携副本。
  if (initial.rules.length === 0) {
    ctx.effect(
      () => {
        let live = true
        store
          .loadFromFile()
          .then((loaded) => {
            if (live && loaded) log(`已加载 ${store.rules.length} 条规则（${statePath}）`)
          })
          .catch((error) => log('规则文件加载失败', error))
        return () => {
          live = false
        }
      },
      'system-prompt-injector: 初始规则加载',
    )
  } else {
    // 静态配置优先时，把配置镜像到 statePath，保证设置页和配置文件一致。
    ctx.effect(
      () => {
        let live = true
        // 镜像与设置页保存串行，期间阻止热读取旧文件覆盖静态配置。
        store.pendingWriteCount += 1
        const mirror = store.pendingWrite.then(async () => {
          await writeStateFile(statePath, store.getState())
          store.fileMtime = (await stat(statePath)).mtimeMs
        })
        store.pendingWrite = mirror.catch((error) => {
          if (live) log('规则文件镜像写入失败', error)
        }).finally(() => { store.pendingWriteCount -= 1 })
        return () => {
          live = false
        }
      },
      'system-prompt-injector: 初始规则镜像',
    )
  }

  /** 最近一次实际应用的结果，供设置页/诊断展示。 */
  let lastApplied = {
    at: '',
    agentPreset: '',
    sessionId: '',
    applied: [],
    errors: [],
  }

  /**
   * 每会话的首次注入记录：sessionId -> 已经注入过的 rule id。
   * 只影响 `schedule: 'first'` 的规则；Map 超过 500 个会话时淘汰最旧的。
   */
  const firstInjections = new Map()
  const markFirstInjected = (sessionId, ruleIds) => {
    let used = firstInjections.get(sessionId)
    if (used === undefined) {
      used = new Set()
      firstInjections.set(sessionId, used)
    }
    for (const id of ruleIds) used.add(id)
    if (firstInjections.size > 500) {
      const oldest = firstInjections.keys().next().value
      if (oldest !== undefined) firstInjections.delete(oldest)
    }
  }

  /** 宿主在 waterfall 后恢复有效 complete 注册段；组装结果本身不含 complete 标记。 */
  const hasCompleteSection = (context) => {
    const prompt = ctx.get('systemPrompt')
    const layers = prompt?.layers
    if (typeof layers?.merge !== 'function') return true // 无法核实时不能声称改写生效。
    try {
      const sections = layers.merge(context?.scope, (layer) => layer.sections)
      return [...sections.values()].some((section) => section.complete === true)
    } catch {
      return true
    }
  }

  /** 系统规则在组装时暂存，真正进入 stream 才确认一次请求已发出。 */
  const systemBySignal = new WeakMap()
  // prepend 只控制 waterfall 内的次序；不能改变宿主 complete 段的优先级。
  ctx.on(
    'system-prompt/assemble',
    async (assembly, context, next) => {
      const signal = context?.signal
      if (signal !== undefined && signal !== null && typeof signal === 'object') systemBySignal.delete(signal)
      const result = (await next()) ?? assembly
      try {
        await store.refreshFromDiskIfChanged()
        const state = store.getState()
        if (!state.enabled) return result
        if (state.rules.length === 0) return result
        const sessionId = typeof context?.agent?.session?.id === 'string' ? context.agent.session.id : ''
        if (!store.isSessionEnabled(sessionId)) return result
        // complete 由注册表控制，宿主会在 waterfall 后丢弃所有改写的 sections。
        if (hasCompleteSection(context)) {
          lastApplied = {
            at: new Date().toISOString(), agentPreset: agentPresetOf(context), sessionId,
            applied: [],
            errors: state.rules.filter((rule) => rule.target === 'system' && rule.enabled && ruleMatches(rule, context))
              .map((rule) => ({ id: rule.id, message: '宿主 complete 系统段优先，waterfall 注入未生效' })),
          }
          return result
        }
        const phase = context?.agent?.phase
        const atSessionStart = phase?.kind === 'running' && phase.turn === 1 && phase.step === 0
        const usedFirst = sessionId.length > 0 ? firstInjections.get(sessionId) : undefined
        const rules = state.rules.filter(
          (rule) => rule.schedule !== 'first' || (atSessionStart && usedFirst?.has(rule.id) !== true),
        )
        if (rules.length === 0) return result
        const applied = applyRules({
          assembly: result,
          rules,
          context,
          baseDir: dshHome,
        })
        lastApplied = {
          at: new Date().toISOString(),
          agentPreset: agentPresetOf(context),
          sessionId,
          applied: [],
          errors: applied.errors,
        }
        if (applied.applied.length === 0 && applied.errors.length === 0) return result
        if (signal !== undefined && signal !== null && typeof signal === 'object') {
          const firstIds = new Set(rules.filter((rule) => rule.schedule === 'first').map((rule) => rule.id))
          systemBySignal.set(signal, {
            sessionId,
            firstIds: applied.applied.map((item) => item.id).filter((id) => firstIds.has(id)),
            applied: applied.applied,
          })
        }
        if (applied.errors.length > 0) {
          log(`规则应用出现 ${applied.errors.length} 个错误：${applied.errors.map((item) => item.id).join(', ')}`)
        }
        return applied.assembly
      } catch (error) {
        log('系统提示词注入失败，本轮保持原样', error)
        return result
      }
    },
    { prepend: true },
  )

  // ---------------------------------------------------------------------------
  // Assistant 预填充（原生 / 软预填充）
  //
  // 目标：在本次模型请求的 messages 里预置内容，但**不写进会话历史**（不进
  // session log、界面也不显示）。
  //
  // 接缝：
  //   1. `agent/pre-step` 里判断这一步是不是「用户刚发来新消息」，是的话算出
  //      预填充计划（原生文本 / 软预填充消息槽），按 turn 的 AbortSignal 存起来；
  //   2. 包装 `llm.prepareCall()` 返回的 prepared call：真正 dispatch 时把消息
  //      数组复制一份，在末尾补原生 assistant 消息，或把软预填充消息插到真实
  //      用户消息前后。`callConfigEquals()` 不比较 messages，所以不会触发
  //      INVALID_PREPARED_CALL。
  // ---------------------------------------------------------------------------

  /** 每个 turn 的 signal -> 预填充计划（signal 每个 turn 新建，WeakMap 自动回收）。 */
  const prefillBySignal = new WeakMap()
  let prefillSeq = 0
  let lastPrefill = {
    at: '',
    sessionId: '',
    applied: [],
    errors: [],
    dispatchedAt: '',
    chars: 0,
    preview: '',
    mode: '',
    messageCount: 0,
  }

  /** 这一步是否带着用户亲手输入的消息（工具续跑、运行时上下文都不算）。 */
  const hasHumanMessage = (messages) =>
    Array.isArray(messages) &&
    messages.some((message) => message?.role === 'user' && message?.source?.kind === 'user')

  ctx.on('agent/pre-step', async (payload, next) => {
    const decision = await next()
    const signal = payload?.signal
    if (signal !== undefined && signal !== null) prefillBySignal.set(signal, { text: '', softBefore: [], softAfter: [] })
    try {
      if (signal === undefined || signal === null) return decision
      if (decision?.kind === 'reject' || !hasHumanMessage(decision?.messages)) return decision
      await store.refreshFromDiskIfChanged()
      const state = store.getState()
      const agent = payload?.agent
      const sessionId = typeof agent?.session?.id === 'string' ? agent.session.id : ''
      if (!state.enabled || !store.isSessionEnabled(sessionId)) return decision
      const usedFirst = sessionId.length > 0 ? firstInjections.get(sessionId) : undefined
      // 「仅首次」必须是这个会话真正意义上的第一条用户消息（turn 1 / step 1）。
      // 否则插件重启后，老会话里的下一条消息也会被当成「首次」，预填充会突然
      // 插进进行到一半的对话里。
      const turn = typeof payload?.turn === 'number' ? payload.turn : 0
      const step = typeof payload?.step === 'number' ? payload.step : 0
      const atSessionStart = turn === 1 && step === 1
      const rules = state.rules.filter(
        (rule) => rule.schedule !== 'first' || (atSessionStart && usedFirst?.has(rule.id) !== true),
      )
      const { text, softBefore, softAfter, applied, errors } = collectPrefill({
        rules,
        context: { agent },
        baseDir: dshHome,
        usedFirst,
      })
      const firstIds = new Set(
        state.rules.filter((rule) => isPrefillRule(rule) && rule.schedule === 'first').map((rule) => rule.id),
      )
      prefillBySignal.set(signal, {
        text, softBefore, softAfter, sessionId,
        firstIds: applied.map((item) => item.id).filter((id) => firstIds.has(id)),
        applied,
      })
      if (applied.length > 0) lastPrefill = { at: new Date().toISOString(), sessionId, applied: [], errors }
      if (errors.length > 0) log(`预填充规则出现 ${errors.length} 个错误：${errors.map((item) => item.id).join(', ')}`)
    } catch (error) {
      log('assistant 预填充计算失败，本轮跳过', error)
    }
    return decision
  })

  /** 包装 llm.prepareCall，把预填充挂到本次 dispatch 的消息数组上。 */
  const PREFILL_PATCH = Symbol.for('dsh-system-prompt-injector.prepareCall')
  const installPrefillBridge = () => {
    const llm = ctx.get('llm')
    if (llm === undefined || llm === null || typeof llm.prepareCall !== 'function') return
    if (llm.prepareCall[PREFILL_PATCH] === true) return
    const original = llm.prepareCall
    const patched = async function (config, signal, configure) {
      const prepared = await original.call(this, config, signal, configure)
      try {
        const pending = signal === undefined || signal === null ? undefined : prefillBySignal.get(signal)
        const system = signal === undefined || signal === null ? undefined : systemBySignal.get(signal)
        if (pending !== undefined || system !== undefined) {
          return attachPrefill(prepared, {
            text: pending?.text,
            softBefore: pending?.softBefore,
            softAfter: pending?.softAfter,
            nextId: () => `spi-prefill-${++prefillSeq}`,
            onDispatch: (dispatch) => {
              if (pending?.sessionId && dispatch.messages.length > 0) {
                markFirstInjected(pending.sessionId, pending.firstIds)
                lastPrefill = {
                  ...lastPrefill,
                  applied: pending.applied,
                  dispatchedAt: new Date().toISOString(),
                  chars: dispatch.chars,
                  preview: dispatch.preview,
                  mode: dispatch.mode,
                  messageCount: dispatch.messages.length,
                }
                log(`预填充已随请求发出（${dispatch.messages.length} 条消息，${dispatch.chars} 字符，${dispatch.mode}）`)
              }
            },
            onStream: () => {
              if (system?.sessionId && system.applied.length > 0) {
                markFirstInjected(system.sessionId, system.firstIds)
                lastApplied = { ...lastApplied, at: new Date().toISOString(), applied: system.applied }
                log(`系统规则已随请求发出（${system.applied.map((item) => item.id).join(', ')}）`)
              }
            },
          })
        }
      } catch (error) {
        log('assistant 预填充挂载失败，本轮跳过', error)
      }
      return prepared
    }
    Object.defineProperty(patched, PREFILL_PATCH, { value: true })
    try {
      llm.prepareCall = patched
    } catch (error) {
      log('无法包装 llm.prepareCall，assistant 预填充不可用', error)
      return
    }
    ctx.effect(
      () => () => {
        if (llm.prepareCall === patched) llm.prepareCall = original
      },
      'system-prompt-injector: assistant 预填充桥',
    )
    log('assistant 预填充接缝已挂载')
  }
  installPrefillBridge()
  try {
    ctx.inject(['llm'], () => installPrefillBridge())
  } catch (error) {
    log('无法订阅 llm 服务，assistant 预填充不可用', error)
  }

  // 设置页 HTTP 接口：webServer 是可选服务，等它出现再注册。
  let routesDisposed
  const ensureRoutes = () => {
    if (routesDisposed !== undefined) return
    const webServer = ctx.get('webServer')
    if (webServer === undefined) return
    routesDisposed = ctx.effect(
      () =>
        registerRoutes({
          ctx,
          store,
          id: INJECTOR_ID,
          baseDir: dshHome,
          log,
          status: () => ({
            lastApplied,
            lastPrefill,
            statePath,
            ruleCount: store.rules.length,
            enabled: store.enabled,
            activeSessions: [...store.sessions],
          }),
        }),
      'system-prompt-injector: HTTP 路由',
    )
  }
  ensureRoutes()
  try {
    ctx.inject(['webServer'], () => ensureRoutes())
  } catch (error) {
    log('无法订阅 webServer，设置页接口不可用', error)
  }

  // 测试接缝：组合可以在 apply 时拿到 store 实例，生产路径不会用到。
  if (typeof config?.onStore === 'function') {
    try {
      config.onStore(store)
    } catch (error) {
      log('onStore 回调失败', error)
    }
  }
}
