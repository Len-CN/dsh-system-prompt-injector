/**
 * 系统提示词注入器 — 浏览器半体。
 *
 * 两个入口：
 *   - 设置 → 系统提示词注入器：管理规则；
 *   - 聊天输入框左侧的「系统提示词」小开关：一键开启 / 关闭注入。
 */

import { createElement, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { SPI_CSS } from './src/styles.js'
import { createStore, plainRule } from './src/store.js'

export const inject = ['slots']

const MODE_INFO = {
  append: { label: '追加', hint: '保留原系统提示词，把内容加在最后。' },
  prepend: { label: '前置', hint: '把内容插到系统提示词最前面。' },
  replace: { label: '替换', hint: '清空原系统提示词，只保留本规则内容。' },
}

const SCHEDULE_INFO = {
  every: { label: '每轮', hint: '每个模型请求都会注入。' },
  first: { label: '仅首次', hint: '只在当前会话的第一次模型请求注入，之后不再注入。' },
}

function emptyRule() {
  return {
    id: `rule-${Date.now().toString(36)}`,
    name: '新规则',
    enabled: true,
    mode: 'append',
    schedule: 'every',
    content: '',
    contentFile: '',
    agentPresets: [],
  }
}

function toDraft(rule) {
  return {
    id: rule.id,
    name: rule.name,
    enabled: rule.enabled !== false,
    mode: MODE_INFO[rule.mode] ? rule.mode : 'append',
    schedule: rule.schedule === 'first' ? 'first' : 'every',
    content: rule.content || '',
    contentFile: rule.contentFile || '',
    agentPresets: Array.isArray(rule.agentPresets) ? [...rule.agentPresets] : [],
  }
}

function ModePicker({ value, onChange }) {
  return createElement(
    'div',
    { className: 'spi-modes', role: 'group', 'aria-label': '注入模式' },
    Object.entries(MODE_INFO).map(([mode, info]) =>
      createElement(
        'button',
        {
          key: mode,
          type: 'button',
          className: 'spi-mode-btn',
          'data-on': value === mode ? 'true' : 'false',
          onClick: () => onChange(mode),
        },
        info.label,
      ),
    ),
  )
}

function SchedulePicker({ value, onChange }) {
  return createElement(
    'div',
    { className: 'spi-modes', role: 'group', 'aria-label': '注入时机' },
    Object.entries(SCHEDULE_INFO).map(([schedule, info]) =>
      createElement(
        'button',
        {
          key: schedule,
          type: 'button',
          className: 'spi-mode-btn',
          'data-on': value === schedule ? 'true' : 'false',
          onClick: () => onChange(schedule),
        },
        info.label,
      ),
    ),
  )
}

function RuleEditor({ draft, setDraft, busy, onSave, onCancel, onDelete }) {
  const update = (fields) => setDraft({ ...draft, ...fields })
  return createElement(
    'div',
    { className: 'spi-editor' },
    createElement(
      'div',
      { className: 'spi-row' },
      createElement(
        'label',
        { className: 'spi-field' },
        createElement('span', { className: 'spi-label' }, '名称'),
        createElement('input', {
          className: 'spi-input',
          value: draft.name,
          placeholder: '例如：破甲模式系统提示词',
          onChange: (event) => update({ name: event.target.value }),
        }),
      ),
      createElement(
        'label',
        { className: 'spi-field' },
        createElement('span', { className: 'spi-label' }, '生效范围'),
        createElement('input', {
          className: 'spi-input',
          value: draft.agentPresets.join(', '),
          placeholder: '全部预设（留空）',
          onChange: (event) =>
            update({
              agentPresets: event.target.value
                .split(',')
                .map((item) => item.trim())
                .filter((item) => item.length > 0),
            }),
        }),
      ),
    ),
    createElement(
      'div',
      { className: 'spi-field' },
      createElement('span', { className: 'spi-label' }, '模式'),
      createElement(ModePicker, { value: draft.mode, onChange: (mode) => update({ mode }) }),
      createElement('span', { className: 'spi-hint' }, MODE_INFO[draft.mode].hint),
    ),
    createElement(
      'div',
      { className: 'spi-field' },
      createElement('span', { className: 'spi-label' }, '注入时机'),
      createElement(SchedulePicker, {
        value: draft.schedule,
        onChange: (schedule) => update({ schedule }),
      }),
      createElement('span', { className: 'spi-hint' }, SCHEDULE_INFO[draft.schedule].hint),
    ),
    createElement(
      'label',
      { className: 'spi-field' },
      createElement('span', { className: 'spi-label' }, '注入内容'),
      createElement('textarea', {
        className: 'spi-textarea',
        value: draft.content,
        placeholder: '写要注入到系统提示词里的内容……',
        onChange: (event) => update({ content: event.target.value }),
      }),
    ),
    createElement(
      'label',
      { className: 'spi-field' },
      createElement('span', { className: 'spi-label' }, '或从文件读取'),
      createElement('input', {
        className: 'spi-input',
        value: draft.contentFile,
        placeholder: '例如：~/.dsh/prompt-inject.md',
        onChange: (event) => update({ contentFile: event.target.value }),
      }),
      createElement('span', { className: 'spi-hint' }, '文件优先于上面的内联内容；修改文件后下一轮模型请求自动生效。'),
    ),
    createElement(
      'div',
      { className: 'spi-editor-actions' },
      // 保存期间不改按钮外观（disabled 会让按钮在请求往返时闪一下），
      // 只挂 aria 状态，重复点击由父级的保存队列去重。
      createElement(
        'button',
        {
          type: 'button',
          className: 'spi-btn primary',
          'aria-busy': busy ? 'true' : 'false',
          onClick: () => onSave(draft),
        },
        '保存',
      ),
      createElement('button', { type: 'button', className: 'spi-btn', onClick: onCancel }, '取消'),
      createElement('span', { className: 'spi-spacer' }),
      createElement(
        'button',
        {
          type: 'button',
          className: 'spi-btn danger',
          'aria-busy': busy ? 'true' : 'false',
          onClick: () => onDelete(draft),
        },
        '删除',
      ),
    ),
  )
}

function statusLine(status) {
  const applied = status?.lastApplied
  if (!applied || !applied.at) return '尚未应用到任何请求'
  const time = new Date(applied.at)
  const clock = Number.isNaN(time.getTime())
    ? applied.at
    : `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`
  const rules = (applied.applied ?? []).map((item) => item.name || item.id).join('、') || '（无）'
  const preset = applied.agentPreset || '默认'
  return `上次应用 ${clock} · ${preset} · ${rules}`
}

function Collapse({ open, children }) {
  return createElement(
    'div',
    { className: 'spi-collapse', 'data-open': open ? 'true' : 'false', 'aria-hidden': open ? 'false' : 'true' },
    createElement('div', { className: 'spi-collapse-inner' }, children),
  )
}

function Swap({ on, onText, offText, className }) {
  return createElement(
    'span',
    { className: 'spi-swap' + (className ? ' ' + className : '') },
    createElement('span', { 'data-show': on ? 'true' : 'false' }, onText),
    createElement('span', { 'data-show': on ? 'false' : 'true' }, offText),
  )
}

function MessageBanner({ message }) {
  const visible = typeof message?.text === 'string' && message.text.length > 0
  const [shown, setShown] = useState(message)
  const [mounted, setMounted] = useState(visible)
  useEffect(() => {
    if (visible) {
      setShown(message)
      setMounted(true)
      return undefined
    }
    const timer = setTimeout(() => setMounted(false), 300)
    return () => clearTimeout(timer)
  }, [visible, message?.text, message?.tone])
  if (!mounted) return null
  const display = visible ? message : shown
  return createElement(
    'div',
    { className: 'spi-presence', 'data-open': visible ? 'true' : 'false', 'aria-live': 'polite' },
    createElement(
      'div',
      { className: 'spi-presence-inner' },
      display?.text
        ? createElement(
            'div',
            { className: 'spi-banner', 'data-tone': display.tone },
            display.text,
          )
        : null,
    ),
  )
}

function SettingsPage({ store }) {
  const live = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)
  const [editingId, setEditingId] = useState('')
  const [draft, setDraft] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const closeTimer = useRef(null)

  useEffect(() => {
    store.refresh()
    return () => {
      if (closeTimer.current !== null) clearTimeout(closeTimer.current)
    }
  }, [])

  const clearCloseTimer = () => {
    if (closeTimer.current !== null) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const beginEdit = (rule) => {
    if (live.saving) return
    clearCloseTimer()
    setEditingId(rule.id)
    setDraft(toDraft(rule))
    setEditorOpen(true)
  }

  const beginNew = () => {
    if (live.saving) return
    clearCloseTimer()
    const rule = emptyRule()
    setEditingId('__new__')
    setDraft(rule)
    setEditorOpen(true)
  }

  const cancel = () => {
    setEditorOpen(false)
    clearCloseTimer()
    // 等折叠动画结束再卸载编辑器，避免高度瞬间跳变。
    closeTimer.current = setTimeout(() => {
      setEditingId('')
      setDraft(null)
      closeTimer.current = null
    }, 300)
  }

  const save = async (value) => {
    if (live.saving) return
    const exists = live.rules.some((rule) => rule.id === value.id)
    const rules = exists
      ? live.rules.map((rule) => (rule.id === value.id ? plainRule(value) : plainRule(rule)))
      : [...live.rules.map(plainRule), plainRule(value)]
    const text = live.enabled ? '已保存，下一轮模型请求生效。' : '已保存。总开关目前是关闭状态，开启后生效。'
    if (await store.saveState({ enabled: live.enabled, rules }, text)) cancel()
  }

  const remove = async (value) => {
    if (live.saving) return
    const rules = live.rules.filter((rule) => rule.id !== value.id).map(plainRule)
    if (await store.saveState({ enabled: live.enabled, rules }, '已删除规则。')) cancel()
  }

  const toggleRule = (rule) => {
    if (live.saving) return
    const rules = live.rules.map((item) =>
      item.id === rule.id ? plainRule({ ...item, enabled: item.enabled === false }) : plainRule(item),
    )
    store.saveState({ enabled: live.enabled, rules }, rule.enabled === false ? '已启用规则。' : '已停用规则。')
  }

  const toggleAll = () => {
    if (live.saving) return
    store.saveState(
      { enabled: !live.enabled, rules: live.rules.map(plainRule) },
      live.enabled ? '已关闭系统提示词注入。' : '已开启系统提示词注入。',
    )
  }

  const renderEditor = (rule) =>
    createElement(RuleEditor, {
      draft,
      setDraft,
      busy: live.saving,
      onSave: save,
      onCancel: cancel,
      onDelete: remove,
    })

  return createElement(
    'div',
    { className: 'spi-page' },
    createElement(
      'header',
      { className: 'spi-header' },
      createElement(
        'div',
        { className: 'spi-header-text' },
        createElement('h1', { className: 'spi-title' }, '系统提示词'),
        createElement('p', { className: 'spi-subtitle' }, '在每次模型请求前改写 messages[0]（role: system）'),
      ),
      createElement(
        'div',
        { className: 'spi-header-actions' },
        createElement(
          'button',
          {
            type: 'button',
            className: 'spi-master',
            'data-on': live.enabled ? 'true' : 'false',
            'aria-busy': live.saving ? 'true' : 'false',
            onClick: toggleAll,
            title: live.enabled ? '点击关闭全部注入' : '点击开启注入',
          },
          createElement('span', { className: 'spi-master-dot' }),
          createElement(Swap, { on: live.enabled, onText: '已启用', offText: '已停用' }),
        ),
        createElement(
          'button',
          { type: 'button', className: 'spi-icon-btn', onClick: () => store.refresh(), title: '刷新' },
          '↻',
        ),
      ),
    ),
    createElement(
      'div',
      { className: 'spi-feedback' },
      createElement(MessageBanner, { message: live.message }),
      createElement(
        'div',
        { className: 'spi-status-bar' },
        createElement('span', { className: 'spi-status-dot', 'data-on': live.enabled ? 'true' : 'false' }),
        createElement('span', null, statusLine(live.status)),
        createElement('span', { className: 'spi-status-rules' }, `${live.rules.length} 条规则`),
      ),
    ),
    createElement(
      'section',
      { className: 'spi-section' },
      createElement(
        'div',
        { className: 'spi-section-head' },
        createElement('h2', { className: 'spi-section-title' }, '规则'),
        createElement(
          'button',
          {
            type: 'button',
            className: 'spi-btn primary',
            'aria-busy': live.saving ? 'true' : 'false',
            onClick: beginNew,
          },
          '＋ 新建规则',
        ),
      ),
      createElement('p', { className: 'spi-section-hint' }, '按列表顺序生效；「替换」会清空它之前的所有规则。'),
      live.rules.length === 0 && editingId !== '__new__'
        ? createElement(
            'div',
            { className: 'spi-empty' },
            createElement('div', { className: 'spi-empty-icon' }, '✎'),
            createElement('p', null, '还没有规则'),
            createElement('button', { type: 'button', className: 'spi-btn primary', onClick: beginNew }, '新建第一条规则'),
          )
        : null,
      createElement(
        'div',
        { className: 'spi-cards' },
        live.rules.map((rule) =>
          createElement(
            'article',
            { key: rule.id, className: 'spi-card', 'data-editing': editingId === rule.id ? 'true' : 'false' },
            createElement(
              'div',
              { className: 'spi-card-main' },
              createElement(
                'button',
                { type: 'button', className: 'spi-card-open', onClick: () => beginEdit(rule) },
                createElement('span', { className: 'spi-dot', 'data-on': rule.enabled === false ? 'false' : 'true' }),
                createElement('span', { className: 'spi-card-name' }, rule.name),
                createElement('span', { className: 'spi-mode-chip', 'data-mode': rule.mode }, MODE_INFO[rule.mode]?.label ?? rule.mode),
                rule.schedule === 'first'
                  ? createElement('span', { className: 'spi-mode-chip spi-schedule-chip' }, '仅首次')
                  : null,
                rule.agentPresets.length > 0
                  ? createElement('span', { className: 'spi-meta' }, rule.agentPresets.join(' · '))
                  : null,
              ),
              createElement(
                'div',
                { className: 'spi-card-side' },
                createElement(
                  'span',
                  { className: 'spi-meta' },
                  `${rule.contentLength} 字符${rule.source === 'file' ? ' · 文件' : ''}`,
                ),
                createElement(
                  'label',
                  { className: 'spi-switch', title: rule.enabled === false ? '启用规则' : '停用规则' },
                  // 这里的 disabled 只拦住保存中的重复点击；开关本身没有禁用样式，
                  // 不会像按钮那样在请求往返时闪一下。
                  createElement('input', {
                    type: 'checkbox',
                    checked: rule.enabled !== false,
                    disabled: live.saving,
                    onChange: () => toggleRule(rule),
                  }),
                  createElement('span', { className: 'spi-switch-track' }),
                ),
              ),
            ),
            rule.preview ? createElement('p', { className: 'spi-preview' }, rule.preview) : null,
            rule.error ? createElement('p', { className: 'spi-error' }, rule.error) : null,
            createElement(
              Collapse,
              { open: editorOpen && editingId === rule.id },
              editingId === rule.id ? renderEditor(rule) : null,
            ),
          ),
        ),
        createElement(
          'div',
          { className: 'spi-new-slot' },
          createElement(
            Collapse,
            { open: editorOpen && editingId === '__new__' },
            createElement(
              'article',
              { className: 'spi-card spi-card-new' },
              createElement(
                'div',
                { className: 'spi-card-main' },
                createElement('span', { className: 'spi-card-name' }, '新规则'),
              ),
              editingId === '__new__' ? renderEditor() : null,
            ),
          ),
        ),
      ),
    ),
    createElement(
      'footer',
      { className: 'spi-footer' },
      `规则变更后下一轮模型请求生效 · 总开关关闭时所有规则都不生效`,
    ),
  )
}

function ComposerToggle({ store }) {
  const live = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)

  useEffect(() => {
    store.refresh()
    const timer = setInterval(() => store.refresh(), 8000)
    return () => clearInterval(timer)
  }, [])

  const on = live.enabled === true
  return createElement(
    'button',
    {
      type: 'button',
      className: 'spi-chip',
      'data-on': on ? 'true' : 'false',
      'aria-pressed': on,
      'aria-busy': live.saving ? 'true' : 'false',
      title: on
        ? `系统提示词注入已开启（${live.rules.length} 条规则）· 点击关闭`
        : `系统提示词注入已关闭（${live.rules.length} 条规则）· 点击开启`,
      onClick: () => store.saveState({ enabled: !on }, on ? '已关闭系统提示词注入。' : '已开启系统提示词注入。'),
    },
    createElement('span', { className: 'spi-chip-dot' }),
    createElement('span', { className: 'spi-chip-label' }, '系统提示词'),
    createElement(Swap, { on, onText: '开', offText: '关', className: 'spi-chip-state' }),
  )
}

export function apply(ctx, deps) {
  void deps
  const store = createStore()
  store.refresh()

  const register = (key, options, component) => {
    try {
      ctx.slots.inject(key, () => ctx.slots.register({ name: key, ...options }, component))
    } catch (error) {
      console.error(`[system-prompt-injector] 注册 ${key} 失败`, error)
    }
  }

  register('settings.section', { id: 'system-prompt-injector', order: 32, label: () => '系统提示词' }, () =>
    createElement(SettingsPage, { store }),
  )
  register('conversation.input.left', { id: 'system-prompt-injector-toggle', order: 42, label: () => '系统提示词' }, () =>
    createElement(ComposerToggle, { store }),
  )

  if (
    typeof document !== 'undefined' &&
    document.querySelector('style[data-plugin-css="dsh-system-prompt-injector/styles.css"]') === null
  ) {
    const style = document.createElement('style')
    style.dataset.plugin = 'dsh-system-prompt-injector'
    style.dataset.pluginCss = 'dsh-system-prompt-injector/styles.css'
    style.textContent = SPI_CSS
    document.head.appendChild(style)
  }
}
