/**
 * 系统提示词注入器 — 浏览器半体。
 *
 * 两个入口：
 *   - 设置 → 系统提示词注入器：管理规则和总开关；
 *   - 聊天输入框左侧的「系统提示词」小开关：只开启 / 关闭当前对话的注入。
 *
 * 总开关关闭时快捷按钮隐藏且所有规则失效；总开关开启后，只有当前对话的
 * 快捷开关也开启时，该对话才会真正注入。
 */

import { createElement, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { SPI_CSS } from './src/styles.js'
import { createStore, mergeImportedRules, parseImportedRules, plainRule, serializeRules } from './src/store.js'

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

const TARGET_INFO = {
  system: { label: '系统提示词', hint: '改写 messages[0]（role: system）。' },
  assistant: {
    label: 'Assistant 预填充',
    hint: '在本次模型请求里预置 assistant 内容；可选原生或软预填充，不写入会话历史。',
  },
}

const PREFILL_MODE_INFO = {
  native: {
    label: '原生',
    hint: '把内容作为最后一条 assistant 消息，模型从这段文字后面接着写；需要 provider 支持 prefill。',
  },
  soft: {
    label: '软预填充',
    hint: '以真实用户消息为基准，在它前面或后面插入假 user / assistant 消息，用上下文惯性引导模型继续写。',
  },
}

let softSlotSeq = 0
function nextSoftSlotKey() {
  softSlotSeq += 1
  return `soft-slot-${softSlotSeq}`
}

function emptyRule() {
  return {
    id: `rule-${Date.now().toString(36)}`,
    name: '新规则',
    enabled: true,
    target: 'system',
    prefillMode: 'native',
    mode: 'append',
    schedule: 'every',
    content: '',
    contentFile: '',
    soft: { before: [], after: [] },
    agentPresets: [],
  }
}

function normalizeDraftSoftSide(value) {
  return (Array.isArray(value) ? value : []).map((item) => ({
    key: typeof item?.key === 'string' && item.key.length > 0 ? item.key : nextSoftSlotKey(),
    role: item?.role === 'assistant' ? 'assistant' : 'user',
    content: typeof item?.content === 'string' ? item.content : '',
  }))
}

function toDraft(rule) {
  return {
    id: rule.id,
    name: rule.name,
    enabled: rule.enabled !== false,
    target: rule.target === 'assistant' ? 'assistant' : 'system',
    prefillMode: rule.target === 'assistant' && rule.prefillMode === 'soft' ? 'soft' : 'native',
    mode: MODE_INFO[rule.mode] ? rule.mode : 'append',
    schedule: rule.schedule === 'first' ? 'first' : 'every',
    content: rule.content || '',
    contentFile: rule.contentFile || '',
    soft: {
      before: normalizeDraftSoftSide(rule.soft?.before),
      after: normalizeDraftSoftSide(rule.soft?.after),
    },
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

function TargetPicker({ value, onChange }) {
  return createElement(
    'div',
    { className: 'spi-modes', role: 'group', 'aria-label': '注入位置' },
    Object.entries(TARGET_INFO).map(([target, info]) =>
      createElement(
        'button',
        {
          key: target,
          type: 'button',
          className: 'spi-mode-btn',
          'data-on': value === target ? 'true' : 'false',
          onClick: () => onChange(target),
        },
        info.label,
      ),
    ),
  )
}

function PrefillModePicker({ value, onChange }) {
  return createElement(
    'div',
    { className: 'spi-modes', role: 'group', 'aria-label': '预填充方式' },
    Object.entries(PREFILL_MODE_INFO).map(([mode, info]) =>
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

function SoftSlot({ side, item, index, count, dragging, dropPosition, onUpdate, onRemove, onMove, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const roleLabel = item.role === 'assistant' ? '假助手' : '假用户'
  return createElement(
    'div',
    {
      className: 'spi-soft-slot',
      'data-side': side,
      'data-dragging': dragging ? 'true' : 'false',
      'data-drop': dropPosition ?? 'false',
      'data-flip-id': item.key ?? `soft-${side}-${index}`,
      onDragOver,
      onDrop,
    },
    createElement(
      'div',
      { className: 'spi-soft-slot-head' },
      createElement(
        'span',
        {
          className: 'spi-drag-handle',
          draggable: true,
          title: '拖动排序；方向键调整顺序',
          role: 'button',
          tabIndex: 0,
          'aria-label': `${side === 'before' ? '基准前' : '基准后'}第 ${index + 1} 条消息排序把手，方向键调整顺序`,
          onKeyDown: (event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
            event.preventDefault()
            const direction = event.key === 'ArrowUp' ? -1 : 1
            if ((direction < 0 && index > 0) || (direction > 0 && index < count - 1)) onMove(direction)
          },
          onDragStart,
          onDragEnd,
        },
        ...Array.from({ length: 6 }, (_, dot) => createElement('span', { key: dot })),
      ),
      createElement(
        'div',
        { className: 'spi-modes spi-modes-mini', role: 'group', 'aria-label': '消息角色' },
        createElement(
          'button',
          {
            type: 'button',
            className: 'spi-mode-btn',
            'data-on': item.role !== 'assistant' ? 'true' : 'false',
            onClick: () => onUpdate({ role: 'user' }),
          },
          '用户',
        ),
        createElement(
          'button',
          {
            type: 'button',
            className: 'spi-mode-btn',
            'data-on': item.role === 'assistant' ? 'true' : 'false',
            onClick: () => onUpdate({ role: 'assistant' }),
          },
          '助手',
        ),
      ),
      createElement('span', { className: 'spi-soft-slot-note' }, `${side === 'before' ? '基准前' : '基准后'} · ${roleLabel}`),
      createElement(
        'div',
        { className: 'spi-soft-actions' },
        createElement(
          'button',
          {
            type: 'button',
            className: 'spi-mini-btn danger',
            title: '删除',
            'aria-label': '删除消息',
            onClick: onRemove,
          },
          '×',
        ),
      ),
    ),
    createElement('textarea', {
      className: 'spi-textarea spi-soft-textarea',
      value: item.content,
      'aria-label': `${side === 'before' ? '基准前' : '基准后'}第 ${index + 1} 条${roleLabel}消息内容`,
      placeholder: item.role === 'assistant' ? '写假 assistant 的应答……' : '写假 user 的请求……',
      onChange: (event) => onUpdate({ content: event.target.value }),
    }),
  )
}

function SoftPrefillEditor({ value, onChange }) {
  const soft = value ?? { before: [], after: [] }
  const before = Array.isArray(soft.before) ? soft.before : []
  const after = Array.isArray(soft.after) ? soft.after : []
  const [dragSlot, setDragSlot] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const listRef = useRef(null)
  const orderToken = [...before.map((item) => item.key ?? ''), ...after.map((item) => item.key ?? '')].join('|')
  useFlipAnimation(listRef, orderToken)
  const updateSide = (side, items) => onChange({ ...soft, [side]: items })
  const add = (side) =>
    updateSide(side, [...(side === 'before' ? before : after), { key: nextSoftSlotKey(), role: 'user', content: '' }])
  const update = (side, index, fields) => {
    const source = side === 'before' ? before : after
    updateSide(side, source.map((item, itemIndex) => (itemIndex === index ? { ...item, ...fields } : item)))
  }
  const remove = (side, index) => updateSide(side, (side === 'before' ? before : after).filter((_, itemIndex) => itemIndex !== index))
  const move = (side, index, direction) => {
    const items = [...(side === 'before' ? before : after)]
    const target = index + direction
    if (target < 0 || target >= items.length) return
    ;[items[index], items[target]] = [items[target], items[index]]
    updateSide(side, items)
  }

  const startSlotDrag = (event, side, item) => {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', item.key)
      const slot = typeof event.currentTarget?.closest === 'function' ? event.currentTarget.closest('.spi-soft-slot') : null
      if (slot && typeof event.dataTransfer.setDragImage === 'function') event.dataTransfer.setDragImage(slot, 20, 20)
    }
    setDragSlot({ side, key: item.key })
    setDropTarget(null)
  }
  const overSlot = (event, side, item) => {
    if (!dragSlot || dragSlot.side !== side) return
    event.preventDefault()
    const rect = event.currentTarget.getBoundingClientRect()
    const after = event.clientY > rect.top + rect.height / 2
    if (dropTarget !== null && dropTarget.side === side && dropTarget.key === item.key && dropTarget.after === after) return
    setDropTarget({ side, key: item.key, after })
  }
  const dropSlot = (event) => {
    event.preventDefault()
    if (dragSlot && dropTarget && dragSlot.side === dropTarget.side) {
      const side = dragSlot.side
      const source = [...(side === 'before' ? before : after)]
      const from = source.findIndex((item) => item.key === dragSlot.key)
      let to = source.findIndex((item) => item.key === dropTarget.key)
      if (from >= 0 && to >= 0 && from !== to) {
        if (dropTarget.after) to += 1
        if (from < to) to -= 1
        if (from !== to) {
          const [moved] = source.splice(from, 1)
          source.splice(to, 0, moved)
          updateSide(side, source)
        }
      }
    }
    setDragSlot(null)
    setDropTarget(null)
  }
  const endSlotDrag = () => {
    setDragSlot(null)
    setDropTarget(null)
  }

  const renderSlots = (side, items) =>
    items.map((item, index) =>
      createElement(SoftSlot, {
        key: item.key ?? `${side}-${index}`,
        side,
        item,
        index,
        count: items.length,
        onMove: (direction) => move(side, index, direction),
        dragging: dragSlot?.side === side && dragSlot.key === item.key,
        dropPosition:
          dropTarget !== null && dropTarget.side === side && dropTarget.key === item.key
            ? dropTarget.after
              ? 'after'
              : 'before'
            : 'false',
        onUpdate: (fields) => update(side, index, fields),
        onRemove: () => remove(side, index),
        onDragStart: (event) => startSlotDrag(event, side, item),
        onDragEnd: endSlotDrag,
        onDragOver: (event) => overSlot(event, side, item),
        onDrop: dropSlot,
      }),
    )

  return createElement(
    'div',
    { className: 'spi-soft', ref: listRef },
    createElement(
      'div',
      { className: 'spi-soft-toolbar' },
      createElement('span', { className: 'spi-label' }, '软预填充消息'),
      createElement('span', { className: 'spi-hint' }, '以本次真实用户消息为基准，假消息只存在于请求里。'),
    ),
    createElement(
      'button',
      { type: 'button', className: 'spi-btn spi-soft-add', onClick: () => add('before') },
      '＋ 在基准前添加',
    ),
    renderSlots('before', before),
    createElement(
      'div',
      { className: 'spi-soft-baseline' },
      createElement('span', { className: 'spi-soft-baseline-dot' }),
      createElement(
        'div',
        { className: 'spi-soft-baseline-text' },
        createElement('span', { className: 'spi-soft-baseline-label' }, '真实用户消息'),
        createElement('span', { className: 'spi-hint' }, '运行时自动填入，不在这里编辑'),
      ),
    ),
    renderSlots('after', after),
    createElement(
      'button',
      { type: 'button', className: 'spi-btn spi-soft-add', onClick: () => add('after') },
      '＋ 在基准后添加',
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
      createElement('span', { className: 'spi-label' }, '注入位置'),
      createElement(TargetPicker, {
        value: draft.target,
        onChange: (target) => update({ target }),
      }),
      createElement('span', { className: 'spi-hint' }, TARGET_INFO[draft.target].hint),
    ),
    draft.target === 'assistant'
      ? createElement(
          'div',
          { className: 'spi-field' },
          createElement('span', { className: 'spi-label' }, '预填充方式'),
          createElement(PrefillModePicker, {
            value: draft.prefillMode,
            onChange: (prefillMode) => update({ prefillMode }),
          }),
          createElement('span', { className: 'spi-hint' }, PREFILL_MODE_INFO[draft.prefillMode].hint),
        )
      : createElement(
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
    draft.target === 'assistant' && draft.prefillMode === 'soft'
      ? createElement(SoftPrefillEditor, {
          value: draft.soft,
          onChange: (soft) => update({ soft }),
        })
      : createElement(
          'div',
          { className: 'spi-content-fields' },
          createElement(
            'label',
            { className: 'spi-field' },
            createElement('span', { className: 'spi-label' }, draft.target === 'assistant' ? '预填充内容' : '注入内容'),
            createElement('textarea', {
              className: 'spi-textarea',
              value: draft.content,
              placeholder: draft.target === 'assistant' ? '写要让模型接着写的开头，例如：好的，我来处理。' : '写要注入到系统提示词里的内容……',
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
  const prefillCount = status?.lastPrefill?.applied?.length ?? 0
  const dispatched = status?.lastPrefill?.dispatchedAt ? '（已发出）' : ''
  const prefillMode = status?.lastPrefill?.mode
  const prefillLabel = prefillMode === 'soft' ? '软预填充' : prefillMode === 'mixed' ? '混合预填充' : '原生预填充'
  if (!applied || !applied.at) {
    return prefillCount > 0 ? `已预填充 ${prefillCount} 条规则${dispatched}` : '尚未应用到任何请求'
  }
  const time = new Date(applied.at)
  const clock = Number.isNaN(time.getTime())
    ? applied.at
    : `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`
  const rules = (applied.applied ?? []).map((item) => item.name || item.id).join('、') || '（无）'
  if (rules === '（无）' && applied.errors?.length > 0) {
    return `上次未生效 ${clock} · ${applied.errors[0].message}`
  }
  const preset = applied.agentPreset || '默认'
  return `上次应用 ${clock} · ${preset} · ${rules}${prefillCount > 0 ? ` · ${prefillLabel} ${prefillCount} 条${dispatched}` : ''}`
}

function ruleFingerprint(rule) {
  return JSON.stringify(plainRule(rule))
}

function moveIdToTarget(ids, fromId, targetId, after) {
  const from = ids.indexOf(fromId)
  let to = ids.indexOf(targetId)
  if (from < 0 || to < 0 || from === to) return ids
  if (after) to += 1
  if (from < to) to -= 1
  if (from === to) return ids
  const next = ids.slice()
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/**
 * 列表重排的 FLIP 动画：规则卡片 / 软预填充槽位共用。
 * 只在「同一批节点换顺序」时播放；新增或删除节点直接跳到新布局，
 * 否则长列表会因为在视口里来回位移而看起来上下闪。
 *
 * 位置用 offsetTop / offsetLeft，而不是 getBoundingClientRect：
 * 后者包含正在播放的 transform，连续渲染时会把动画中的位置记成基准。
 */
function useFlipAnimation(containerRef, token) {
  const previous = useRef(new Map())
  const previousIds = useRef([])
  const lastToken = useRef(Symbol('initial'))
  useLayoutEffect(() => {
    if (token === lastToken.current) return
    const container = containerRef.current
    if (!container || typeof container.querySelectorAll !== 'function') return
    const nodes = [...container.querySelectorAll('[data-flip-id]')]
    const next = new Map()
    const nextIds = []
    for (const node of nodes) {
      const id = node.getAttribute('data-flip-id')
      if (!id) continue
      nextIds.push(id)
      next.set(id, { left: node.offsetLeft, top: node.offsetTop })
    }
    // 节点集合发生变化（添加 / 删除）时不播放位移动画。
    const batchChanged =
      previousIds.current.length > 0 &&
      (previousIds.current.length !== nextIds.length ||
        nextIds.some((id) => !previousIds.current.includes(id)))
    if (batchChanged) {
      for (const node of nodes) {
        node.style.transition = 'none'
        node.style.transform = ''
      }
    }
    const changed = !batchChanged && !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
    for (const [id, rect] of next) {
      if (!changed) continue
      const prev = previous.current.get(id)
      if (prev === undefined) continue
      const dx = prev.left - rect.left
      const dy = prev.top - rect.top
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue
      const node = nodes.find((item) => item.getAttribute('data-flip-id') === id)
      if (node === undefined) continue
      node.style.transition = 'none'
      node.style.transform = `translate(${dx}px, ${dy}px)`
      const play = () => {
        node.style.transition = 'transform 220ms cubic-bezier(.22, 1, .36, 1)'
        node.style.transform = ''
      }
      if (typeof requestAnimationFrame === 'function') requestAnimationFrame(play)
      else setTimeout(play, 0)
    }
    previous.current = next
    previousIds.current = nextIds
    lastToken.current = token
  })
}

function Collapse({ open, children }) {
  return createElement(
    'div',
    { className: 'spi-collapse', 'data-open': open ? 'true' : 'false', 'aria-hidden': open ? 'false' : 'true', inert: !open },
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
  const drafts = useRef(new Map())
  const [deletedRule, setDeletedRule] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [dragId, setDragId] = useState('')
  const [dragTarget, setDragTarget] = useState(null)
  const [importDraft, setImportDraft] = useState(null)
  const closeTimer = useRef(null)
  const cardsRef = useRef(null)
  const importInputRef = useRef(null)
  const orderedRules = live.rules
  const ruleOrderToken = live.rules.map((rule) => rule.id).join('|')
  useFlipAnimation(cardsRef, ruleOrderToken)

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
    if (draft && editingId) drafts.current.set(editingId, draft)
    setEditingId(rule.id)
    setDraft(drafts.current.get(rule.id) ?? toDraft(rule))
    setEditorOpen(true)
  }

  const beginNew = () => {
    if (live.saving) return
    clearCloseTimer()
    if (draft && editingId) drafts.current.set(editingId, draft)
    const rule = drafts.current.get('__new__') ?? emptyRule()
    setEditingId('__new__')
    setDraft(rule)
    setEditorOpen(true)
  }

  const cancel = () => {
    drafts.current.delete(editingId)
    setEditorOpen(false)
    clearCloseTimer()
    // 等折叠动画结束再卸载编辑器，避免高度瞬间跳变。
    closeTimer.current = setTimeout(() => {
      setEditingId('')
      setDraft(null)
      closeTimer.current = null
    }, 300)
  }

  const toggleEdit = (rule) => {
    if (live.saving) return
    if (editingId === rule.id && editorOpen) {
      // 第二次点击同一张卡片：只有没改过才允许收起，避免丢掉未保存的编辑。
      if (draft !== null && ruleFingerprint(draft) === ruleFingerprint(rule)) cancel()
      else store.setMessage({ tone: 'error', text: '有未保存的修改，先保存或取消。' })
      return
    }
    beginEdit(rule)
  }

  const commitOrder = (orderIds) => {
    const byId = new Map(live.rules.map((rule) => [rule.id, plainRule(rule)]))
    const rules = orderIds.map((id) => byId.get(id)).filter(Boolean)
    if (rules.length !== live.rules.length) return Promise.resolve(false)
    return store.saveState({ rules }, '已调整规则顺序。')
  }

  const startRuleDrag = (event, rule) => {
    if (live.saving) return
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', rule.id)
      const card = typeof event.currentTarget?.closest === 'function' ? event.currentTarget.closest('.spi-card') : null
      if (card && typeof event.dataTransfer.setDragImage === 'function') event.dataTransfer.setDragImage(card, 24, 20)
    }
    setDragId(rule.id)
    setDragTarget(null)
  }

  const overRule = (event, rule) => {
    if (!dragId || live.saving) return
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
    if (rule.id === dragId) return
    const rect = event.currentTarget.getBoundingClientRect()
    const after = event.clientY > rect.top + rect.height / 2
    if (dragTarget !== null && dragTarget.id === rule.id && dragTarget.after === after) return
    setDragTarget({ id: rule.id, after })
  }

  const dropRule = async (event) => {
    if (!dragId) return
    event.preventDefault()
    const fromId = dragId
    const target = dragTarget
    setDragId('')
    setDragTarget(null)
    if (target === null) return
    const ids = live.rules.map((rule) => rule.id)
    const next = moveIdToTarget(ids, fromId, target.id, target.after)
    if (next !== ids) await commitOrder(next)
  }

  const endRuleDrag = () => {
    setDragId('')
    setDragTarget(null)
  }

  const moveRule = (rule, direction) => {
    if (live.saving) return
    const ids = live.rules.map((item) => item.id)
    const index = ids.indexOf(rule.id)
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    commitOrder(ids)
  }

  const exportRules = () => {
    if (live.saving) return
    const blob = new Blob([serializeRules(live.rules)], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    const stamp = new Date()
    const suffix = `${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, '0')}${String(stamp.getDate()).padStart(2, '0')}-${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}`
    anchor.href = url
    anchor.download = `dsh-system-prompt-injector-${suffix}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    store.setMessage({ tone: 'ok', text: `已导出 ${live.rules.length} 条规则。` })
  }

  const beginImport = () => {
    if (live.saving) return
    importInputRef.current?.click()
  }

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const rules = parseImportedRules(await file.text())
      setImportDraft({ fileName: file.name, rules })
      store.setMessage({ tone: 'idle', text: '' })
    } catch (error) {
      setImportDraft(null)
      store.setMessage({ tone: 'error', text: `导入失败：${error instanceof Error ? error.message : String(error)}` })
    }
  }

  const cancelImport = () => setImportDraft(null)

  const applyImport = async (replace) => {
    if (!importDraft || live.saving) return
    if (replace && !window.confirm(`确定用 ${importDraft.rules.length} 条导入规则替换当前全部 ${live.rules.length} 条规则？现有规则将被清空。`)) return
    const rules = replace ? importDraft.rules : mergeImportedRules(live.rules, importDraft.rules)
    const text = replace ? `已替换为 ${rules.length} 条规则。` : `已追加 ${importDraft.rules.length} 条规则。`
    if (await store.saveState({ rules }, text)) setImportDraft(null)
  }

  const save = async (value) => {
    if (live.saving) return
    const exists = live.rules.some((rule) => rule.id === value.id)
    const rules = exists
      ? live.rules.map((rule) => (rule.id === value.id ? plainRule(value) : plainRule(rule)))
      : [...live.rules.map(plainRule), plainRule(value)]
    const text = live.enabled
      ? '已保存，下一轮模型请求生效。'
      : '已保存。总开关目前关闭，开启后生效。'
    if (await store.saveState({ rules }, text)) {
      drafts.current.delete(value.id)
      cancel()
    }
  }

  const remove = async (value) => {
    if (live.saving) return
    const index = live.rules.findIndex((rule) => rule.id === value.id)
    if (index < 0) { cancel(); return }
    if (!window.confirm(`确定删除规则「${live.rules[index].name}」？删除后可在本页撤销。`)) return
    const rules = live.rules.filter((rule) => rule.id !== value.id).map(plainRule)
    if (await store.saveState({ rules }, '已删除规则，可撤销。')) {
      setDeletedRule({ rule: plainRule(live.rules[index]), index })
      cancel()
    }
  }

  const undoDelete = async () => {
    if (!deletedRule || live.saving) return
    const rules = live.rules.map(plainRule)
    if (rules.some((rule) => rule.id === deletedRule.rule.id)) return
    rules.splice(Math.min(deletedRule.index, rules.length), 0, deletedRule.rule)
    if (await store.saveState({ rules }, '已恢复规则。')) setDeletedRule(null)
  }

  const toggleRule = (rule) => {
    if (live.saving) return
    const rules = live.rules.map((item) =>
      item.id === rule.id ? plainRule({ ...item, enabled: item.enabled === false }) : plainRule(item),
    )
    store.saveState({ rules }, rule.enabled === false ? '已启用规则。' : '已停用规则。')
  }

  const toggleAll = () => {
    if (live.saving) return
    store.saveState(
      { enabled: !live.enabled },
      live.enabled ? '已关闭总开关，快捷按钮已隐藏。' : '已开启总开关。',
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
        createElement('p', { className: 'spi-subtitle' }, '在每次模型请求前注入提示词或预填充消息'),
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
            'aria-pressed': live.enabled,
            'aria-busy': live.saving ? 'true' : 'false',
            onClick: toggleAll,
            title: live.enabled ? '点击关闭总开关' : '点击开启总开关',
          },
          createElement('span', { className: 'spi-master-dot' }),
          createElement('span', { className: 'spi-master-label' }, '总开关'),
          createElement(Swap, {
            on: live.enabled,
            onText: '已启用',
            offText: '已停用',
          }),
        ),
        createElement(
          'button',
          { type: 'button', className: 'spi-icon-btn', onClick: () => store.refresh(), title: '刷新', 'aria-label': '刷新状态' },
          '↻',
        ),
      ),
    ),
    createElement(
      'div',
      { className: 'spi-feedback' },
      createElement(MessageBanner, {
        message: live.error && live.message?.tone === 'error' && live.message.text.includes(live.error)
          ? null : live.message,
      }),
      live.error
        ? createElement('div', { className: 'spi-banner', 'data-tone': 'error', role: 'alert' },
        `状态错误：${live.error} `,
        createElement('button', { type: 'button', className: 'spi-btn', onClick: () => store.refresh() }, '重试'),
      ) : null,
      createElement(
        'div',
        { className: 'spi-status-bar' },
        createElement('span', {
          className: 'spi-status-dot',
          'data-on': live.enabled ? 'true' : 'false',
        }),
        createElement('span', null, statusLine(live.status)),
        createElement(
          'span',
          { className: 'spi-status-rules' },
          `${live.sessions.length} 个对话开启 · ${live.rules.length} 条规则`,
        ),
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
          'div',
          { className: 'spi-section-actions' },
          createElement(
            'button',
            { type: 'button', className: 'spi-btn', onClick: exportRules },
            '导出',
          ),
          createElement(
            'button',
            { type: 'button', className: 'spi-btn', onClick: beginImport },
            '导入',
          ),
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
          createElement('input', {
            ref: importInputRef,
            type: 'file',
            accept: '.json,application/json',
            className: 'spi-file-input',
            onChange: handleImportFile,
          }),
        ),
      ),
      createElement('p', { className: 'spi-section-hint' }, '按列表顺序生效，可拖动卡片左侧把手排序；「替换」会清空它之前的所有规则；预填充只影响本次请求。'),
      importDraft !== null
        ? createElement(
            'div',
            { className: 'spi-import' },
            createElement(
              'div',
              { className: 'spi-import-text' },
              createElement('span', { className: 'spi-import-title' }, `已读取 ${importDraft.rules.length} 条规则`),
              createElement('span', { className: 'spi-hint' }, importDraft.fileName),
              createElement('span', { className: 'spi-hint' }, '追加保留现有规则；替换会清空当前规则。'),
            ),
            createElement(
              'div',
              { className: 'spi-import-actions' },
              createElement(
                'button',
                { type: 'button', className: 'spi-btn', onClick: () => applyImport(false) },
                '追加导入',
              ),
              createElement(
                'button',
                { type: 'button', className: 'spi-btn danger', onClick: () => applyImport(true) },
                '替换全部',
              ),
              createElement('button', { type: 'button', className: 'spi-btn', onClick: cancelImport }, '取消'),
            ),
          )
        : null,
      deletedRule ? createElement('div', { className: 'spi-undo', role: 'status' },
        `已删除「${deletedRule.rule.name}」`,
        createElement('button', { type: 'button', className: 'spi-btn', onClick: undoDelete }, '撤销删除'),
      ) : null,
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
        { className: 'spi-cards', ref: cardsRef },
        orderedRules.map((rule) =>
          createElement(
            'article',
            {
              key: rule.id,
              className: 'spi-card',
              'data-rule-id': rule.id,
              'data-flip-id': rule.id,
              'data-editing': editingId === rule.id ? 'true' : 'false',
              'data-dragging': dragId === rule.id ? 'true' : 'false',
              'data-drop':
                dragTarget !== null && dragTarget.id === rule.id && dragId !== rule.id
                  ? dragTarget.after
                    ? 'after'
                    : 'before'
                  : 'false',
              onDragOver: (event) => overRule(event, rule),
              onDrop: dropRule,
            },
            createElement(
              'div',
              { className: 'spi-card-main' },
              createElement(
                'span',
                {
                  className: 'spi-drag-handle spi-drag-handle-lg',
                  draggable: true,
                  title: '拖动排序；方向键调整顺序',
                  'aria-label': `${rule.name}排序把手，方向键调整顺序`,
                  role: 'button',
                  tabIndex: 0,
                  onKeyDown: (event) => {
                    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                    event.preventDefault()
                    moveRule(rule, event.key === 'ArrowUp' ? -1 : 1)
                  },
                  onDragStart: (event) => startRuleDrag(event, rule),
                  onDragEnd: endRuleDrag,
                },
                ...Array.from({ length: 6 }, (_, index) => createElement('span', { key: index })),
              ),
              createElement(
                'button',
                {
                  type: 'button',
                  className: 'spi-card-open',
                  'aria-expanded': editingId === rule.id && editorOpen ? 'true' : 'false',
                  title:
                    editingId === rule.id && editorOpen
                      ? draft !== null && ruleFingerprint(draft) !== ruleFingerprint(rule)
                        ? '有未保存修改，先保存或取消'
                        : '点击收起'
                      : '点击展开编辑',
                  onClick: () => toggleEdit(rule),
                },
                createElement('span', { className: 'spi-dot', 'data-on': rule.enabled === false ? 'false' : 'true' }),
                createElement('span', { className: 'spi-card-name' }, rule.name),
                rule.target === 'assistant'
                  ? createElement(
                      'span',
                      { className: 'spi-mode-chip ' + (rule.prefillMode === 'soft' ? 'spi-soft-chip' : 'spi-prefill-chip') },
                      rule.prefillMode === 'soft' ? '软预填充' : '原生预填充',
                    )
                  : createElement(
                      'span',
                      { className: 'spi-mode-chip', 'data-mode': rule.mode },
                      MODE_INFO[rule.mode]?.label ?? rule.mode,
                    ),
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
                    'aria-label': `${rule.name}规则开关`,
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
      `规则变更后下一轮模型请求生效 · 总开关关闭时所有对话停止注入，快捷按钮也会隐藏`,
    ),
  )
}

function ComposerToggle({ store, sessionId, session }) {
  const live = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot)

  useEffect(() => {
    store.refresh()
    const timer = setInterval(() => store.refresh(), 8000)
    return () => clearInterval(timer)
  }, [])

  const id =
    typeof sessionId === 'string'
      ? sessionId
      : typeof session?.id === 'string'
        ? session.id
        : ''
  if (live.enabled !== true || id.length === 0) return null
  const on = Array.isArray(live.sessions) && live.sessions.includes(id)
  return createElement(
    'button',
    {
      type: 'button',
      className: 'spi-chip',
      'data-on': on ? 'true' : 'false',
      'aria-pressed': on,
      'aria-busy': live.saving ? 'true' : 'false',
      title: on
        ? `本对话的系统提示词注入已开启（${live.rules.length} 条规则）· 点击关闭`
        : `本对话的系统提示词注入已关闭（${live.rules.length} 条规则）· 点击开启`,
      onClick: () =>
        store.saveState(
          { sessionId: id, sessionEnabled: !on },
          on ? '已关闭本对话的系统提示词注入。' : '已开启本对话的系统提示词注入。',
        ),
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
  register('conversation.input.left', { id: 'system-prompt-injector-toggle', order: 42, label: () => '系统提示词' }, (props) =>
    createElement(ComposerToggle, { ...props, store }),
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
