window.__ModuleLoader__.load({
	id: "dsh-system-prompt-injector",
	factory: (require) => {
		try {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var __require = require;
		var __factories = {};
		var __cache = {};
		function __load(id) {
			if (Object.prototype.hasOwnProperty.call(__cache, id)) return __cache[id].exports;
			var factory = __factories[id];
			if (factory === undefined) {
				if (typeof id === "string" && id.indexOf("dspi:") !== 0) return __require(id);
				throw new Error("system-prompt-injector: unknown module " + id);
			}
			var record = { exports: {} };
			__cache[id] = record;
			factory(record, record.exports, __load);
			return record.exports;
		}
		if (typeof document !== "undefined" && document.querySelector('style[data-plugin-css="dsh-system-prompt-injector/styles.css"]') === null) {
			var __style = document.createElement("style");
			__style.dataset.plugin = "dsh-system-prompt-injector";
			__style.dataset.pluginCss = "dsh-system-prompt-injector/styles.css";
			__style.textContent = "\n.spi-page, .spi-chip {\n  --spi-accent: var(--dsw-alias-state-business-primary, #4f7cf7);\n  --spi-accent-soft: color-mix(in srgb, var(--spi-accent) 10%, transparent);\n  --spi-success: var(--dsw-alias-state-success-primary, #2e9e5b);\n  --spi-danger: var(--dsw-alias-state-error-primary, #d04545);\n  --spi-ink: var(--dsw-alias-label-primary, #24292f);\n  --spi-ink-soft: var(--dsw-alias-label-secondary, #57606a);\n  --spi-ink-faint: var(--dsw-alias-label-tertiary, #8b949e);\n  --spi-line: var(--dsw-alias-border-l2, rgba(27, 31, 36, 0.12));\n  --spi-line-soft: var(--dsw-alias-border-l1, rgba(27, 31, 36, 0.07));\n  --spi-surface: var(--dsw-alias-bg-layer-1, #ffffff);\n  --spi-surface-soft: var(--dsw-alias-bg-layer-2, #f6f8fa);\n  --spi-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);\n}\n.spi-page {\n  font-family: inherit;\n  color: var(--spi-ink);\n  max-width: 860px;\n  margin: 0 auto;\n  padding: 8px 4px 40px;\n  display: flex;\n  flex-direction: column;\n  gap: 20px;\n  line-height: 1.55;\n}\n\n/* ---------- motion ---------- */\n@keyframes spi-fade {\n  from { opacity: 0; }\n  to { opacity: 1; }\n}\n.spi-banner { animation: spi-fade .22s ease both; }\n/* 注意：卡片和空状态不加挂载动画。否则点击「新建规则」时整块内容会从\n   opacity:0 淡入，看起来像闪一下；这里只用展开/折叠与状态过渡。 */\n.spi-collapse {\n  display: grid;\n  grid-template-rows: 0fr;\n  min-height: 0;\n  opacity: 0;\n  transition: grid-template-rows .3s cubic-bezier(.22, 1, .36, 1), opacity .22s ease;\n}\n.spi-collapse[data-open=\"true\"] { grid-template-rows: 1fr; opacity: 1; }\n.spi-collapse-inner { overflow: hidden; min-height: 0; }\n\n.spi-presence {\n  display: grid;\n  grid-template-rows: 0fr;\n  opacity: 0;\n  transition: grid-template-rows .28s cubic-bezier(.22, 1, .36, 1), opacity .2s ease;\n}\n.spi-presence[data-open=\"true\"] { grid-template-rows: 1fr; opacity: 1; }\n.spi-presence-inner { overflow: hidden; min-height: 0; }\n\n.spi-swap { display: inline-grid; }\n.spi-swap > span {\n  grid-area: 1 / 1;\n  transition: opacity .2s ease, transform .2s cubic-bezier(.22, 1, .36, 1);\n  white-space: nowrap;\n}\n.spi-swap > span[data-show=\"true\"] { opacity: 1; transform: translateY(0); }\n.spi-swap > span[data-show=\"false\"] { opacity: 0; transform: translateY(3px); pointer-events: none; }\n\n/* ---------- header ---------- */\n.spi-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; }\n.spi-header-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }\n.spi-title { margin: 0; font-size: 20px; font-weight: 650; letter-spacing: -0.01em; }\n.spi-subtitle { margin: 0; font-size: 13px; color: var(--spi-ink-faint); }\n.spi-header-actions { display: flex; align-items: center; gap: 8px; flex: none; }\n.spi-master {\n  display: inline-flex; align-items: center; gap: 8px;\n  height: 34px; padding: 0 14px; border-radius: 999px;\n  border: 1px solid var(--spi-line); background: var(--spi-surface);\n  color: var(--spi-ink-soft); font: inherit; font-size: 13px; font-weight: 550;\n  cursor: pointer; transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;\n  box-shadow: var(--spi-shadow);\n}\n.spi-master:hover { border-color: var(--spi-accent); }\n.spi-master:active { transform: scale(.97); }\n.spi-master[data-on=\"true\"] { color: var(--spi-success); border-color: color-mix(in srgb, var(--spi-success) 35%, transparent); background: color-mix(in srgb, var(--spi-success) 7%, var(--spi-surface)); }\n.spi-master-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--spi-ink-faint); transition: background .2s ease, box-shadow .25s ease, transform .25s cubic-bezier(.22, 1, .36, 1); }\n.spi-master[data-on=\"true\"] .spi-master-dot { background: var(--spi-success); box-shadow: 0 0 0 3px color-mix(in srgb, var(--spi-success) 18%, transparent); transform: scale(1.1); }\n.spi-icon-btn {\n  width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--spi-line);\n  background: var(--spi-surface); color: var(--spi-ink-soft); font-size: 17px; line-height: 1;\n  cursor: pointer; transition: border-color .2s ease, color .2s ease, transform .12s ease;\n  box-shadow: var(--spi-shadow);\n}\n.spi-icon-btn:hover { border-color: var(--spi-accent); color: var(--spi-accent); }\n.spi-icon-btn:active { transform: scale(.95) rotate(12deg); }\n\n/* ---------- banners ---------- */\n.spi-banner { border-radius: 10px; padding: 10px 14px; font-size: 13px; background: var(--spi-surface-soft); color: var(--spi-ink-soft); transition: background-color .2s ease, color .2s ease; }\n.spi-banner[data-tone=\"ok\"] { background: color-mix(in srgb, var(--spi-success) 9%, var(--spi-surface)); color: var(--spi-success); }\n.spi-banner[data-tone=\"error\"] { background: color-mix(in srgb, var(--spi-danger) 9%, var(--spi-surface)); color: var(--spi-danger); }\n.spi-feedback { display: flex; flex-direction: column; gap: 10px; }\n.spi-status-bar {\n  display: flex; align-items: center; gap: 9px; font-size: 12px; color: var(--spi-ink-faint);\n  padding: 0 2px;\n}\n.spi-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--spi-ink-faint); flex: none; transition: background .2s ease, transform .2s ease; }\n.spi-status-dot[data-on=\"true\"] { background: var(--spi-success); transform: scale(1.15); }\n.spi-status-rules { margin-left: auto; }\n\n/* ---------- section ---------- */\n.spi-section { display: flex; flex-direction: column; gap: 12px; }\n.spi-section-head { display: flex; align-items: center; justify-content: space-between; }\n.spi-section-hint { margin: -6px 0 0; font-size: 11.5px; color: var(--spi-ink-faint); }\n.spi-section-title { margin: 0; font-size: 14px; font-weight: 650; color: var(--spi-ink-soft); letter-spacing: .02em; }\n.spi-cards { display: flex; flex-direction: column; gap: 10px; }\n\n/* ---------- card ---------- */\n.spi-card {\n  background: var(--spi-surface); border: 1px solid var(--spi-line-soft);\n  border-radius: 14px; padding: 14px 16px; box-shadow: var(--spi-shadow);\n  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;\n}\n.spi-card:hover { border-color: var(--spi-line); }\n.spi-card[data-editing=\"true\"] { border-color: var(--spi-accent); box-shadow: 0 0 0 3px var(--spi-accent-soft); }\n.spi-card-main { display: flex; align-items: center; gap: 12px; }\n.spi-card-open {\n  display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1;\n  border: 0; background: none; padding: 0; color: inherit; font: inherit; text-align: left; cursor: pointer;\n}\n.spi-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--spi-ink-faint); flex: none; transition: background .2s ease, transform .2s ease; }\n.spi-dot[data-on=\"true\"] { background: var(--spi-success); transform: scale(1.08); }\n.spi-card-name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.spi-mode-chip {\n  flex: none; font-size: 11px; line-height: 1; padding: 4px 8px; border-radius: 999px;\n  background: var(--spi-surface-soft); color: var(--spi-ink-soft); font-weight: 550;\n}\n.spi-mode-chip[data-mode=\"replace\"] { background: color-mix(in srgb, var(--spi-danger) 9%, var(--spi-surface)); color: var(--spi-danger); }\n.spi-schedule-chip { background: color-mix(in srgb, var(--spi-accent) 9%, var(--spi-surface)); color: var(--spi-accent); }\n.spi-meta { font-size: 11.5px; color: var(--spi-ink-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\n.spi-card-side { display: flex; align-items: center; gap: 12px; flex: none; }\n.spi-preview { margin: 8px 0 0 16px; font-size: 12.5px; color: var(--spi-ink-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }\n.spi-error { margin: 8px 0 0 16px; font-size: 12px; color: var(--spi-danger); }\n\n/* small switch inside card */\n.spi-switch { display: inline-flex; align-items: center; cursor: pointer; }\n.spi-switch input { position: absolute; opacity: 0; width: 0; height: 0; }\n.spi-switch-track { width: 34px; height: 20px; border-radius: 999px; background: var(--spi-line); position: relative; transition: background .16s ease; }\n.spi-switch-track::after { content: \"\"; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.18); transition: transform .16s ease; }\n.spi-switch input:checked + .spi-switch-track { background: var(--spi-success); }\n.spi-switch input:checked + .spi-switch-track::after { transform: translateX(14px); }\n.spi-switch input:focus-visible + .spi-switch-track { outline: 2px solid var(--spi-accent); outline-offset: 2px; }\n\n/* ---------- editor ---------- */\n.spi-editor { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--spi-line-soft); display: flex; flex-direction: column; gap: 14px; }\n.spi-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }\n@media (max-width: 680px) { .spi-row { grid-template-columns: 1fr; } }\n.spi-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }\n.spi-label { font-size: 12px; font-weight: 600; color: var(--spi-ink-soft); }\n.spi-input, .spi-textarea {\n  width: 100%; box-sizing: border-box; border: 1px solid var(--spi-line); border-radius: 9px;\n  background: var(--spi-surface); color: var(--spi-ink); padding: 8px 10px; font: inherit; font-size: 13px;\n  transition: border-color .15s ease, box-shadow .15s ease;\n}\n.spi-input:focus, .spi-textarea:focus { outline: none; border-color: var(--spi-accent); box-shadow: 0 0 0 3px var(--spi-accent-soft); }\n.spi-textarea { min-height: 160px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; line-height: 1.6; }\n.spi-hint { font-size: 11.5px; color: var(--spi-ink-faint); }\n.spi-modes { display: inline-flex; gap: 4px; padding: 3px; border-radius: 9px; background: var(--spi-surface-soft); align-self: flex-start; }\n.spi-mode-btn {\n  border: 0; border-radius: 7px; padding: 5px 14px; background: transparent;\n  color: var(--spi-ink-soft); font: inherit; font-size: 12.5px; cursor: pointer;\n  transition: background .2s ease, color .2s ease, transform .12s ease;\n}\n.spi-mode-btn:active { transform: scale(.96); }\n.spi-mode-btn[data-on=\"true\"] { background: var(--spi-surface); color: var(--spi-accent); font-weight: 600; box-shadow: 0 1px 3px rgba(16,24,40,.1); }\n.spi-editor-actions { display: flex; align-items: center; gap: 8px; }\n.spi-spacer { flex: 1; }\n\n/* ---------- buttons ---------- */\n.spi-btn {\n  display: inline-flex; align-items: center; justify-content: center; gap: 4px;\n  height: 34px; padding: 0 14px; border-radius: 9px;\n  border: 1px solid var(--spi-line); background: var(--spi-surface);\n  color: var(--spi-ink-soft); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;\n  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;\n  white-space: nowrap;\n}\n.spi-btn:hover { border-color: var(--spi-accent); color: var(--spi-accent); }\n.spi-btn:active { transform: scale(.97); }\n.spi-btn.primary { background: var(--spi-accent); border-color: var(--spi-accent); color: #fff; }\n.spi-btn.primary:hover { filter: brightness(1.05); color: #fff; }\n.spi-btn.danger { color: var(--spi-danger); border-color: color-mix(in srgb, var(--spi-danger) 30%, transparent); }\n.spi-btn.danger:hover { background: color-mix(in srgb, var(--spi-danger) 8%, var(--spi-surface)); border-color: var(--spi-danger); color: var(--spi-danger); }\n/* 保存期间不给按钮加 disabled / 透明度变化：请求一来一回会让按钮闪一下。\n   忙碌状态只用 aria-busy 表达，重复点击由状态仓库去重。 */\n.spi-chip[aria-busy=\"true\"] { cursor: progress; }\n\n/* ---------- empty ---------- */\n.spi-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 16px; color: var(--spi-ink-faint); font-size: 13px; }\n.spi-empty-icon { font-size: 22px; opacity: .55; }\n.spi-empty p { margin: 0; }\n\n.spi-footer { font-size: 11.5px; color: var(--spi-ink-faint); text-align: center; }\n\n/* ---------- composer chip ---------- */\n.spi-chip {\n  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px;\n  border-radius: 999px; border: 1px solid var(--spi-line); background: var(--spi-surface);\n  color: var(--spi-ink-soft); font: inherit; font-size: 12px; line-height: 1; cursor: pointer;\n  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;\n}\n.spi-chip:hover { border-color: var(--spi-accent); }\n.spi-chip:active { transform: scale(.98); }\n.spi-chip[data-on=\"true\"] { border-color: color-mix(in srgb, var(--spi-success) 35%, transparent); background: color-mix(in srgb, var(--spi-success) 6%, var(--spi-surface)); color: var(--spi-success); }\n.spi-chip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--spi-ink-faint); transition: background .2s ease, transform .2s ease; }\n.spi-chip[data-on=\"true\"] .spi-chip-dot { background: var(--spi-success); transform: scale(1.15); }\n.spi-chip-label { font-weight: 500; }\n.spi-chip-state { font-size: 10.5px; opacity: .75; }\n.spi-chip:focus-visible { outline: 2px solid var(--spi-accent); outline-offset: 2px; }\n\n.spi-card-new { /* 新规则占位；展开与外层 Collapse 的网格行过渡负责动画 */ }\n\n@media (prefers-reduced-motion: reduce) {\n  .spi-page *, .spi-chip {\n    animation-duration: .01ms !important;\n    animation-iteration-count: 1 !important;\n    transition-duration: .01ms !important;\n  }\n}\n";
			document.head.appendChild(__style);
		}
		__factories["dspi:client/index.js"] = (module, exports, __require) => {
/**
 * 系统提示词注入器 — 浏览器半体。
 *
 * 两个入口：
 *   - 设置 → 系统提示词注入器：管理规则；
 *   - 聊天输入框左侧的「系统提示词」小开关：一键开启 / 关闭注入。
 */

const __ext0 = __require("react");
const createElement = __ext0["createElement"];
const useEffect = __ext0["useEffect"];
const useRef = __ext0["useRef"];
const useState = __ext0["useState"];
const useSyncExternalStore = __ext0["useSyncExternalStore"];
const __m1 = __require("dspi:client/src/styles.js");
const SPI_CSS = __m1["SPI_CSS"];
const __m2 = __require("dspi:client/src/store.js");
const createStore = __m2["createStore"];
const plainRule = __m2["plainRule"];

const inject = ['slots']

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

function apply(ctx, deps) {
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

exports["apply"] = apply;
exports["inject"] = inject;
		};
		__factories["dspi:client/src/styles.js"] = (module, exports, __require) => {
/** 设置页与聊天快捷开关样式。构建时会被内联进 client.js。 */
const SPI_CSS = `
.spi-page, .spi-chip {
  --spi-accent: var(--dsw-alias-state-business-primary, #4f7cf7);
  --spi-accent-soft: color-mix(in srgb, var(--spi-accent) 10%, transparent);
  --spi-success: var(--dsw-alias-state-success-primary, #2e9e5b);
  --spi-danger: var(--dsw-alias-state-error-primary, #d04545);
  --spi-ink: var(--dsw-alias-label-primary, #24292f);
  --spi-ink-soft: var(--dsw-alias-label-secondary, #57606a);
  --spi-ink-faint: var(--dsw-alias-label-tertiary, #8b949e);
  --spi-line: var(--dsw-alias-border-l2, rgba(27, 31, 36, 0.12));
  --spi-line-soft: var(--dsw-alias-border-l1, rgba(27, 31, 36, 0.07));
  --spi-surface: var(--dsw-alias-bg-layer-1, #ffffff);
  --spi-surface-soft: var(--dsw-alias-bg-layer-2, #f6f8fa);
  --spi-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
}
.spi-page {
  font-family: inherit;
  color: var(--spi-ink);
  max-width: 860px;
  margin: 0 auto;
  padding: 8px 4px 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  line-height: 1.55;
}

/* ---------- motion ---------- */
@keyframes spi-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
.spi-banner { animation: spi-fade .22s ease both; }
/* 注意：卡片和空状态不加挂载动画。否则点击「新建规则」时整块内容会从
   opacity:0 淡入，看起来像闪一下；这里只用展开/折叠与状态过渡。 */
.spi-collapse {
  display: grid;
  grid-template-rows: 0fr;
  min-height: 0;
  opacity: 0;
  transition: grid-template-rows .3s cubic-bezier(.22, 1, .36, 1), opacity .22s ease;
}
.spi-collapse[data-open="true"] { grid-template-rows: 1fr; opacity: 1; }
.spi-collapse-inner { overflow: hidden; min-height: 0; }

.spi-presence {
  display: grid;
  grid-template-rows: 0fr;
  opacity: 0;
  transition: grid-template-rows .28s cubic-bezier(.22, 1, .36, 1), opacity .2s ease;
}
.spi-presence[data-open="true"] { grid-template-rows: 1fr; opacity: 1; }
.spi-presence-inner { overflow: hidden; min-height: 0; }

.spi-swap { display: inline-grid; }
.spi-swap > span {
  grid-area: 1 / 1;
  transition: opacity .2s ease, transform .2s cubic-bezier(.22, 1, .36, 1);
  white-space: nowrap;
}
.spi-swap > span[data-show="true"] { opacity: 1; transform: translateY(0); }
.spi-swap > span[data-show="false"] { opacity: 0; transform: translateY(3px); pointer-events: none; }

/* ---------- header ---------- */
.spi-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
.spi-header-text { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.spi-title { margin: 0; font-size: 20px; font-weight: 650; letter-spacing: -0.01em; }
.spi-subtitle { margin: 0; font-size: 13px; color: var(--spi-ink-faint); }
.spi-header-actions { display: flex; align-items: center; gap: 8px; flex: none; }
.spi-master {
  display: inline-flex; align-items: center; gap: 8px;
  height: 34px; padding: 0 14px; border-radius: 999px;
  border: 1px solid var(--spi-line); background: var(--spi-surface);
  color: var(--spi-ink-soft); font: inherit; font-size: 13px; font-weight: 550;
  cursor: pointer; transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;
  box-shadow: var(--spi-shadow);
}
.spi-master:hover { border-color: var(--spi-accent); }
.spi-master:active { transform: scale(.97); }
.spi-master[data-on="true"] { color: var(--spi-success); border-color: color-mix(in srgb, var(--spi-success) 35%, transparent); background: color-mix(in srgb, var(--spi-success) 7%, var(--spi-surface)); }
.spi-master-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--spi-ink-faint); transition: background .2s ease, box-shadow .25s ease, transform .25s cubic-bezier(.22, 1, .36, 1); }
.spi-master[data-on="true"] .spi-master-dot { background: var(--spi-success); box-shadow: 0 0 0 3px color-mix(in srgb, var(--spi-success) 18%, transparent); transform: scale(1.1); }
.spi-icon-btn {
  width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--spi-line);
  background: var(--spi-surface); color: var(--spi-ink-soft); font-size: 17px; line-height: 1;
  cursor: pointer; transition: border-color .2s ease, color .2s ease, transform .12s ease;
  box-shadow: var(--spi-shadow);
}
.spi-icon-btn:hover { border-color: var(--spi-accent); color: var(--spi-accent); }
.spi-icon-btn:active { transform: scale(.95) rotate(12deg); }

/* ---------- banners ---------- */
.spi-banner { border-radius: 10px; padding: 10px 14px; font-size: 13px; background: var(--spi-surface-soft); color: var(--spi-ink-soft); transition: background-color .2s ease, color .2s ease; }
.spi-banner[data-tone="ok"] { background: color-mix(in srgb, var(--spi-success) 9%, var(--spi-surface)); color: var(--spi-success); }
.spi-banner[data-tone="error"] { background: color-mix(in srgb, var(--spi-danger) 9%, var(--spi-surface)); color: var(--spi-danger); }
.spi-feedback { display: flex; flex-direction: column; gap: 10px; }
.spi-status-bar {
  display: flex; align-items: center; gap: 9px; font-size: 12px; color: var(--spi-ink-faint);
  padding: 0 2px;
}
.spi-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--spi-ink-faint); flex: none; transition: background .2s ease, transform .2s ease; }
.spi-status-dot[data-on="true"] { background: var(--spi-success); transform: scale(1.15); }
.spi-status-rules { margin-left: auto; }

/* ---------- section ---------- */
.spi-section { display: flex; flex-direction: column; gap: 12px; }
.spi-section-head { display: flex; align-items: center; justify-content: space-between; }
.spi-section-hint { margin: -6px 0 0; font-size: 11.5px; color: var(--spi-ink-faint); }
.spi-section-title { margin: 0; font-size: 14px; font-weight: 650; color: var(--spi-ink-soft); letter-spacing: .02em; }
.spi-cards { display: flex; flex-direction: column; gap: 10px; }

/* ---------- card ---------- */
.spi-card {
  background: var(--spi-surface); border: 1px solid var(--spi-line-soft);
  border-radius: 14px; padding: 14px 16px; box-shadow: var(--spi-shadow);
  transition: border-color .2s ease, box-shadow .2s ease, background .2s ease;
}
.spi-card:hover { border-color: var(--spi-line); }
.spi-card[data-editing="true"] { border-color: var(--spi-accent); box-shadow: 0 0 0 3px var(--spi-accent-soft); }
.spi-card-main { display: flex; align-items: center; gap: 12px; }
.spi-card-open {
  display: flex; align-items: center; gap: 9px; min-width: 0; flex: 1;
  border: 0; background: none; padding: 0; color: inherit; font: inherit; text-align: left; cursor: pointer;
}
.spi-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--spi-ink-faint); flex: none; transition: background .2s ease, transform .2s ease; }
.spi-dot[data-on="true"] { background: var(--spi-success); transform: scale(1.08); }
.spi-card-name { font-size: 14px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spi-mode-chip {
  flex: none; font-size: 11px; line-height: 1; padding: 4px 8px; border-radius: 999px;
  background: var(--spi-surface-soft); color: var(--spi-ink-soft); font-weight: 550;
}
.spi-mode-chip[data-mode="replace"] { background: color-mix(in srgb, var(--spi-danger) 9%, var(--spi-surface)); color: var(--spi-danger); }
.spi-schedule-chip { background: color-mix(in srgb, var(--spi-accent) 9%, var(--spi-surface)); color: var(--spi-accent); }
.spi-meta { font-size: 11.5px; color: var(--spi-ink-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.spi-card-side { display: flex; align-items: center; gap: 12px; flex: none; }
.spi-preview { margin: 8px 0 0 16px; font-size: 12.5px; color: var(--spi-ink-faint); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.spi-error { margin: 8px 0 0 16px; font-size: 12px; color: var(--spi-danger); }

/* small switch inside card */
.spi-switch { display: inline-flex; align-items: center; cursor: pointer; }
.spi-switch input { position: absolute; opacity: 0; width: 0; height: 0; }
.spi-switch-track { width: 34px; height: 20px; border-radius: 999px; background: var(--spi-line); position: relative; transition: background .16s ease; }
.spi-switch-track::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.18); transition: transform .16s ease; }
.spi-switch input:checked + .spi-switch-track { background: var(--spi-success); }
.spi-switch input:checked + .spi-switch-track::after { transform: translateX(14px); }
.spi-switch input:focus-visible + .spi-switch-track { outline: 2px solid var(--spi-accent); outline-offset: 2px; }

/* ---------- editor ---------- */
.spi-editor { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--spi-line-soft); display: flex; flex-direction: column; gap: 14px; }
.spi-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 680px) { .spi-row { grid-template-columns: 1fr; } }
.spi-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.spi-label { font-size: 12px; font-weight: 600; color: var(--spi-ink-soft); }
.spi-input, .spi-textarea {
  width: 100%; box-sizing: border-box; border: 1px solid var(--spi-line); border-radius: 9px;
  background: var(--spi-surface); color: var(--spi-ink); padding: 8px 10px; font: inherit; font-size: 13px;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.spi-input:focus, .spi-textarea:focus { outline: none; border-color: var(--spi-accent); box-shadow: 0 0 0 3px var(--spi-accent-soft); }
.spi-textarea { min-height: 160px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; line-height: 1.6; }
.spi-hint { font-size: 11.5px; color: var(--spi-ink-faint); }
.spi-modes { display: inline-flex; gap: 4px; padding: 3px; border-radius: 9px; background: var(--spi-surface-soft); align-self: flex-start; }
.spi-mode-btn {
  border: 0; border-radius: 7px; padding: 5px 14px; background: transparent;
  color: var(--spi-ink-soft); font: inherit; font-size: 12.5px; cursor: pointer;
  transition: background .2s ease, color .2s ease, transform .12s ease;
}
.spi-mode-btn:active { transform: scale(.96); }
.spi-mode-btn[data-on="true"] { background: var(--spi-surface); color: var(--spi-accent); font-weight: 600; box-shadow: 0 1px 3px rgba(16,24,40,.1); }
.spi-editor-actions { display: flex; align-items: center; gap: 8px; }
.spi-spacer { flex: 1; }

/* ---------- buttons ---------- */
.spi-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 4px;
  height: 34px; padding: 0 14px; border-radius: 9px;
  border: 1px solid var(--spi-line); background: var(--spi-surface);
  color: var(--spi-ink-soft); font: inherit; font-size: 13px; font-weight: 500; cursor: pointer;
  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;
  white-space: nowrap;
}
.spi-btn:hover { border-color: var(--spi-accent); color: var(--spi-accent); }
.spi-btn:active { transform: scale(.97); }
.spi-btn.primary { background: var(--spi-accent); border-color: var(--spi-accent); color: #fff; }
.spi-btn.primary:hover { filter: brightness(1.05); color: #fff; }
.spi-btn.danger { color: var(--spi-danger); border-color: color-mix(in srgb, var(--spi-danger) 30%, transparent); }
.spi-btn.danger:hover { background: color-mix(in srgb, var(--spi-danger) 8%, var(--spi-surface)); border-color: var(--spi-danger); color: var(--spi-danger); }
/* 保存期间不给按钮加 disabled / 透明度变化：请求一来一回会让按钮闪一下。
   忙碌状态只用 aria-busy 表达，重复点击由状态仓库去重。 */
.spi-chip[aria-busy="true"] { cursor: progress; }

/* ---------- empty ---------- */
.spi-empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 16px; color: var(--spi-ink-faint); font-size: 13px; }
.spi-empty-icon { font-size: 22px; opacity: .55; }
.spi-empty p { margin: 0; }

.spi-footer { font-size: 11.5px; color: var(--spi-ink-faint); text-align: center; }

/* ---------- composer chip ---------- */
.spi-chip {
  display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px;
  border-radius: 999px; border: 1px solid var(--spi-line); background: var(--spi-surface);
  color: var(--spi-ink-soft); font: inherit; font-size: 12px; line-height: 1; cursor: pointer;
  transition: border-color .2s ease, background .2s ease, color .2s ease, transform .12s ease;
}
.spi-chip:hover { border-color: var(--spi-accent); }
.spi-chip:active { transform: scale(.98); }
.spi-chip[data-on="true"] { border-color: color-mix(in srgb, var(--spi-success) 35%, transparent); background: color-mix(in srgb, var(--spi-success) 6%, var(--spi-surface)); color: var(--spi-success); }
.spi-chip-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--spi-ink-faint); transition: background .2s ease, transform .2s ease; }
.spi-chip[data-on="true"] .spi-chip-dot { background: var(--spi-success); transform: scale(1.15); }
.spi-chip-label { font-weight: 500; }
.spi-chip-state { font-size: 10.5px; opacity: .75; }
.spi-chip:focus-visible { outline: 2px solid var(--spi-accent); outline-offset: 2px; }

.spi-card-new { /* 新规则占位；展开与外层 Collapse 的网格行过渡负责动画 */ }

@media (prefers-reduced-motion: reduce) {
  .spi-page *, .spi-chip {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
  }
}
`

exports["SPI_CSS"] = SPI_CSS;
		};
		__factories["dspi:client/src/store.js"] = (module, exports, __require) => {
/**
 * 浏览器端的规则状态仓库。
 *
 * 设置页和聊天输入框旁的快捷开关共用同一份状态：任意一处保存，另一处会立即
 * 通过订阅收到新快照。HTTP 接口由宿主半体提供。
 */

const API = '/system-prompt-injector/system-prompt-injector/state'

/** 只保留后端认识的字段，避免把 contentLength/preview 等展示字段写回去。 */
function plainRule(rule) {
  return {
    id: rule.id,
    name: rule.name,
    enabled: rule.enabled !== false,
    mode: rule.mode || 'append',
    schedule: rule.schedule === 'first' ? 'first' : 'every',
    content: rule.content || '',
    contentFile: rule.contentFile || '',
    agentPresets: Array.isArray(rule.agentPresets) ? rule.agentPresets : [],
  }
}

/**
 * 创建共享状态仓库。
 * @returns {{
 *   subscribe(listener: () => void): () => void,
 *   snapshot(): object,
 *   refresh(): Promise<boolean>,
 *   saveState(next: { enabled?: boolean, rules?: unknown[] }, successText?: string): Promise<boolean>,
 *   setMessage(message: { tone: string, text: string }): void,
 * }}
 */
function createStore() {
  let state = {
    ready: false,
    enabled: false,
    rules: [],
    revision: 0,
    status: {},
    error: '',
    saving: false,
    message: { tone: 'idle', text: '' },
  }
  /** @type {Set<() => void>} */
  const listeners = new Set()
  let snapshot = state

  const emit = () => {
    snapshot = state
    for (const listener of [...listeners]) {
      try {
        listener()
      } catch (error) {
        console.error('[system-prompt-injector] listener failed', error)
      }
    }
  }

  const patch = (fields) => {
    state = { ...state, ...fields }
    emit()
  }

  const request = async (init) => {
    const response = await fetch(API, {
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      ...init,
    })
    const body = await response.json().catch(() => undefined)
    if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`)
    return body
  }

  const subscribe = (listener) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  const refresh = async () => {
    if (state.saving) return false
    try {
      const body = await request({})
      patch({
        ready: true,
        enabled: body.enabled === true,
        rules: Array.isArray(body.rules) ? body.rules : [],
        revision: body.revision ?? 0,
        status: body.status ?? {},
        error: body.lastError || '',
      })
      return true
    } catch (error) {
      patch({
        ready: true,
        error: error instanceof Error ? error.message : String(error),
      })
      return false
    }
  }

  const saveState = async (next, successText = '已保存，下一轮模型请求生效。') => {
    if (state.saving) return false
    patch({ saving: true })
    try {
      const current = {
        enabled: next.enabled === undefined ? state.enabled : next.enabled !== false,
        rules: (next.rules === undefined ? state.rules : next.rules).map(plainRule),
      }
      const body = await request({ method: 'PUT', body: JSON.stringify(current) })
      patch({
        ready: true,
        enabled: body.enabled === true,
        rules: Array.isArray(body.rules) ? body.rules : [],
        revision: body.revision ?? 0,
        status: body.status ?? {},
        error: body.lastError || '',
        saving: false,
        message: { tone: 'ok', text: successText },
      })
      return true
    } catch (error) {
      patch({
        saving: false,
        message: { tone: 'error', text: '保存失败：' + (error instanceof Error ? error.message : String(error)) },
      })
      return false
    }
  }

  return {
    subscribe,
    snapshot: () => snapshot,
    refresh,
    saveState,
    setMessage: (message) => patch({ message }),
  }
}

exports["plainRule"] = plainRule;
exports["createStore"] = createStore;
		};
		var entry = __load("dspi:client/index.js");
		return entry;
		} catch (error) {
			globalThis.__DSH_SYSTEM_PROMPT_INJECTOR_ERROR__ = error;
			console.error("dsh-system-prompt-injector: factory failed", error);
			throw error;
		}
	}
});
