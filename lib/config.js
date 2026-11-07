/**
 * 插件 Config schema。
 *
 * `@deepseek-ai/schemastery` 是 Harness 宿主组合的 peer 依赖，不是本包的普通
 * 依赖。因此这里单独成模块，入口按需动态加载：没有 schemastery 的纯 Node 测试
 * 环境也能加载插件本体。
 */

import z from '@deepseek-ai/schemastery'

/**
 * 构建 Config schema。每个字段都带默认值，profile 里完全省略 config 也能工作。
 * @returns {any}
 */
export function createConfigSchema() {
  return z.object({
    enabled: z.boolean().default(true).description('总开关。关闭后所有规则都不生效，但配置保留。'),
    rules: z
      .array(z.any())
      .default([])
      .description(
        '注入规则。每条规则：id、name、enabled、mode(append/prepend/replace)、schedule(every/first)、content、contentFile、agentPresets。',
      ),
    statePath: z
      .string()
      .default('')
      .description('可选的规则状态文件路径（默认 ~/.dsh/dsh-system-prompt-injector.json）。'),
  })
}
