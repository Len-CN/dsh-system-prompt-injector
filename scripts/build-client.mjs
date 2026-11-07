#!/usr/bin/env node
/**
 * 把浏览器半体构建成 Harness 客户端模块系统要求的 lazy-CJS factory。
 *
 * 这个项目不引入打包器：这里只做需要的最小工作——
 *   1. 读 client/index.js 及其相对依赖；
 *   2. 把 import/export 语法改写成一个极小的 require 图；
 *   3. 内联 styles.js 里的 CSS；
 *   4. 输出 `window.__ModuleLoader__.load({ id, factory })`。
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, posix, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const entry = join(root, 'client', 'index.js')
const outFile = join(root, 'client', 'client.js')

/** 浏览器源码命名空间。 */
const MODULE_PREFIX = 'dspi:'

/** 由加载器提供的平台模块。 */
const EXTERNALS = new Map([
  ['react', 'react'],
  ['react-dom', 'react-dom'],
  ['react/jsx-runtime', 'react/jsx-runtime'],
])

/**
 * 把 `{ a, b as c }` 解构语句展开成 const 声明。
 * @param {string} clause
 * @param {string} local
 * @returns {string[]}
 */
function destructure(clause, local) {
  const lines = []
  for (const piece of clause.split(',')) {
    const trimmed = piece.trim()
    if (trimmed.length === 0) continue
    const [from, to] = trimmed.split(/\s+as\s+/).map((value) => value.trim())
    lines.push(`const ${to ?? from} = ${local}[${JSON.stringify(from)}];`)
  }
  return lines
}

/**
 * 转换单个源文件。
 * @param {string} id
 * @param {string} source
 * @param {(specifier: string) => string} resolveId
 * @returns {{ id: string, deps: Map<string, string>, body: string }}
 */
function transform(id, source, resolveId) {
  const deps = new Map()
  const exported = new Set()
  let index = 0

  let body = source.replace(
    /^[ \t]*import\s+(?:([\w$]+)\s*,\s*)?(?:\{([^}]*)\}|\*\s+as\s+([\w$]+)|([\w$]+))?\s*from\s*['"]([^'"]+)['"];?[ \t]*$/gm,
    (whole, defaultName, named, namespace, bare, specifier) => {
      if (EXTERNALS.has(specifier)) {
        const local = `__ext${index++}`
        const parts = [`const ${local} = __require(${JSON.stringify(EXTERNALS.get(specifier))});`]
        if (bare) parts.push(`const ${bare} = ${local};`)
        if (defaultName) parts.push(`const ${defaultName} = ${local}.default ?? ${local};`)
        if (namespace) parts.push(`const ${namespace} = ${local};`)
        if (named) parts.push(...destructure(named, local))
        return parts.join('\n')
      }
      const target = resolveId(specifier)
      deps.set(specifier, target)
      const local = `__m${index++}`
      const parts = [`const ${local} = __require(${JSON.stringify(target)});`]
      if (bare) parts.push(`const ${bare} = ${local};`)
      if (defaultName) parts.push(`const ${defaultName} = ${local}.default ?? ${local};`)
      if (namespace) parts.push(`const ${namespace} = ${local};`)
      if (named) parts.push(...destructure(named, local))
      return parts.join('\n')
    },
  )

  body = body.replace(/^[ \t]*import\s*['"]([^'"]+)['"];?[ \t]*$/gm, (whole, specifier) => {
    if (EXTERNALS.has(specifier)) return `__require(${JSON.stringify(EXTERNALS.get(specifier))});`
    const target = resolveId(specifier)
    deps.set(specifier, target)
    return `__require(${JSON.stringify(target)});`
  })

  body = body.replace(/^[ \t]*export\s+default\s+/gm, 'exports.default = ')
  body = body.replace(/^[ \t]*export\s+(async\s+)?function\s+([\w$]+)/gm, (whole, asyncKeyword, name) => {
    exported.add(name)
    return `${asyncKeyword ?? ''}function ${name}`
  })
  body = body.replace(/^[ \t]*export\s*\{([^}]*)\};?[ \t]*$/gm, (whole, names) => {
    const lines = []
    for (const piece of names.split(',')) {
      const trimmed = piece.trim()
      if (trimmed.length === 0) continue
      const [from, to] = trimmed.split(/\s+as\s+/).map((value) => value.trim())
      lines.push(`exports[${JSON.stringify(to ?? from)}] = ${from};`)
    }
    return lines.join('\n')
  })
  body = body.replace(/^[ \t]*export\s+(const|let|var|class)\s+([\w$]+)/gm, (whole, keyword, name) => {
    exported.add(name)
    return `${keyword} ${name}`
  })

  if (exported.size > 0) {
    body += '\n' + [...exported].map((name) => `exports[${JSON.stringify(name)}] = ${name};`).join('\n')
  }
  if (/^\s*export\s/m.test(body)) throw new Error(`${id}: 仍有未处理的 export 语法`)
  return { id, deps, body }
}

