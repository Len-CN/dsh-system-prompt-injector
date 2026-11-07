/**
 * 设置页使用的 HTTP 接口。
 *
 * 路由挂在 Harness 自身的 Web 服务器上，因此继承它的浏览器信任边界与鉴权。
 * 只提供规则状态的读写和诊断，不提供任意文件访问——`contentFile` 的读取由规则
 * 决定，设置页只能看到读取结果摘要。
 */

import { summarizeRules } from './core.js'

/** 请求体大小上限。 */
export const MAX_BODY_BYTES = 1024 * 1024

/**
 * 生成每条路由的路径。
 * @param {string} id - profile 条目 id
 * @returns {{ state: string, status: string }}
 */
export function routesFor(id) {
  const slug = String(id).replace(/[^a-zA-Z0-9._-]+/g, '-') || 'default'
  return {
    state: `/system-prompt-injector/${slug}/state`,
    status: `/system-prompt-injector/${slug}/status`,
  }
}

/**
 * @param {import('node:http').ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 */
function sendJson(res, status, body) {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    'cache-control': 'no-store',
  })
  res.end(payload)
}

/**
 * 读取有大小上限的 JSON 请求体。
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<unknown>}
 */
async function readJsonBody(req) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > MAX_BODY_BYTES) throw new Error(`请求体超过 ${MAX_BODY_BYTES} 字节上限`)
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString('utf8')
  if (text.trim().length === 0) return undefined
  return JSON.parse(text)
}

/**
 * 注册路由。
 * @param {object} options
 * @param {import('@deepseek-ai/cordis').Context} options.ctx
 * @param {import('./store.js').RuleStore} options.store
 * @param {string} options.id
 * @param {() => Record<string, unknown>} [options.status]
 * @param {(message: string, error?: unknown) => void} [options.log]
 * @param {string} [options.baseDir]
 * @returns {() => void} disposer
 */
export function registerRoutes({ ctx, store, id, status, log, baseDir }) {
  const webServer = ctx.get('webServer')
  if (webServer === undefined) {
    log?.('没有挂载 webServer，设置页接口不可用')
    return () => {}
  }
  const routes = routesFor(id)

  const stateView = () => {
    const state = store.getState()
    return {
      id,
      revision: store.revision,
      enabled: state.enabled,
      rules: summarizeRules(state.rules, { baseDir }),
      lastError: store.lastError,
      status: status?.() ?? {},
    }
  }

  const stateDisposer = webServer.register({
    kind: 'exact',
    path: routes.state,
    handler: async (req, res) => {
      try {
        if (req.method === 'GET' || req.method === 'HEAD') {
          sendJson(res, 200, stateView())
          return
        }
        if (req.method !== 'PUT' && req.method !== 'POST') {
          sendJson(res, 405, { error: 'method-not-allowed' })
          return
        }
        const body = await readJsonBody(req)
        if (body === null || typeof body !== 'object') {
          sendJson(res, 400, { error: 'expected {"enabled": boolean, "rules": [...]}' })
          return
        }
        const saved = await store.replace(body)
        sendJson(res, 200, {
          saved: { enabled: saved.enabled, rules: saved.rules.map((rule) => rule.id) },
          ...stateView(),
        })
      } catch (error) {
        log?.(`state 路由失败：${String(error)}`)
        sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
      }
    },
  })

  const statusDisposer = webServer.register({
    kind: 'exact',
    path: routes.status,
    handler: async (req, res) => {
      try {
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          sendJson(res, 405, { error: 'method-not-allowed' })
          return
        }
        sendJson(res, 200, stateView())
      } catch (error) {
        log?.(`status 路由失败：${String(error)}`)
        sendJson(res, 500, { error: error instanceof Error ? error.message : String(error) })
      }
    },
  })

  return () => {
    statusDisposer()
    stateDisposer()
  }
}
