/**
 * dsh-system-prompt-injector — 宿主半体。
 *
 * 在每次 `system-prompt/assemble` 的 waterfall 末尾应用规则，改写最终交给模型的
 * 系统提示词（即 messages[0]，role=system 的那条消息）。支持：
 *   - append / prepend：在系统提示词末尾/开头注入自定义信息；
 *   - replace：用自定义内容完全替换系统提示词；
 *   - transform：对当前系统提示词做正则替换（删除/改写某些段落）。
 *
 * 规则来源有两条：
 *   - profile 的 cordis.patch.yml 里本插件的 `config.rules`（静态配置）；
 *   - `~/.dsh/dsh-system-prompt-injector.json`（设置页保存、支持热加载）。
 *
 * 插件自身不直接触碰 session 历史，也不修改任何宿主文件；它只改变本次组装结果，
 * 因此不会污染历史记录，也不会破坏其他插件的段。
 */

import { copyFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { applyRules, agentPresetOf, expandPath, normalizeRules } from './core.js'
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
 * @param {{ enabled?: boolean, rules?: unknown[], statePath?: string }} config
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
          await settings.update(INJECTOR_ID, { enabled: state.enabled, rules: state.rules }, descriptor.revision)
        } catch (error) {
          log('Settings 持久化失败，改为只写状态文件', error)
        }
      }
    }
    await writeStateFile(statePath, state)
  }

  const initial = {
    enabled: config?.enabled !== false,
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
        writeStateFile(statePath, store.getState()).catch((error) => {
          if (live) log('规则文件镜像写入失败', error)
        })
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

  // 主接缝：system-prompt/assemble 是宿主在每次模型步骤前组装系统提示词的权威
  // waterfall。用 prepend 让自己位于最外层：先 await next() 拿到其他插件处理后的
  // 段列表，再应用本插件的规则，保证最终结果以这里为准。
  ctx.on(
    'system-prompt/assemble',
    async (assembly, context, next) => {
      const result = (await next()) ?? assembly
      try {
        await store.refreshFromDiskIfChanged()
        const state = store.getState()
        if (!state.enabled) return result
        if (state.rules.length === 0) return result
        const sessionId = typeof context?.agent?.session?.id === 'string' ? context.agent.session.id : ''
        const usedFirst = sessionId.length > 0 ? firstInjections.get(sessionId) : undefined
        const rules = state.rules.filter(
          (rule) => rule.schedule !== 'first' || sessionId.length === 0 || usedFirst?.has(rule.id) !== true,
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
          applied: applied.applied,
          errors: applied.errors,
        }
        if (applied.applied.length === 0 && applied.errors.length === 0) return result
        if (sessionId.length > 0 && applied.applied.length > 0) {
          const firstIds = new Set(rules.filter((rule) => rule.schedule === 'first').map((rule) => rule.id))
          const consumed = applied.applied.map((item) => item.id).filter((id) => firstIds.has(id))
          if (consumed.length > 0) markFirstInjected(sessionId, consumed)
        }
        if (applied.errors.length > 0) {
          log(`规则应用出现 ${applied.errors.length} 个错误：${applied.errors.map((item) => item.id).join(', ')}`)
        }
        if (applied.applied.length > 0) {
          log(
            `已应用 ${applied.applied.length} 条规则（${applied.applied.map((item) => `${item.id}:${item.mode}`).join(', ')}）` +
              ` preset=${lastApplied.agentPreset || '(none)'}`,
          )
        }
        return applied.assembly
      } catch (error) {
        log('系统提示词注入失败，本轮保持原样', error)
        return result
      }
    },
    { prepend: true },
  )

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
            statePath,
            ruleCount: store.rules.length,
            enabled: store.enabled,
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