/**
 * 从入口递归收集模块。
 * @param {string} entryPath
 */
async function collect(entryPath) {
  const modules = new Map()
  const resolveId = (fromFile, specifier) =>
    MODULE_PREFIX + posix.normalize(relative(root, resolve(dirname(fromFile), specifier)).split('\\').join('/'))
  const visit = async (filePath) => {
    const id = MODULE_PREFIX + posix.normalize(relative(root, filePath).split('\\').join('/'))
    if (modules.has(id)) return id
    const source = await readFile(filePath, 'utf8')
    const module = transform(id, source, (specifier) => resolveId(filePath, specifier))
    modules.set(id, module)
    for (const specifier of module.deps.keys()) await visit(resolve(dirname(filePath), specifier))
    return id
  }
  const entryId = await visit(entryPath)
  return [modules.get(entryId), ...[...modules.values()].filter((module) => module.id !== entryId)]
}

/**
 * 生成 loader 注册文件。
 * @param {string} entryId
 * @param {Array<{ id: string, body: string }>} modules
 * @param {string} packageName
 * @param {string} css
 */
function emit(entryId, modules, packageName, css) {
  const cssTag = `${packageName}/styles.css`
  const lines = []
  lines.push('window.__ModuleLoader__.load({')
  lines.push(`\tid: ${JSON.stringify(packageName)},`)
  lines.push('\tfactory: (require) => {')
  lines.push('\t\ttry {')
  lines.push('\t\tvar module = { exports: {} };')
  lines.push('\t\tvar exports = module.exports;')
  lines.push('\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: "Module" });')
  lines.push('\t\tvar __require = require;')
  lines.push('\t\tvar __factories = {};')
  lines.push('\t\tvar __cache = {};')
  lines.push('\t\tfunction __load(id) {')
  lines.push('\t\t\tif (Object.prototype.hasOwnProperty.call(__cache, id)) return __cache[id].exports;')
  lines.push('\t\t\tvar factory = __factories[id];')
  lines.push('\t\t\tif (factory === undefined) {')
  lines.push('\t\t\t\tif (typeof id === "string" && id.indexOf("dspi:") !== 0) return __require(id);')
  lines.push('\t\t\t\tthrow new Error("system-prompt-injector: unknown module " + id);')
  lines.push('\t\t\t}')
  lines.push('\t\t\tvar record = { exports: {} };')
  lines.push('\t\t\t__cache[id] = record;')
  lines.push('\t\t\tfactory(record, record.exports, __load);')
  lines.push('\t\t\treturn record.exports;')
  lines.push('\t\t}')
  lines.push('\t\tif (typeof document !== "undefined" && document.querySelector(\'style[data-plugin-css="' + cssTag + '"]\') === null) {')
  lines.push('\t\t\tvar __style = document.createElement("style");')
  lines.push(`\t\t\t__style.dataset.plugin = ${JSON.stringify(packageName)};`)
  lines.push(`\t\t\t__style.dataset.pluginCss = ${JSON.stringify(cssTag)};`)
  lines.push(`\t\t\t__style.textContent = ${JSON.stringify(css)};`)
  lines.push('\t\t\tdocument.head.appendChild(__style);')
  lines.push('\t\t}')
  for (const module of modules) {
    lines.push(`\t\t__factories[${JSON.stringify(module.id)}] = (module, exports, __require) => {`)
    lines.push(module.body)
    lines.push('\t\t};')
  }
  lines.push('\t\tvar entry = __load(' + JSON.stringify(entryId) + ');')
  lines.push('\t\treturn entry;')
  lines.push('\t\t} catch (error) {')
  lines.push('\t\t\tglobalThis.__DSH_SYSTEM_PROMPT_INJECTOR_ERROR__ = error;')
  lines.push(`\t\t\tconsole.error(${JSON.stringify(packageName + ': factory failed')}, error);`)
  lines.push('\t\t\tthrow error;')
  lines.push('\t\t}')
  lines.push('\t}')
  lines.push('});')
  return lines.join('\n') + '\n'
}

const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const packageName = manifest.name
const modules = await collect(entry)
const stylesSource = await readFile(join(root, 'client', 'src', 'styles.js'), 'utf8')
const stylesMatch = /export const SPI_CSS = `([\s\S]*)`\n/.exec(stylesSource)
if (stylesMatch === null) throw new Error('client/src/styles.js: 找不到 SPI_CSS 模板字符串')
const css = stylesMatch[1].replace(/\\`/g, '`').replace(/\\\$\{/g, '${')

await mkdir(dirname(outFile), { recursive: true })
await writeFile(outFile, emit(modules[0].id, modules, packageName, css), 'utf8')
process.stdout.write(`built ${relative(root, outFile)} (${modules.length} modules)\n`)
