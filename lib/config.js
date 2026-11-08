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
    enabled: z
      .boolean()
      .default(true)
      .description('总开关。关闭后所有规则都不生效，聊天输入框的快捷按钮也会隐藏；重新开启后各对话快捷开关默认关闭。'),
    sessions: z
      .array(z.string())
      .default([])
      .description('已开启注入的会话 id。总开关开启且会话在此列表中时，该对话才会注入。'),
    rules: z
      .array(z.any())
      .default([])
      .description(
        '注入规则。每条规则：id、name、enabled、target(system/assistant)、prefillMode(native/soft)、mode(append/prepend/replace)、schedule(every/first)、content、contentFile、soft(before/after 消息槽)、agentPresets。target=assistant 时作为 assistant 预填充；prefillMode=soft 时以真实用户消息为基准，在请求中插入假 user/assistant 消息。',
      ),
    statePath: z
      .string()
      .default('')
      .description('可选的规则状态文件路径（默认 ~/.dsh/dsh-system-prompt-injector.json）。'),
  })
}
